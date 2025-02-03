// models/Employee.js
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  personalDetails: {
    name: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    contact: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: String
  },
  professionalDetails: {
    role: {
      type: String,
      enum: ['agent', 'hr_manager', 't1_member', 'operational_manager'],
      required: true
    },
    branch: { type: String, required: true },
    department: String,
    status: {
      type: String,
      enum: ['active', 'resigned', 'terminated', 'on_leave'],
      default: 'active'
    }
  },
  documents: [{
    name: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;