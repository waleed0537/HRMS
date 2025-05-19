// Modified attendance-sync-daemon.js with reduced logging and hourly log rotation
const ZKLib = require('zklib');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const os = require('os');

// Configuration with enhanced reliability options
const CONFIG = {
  // ZKTeco device settings
  device: {
    ip: process.env.DEVICE_IP || '192.168.100.35',
    port: parseInt(process.env.DEVICE_PORT || '4370'),
    timeout: parseInt(process.env.DEVICE_TIMEOUT || '15000'), // Increased timeout
    attendanceParser: process.env.DEVICE_PARSER || 'v6.60',
    connectionTries: parseInt(process.env.CONNECTION_TRIES || '5'),
    connectionDelay: parseInt(process.env.CONNECTION_DELAY || '2000')
  },

  // MongoDB connection
  database: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Sync settings
  sync: {
    interval: parseInt(process.env.SYNC_INTERVAL || '30000'), // 30 seconds
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.RETRY_DELAY || '3000')
  },

  // Logging settings
  logs: {
    dir: process.env.LOG_DIR || './logs',
    level: process.env.LOG_LEVEL || 'info', // Changed from debug to info for fewer logs
    retention: parseInt(process.env.LOG_RETENTION || '7'), // days
    cleanInterval: parseInt(process.env.LOG_CLEAN_INTERVAL || '3600000') // 1 hour in milliseconds
  }
};

// Create log directory if it doesn't exist
if (!fs.existsSync(CONFIG.logs.dir)) {
  fs.mkdirSync(CONFIG.logs.dir, { recursive: true });
}

// Define today's log file with date in filename
const today = new Date().toISOString().split('T')[0];
const logFile = path.join(CONFIG.logs.dir, `attendance-sync-${today}.log`);

// Create empty log file or clear existing file
fs.writeFileSync(logFile, `=== Log started at ${new Date().toISOString()} ===\n`);

// Track sync statistics
let syncStats = {
  lastSync: null,
  totalRecords: 0,
  todayRecords: 0,
  newRecords: 0,
  successfulSyncs: 0,
  failedSyncs: 0,
  startTime: new Date()
};

// Time of last log cleanup
let lastLogCleanup = new Date();

// Modified logging function with reduced verbosity
function log(level, message, data = null) {
  const levels = ['error', 'warn', 'info', 'debug'];
  const configLevel = CONFIG.logs.level.toLowerCase();

  if (levels.indexOf(level) > levels.indexOf(configLevel)) {
    return; // Skip logging if level is higher than config
  }

  // Filter out unnecessary logs
  // Only log errors, warnings, and important info messages
  if (level === 'debug') {
    // Omit most debug messages except for essential ones
    if (!message.includes('Connection successful') &&
      !message.includes('Today\'s attendance') &&
      !message.includes('NEW ATTENDANCE RECORDS')) {
      return;
    }
  }

  // Skip detailed data dumps for routine operations
  if (message.includes('Processing record:') ||
    message.includes('Found users:') ||
    message.includes('Retrieved') && message.includes('attendance records')) {
    data = null; // Skip detailed data
  }

  const timestamp = new Date().toISOString();
  let logMessage = message;

  // Add data as JSON if provided, but limit verbosity
  if (data) {
    if (typeof data === 'object') {
      try {
        // Limit JSON stringification depth to reduce verbosity
        const stringified = JSON.stringify(data, (key, value) => {
          // Filter out nested objects and arrays to reduce log size
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return '[Object]';
          }
          if (Array.isArray(value) && value.length > 5) {
            return `[Array(${value.length})]`;
          }
          return value;
        });
        logMessage += ' ' + stringified;
      } catch (e) {
        logMessage += ' [Object cannot be stringified]';
      }
    } else {
      logMessage += ' ' + data;
    }
  }

  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${logMessage}\n`;

  // Log to console with colors
  const colors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[90m', // Grey
    reset: '\x1b[0m'   // Reset
  };

  console[level === 'debug' ? 'log' : level](`${colors[level]}[${timestamp}] ${logMessage}${colors.reset}`);

  // Append to log file
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
}

// New function to clear log file every hour
function cleanLogFile() {
  try {
    const now = new Date();
    const hoursSinceLastCleanup = (now - lastLogCleanup) / (1000 * 60 * 60);

    // Check if an hour has passed
    if (hoursSinceLastCleanup >= 1) {
      // Clear the log file and start fresh
      fs.writeFileSync(logFile, `=== Log cleared at ${now.toISOString()} ===\n`);

      // Log summary stats before clearing
      fs.appendFileSync(logFile, `[SUMMARY] Today's attendance: ${syncStats.todayRecords} records\n`);
      fs.appendFileSync(logFile, `[SUMMARY] Successful syncs: ${syncStats.successfulSyncs}, Failed syncs: ${syncStats.failedSyncs}\n`);

      log('info', `Log file cleared. Starting fresh log at ${now.toISOString()}`);
      lastLogCleanup = now;
    }
  } catch (error) {
    console.error('Error cleaning log file:', error);
  }
}

