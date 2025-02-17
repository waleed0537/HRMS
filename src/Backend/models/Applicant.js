const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  personalDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
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
    createdAt: this.createdAt
  };
};

const Applicant = mongoose.model('Applicant', applicantSchema);
module.exports = Applicant;