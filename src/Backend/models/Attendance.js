// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true
  },
  employeeNumber: {
    type: String,
    required: true,
    index: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  timeIn: {
    type: Date,
    required: true
  },
  timeOut: {
    type: Date
  },
  location: {
    type: String
  },
  verifyMethod: {
    type: String
  },
  // Store status for this attendance record
  status: {
    type: String,
    enum: ['present', 'late', 'half-day', 'adjusted'],
    default: 'present'
  },
  // Allow for notes/manual adjustments
  notes: {
    type: String
  },
  // Add fields to track the original device data
  deviceUserId: {
    type: Number,
    index: true
  },
  // Store any manipulations done to the record
  modified: {
    type: Boolean,
    default: false
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedAt: {
    type: Date
  },
  // Store the original raw data from device
  rawData: {
    type: String
  },
  // Store shift information if available
  shiftStart: {
    type: Date
  },
  shiftEnd: {
    type: Date
  }
}, {
  timestamps: true
});

// Create unique index to prevent duplicate records per day
// REMOVED duplicate index definition to fix warning
attendanceSchema.index({ employeeNumber: 1, date: 1 }, { unique: true, partialFilterExpression: { date: { $exists: true } } });

// Add a timestamp accuracy check method
attendanceSchema.methods.isLate = function(graceMinutes = 15) {
  if (!this.shiftStart) return false;
  
  const lateThreshold = new Date(this.shiftStart);
  lateThreshold.setMinutes(lateThreshold.getMinutes() + graceMinutes);
  
  return this.timeIn > lateThreshold;
};

// Add method to check if this is a complete day
attendanceSchema.methods.isCompleteDay = function() {
  if (!this.timeIn || !this.timeOut) return false;
  
  // Calculate hours worked
  const msWorked = this.timeOut - this.timeIn;
  const hoursWorked = msWorked / (1000 * 60 * 60);
  
  return hoursWorked >= 7; // Assuming 7+ hours is a full day
};

// Static method to get attendance stats
attendanceSchema.statics.getStats = async function(startDate, endDate, department = null) {
  const match = {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (department) {
    match.department = department;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          employeeNumber: "$employeeNumber",
          day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        },
        count: { $sum: 1 },
        firstTimeIn: { $min: "$timeIn" },
        lastTimeOut: { $max: "$timeOut" }
      }
    },
    {
      $group: {
        _id: "$_id.employeeNumber",
        daysPresent: { $sum: 1 },
        averageTimeIn: { $avg: { $hour: "$firstTimeIn" } },
        records: { $push: "$$ROOT" }
      }
    }
  ]);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;