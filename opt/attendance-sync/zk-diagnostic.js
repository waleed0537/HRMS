// zk-diagnostic.js - Dedicated tool to diagnose ZKTeco device issues

const ZKLib = require('zklib');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Direct connection settings - modify as needed
const DEVICE = {
  ip: '192.168.100.35',
  port: 4370,
  timeout: 20000, // Higher timeout for diagnostics
  inport: 4370
};

const MONGODB_URI = 'mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms';

// Create logs directory
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// Setup log file
const logFile = path.join('./logs', `zk-diagnostic-${new Date().toISOString().split('T')[0]}.log`);

// Logger function
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  fs.appendFileSync(logFile, logEntry);
}

// Create Attendance model schema for testing today's records
const attendanceSchema = new mongoose.Schema({
  employeeName: String,
  employeeNumber: String,
  deviceUserId: Number,
  department: String,
  date: Date,
  timeIn: Date,
  timeOut: Date,
  location: String,
  verifyMethod: String,
  status: String,
  notes: String,
  modified: Boolean,
  rawData: String
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Create direct ZK instance - no wrappers
function createZkInstance() {
  return new ZKLib({
    ip: DEVICE.ip,
    port: DEVICE.port,
    inport: DEVICE.inport,
    timeout: DEVICE.timeout,
    attendanceParser: 'v6.60'
  });
}

// Test raw connection without any extra logic
async function testRawConnection() {
  const zk = createZkInstance();
  
  log(`\n====== TESTING RAW CONNECTION ======`);
  log(`Connecting to device at ${DEVICE.ip}:${DEVICE.port}...`);
  
  return new Promise((resolve) => {
    // Set timeout
    const timeout = setTimeout(() => {
      log('❌ Connection TIMED OUT');
      try { zk.disconnect(); } catch(e) {}
      resolve(false);
    }, DEVICE.timeout);
    
    // Try connecting
    zk.connect((err) => {
      clearTimeout(timeout);
      
      if (err) {
        log(`❌ Connection FAILED: ${err.message}`);
        try { zk.disconnect(); } catch(e) {}
        resolve(false);
        return;
      }
      
      log('✅ Successfully connected to device');
      zk.disconnect();
      resolve(true);
    });
  });
}

// Attempt to get device serial number or version info
async function getDeviceInfo() {
  const zk = createZkInstance();
  
  log(`\n====== GETTING DEVICE INFO ======`);
  
  return new Promise((resolve) => {
    // Set timeout
    const timeout = setTimeout(() => {
      log('❌ Device info request TIMED OUT');
      try { zk.disconnect(); } catch(e) {}
      resolve(null);
    }, DEVICE.timeout);
    
    // Try connecting
    zk.connect((err) => {
      if (err) {
        clearTimeout(timeout);
        log(`❌ Connection FAILED: ${err.message}`);
        try { zk.disconnect(); } catch(e) {}
        resolve(null);
        return;
      }
      
      // Try to get version
      zk.getTime((err, time) => {
        clearTimeout(timeout);
        
        if (err) {
          log(`❌ Failed to get device time: ${err.message}`);
          try { zk.disconnect(); } catch(e) {}
          resolve(null);
          return;
        }
        
        log(`✅ Device time: ${time}`);
        
        // Try additional info methods if available
        try {
          zk.getInfo && zk.getInfo((err, info) => {
            if (!err && info) {
              log(`Device info: ${JSON.stringify(info)}`);
            }
            zk.disconnect();
            resolve({ time });
          });
        } catch (e) {
          zk.disconnect();
          resolve({ time });
        }
      });
    });
  });
}

// Attempt to get users with direct approach
async function getUsers() {
  const zk = createZkInstance();
  
  log(`\n====== TESTING USER RETRIEVAL ======`);
  log(`Attempting to get users from device...`);
  
  return new Promise((resolve) => {
    // Set timeout
    const timeout = setTimeout(() => {
      log('❌ User retrieval TIMED OUT');
      try { zk.disconnect(); } catch(e) {}
      resolve([]);
    }, DEVICE.timeout);
    
    // Try connecting
    zk.connect((err) => {
      if (err) {
        clearTimeout(timeout);
        log(`❌ Connection FAILED: ${err.message}`);
        try { zk.disconnect(); } catch(e) {}
        resolve([]);
        return;
      }
      
      log('Connected, requesting users...');
      
      // Try to get users
      zk.getUser((err, users) => {
        clearTimeout(timeout);
        
        if (err) {
          log(`❌ Failed to get users: ${err.message}`);
          try { zk.disconnect(); } catch(e) {}
          resolve([]);
          return;
        }
        
        if (!users || !Array.isArray(users)) {
          log('❌ Invalid user data received');
          try { zk.disconnect(); } catch(e) {}
          resolve([]);
          return;
        }
        
        log(`✅ Successfully retrieved ${users.length} users from device`);
        
        if (users.length > 0) {
          log(`First user: ${JSON.stringify(users[0])}`);
          log(`User data fields: ${Object.keys(users[0]).join(', ')}`);
        }
        
        zk.disconnect();
        resolve(users);
      });
    });
  });
}

// Attempt to get attendance records directly
async function getAttendance() {
  const zk = createZkInstance();
  
  log(`\n====== TESTING ATTENDANCE RETRIEVAL ======`);
  log(`Attempting to get attendance records from device...`);
  
  return new Promise((resolve) => {
    // Set timeout
    const timeout = setTimeout(() => {
      log('❌ Attendance retrieval TIMED OUT');
      try { zk.disconnect(); } catch(e) {}
      resolve([]);
    }, DEVICE.timeout);
    
    // Try connecting
    zk.connect((err) => {
      if (err) {
        clearTimeout(timeout);
        log(`❌ Connection FAILED: ${err.message}`);
        try { zk.disconnect(); } catch(e) {}
        resolve([]);
        return;
      }
      
      log('Connected, requesting attendance records...');
      
      // Try to get attendance
      zk.getAttendance((err, records) => {
        clearTimeout(timeout);
        
        if (err) {
          log(`❌ Failed to get attendance: ${err.message}`);
          try { zk.disconnect(); } catch(e) {}
          resolve([]);
          return;
        }
        
        if (!records || !Array.isArray(records)) {
          log('❌ Invalid attendance data received');
          try { zk.disconnect(); } catch(e) {}
          resolve([]);
          return;
        }
        
        log(`✅ Successfully retrieved ${records.length} attendance records from device`);
        
        if (records.length > 0) {
          log(`First record: ${JSON.stringify(records[0])}`);
          log(`Attendance data fields: ${Object.keys(records[0]).join(', ')}`);
        }
        
        // Find today's records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayRecords = records.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= today && recordDate < tomorrow;
        });
        
        log(`Records for today (${today.toISOString().split('T')[0]}): ${todayRecords.length}`);
        
        if (todayRecords.length > 0) {
          log(`Today's records: ${JSON.stringify(todayRecords)}`);
        }
        
        zk.disconnect();
        resolve(records);
      });
    });
  });
}

