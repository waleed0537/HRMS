// models/Applicant.js - Updated to store files in database
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
  applicationId: {
    type: String,
    required: false,
    unique: true
  },
  applicationTimestamp: {
    type: Date,
    default: Date.now
  },
  // Updated resume storage - now stores file data in database
  resume: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    data: Buffer, // Store actual file data
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  // Additional documents array for future use
  documents: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    data: Buffer,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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

  // Return data without the large Buffer fields for listing purposes
  return {
    _id: this._id,
    personalDetails,
    jobDetails,
    branchName: this.branchName,
    status: this.status,
    resume: this.resume ? {
      filename: this.resume.filename,
      originalName: this.resume.originalName,
      mimetype: this.resume.mimetype,
      size: this.resume.size,
      uploadedAt: this.resume.uploadedAt,
      hasData: !!this.resume.data
    } : null,
    createdAt: this.createdAt,
    applicationId: this.applicationId,
    applicationTimestamp: this.applicationTimestamp
  };
};

// Method to add a document
applicantSchema.methods.addDocument = function(fileData) {
  if (!this.documents) {
    this.documents = [];
  }
  
  this.documents.push({
    filename: fileData.filename,
    originalName: fileData.originalname,
    mimetype: fileData.mimetype,
    size: fileData.size,
    data: fileData.buffer,
    uploadedAt: new Date()
  });
  
  return this.save();
};

// Method to get resume file data for download
applicantSchema.methods.getResumeForDownload = function() {
  if (!this.resume || !this.resume.data) {
    return null;
  }
  
  return {
    data: this.resume.data,
    filename: this.resume.originalName || this.resume.filename,
    mimetype: this.resume.mimetype,
    size: this.resume.size
  };
};

// Method to get document file data for download
applicantSchema.methods.getDocumentForDownload = function(documentId) {
  const document = this.documents.id(documentId);
  if (!document || !document.data) {
    return null;
  }
  
  return {
    data: document.data,
    filename: document.originalName || document.filename,
    mimetype: document.mimetype,
    size: document.size
  };
};

// Indexes
applicantSchema.index({ applicationId: 1 }, { unique: true, sparse: true });
applicantSchema.index({ createdAt: -1 });
applicantSchema.index({ status: 1 });
applicantSchema.index({ branchName: 1 });

const Applicant = mongoose.model('Applicant', applicantSchema);
module.exports = Applicant;