// Define MongoDB schemas
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
  deviceUserId: {
    type: Number,
    index: true
  },
  department: {
    type: String,
    default: 'General',
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
  status: {
    type: String,
    enum: ['present', 'late', 'half-day', 'adjusted'],
    default: 'present'
  },
  notes: {
    type: String
  },
  modified: {
    type: Boolean,
    default: false
  },
  rawData: {
    type: String
  }
}, {
  timestamps: true
});

// Create a unique index to prevent duplicate entries
attendanceSchema.index(
  { employeeNumber: 1, date: 1 },
  { unique: true, partialFilterExpression: { date: { $exists: true } } }
);

// Define UserCache model to store user mapping
const userCacheSchema = new mongoose.Schema({
  deviceUserId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  employeeNumber: {
    type: String
  },
  department: {
    type: String,
    default: 'General'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Define SyncStatus model to track sync operations
const syncStatusSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    required: true
  },
  message: {
    type: String
  },
  recordsProcessed: {
    type: Number,
    default: 0
  },
  recordsAdded: {
    type: Number,
    default: 0
  },
  todayRecords: {
    type: Number,
    default: 0
  },
  error: {
    type: String
  },
  deviceInfo: {
    ip: String,
    port: Number,
    users: Number
  }
});

// Create the models
const Attendance = mongoose.model('Attendance', attendanceSchema);
const UserCache = mongoose.model('UserCache', userCacheSchema);
const SyncStatus = mongoose.model('SyncStatus', syncStatusSchema);

// Connection status tracking
let isConnected = false;
let syncIntervalId = null;
let logCleanupIntervalId = null; // Track log cleanup interval

// Connect to MongoDB
async function connectToDatabase() {
  try {
    log('info', 'Connecting to MongoDB...');
    await mongoose.connect(CONFIG.database.uri, CONFIG.database.options);
    log('info', 'Successfully connected to MongoDB');
    isConnected = true;
    return true;
  } catch (error) {
    log('error', `MongoDB connection error: ${error.message}`);
    return false;
  }
}

// Ping device to check if it's reachable
async function pingDevice(ip) {
  return new Promise((resolve) => {
    const platform = os.platform();
    const pingCmd = platform === 'win32'
      ? `ping -n 1 -w 2000 ${ip}`
      : `ping -c 1 -W 2 ${ip}`;

    // Reduced logging - don't log ping command details
    childProcess.exec(pingCmd, (error, stdout) => {
      const isAlive = !error &&
        (platform === 'win32'
          ? stdout.includes('Reply from')
          : stdout.includes(' 0% packet loss'));

      // Only log if ping fails
      if (!isAlive) {
        log('warn', `Ping result for ${ip}: Device unreachable`);
      }

      resolve({
        alive: isAlive,
        time: new Date()
      });
    });
  });
}

// Create a ZK instance with optimized parameters for reliability
function createZkInstance() {
  const zkOptions = {
    ip: CONFIG.device.ip,
    port: CONFIG.device.port,
    inport: Math.floor(Math.random() * 10000) + 10000, // Random port between 10000-20000
    timeout: CONFIG.device.timeout,
    attendanceParser: CONFIG.device.attendanceParser
  };

  // Reduce logging - don't log instance creation details
  return new ZKLib(zkOptions);
}

