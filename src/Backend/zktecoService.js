// zktecoService.js - Optimized with proper user ID handling like Python script
const ZKLib = require('zklib');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');
const User = require('./models/Users');
const { exec } = require('child_process');
const os = require('os');

// Configuration with updated options for faster sync
const CONFIG = {
  ip: process.env.ZKTECO_IP || '192.168.100.35',
  port: parseInt(process.env.ZKTECO_PORT || '4370'),
  timeout: parseInt(process.env.ZKTECO_TIMEOUT || '5000'), // Reduced timeout for faster sync
  retry: parseInt(process.env.ZKTECO_RETRY || '2'),
  syncInterval: process.env.ZKTECO_SYNC_INTERVAL || '*/5 * * * * *', // Every 5 seconds
  attendanceParser: process.env.ZKTECO_PARSER || 'v6.60',
  autoSync: process.env.ZKTECO_AUTO_SYNC === 'true'
};

// Store last sync status
let lastSyncStatus = {
  success: false,
  timestamp: null,
  message: 'No sync attempted yet',
  recordsProcessed: 0
};

// Cache for user data to avoid frequent lookups
let userCache = {
  timestamp: null,
  data: null,
  TTL: 5 * 60 * 1000 // 5 minutes cache TTL
};

// Initialize automatic sync scheduler
let syncScheduler = null;

// Create a function to get a new ZK instance each time
function createZkInstance(options = {}) {
  return new ZKLib({
    ip: options.ip || CONFIG.ip,
    port: options.port || CONFIG.port,
    inport: options.port || CONFIG.port,
    timeout: options.timeout || CONFIG.timeout,
    attendanceParser: options.attendanceParser || CONFIG.attendanceParser
  });
}

// Native ping implementation without external dependencies
const pingDevice = (host) => {
  return new Promise((resolve) => {
    const platform = os.platform();
    const pingCmd = platform === 'win32' 
      ? `ping -n 1 -w 2000 ${host}` 
      : `ping -c 1 -W 2 ${host}`;
    
    exec(pingCmd, (error, stdout, stderr) => {
      // Check for successful ping response
      const isAlive = !error && 
        (platform === 'win32' 
          ? stdout.includes('Reply from') 
          : stdout.includes(' 0% packet loss'));
      
      resolve({
        host,
        alive: isAlive,
        time: new Date()
      });
    });
  });
};

// Test connection function that uses ping first for speed
const testConnection = async (options = {}) => {
  const deviceIp = options.ip || CONFIG.ip;
  console.log(`Testing connection to ZKTeco device at ${deviceIp}`);
  
  // First try ping for quick connection test
  try {
    console.log(`Pinging ${deviceIp}...`);
    const pingResult = await pingDevice(deviceIp);
    
    if (!pingResult.alive) {
      console.log('Ping failed, device appears to be offline');
      return {
        success: false,
        message: `Device at ${deviceIp} is unreachable (ping failed)`,
        pingResult
      };
    }
    
    console.log('Ping successful! Trying ZK connection...');
  } catch (pingError) {
    console.warn('Ping check failed:', pingError.message);
    // Continue with ZK connection test even if ping fails
  }
  
  // Then try actual ZK connection and get user data to verify full functionality
  try {
    // Get users to verify proper connection
    const users = await getUsersFromDevice(options);
    console.log(`Retrieved ${users.length} users from device - test successful!`);
    
    return {
      success: true,
      message: 'Successfully connected and retrieved data from device',
      userCount: users.length
    };
  } catch (err) {
    console.error('Failed to get user data from device:', err.message);
    return {
      success: false,
      message: `Connected but failed to retrieve user data: ${err.message}`,
      error: err.message
    };
  }
};

