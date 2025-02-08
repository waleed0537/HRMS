const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true
  },
  employeeNumber: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeIn: {
    type: Date
  },
  timeOut: {
    type: Date
  },
  location: {
    type: String
  },
  verifyMethod: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
attendanceSchema.index({ date: 1, employeeNumber: 1 });
attendanceSchema.index({ department: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;