// Multi-try approach to connect to ZKTeco device
async function connectToDevice(retry = 0) {
  // Only log the first attempt and successful connection
  if (retry === 0) {
    log('info', 'Connecting to ZKTeco device...');
  }

  return new Promise((resolve, reject) => {
    const zk = createZkInstance();

    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      log('error', `Connection timed out after ${CONFIG.device.timeout}ms`);
      try { zk.disconnect(); } catch (e) { } // Make sure to clean up

      if (retry < CONFIG.device.connectionTries - 1) {
        // Don't log retry attempts to reduce verbosity
        setTimeout(() => {
          connectToDevice(retry + 1)
            .then(resolve)
            .catch(reject);
        }, CONFIG.device.connectionDelay);
      } else {
        reject(new Error(`Connection failed after ${CONFIG.device.connectionTries} attempts`));
      }
    }, CONFIG.device.timeout);

    // Try to connect
    try {
      zk.connect((err) => {
        clearTimeout(connectionTimeout);

        if (err) {
          // Only log the final error, not intermediate retries
          if (retry === CONFIG.device.connectionTries - 1) {
            log('error', `Connection error: ${err.message}`);
          }
          try { zk.disconnect(); } catch (e) { } // Clean up

          if (retry < CONFIG.device.connectionTries - 1) {
            // Don't log retry attempts
            setTimeout(() => {
              connectToDevice(retry + 1)
                .then(resolve)
                .catch(reject);
            }, CONFIG.device.connectionDelay);
          } else {
            reject(new Error(`Connection failed after ${CONFIG.device.connectionTries} attempts: ${err.message}`));
          }
          return;
        }

        log('info', 'Successfully connected to ZKTeco device!');
        resolve(zk);
      });
    } catch (error) {
      clearTimeout(connectionTimeout);

      // Only log the final error, not intermediate retries
      if (retry === CONFIG.device.connectionTries - 1) {
        log('error', `Connection attempt error: ${error.message}`);
      }

      if (retry < CONFIG.device.connectionTries - 1) {
        // Don't log retry attempts
        setTimeout(() => {
          connectToDevice(retry + 1)
            .then(resolve)
            .catch(reject);
        }, CONFIG.device.connectionDelay);
      } else {
        reject(new Error(`Connection failed after ${CONFIG.device.connectionTries} attempts: ${error.message}`));
      }
    }
  });
}

// Get users from ZKTeco device
async function getUsersFromDevice() {
  log('info', 'Fetching users from ZKTeco device...');

  try {
    const zk = await connectToDevice();

    return new Promise((resolve, reject) => {
      const operationTimeout = setTimeout(() => {
        log('error', 'User fetch operation timed out');
        try { zk.disconnect(); } catch (e) { }
        reject(new Error('User fetch operation timed out'));
      }, CONFIG.device.timeout);

      zk.getUser((err, users) => {
        clearTimeout(operationTimeout);

        // Always disconnect
        try { zk.disconnect(); } catch (e) { }

        if (err) {
          log('error', `Error getting users: ${err.message}`);
          return reject(err);
        }

        if (!users || !Array.isArray(users)) {
          log('error', 'Invalid user data received');
          return reject(new Error('Invalid user data format'));
        }

        // Only log the count, not the full user details
        log('info', `Retrieved ${users.length} users from device`);

        // Process users for easier mapping
        const processedUsers = users.map(user => ({
          id: user.uid, // The actual device user ID
          name: user.name || `User ${user.uid}`,
          role: user.role || 0,
          cardno: user.cardno || ''
        }));

        // Save users to cache for future use
        updateUserCache(processedUsers);

        resolve(processedUsers);
      });
    });
  } catch (connectionError) {
    log('error', `Failed to connect for user data: ${connectionError.message}`);
    throw connectionError;
  }
}

