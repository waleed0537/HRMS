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
const attendanceData = `Department	Name	No.	Date/Time	Location ID	ID Number	VerifyCode	CardNo
OUR COMPANY	Hussain Haider	1	10/01/2025 4:49:59 am	1		FP	
OUR COMPANY	Hussain Haider	1	10/01/2025 6:05:42 pm	1		FP	
OUR COMPANY	Fiza Haider	10	10/01/2025 6:05:41 pm	1		FP	
OUR COMPANY	Noor Rehman	12	10/01/2025 5:42:55 pm	1		FP	
OUR COMPANY	Hamza Khalid	16	10/01/2025 5:46:32 pm	1		FP	
OUR COMPANY	Afzaal Ahmed Qureshi	19	10/01/2025 5:44:43 pm	1		FP	
OUR COMPANY	Faisal Rafi	1908	10/01/2025 5:58:22 pm	1		FP	
OUR COMPANY	Muhammad Ahmed Raza	1911	10/01/2025 6:06:21 pm	1		FP	
OUR COMPANY	Abdullah Shah	1912	10/01/2025 6:23:41 pm	1		FP	
OUR COMPANY	Abdul Mutaal	1916	10/01/2025 5:55:01 pm	1		FP	
OUR COMPANY	Zain Ali Arif	1917	10/01/2025 6:11:27 pm	1		FP	
OUR COMPANY	Shujaat Ali	1919	10/01/2025 5:50:25 pm	1		FP	
OUR COMPANY	Zeenat Ali	1920	10/01/2025 5:49:36 pm	1		FP	
OUR COMPANY	Saher Gull	1921	10/01/2025 5:41:41 pm	1		FP	
OUR COMPANY	Izen Fatima	1923	10/01/2025 5:51:16 pm	1		FP	
OUR COMPANY	Asif Hameed	1935	10/01/2025 4:27:49 am	1		FP	
OUR COMPANY	Asif Hameed	1935	10/01/2025 6:11:14 pm	1		FP	
OUR COMPANY	Mubariz Bin Rafay	1943	10/01/2025 6:36:49 pm	1		FP	
OUR COMPANY	Abul kalam Khan	1947	10/01/2025 3:54:48 am	1		FP	
OUR COMPANY	Abul kalam Khan	1947	10/01/2025 5:38:09 pm	1		FP	
OUR COMPANY	Mahad Bin Rafay	1954	10/01/2025 6:36:52 pm	1		FP	
OUR COMPANY	Shumaila Parveen	1955	10/01/2025 5:35:52 pm	1		FP	
OUR COMPANY	Alisha Shakeel	1959	10/01/2025 4:02:30 am	1		FP	
OUR COMPANY	Alisha Shakeel	1959	10/01/2025 5:38:03 pm	1		FP	
OUR COMPANY	Mahnoor Fatima	1960	10/01/2025 4:00:32 am	1		FP	
OUR COMPANY	Mahnoor Fatima	1960	10/01/2025 5:51:43 pm	1		FP	
OUR COMPANY	Jamal Abdullah Abbasi	1961	10/01/2025 5:42:41 pm	1		FP	
OUR COMPANY	Farhat Abbasi	1962	10/01/2025 5:51:56 pm	1		FP	
OUR COMPANY	Zohaib Ali	1963	10/01/2025 2:41:25 am	1		FP	
OUR COMPANY	Muhammad Qasim	1964	10/01/2025 4:03:09 am	1		FP	
OUR COMPANY	Muhammad Qasim	1964	10/01/2025 5:37:23 pm	1		FP	
OUR COMPANY	Asif Khan	1974	10/01/2025 3:54:29 am	1		FP	
OUR COMPANY	Asif Khan	1974	10/01/2025 5:43:23 pm	1		FP	
OUR COMPANY	Maaz khan	1977	10/01/2025 4:01:47 am	1		FP	
OUR COMPANY	Maaz khan	1977	10/01/2025 5:43:18 pm	1		FP	
OUR COMPANY	Muhammad Wasay Ali	1980	10/01/2025 4:03:50 am	1		FP	
OUR COMPANY	Muhammad Wasay Ali	1980	10/01/2025 5:40:59 pm	1		FP	
OUR COMPANY	Hamza Khan	1986	10/01/2025 5:58:27 pm	1		FP	
OUR COMPANY	Talha Liaqat	1992	10/01/2025 4:02:24 am	1		FP	
OUR COMPANY	Talha Liaqat	1992	10/01/2025 5:43:31 pm	1		FP	
OUR COMPANY	Kashaf Yaseen	1995	10/01/2025 3:54:50 am	1		FP	
OUR COMPANY	Kashaf Yaseen	1995	10/01/2025 5:38:51 pm	1		FP	
OUR COMPANY	Umer Faisal	1997	10/01/2025 3:54:35 am	1		FP	
OUR COMPANY	Umer Faisal	1997	10/01/2025 5:52:48 pm	1		FP	
OUR COMPANY	Muhammad Tayyab	1998	10/01/2025 3:53:14 am	1		FP	
OUR COMPANY	Muhammad Tayyab	1998	10/01/2025 5:44:15 pm	1		FP	
OUR COMPANY	Muhammad Tayyab Afzal	1999	10/01/2025 3:56:13 am	1		FP	
OUR COMPANY	Muhammad Tayyab Afzal	1999	10/01/2025 5:43:42 pm	1		FP	
OUR COMPANY	Isha Maryam	2006	10/01/2025 6:23:16 pm	1		FP	
OUR COMPANY	Hafiz Saifullah Javed	2008	10/01/2025 6:04:49 pm	1		FP	
OUR COMPANY	Muhammad Talha Hassan	2009	10/01/2025 7:34:08 pm	1		FP	
OUR COMPANY	Muhammad Arslan	2010	10/01/2025 3:58:06 am	1		FP	
OUR COMPANY	Muhammad Arslan	2010	10/01/2025 5:58:32 pm	1		FP	
OUR COMPANY	Asif Khan Khattak	2017	10/01/2025 3:53:15 am	1		FP	
OUR COMPANY	Asif Khan Khattak	2017	10/01/2025 6:07:27 pm	1		FP	
OUR COMPANY	Adil khan	2021	10/01/2025 5:44:47 pm	1		FP	
OUR COMPANY	Ahmad Hassan	2023	10/01/2025 3:54:58 am	1		FP	
OUR COMPANY	Ahmad Hassan	2023	10/01/2025 5:43:55 pm	1		FP	
OUR COMPANY	Umm E Hani	2024	10/01/2025 3:54:38 am	1		FP	
OUR COMPANY	Umm E Hani	2024	10/01/2025 5:37:35 pm	1		FP	
OUR COMPANY	Abdul Samad Khan	2026	10/01/2025 5:49:29 pm	1		FP	
OUR COMPANY	Qazi Zafar Ullah	2028	10/01/2025 4:06:23 am	1		FP	
OUR COMPANY	Qazi Zafar Ullah	2028	10/01/2025 5:54:25 pm	1		FP	
OUR COMPANY	Qazi Zafar Ullah	2028	10/01/2025 5:54:27 pm	1		FP	
OUR COMPANY	Robert Albert	2029	10/01/2025 7:27:24 pm	1		FP	
OUR COMPANY	Nimra Karamat	2031	10/01/2025 5:35:46 pm	1		FP	0
OUR COMPANY	Mubashir Ahmed	2033	10/01/2025 3:58:16 am	1		FP	
OUR COMPANY	Mubashir Ahmed	2033	10/01/2025 7:11:26 pm	1		FP	
OUR COMPANY	Muhammad Shafan Ali	2036	10/01/2025 3:57:56 am	1		FP	
OUR COMPANY	Muhammad Shafan Ali	2036	10/01/2025 5:30:39 pm	1		FP	
OUR COMPANY	Fariah Sulman	2038	10/01/2025 3:53:06 am	1		FP	
OUR COMPANY	Fariah Sulman	2038	10/01/2025 5:36:36 pm	1		FP	
OUR COMPANY	Muhammad Noman Tariq	2042	10/01/2025 3:54:42 am	1		FP	
OUR COMPANY	Muhammad Noman Tariq	2042	10/01/2025 6:46:00 pm	1		FP	
OUR COMPANY	Muhammad Haris	2043	10/01/2025 4:02:27 am	1		FP	
OUR COMPANY	Muhammad Haris	2043	10/01/2025 5:44:35 pm	1		FP`;

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