// Check today's attendance in MongoDB
async function checkTodayAttendance() {
  log(`\n====== CHECKING TODAY'S ATTENDANCE IN DATABASE ======`);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    log('Connected to MongoDB');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Query for today's attendance
    const records = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).lean();
    
    log(`Found ${records.length} attendance records in database for today`);
    
    if (records.length > 0) {
      log(`First database record: ${JSON.stringify(records[0])}`);
      
      // Group by employee
      const byEmployee = {};
      records.forEach(record => {
        if (!byEmployee[record.employeeName]) {
          byEmployee[record.employeeName] = [];
        }
        byEmployee[record.employeeName].push(record);
      });
      
      log(`Attendance by employee:`);
      Object.keys(byEmployee).forEach(name => {
        log(`- ${name}: ${byEmployee[name].length} records`);
      });
    }
    
    // Disconnect from MongoDB
    await mongoose.connection.close();
    log('Disconnected from MongoDB');
    
    return records;
  } catch (error) {
    log(`❌ Error checking database: ${error.message}`);
    
    // Try to disconnect
    try {
      await mongoose.connection.close();
    } catch (e) {}
    
    return [];
  }
}

// Run the diagnostic tests
async function runDiagnostics() {
  log(`\n==================================================`);
  log(`ZKTeco Device Diagnostic Tool`);
  log(`Started at: ${new Date().toISOString()}`);
  log(`Device: ${DEVICE.ip}:${DEVICE.port}`);
  log(`==================================================\n`);
  
  // Test 1: Raw connection
  const isConnected = await testRawConnection();
  
  if (!isConnected) {
    log(`\n⚠️ DEVICE CONNECTION FAILED - Check IP, port, and network connectivity`);
    log(`Possible solutions:`);
    log(`1. Verify the device is powered on and connected to the network`);
    log(`2. Confirm IP address ${DEVICE.ip} is correct`);
    log(`3. Check that port ${DEVICE.port} is open and not blocked by firewall`);
    log(`4. Try restarting the device`);
    return;
  }
  
  // Test 2: Get device info
  await getDeviceInfo();
  
  // Test 3: Get users
  const users = await getUsers();
  
  // Test 4: Get attendance
  const attendanceRecords = await getAttendance();
  
  // Test 5: Check database
  const dbRecords = await checkTodayAttendance();
  
  // Summary
  log(`\n==================================================`);
  log(`DIAGNOSTIC SUMMARY:`);
  log(`==================================================`);
  log(`✅ Device Connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
  log(`✅ User Retrieval: ${users.length > 0 ? 'SUCCESS' : 'FAILED'} (${users.length} users)`);
  log(`✅ Attendance Retrieval: ${attendanceRecords.length > 0 ? 'SUCCESS' : 'FAILED'} (${attendanceRecords.length} records)`);
  log(`✅ Database Records for Today: ${dbRecords.length}`);
  
  if (attendanceRecords.length > 0) {
    // Check if there are attendance records from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= today && recordDate < tomorrow;
    });
    
    log(`✅ Today's Attendance Records on Device: ${todayRecords.length}`);
    
    // Calculate potential new records to add
    const potentialNewRecords = todayRecords.length - dbRecords.length;
    log(`✅ Potential New Records to Add: ${potentialNewRecords > 0 ? potentialNewRecords : 0}`);
  }
  
  log(`\nDiagnostic completed at: ${new Date().toISOString()}`);
  log(`See full details above for troubleshooting information.`);
}

// Run the diagnostics
runDiagnostics().catch(err => {
  log(`Fatal error during diagnostics: ${err.message}`);
});