// models/FormField.js
const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'email', 'tel', 'select', 'textarea', 'file'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String
  }],
  section: {
    type: String,
    enum: ['personal', 'professional', 'additional'],
    required: true
  },
  order: {
    type: Number,
    required: true
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

formFieldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FormField = mongoose.model('FormField', formFieldSchema);

module.exports = FormField;