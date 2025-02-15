// models/Applicant.js
const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  personalDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  jobDetails: {
    position: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      required: true
    }
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
applicantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Applicant = mongoose.model('Applicant', applicantSchema);

module.exports = Applicant;