// Get users data from device - Implementation similar to Python example
const getUsersFromDevice = async (options = {}) => {
  // Check cache first
  const now = new Date();
  if (userCache.data && userCache.timestamp && 
      (now - userCache.timestamp) < userCache.TTL) {
    console.log('Using cached user data');
    return userCache.data;
  }
  
  console.log('Fetching user data from device...');
  const maxRetries = options.retry || CONFIG.retry;
  let attempt = 0;
  let lastError = null;
  
  while (attempt < maxRetries) {
    attempt++;
    
    try {
      const users = await getUsersAttempt(options);
      
      // Transform users to a more usable format and cache
      const transformedUsers = users.map(user => ({
        id: user.uid, // This is the actual device user ID
        name: user.name || `User ${user.uid}`,
        role: user.role || 0,
        password: user.password || '',
        cardno: user.cardno || ''
      }));
      
      // Update cache
      userCache = {
        timestamp: now,
        data: transformedUsers,
        TTL: userCache.TTL
      };
      
      return transformedUsers;
    } catch (err) {
      lastError = err;
      console.error(`User fetch attempt ${attempt} failed:`, err.message);
      
      if (attempt < maxRetries) {
        const delay = 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to get users after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

// Single user fetch attempt
const getUsersAttempt = (options = {}) => {
  return new Promise((resolve, reject) => {
    const zk = createZkInstance(options);
    
    console.log('Connecting to ZKTeco device for user data...');
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      console.log('User data fetch timed out');
      try { zk.disconnect(); } catch (e) {}
      reject(new Error('Operation timeout while fetching users'));
    }, options.timeout || CONFIG.timeout);
    
    zk.connect((err) => {
      if (err) {
        clearTimeout(timeoutId);
        try { zk.disconnect(); } catch (e) {}
        console.error('Connection error when getting users:', err);
        return reject(err);
      }
      
      console.log('Connected, getting user data...');
      
      zk.getUser((userErr, users) => {
        clearTimeout(timeoutId);
        
        // Always disconnect
        try { zk.disconnect(); } catch (e) {}
        
        if (userErr) {
          console.error('Error getting users:', userErr);
          return reject(userErr);
        }
        
        if (!users || !Array.isArray(users)) {
          return reject(new Error('Invalid user data format received from device'));
        }
        
        console.log(`Got ${users.length} user records`);
        resolve(users);
      });
    });
  });
};

// Get attendance data with retry - optimized for speed
const getAttendanceData = async (options = {}) => {
  const maxRetries = options.retry || CONFIG.retry;
  let attempt = 0;
  let lastError = null;
  
  while (attempt < maxRetries) {
    attempt++;
    
    try {
      const data = await getAttendanceDataAttempt(options);
      return data;
    } catch (err) {
      lastError = err;
      console.error(`Attendance fetch attempt ${attempt} failed:`, err.message);
      
      if (attempt < maxRetries) {
        const delay = 500; // Shorter delay for faster sync
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to get attendance data after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

// Single attendance data fetch attempt - optimized
const getAttendanceDataAttempt = (options = {}) => {
  return new Promise((resolve, reject) => {
    const zk = createZkInstance(options);
    
    // Timeout handler - shorter timeout for faster response
    const timeoutId = setTimeout(() => {
      console.log('Attendance data fetch timed out');
      try { zk.disconnect(); } catch (e) {}
      reject(new Error('Operation timeout while fetching attendance'));
    }, options.timeout || CONFIG.timeout);
    
    zk.connect((err) => {
      if (err) {
        clearTimeout(timeoutId);
        try { zk.disconnect(); } catch (e) {}
        console.error('Connection error when getting attendance:', err);
        return reject(err);
      }
      
      zk.getAttendance((dataErr, data) => {
        clearTimeout(timeoutId);
        
        // Always disconnect
        try { zk.disconnect(); } catch (e) {}
        
        if (dataErr) {
          console.error('Error getting attendance:', dataErr);
          return reject(dataErr);
        }
        
        if (!data || !Array.isArray(data)) {
          return reject(new Error('Invalid data format received from device'));
        }
        
        console.log(`Got ${data.length} attendance records`);
        resolve(data);
      });
    });
  });
};

// Optimized sync attendance data to MongoDB with user info - Python approach implementation
const syncAttendanceLogs = async (options = {}) => {
  console.log('Starting attendance synchronization...');
  const startTime = Date.now();
  
  try {
    // 1) First, get all users from the device (like Python script)
    const users = await getUsersFromDevice(options);
    console.log(`Retrieved ${users.length} users from device`);
    
    // 2) Build user_id → user.name mapping (like Python script)
    const nameMap = {};
    users.forEach(user => {
      nameMap[user.id] = user.name;
    });
    console.log('Created user ID to name mapping');
    
    // 3) Get attendance logs (like Python script)
    const logs = await getAttendanceData(options);
    
    if (!logs || logs.length === 0) {
      const result = {
        success: true,
        message: 'No attendance records found on the device',
        count: 0
      };
      lastSyncStatus = {
        ...result,
        timestamp: new Date()
      };
      return result;
    }
    
    console.log(`Processing ${logs.length} attendance records...`);
    
    // Process records
    let added = 0;
    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    let newEmployees = new Set();
    
    // Use bulk operations for better performance
    const bulkOps = [];
    
    // 4) Process attendance records with user names (like Python script)
    for (const log of logs) {
      try {
        // Format the data
        const recordDate = new Date(log.timestamp);
        
        // Skip invalid dates
        if (isNaN(recordDate.getTime())) {
          console.warn(`Skipping record with invalid date: ${log.timestamp}`);
          errors++;
          continue;
        }
        
        // Get user ID and name exactly like Python script
        const uid = log.uid || log.id; // Ensure we get the correct user ID field
        const name = nameMap[uid] || 'Unknown';
        
        console.log(`Processing record: ${uid}\t${name}\t${recordDate}`);
        
        // Generate a record
        const record = {
          employeeName: name,
          employeeNumber: uid.toString(), // Store as string for compatibility
          deviceUserId: uid, // Important: store the actual device ID
          department: log.department || 'General', // Default department
          date: recordDate,
          timeIn: recordDate,
          location: options.ip || CONFIG.ip,
          verifyMethod: log.type?.toString() || '0'
        };
        
        // Check if record exists (without database query for speed)
        const dateStart = new Date(recordDate);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(recordDate);
        dateEnd.setHours(23, 59, 59, 999);
        
        // Prepare upsert operation
        bulkOps.push({
          updateOne: {
            filter: {
              deviceUserId: record.deviceUserId,
              date: {
                $gte: dateStart,
                $lt: dateEnd
              }
            },
            update: {
              $setOnInsert: {
                employeeNumber: record.employeeNumber,
                department: record.department,
                date: record.date,
                timeIn: record.timeIn,
                location: record.location,
                verifyMethod: record.verifyMethod,
                status: 'present',
                createdAt: new Date()
              },
              $set: {
                deviceUserId: record.deviceUserId, // Always store actual device ID
                employeeName: record.employeeName, // Always update name if available
                updatedAt: new Date()
              }
            },
            upsert: true
          }
        });
        
        newEmployees.add(record.employeeNumber);
      } catch (recordError) {
        console.error('Error processing attendance record:', recordError);
        errors++;
      }
    }
    
    // Execute bulk operations if any
    if (bulkOps.length > 0) {
      const bulkResult = await Attendance.bulkWrite(bulkOps);
      added = bulkResult.upsertedCount || 0;
      updated = bulkResult.modifiedCount || 0;
      unchanged = logs.length - added - updated - errors;
    }
    
    const syncTime = Date.now() - startTime;
    console.log(`Sync completed in ${syncTime}ms: ${added} new records, ${updated} updated, ${unchanged} unchanged, ${errors} errors`);
    
    // If any new attendance records, notify HR and admins
    if (added > 0) {
      notifyNewAttendance(added, Array.from(newEmployees));
    }
    
    const result = {
      success: true,
      message: `Sync completed in ${syncTime}ms: ${added} new records, ${updated} updated`,
      count: added + updated,
      added,
      updated,
      unchanged,
      errors,
      syncTime
    };
    
    lastSyncStatus = {
      ...result,
      timestamp: new Date()
    };
    
    return result;
  } catch (err) {
    console.error('Error syncing attendance logs:', err);
    
    const result = {
      success: false,
      message: `Failed to sync attendance data: ${err.message}`,
      error: err.message
    };
    
    lastSyncStatus = {
      ...result,
      timestamp: new Date()
    };
    
    return result;
  }
};

// Function to notify HR and admins about new attendance records
const notifyNewAttendance = async (count, employeeNumbers) => {
  try {
    // Find HR managers and admins
    const adminUsers = await User.find({
      $or: [
        { isAdmin: true },
        { role: 'hr_manager' }
      ]
    });
    
    if (adminUsers.length === 0) {
      console.log('No HR managers or admins found for attendance notification');
      return;
    }
    
    console.log(`Notifying ${adminUsers.length} HR/admin users about new attendance`);
    
    // Create notifications
    const notifications = adminUsers.map(user => ({
      userId: user._id,
      title: 'New Attendance Records',
      message: `${count} new attendance records synced from the device`,
      type: 'attendance',
      metadata: {
        count,
        employeeNumbers
      }
    }));
    
    // Save all notifications
    await Notification.insertMany(notifications);
    
  } catch (error) {
    console.error('Failed to send attendance notifications:', error);
  }
};

// Get sync status
const getSyncStatus = () => {
  return {
    ...lastSyncStatus,
    config: {
      ip: CONFIG.ip,
      port: CONFIG.port,
      syncInterval: CONFIG.syncInterval
    }
  };
};

// Start automatic sync scheduler
const startAutoSync = () => {
  if (syncScheduler) {
    return {
      success: false,
      message: 'Automatic sync already running'
    };
  }
  
  try {
    // Use a simple setInterval for 5-second sync instead of cron
    syncScheduler = setInterval(async () => {
      console.log(`Running scheduled attendance sync at ${new Date().toISOString()}`);
      try {
        await syncAttendanceLogs();
      } catch (error) {
        console.error('Scheduled sync error:', error);
      }
    }, 5000); // Every 5 seconds
    
    return {
      success: true,
      message: `Automatic sync started with 5-second interval`
    };
  } catch (error) {
    console.error('Error starting automatic sync:', error);
    return {
      success: false,
      message: `Failed to start automatic sync: ${error.message}`
    };
  }
};

// Stop automatic sync
const stopAutoSync = () => {
  if (!syncScheduler) {
    return {
      success: false,
      message: 'Automatic sync not running'
    };
  }
  
  clearInterval(syncScheduler);
  syncScheduler = null;
  
  return {
    success: true,
    message: 'Automatic sync stopped'
  };
};

// Initialize module - start automatic sync if configured
const initialize = () => {
  console.log('Initializing ZKTeco service...');
  // Test connection first
  testConnection()
    .then(result => {
      if (result.success) {
        console.log('ZKTeco connection successful, starting automatic sync');
        return startAutoSync();
      } else {
        console.log('ZKTeco connection failed, automatic sync not started');
        return {
          success: false,
          message: 'Automatic sync not started due to connection failure'
        };
      }
    })
    .then(result => {
      console.log('Auto-sync initialization result:', result);
    })
    .catch(err => {
      console.error('Error during ZKTeco service initialization:', err);
    });
};

// Initialize on module load
initialize();

module.exports = {
  testConnection,
  getAttendanceData,
  getUsersFromDevice,
  syncAttendanceLogs,
  getSyncStatus,
  startAutoSync,
  stopAutoSync
};