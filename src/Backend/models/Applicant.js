// models/Applicant.js
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
  timestamps: true,
  // Allow fields not specified in the schema
  strict: false
});

// Add this to properly handle the email uniqueness
applicantSchema.index({
  'personalDetails.email': 1
}, {
  unique: true,
  partialFilterExpression: {
    'personalDetails.email': { $exists: true, $type: 'string' }
  },
  sparse: true
});

// Helper method to convert Map to Object
applicantSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Convert Maps to regular objects
  if (obj.personalDetails instanceof Map) {
    obj.personalDetails = Object.fromEntries(obj.personalDetails);
  }
  if (obj.jobDetails instanceof Map) {
    obj.jobDetails = Object.fromEntries(obj.jobDetails);
  }
  
  return obj;
};

const Applicant = mongoose.model('Applicant', applicantSchema);
module.exports = Applicant;