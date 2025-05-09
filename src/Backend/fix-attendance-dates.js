// fix-attendance-dates.js
// ES Module version - Run this script once to fix existing attendance records

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Attendance model schema directly for this script
const attendanceSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true
  },
  employeeNumber: {
    type: String,
    required: true
  },
  deviceUserId: {
    type: Number
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
  status: {
    type: String,
    enum: ['present', 'late', 'half-day', 'adjusted'],
    default: 'present'
  }
}, {
  timestamps: true
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Connect to MongoDB
await mongoose.connect('mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('Connected to MongoDB');

async function fixAttendanceRecords() {
  try {
    console.log('Starting attendance record correction...');
    
    // Get all attendance records
    const records = await Attendance.find({}).lean();
    console.log(`Found ${records.length} total attendance records`);
    
    let updatedCount = 0;
    const bulkOps = [];
    
    // Process each record
    records.forEach(record => {
      const timeIn = new Date(record.timeIn);
      const currentDate = new Date(record.date);
      
      // Extract hours from the check-in time
      const hours = timeIn.getHours();
      
      // If time is between midnight and noon
      if (hours >= 0 && hours < 12) {
        // Check if the date is different from the time's date minus 1
        // (This means it's an after-midnight check-in that should be assigned to previous day)
        const expectedDate = new Date(timeIn);
        expectedDate.setDate(expectedDate.getDate() - 1);
        expectedDate.setHours(0, 0, 0, 0); // Reset time part
        
        const currentDateMidnight = new Date(currentDate);
        currentDateMidnight.setHours(0, 0, 0, 0); // Reset time part
        
        // If dates are different, we need to update this record
        if (expectedDate.getTime() !== currentDateMidnight.getTime()) {
          console.log(`Fixing record: ID ${record._id}, Time ${timeIn}, Current date ${currentDate}, Should be ${expectedDate}`);
          
          // Add to bulk operations
          bulkOps.push({
            updateOne: {
              filter: { _id: record._id },
              update: { $set: { date: expectedDate } }
            }
          });
          
          updatedCount++;
        }
      }
    });
    
    // Execute bulk operations if any
    if (bulkOps.length > 0) {
      console.log(`Updating ${bulkOps.length} records...`);
      const result = await Attendance.bulkWrite(bulkOps);
      console.log(`Update complete. Modified: ${result.modifiedCount}`);
    } else {
      console.log('No records need to be updated.');
    }
    
    console.log(`Fixed ${updatedCount} attendance records`);
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error fixing attendance records:', error);
    await mongoose.connection.close();
    return { success: false, error: error.message };
  }
}

// Run the function and exit
try {
  const result = await fixAttendanceRecords();
  console.log('Migration result:', result);
  process.exit(0);
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}