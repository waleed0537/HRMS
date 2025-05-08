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

// Create non-unique indices for improved query performance
attendanceSchema.index({ employeeNumber: 1, date: 1 });
attendanceSchema.index({ deviceUserId: 1, timeIn: 1 });

// CRITICAL: Add code to drop the problematic unique index that's causing errors
const Attendance = mongoose.model('Attendance', attendanceSchema);

// This function will run when your application starts
// It will drop the problematic index that's causing duplicate key errors
async function dropUniqueIndices() {
  try {
    console.log('Checking for and removing problematic unique indices on attendance collection...');
    
    // Get collection to access raw MongoDB commands
    const collection = Attendance.collection;
    
    // Get all indices on the collection
    const indices = await collection.indexes();
    
    // Find problematic unique indices
    const uniqueIndices = indices.filter(index => 
      index.unique === true && 
      (
        // Look for the specific problematic index from the error message
        (index.key && index.key.deviceUserId === 1 && index.key.date === 1) ||
        // Also check for other potential unique indices that could cause problems
        (index.key && index.key.employeeNumber === 1 && index.key.date === 1)
      )
    );
    
    if (uniqueIndices.length > 0) {
      console.log(`Found ${uniqueIndices.length} problematic unique indices to drop:`);
      uniqueIndices.forEach(index => console.log(` - ${index.name}`));
      
      // Drop each problematic index
      for (const index of uniqueIndices) {
        console.log(`Dropping index: ${index.name}...`);
        await collection.dropIndex(index.name);
        console.log(`Successfully dropped index: ${index.name}`);
      }
      
      console.log('All problematic unique indices have been dropped!');
    } else {
      console.log('No problematic unique indices found on attendance collection.');
    }
  } catch (error) {
    console.error('Error while trying to drop unique indices:', error);
  }
}

// Call the function to drop problematic indices
// This needs to run when your server starts
dropUniqueIndices();

// No changes to the existing methods
attendanceSchema.methods.isLate = function(graceMinutes = 15) {
  if (!this.shiftStart) return false;
  
  const lateThreshold = new Date(this.shiftStart);
  lateThreshold.setMinutes(lateThreshold.getMinutes() + graceMinutes);
  
  return this.timeIn > lateThreshold;
};

attendanceSchema.methods.isCompleteDay = function() {
  if (!this.timeIn || !this.timeOut) return false;
  
  // Calculate hours worked
  const msWorked = this.timeOut - this.timeIn;
  const hoursWorked = msWorked / (1000 * 60 * 60);
  
  return hoursWorked >= 7; // Assuming 7+ hours is a full day
};

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

module.exports = Attendance;