// Get attendance data from ZKTeco device
async function getAttendanceData() {
  log('info', 'Fetching attendance data from ZKTeco device...');

  try {
    const zk = await connectToDevice();

    return new Promise((resolve, reject) => {
      const operationTimeout = setTimeout(() => {
        log('error', 'Attendance fetch operation timed out');
        try { zk.disconnect(); } catch (e) { }
        reject(new Error('Attendance fetch operation timed out'));
      }, CONFIG.device.timeout);

      zk.getAttendance((err, data) => {
        clearTimeout(operationTimeout);

        // Always disconnect
        try { zk.disconnect(); } catch (e) { }

        if (err) {
          log('error', `Error getting attendance data: ${err.message}`);
          return reject(err);
        }

        if (!data || !Array.isArray(data)) {
          log('error', 'Invalid attendance data received');
          return reject(new Error('Invalid attendance data format'));
        }

        // Count today's records only
        const now = new Date();
        // Adjust for Pakistan Standard Time offset (UTC+5)
        const pkOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
        const pkToday = new Date(now.getTime() + pkOffset);
        pkToday.setUTCHours(0, 0, 0, 0);
        const pkTomorrow = new Date(pkToday);
        pkTomorrow.setDate(pkToday.getDate() + 1);

        const todayRecords = data.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= pkToday && recordDate < pkTomorrow;
        });

        // Log only total count and today's count, not all records
        log('info', `Retrieved ${data.length} attendance records, ${todayRecords.length} from today`);

        resolve(data);
      });
    });
  } catch (connectionError) {
    log('error', `Failed to connect for attendance data: ${connectionError.message}`);
    throw connectionError;
  }
}

// Test connection to ZKTeco device
async function testConnection() {
  try {
    log('info', `Testing connection to ZKTeco device at ${CONFIG.device.ip}...`);

    // First try ping for quick check
    const pingResult = await pingDevice(CONFIG.device.ip);

    if (!pingResult.alive) {
      log('warn', 'Ping failed, device appears to be offline');
      return {
        success: false,
        message: 'Device is unreachable (ping failed)'
      };
    }

    log('info', 'Ping successful, testing device connection...');

    // Try to establish connection and get users
    try {
      const users = await getUsersFromDevice();
      log('info', `Connection test successful! Retrieved ${users.length} users.`);

      return {
        success: true,
        message: `Connected successfully. Retrieved ${users.length} users.`,
        userCount: users.length
      };
    } catch (userError) {
      log('error', `Failed to get users during connection test: ${userError.message}`);
      return {
        success: false,
        message: `Connection failed: ${userError.message}`
      };
    }
  } catch (error) {
    log('error', `Connection test error: ${error.message}`);
    return {
      success: false,
      message: `Connection test error: ${error.message}`
    };
  }
}

