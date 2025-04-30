// importAttendance.js
import mongoose from 'mongoose';

// Define Attendance Schema
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

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Your exact attendance data
const attendanceData = ``;

async function importAttendance() {
  try {
    await mongoose.connect('mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms');
    console.log('Connected to MongoDB');

    // Split data into lines and remove header
    const lines = attendanceData.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1);

    // Process each line and create records
    const records = dataLines.map(line => {
      const fields = line.split('\t');
      
      const department = fields[0];
      const name = fields[1];
      const empNo = fields[2];
      const dateTime = fields[3];
      const locationId = fields[4];
      const verifyCode = fields[6];
      
      // Parse the date/time
      const [date, time, period] = dateTime.split(' ');
      const [month, day, year] = date.split('/');
      const timeStr = `${time} ${period}`;
      const datetime = new Date(`${year}-${month}-${day} ${timeStr}`);

      return {
        employeeName: name,
        employeeNumber: empNo,
        department,
        date: datetime,
        timeIn: datetime,
        location: locationId,
        verifyMethod: verifyCode
      };
    });

    // Group records by employee and date to handle check-in/check-out
    const groupedRecords = {};
    records.forEach(record => {
      const dateKey = record.date.toDateString();
      const key = `${record.employeeNumber}-${dateKey}`;
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = record;
      } else {
        // If record exists, compare times and set the later one as timeOut
        if (record.timeIn > groupedRecords[key].timeIn) {
          groupedRecords[key].timeOut = record.timeIn;
        } else {
          groupedRecords[key].timeOut = groupedRecords[key].timeIn;
          groupedRecords[key].timeIn = record.timeIn;
        }
      }
    });

    // Convert to array and insert into database
    const finalRecords = Object.values(groupedRecords);
    console.log(`Importing ${finalRecords.length} attendance records...`);

    await Attendance.insertMany(finalRecords);
    console.log('Import completed successfully!');

    // Log some statistics
    const totalEmployees = new Set(finalRecords.map(r => r.employeeNumber)).size;
    console.log(`Total unique employees: ${totalEmployees}`);
    console.log(`Total attendance records: ${finalRecords.length}`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the import
importAttendance();