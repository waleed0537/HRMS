// models/Applicant.js - Updated version
const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  personalDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
    // No unique constraint here
  },
  jobDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  branchName: {
    type: String,
    required: false
  },
  // Add new fields for tracking multiple applications
  applicationId: {
    type: String,
    required: false,
    unique: true // This can be unique instead of email
  },
  applicationTimestamp: {
    type: Date,
    default: Date.now
  },
  resume: {
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Method to get all details in a consistent format
applicantSchema.methods.getAllDetails = function() {
  const personalDetails = this.personalDetails instanceof Map ? 
    Object.fromEntries(this.personalDetails) : 
    this.personalDetails;

  const jobDetails = this.jobDetails instanceof Map ? 
    Object.fromEntries(this.jobDetails) : 
    this.jobDetails;

  return {
    _id: this._id,
    personalDetails,
    jobDetails,
    branchName: this.branchName,
    status: this.status,
    resume: this.resume,
    createdAt: this.createdAt,
    applicationId: this.applicationId,
    applicationTimestamp: this.applicationTimestamp
  };
};

// Explicitly create only the indexes we want
// DO NOT create an index on personalDetails.email
// Instead, create an index for applicationId which can be unique
applicantSchema.index({ applicationId: 1 }, { unique: true, sparse: true });
applicantSchema.index({ createdAt: -1 }); // Index for sorting by creation date
applicantSchema.index({ status: 1 }); // Index for filtering by status
applicantSchema.index({ branchName: 1 }); // Index for filtering by branch

const Applicant = mongoose.model('Applicant', applicantSchema);
module.exports = Applicant;