// Update user cache in database - reduced logging
async function updateUserCache(users) {
  try {
    if (!users || users.length === 0) {
      log('warn', 'No users to update in cache');
      return false;
    }

    // Only log count, not details
    log('info', `Updating user cache with ${users.length} users`);

    // Prepare bulk operations
    const bulkOps = users.map(user => ({
      updateOne: {
        filter: { deviceUserId: user.id },
        update: {
          $set: {
            name: user.name,
            employeeNumber: user.id.toString(),
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    // Execute bulk update
    const result = await UserCache.bulkWrite(bulkOps);
    log('info', `User cache updated: ${result.upsertedCount} new, ${result.modifiedCount} updated`);

    return true;
  } catch (error) {
    log('error', `Failed to update user cache: ${error.message}`);
    return false;
  }
}

// Get today's attendance count
async function getTodayAttendanceCount() {
  try {
    // Define today's date range in Pakistan time (UTC+5)
    const now = new Date();
    const pkOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

    // Convert current UTC time to Pakistan time
    const pkNow = new Date(now.getTime() + pkOffset);

    // Get the start of today in Pakistan time
    const pkToday = new Date(pkNow);
    pkToday.setHours(0, 0, 0, 0);

    // Convert back to UTC for database query (subtract the offset)
    const utcTodayStart = new Date(pkToday.getTime() - pkOffset);

    // Calculate the end of the day (tomorrow at 00:00 Pakistan time)
    const pkTomorrow = new Date(pkToday);
    pkTomorrow.setDate(pkToday.getDate() + 1);

    // Convert back to UTC for database query
    const utcTomorrowStart = new Date(pkTomorrow.getTime() - pkOffset);

    // Query database using UTC time boundaries that correspond to Pakistan day
    const count = await Attendance.countDocuments({
      timeIn: {
        $gte: utcTodayStart,
        $lt: utcTomorrowStart
      }
    });

    log('info', `Today's attendance count: ${count} records`);
    log('debug', `Using date range: ${utcTodayStart.toISOString()} to ${utcTomorrowStart.toISOString()}`);
    return count;
  } catch (error) {
    log('error', `Error getting today's attendance count: ${error.message}`);
    return 0;
  }
}

// Simplified sync attendance logs with reduced logging
async function syncAttendanceLogs() {
  const syncStart = Date.now();
  let syncStatus = {
    timestamp: new Date(),
    success: false,
    message: '',
    recordsProcessed: 0,
    recordsAdded: 0,
    todayRecords: 0,
    error: null,
    deviceInfo: {
      ip: CONFIG.device.ip,
      port: CONFIG.device.port,
      users: 0
    }
  };

  try {
    log('info', '============ Starting attendance synchronization ============');

    // Get today's attendance count before sync
    const beforeCount = await getTodayAttendanceCount();

    // 1. Get users from the device
    const users = await getUsersFromDevice();

    syncStatus.deviceInfo.users = users.length;

    // 2. Build user_id → user.name mapping
    const nameMap = {};
    users.forEach(user => {
      nameMap[user.id] = user.name;
    });

    // 3. Get attendance logs
    const logs = await getAttendanceData();

    // Handle no records case
    if (!logs || logs.length === 0) {
      log('info', 'No attendance records found on device');

      syncStatus.success = true;
      syncStatus.message = 'No attendance records found on device';
      syncStatus.todayRecords = beforeCount;

      await new SyncStatus(syncStatus).save();

      syncStats.lastSync = new Date();
      syncStats.successfulSyncs++;

      log('info', `=============== Today's attendance: ${beforeCount} records ===============`);

      return {
        success: true,
        message: 'No attendance records found on device',
        todayCount: beforeCount
      };
    }

    // Only log that we're processing records, not each individual record
    log('info', `Processing ${logs.length} attendance records...`);

    // Process records with bulk operations for better performance
    const bulkOps = [];
    let todayRecordsCount = 0;

    // Get today's date range for checking
    const now = new Date();
    const pkOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
    const pkToday = new Date(now.getTime() + pkOffset);
    pkToday.setUTCHours(0, 0, 0, 0);
    const pkTomorrow = new Date(pkToday);
    pkTomorrow.setDate(pkToday.getDate() + 1);

    // Process each attendance record - don't log individual records
    // Update the syncAttendanceLogs function in attendance-sync-daemon.js
// Find this section in the function where it processes attendance records:

// Process each attendance record - don't log individual records
for (const record of logs) {
  try {
    // Check if timestamp exists before trying to use it
    if (!record.timestamp) {
      continue;
    }
    
    // Format the data - this is the device's UTC timestamp
    const recordTimestamp = new Date(record.timestamp);
    
    // Skip invalid dates
    if (isNaN(recordTimestamp.getTime())) {
      continue;
    }

    // CORRECT DATE ASSIGNMENT:
    // We'll use the actual timestamp for both date and timeIn
    // This means a 3:23 AM check-in on May 14 will be treated as May 14
    // (not May 13)
    const recordDate = new Date(recordTimestamp);
    
    // Set the time to 00:00:00 for the date field while keeping the
    // timeIn field with the actual check-in time
    const dateOnly = new Date(recordDate);
    dateOnly.setHours(0, 0, 0, 0);
    
    // Get user ID and name
    const uid = record.uid || record.id; // Ensure we get the correct user ID field
    const name = nameMap[uid] || 'Unknown';
    
    // Prepare upsert operation
    bulkOps.push({
      updateOne: {
        filter: {
          deviceUserId: uid,
          date: dateOnly  // Use the date part (midnight) for filtering
        },
        update: {
          $setOnInsert: {
            employeeNumber: uid.toString(),
            department: 'General',
            date: dateOnly,  // Store the date at midnight for consistency
            timeIn: recordTimestamp,  // Keep the actual check-in time
            location: CONFIG.device.ip,
            verifyMethod: record.type?.toString() || '0',
            status: 'present',
            createdAt: new Date()
          },
          $set: {
            deviceUserId: uid,
           
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    });
  } catch (recordError) {
    log('error', `Error processing attendance record: ${recordError.message}`);
  }
}

    // Execute bulk operations
    let newRecords = 0;

    // After executing bulk operations
    if (bulkOps.length > 0) {
      log('info', `Executing ${bulkOps.length} database operations...`);
      try {
        const bulkResult = await Attendance.bulkWrite(bulkOps);

        // Only log concise results, not the full details
        newRecords = bulkResult.upsertedCount || 0;

        syncStatus.recordsAdded = newRecords;
        syncStatus.recordsProcessed = logs.length;
        syncStatus.todayRecords = todayRecordsCount;

        log('info', `Bulk operations complete: ${newRecords} new records, ${bulkResult.modifiedCount} updated`);
      } catch (dbError) {
        log('error', `Database write failed: ${dbError.message}`);
        throw dbError; // Re-throw so it's properly handled
      }
    }

    // Get the updated count
    const afterCount = await getTodayAttendanceCount();
    const newTodayRecords = afterCount - beforeCount;

    // Update sync stats
    syncStats.lastSync = new Date();
    syncStats.totalRecords += logs.length;
    syncStats.todayRecords = afterCount;
    syncStats.newRecords += newRecords;
    syncStats.successfulSyncs++;

    // Update sync status
    syncStatus.success = true;
    syncStatus.message = `Sync completed successfully. Added ${syncStatus.recordsAdded} new records.`;

    // Display summary of today's records - important, keep this
    if (newTodayRecords > 0) {
      log('info', `\n=============== ${newTodayRecords} NEW ATTENDANCE RECORDS TODAY ===============`);
      log('info', `Total attendance for today: ${afterCount} records`);
    } else {
      log('info', `\n=============== No new attendance records today ===============`);
      log('info', `Total attendance for today: ${afterCount} records`);
    }

    // Save sync status to database
    await new SyncStatus(syncStatus).save();

    const syncDuration = Date.now() - syncStart;
    log('info', `Sync operation completed in ${syncDuration}ms`);

    return {
      success: true,
      message: `Sync completed successfully in ${syncDuration}ms`,
      recordsProcessed: logs.length,
      recordsAdded: newRecords,
      todayRecords: afterCount,
      newTodayRecords
    };
  } catch (error) {
    log('error', `Sync error: ${error.message}`);

    // Update sync status for error
    syncStatus.success = false;
    syncStatus.error = error.message;
    syncStatus.message = `Sync failed: ${error.message}`;

    // Update sync stats
    syncStats.failedSyncs++;

    // Save sync status to database
    try {
      await new SyncStatus(syncStatus).save();
    } catch (saveError) {
      log('error', `Failed to save sync status: ${saveError.message}`);
    }

    return {
      success: false,
      message: `Sync failed: ${error.message}`,
      error: error.message
    };
  }
}

// Get sync statistics
function getSyncStats() {
  const uptime = Math.floor((new Date() - syncStats.startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  return {
    ...syncStats,
    uptime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    successRate: syncStats.successfulSyncs + syncStats.failedSyncs > 0
      ? ((syncStats.successfulSyncs / (syncStats.successfulSyncs + syncStats.failedSyncs)) * 100).toFixed(2) + '%'
      : 'N/A'
  };
}

// Main function to start the service
async function startService() {
  log('info', '===== Starting ZKTeco Attendance Sync Service =====');
  log('info', `Device: ${CONFIG.device.ip}:${CONFIG.device.port}`);
  log('info', `Sync interval: ${CONFIG.sync.interval}ms`);

  // Connect to database
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    log('error', 'Failed to connect to database. Exiting.');
    process.exit(1);
  }

  // Test connection to device
  const deviceConnected = await testConnection();
  if (!deviceConnected.success) {
    log('warn', `Initial device connection failed: ${deviceConnected.message}`);
    log('info', 'Will continue trying during sync cycles');
  } else {
    log('info', 'Successfully connected to device');
  }

  // Get today's current attendance
  try {
    const todayCount = await getTodayAttendanceCount();
    log('info', `Current attendance for today: ${todayCount} records`);
    syncStats.todayRecords = todayCount;
  } catch (error) {
    log('error', `Failed to get today's attendance: ${error.message}`);
  }

  // Run initial sync
  try {
    await syncAttendanceLogs();
  } catch (error) {
    log('error', `Initial sync failed: ${error.message}`);
  }

  // Start sync interval
  syncIntervalId = setInterval(async () => {
    try {
      await syncAttendanceLogs();
    } catch (error) {
      log('error', `Scheduled sync error: ${error.message}`);
    }
  }, CONFIG.sync.interval);

  // Set up hourly log cleanup
  logCleanupIntervalId = setInterval(() => {
    try {
      cleanLogFile();
    } catch (error) {
      console.error('Log cleanup error:', error);
    }
  }, 15 * 60 * 1000); // Check every 15 minutes

  log('info', 'Service started successfully');

  // Return API for management
  return {
    getStats: getSyncStats,
    stop: () => {
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
      }
      if (logCleanupIntervalId) {
        clearInterval(logCleanupIntervalId);
        logCleanupIntervalId = null;
      }
      log('info', 'Sync service stopped');
      return true;
    },
    restart: () => {
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
      }
      if (logCleanupIntervalId) {
        clearInterval(logCleanupIntervalId);
      }

      syncIntervalId = setInterval(async () => {
        try {
          await syncAttendanceLogs();
        } catch (error) {
          log('error', `Scheduled sync error: ${error.message}`);
        }
      }, CONFIG.sync.interval);

      logCleanupIntervalId = setInterval(() => {
        try {
          cleanLogFile();
        } catch (error) {
          console.error('Log cleanup error:', error);
        }
      }, 15 * 60 * 1000);

      log('info', 'Sync service restarted');
      return true;
    },
    syncNow: syncAttendanceLogs,
    cleanLogs: cleanLogFile,
    testConnection
  };
}

// Handle process termination
process.on('SIGINT', async () => {
  log('info', 'Received SIGINT. Shutting down...');

  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }

  if (logCleanupIntervalId) {
    clearInterval(logCleanupIntervalId);
    logCleanupIntervalId = null;
  }

  try {
    await mongoose.connection.close();
    log('info', 'Closed database connection');
  } catch (error) {
    log('error', `Error closing database connection: ${error.message}`);
  }

  log('info', 'Service shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('info', 'Received SIGTERM. Shutting down...');

  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }

  if (logCleanupIntervalId) {
    clearInterval(logCleanupIntervalId);
    logCleanupIntervalId = null;
  }

  try {
    await mongoose.connection.close();
    log('info', 'Closed database connection');
  } catch (error) {
    log('error', `Error closing database connection: ${error.message}`);
  }

  log('info', 'Service shutdown complete');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('error', `Uncaught exception: ${error.message}`);
  log('error', error.stack);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log('error', `Unhandled promise rejection at: ${promise}`);
  log('error', `Reason: ${reason}`);
});

// If this file is run directly (not imported), start the service
if (require.main === module) {
  startService().catch(error => {
    log('error', `Failed to start service: ${error.message}`);
    process.exit(1);
  });
} else {
  // Export for use as a module
  module.exports = {
    startService,
    testConnection,
    getUsersFromDevice,
    getAttendanceData,
    syncAttendanceLogs,
    cleanLogFile
  };
}
// Run command  pm2 start attendance-sync-daemon.js --name attendance-sync
// Stop command pm2 stop attendance-sync-daemon.js --name attendance-sync