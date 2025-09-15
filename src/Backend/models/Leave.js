// models/Leave.js - Updated to store documents in database
const mongoose = require('mongoose');

// Document schema for storing files in database
const documentSchema = new mongoose.Schema({
  name: String,
  originalName: String,
  mimetype: String,
  size: Number,
  data: Buffer, // Store actual file data in database
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeEmail: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'study'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Updated documents array to store files in database
  documents: [documentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method to add document with file data
leaveSchema.methods.addDocument = function(fileData) {
  const document = {
    name: fileData.filename || fileData.originalname,
    originalName: fileData.originalname,
    mimetype: fileData.mimetype,
    size: fileData.size,
    data: fileData.buffer, // Store file buffer in database
    uploadedAt: new Date()
  };
  
  this.documents.push(document);
  return this.save();
};

// Method to get document for download
leaveSchema.methods.getDocumentForDownload = function(documentId) {
  const document = this.documents.id(documentId);
  if (!document || !document.data) {
    return null;
  }
  
  return {
    data: document.data,
    filename: document.originalName || document.name,
    mimetype: document.mimetype,
    size: document.size
  };
};

// Method to get documents list without data for performance
leaveSchema.methods.getDocumentsList = function() {
  return this.documents.map(doc => ({
    _id: doc._id,
    name: doc.name,
    originalName: doc.originalName,
    mimetype: doc.mimetype,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
    hasData: !!doc.data
  }));
};

// Override toJSON to exclude large file data by default
leaveSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Replace document data with metadata only
  if (obj.documents) {
    obj.documents = obj.documents.map(doc => ({
      _id: doc._id,
      name: doc.name,
      originalName: doc.originalName,
      mimetype: doc.mimetype,
      size: doc.size,
      uploadedAt: doc.uploadedAt,
      hasData: !!doc.data
    }));
  }
  
  return obj;
};

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;