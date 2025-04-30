// zktecoService.js - Enhanced with better error handling and automatic sync
const ZKLib = require('zklib');
const Attendance = require('./models/Attendance');
const cron = require('node-cron');
const Notification = require('./models/Notification');
const User = require('./models/Users');

// Configuration with fallback options
const CONFIG = {
  ip: process.env.ZKTECO_IP || '192.168.100.35',
  port: parseInt(process.env.ZKTECO_PORT || '4370'),
  timeout: parseInt(process.env.ZKTECO_TIMEOUT || '10000'), // Increased timeout
  retry: parseInt(process.env.ZKTECO_RETRY || '3'),
  syncInterval: process.env.ZKTECO_SYNC_INTERVAL || '*/10 * * * *', // Every 10 minutes by default
  attendanceParser: process.env.ZKTECO_PARSER || 'v6.60'
};

// Store last sync status
let lastSyncStatus = {
  success: false,
  timestamp: null,
  message: 'No sync attempted yet',
  recordsProcessed: 0
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

// Test connection function with retry
const testConnection = async (options = {}) => {
  const maxRetries = options.retry || CONFIG.retry;
  let attempt = 0;
  let lastError = null;
  
  console.log(`Testing connection to ZKTeco device at ${options.ip || CONFIG.ip}:${options.port || CONFIG.port}...`);
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Connection attempt ${attempt}/${maxRetries}`);
    
    try {
      const result = await testConnectionAttempt(options);
      console.log('Connection successful!');
      return result;
    } catch (err) {
      lastError = err;
      console.error(`Connection attempt ${attempt} failed:`, err.message);
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s...
        console.log(`Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed
  console.error(`All ${maxRetries} connection attempts failed.`);
  return {
    success: false,
    message: `Failed to connect after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    retryCount: attempt
  };
};

// Single connection test attempt
const testConnectionAttempt = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Create a new ZK instance for this operation
    const zk = createZkInstance(options);
    
    // Handle connection timeout manually for more control
    const timeoutId = setTimeout(() => {
      console.log('Connection attempt timed out');
      zk.disconnect();
      reject(new Error('Connection timeout'));
    }, options.timeout || CONFIG.timeout);
    
    zk.connect((err) => {
      clearTimeout(timeoutId);
      
      if (err) {
        console.error('ZK connect error:', err);
        zk.disconnect();
        reject(err);
      } else {
        console.log('Connected to device, getting info...');
        
        // Get device information
        zk.getInfo((infoErr, info) => {
          zk.disconnect();
          
          if (infoErr) {
            console.error('Error getting device info:', infoErr);
            resolve({
              success: true,
              message: 'Connected to device but failed to get info',
              error: infoErr.message
            });
          } else {
            console.log('Device info:', info);
            resolve({
              success: true,
              message: 'Connected successfully',
              deviceInfo: info || { status: 'unknown' }
            });
          }
        });
      }
    });
  });
};

// Get attendance data with retry
const getAttendanceData = async (options = {}) => {
  const maxRetries = options.retry || CONFIG.retry;
  let attempt = 0;
  let lastError = null;
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Fetching attendance data: attempt ${attempt}/${maxRetries}`);
    
    try {
      const data = await getAttendanceDataAttempt(options);
      return data;
    } catch (err) {
      lastError = err;
      console.error(`Attendance fetch attempt ${attempt} failed:`, err.message);
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to get attendance data after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

// Single attendance data fetch attempt
const getAttendanceDataAttempt = (options = {}) => {
  return new Promise((resolve, reject) => {
    const zk = createZkInstance(options);
    
    console.log('Connecting to ZKTeco device for attendance data...');
    
    // Timeout handler
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
      
      console.log('Connected, getting attendance data...');
      
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

// Sync attendance data to MongoDB
const syncAttendanceLogs = async (options = {}) => {
  console.log('Starting attendance synchronization...');
  
  try {
    // Get attendance data
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
        
        // Generate a record
        const record = {
          employeeName: log.name || 'Unknown',
          employeeNumber: log.id.toString(),
          department: log.department || 'General', // Default department
          date: recordDate,
          timeIn: recordDate,
          location: options.ip || CONFIG.ip,
          verifyMethod: log.type?.toString() || '0',
          deviceUserId: log.id
        };
        
        // Check if record exists
        const existingRecord = await Attendance.findOne({
          employeeNumber: record.employeeNumber,
          date: {
            $gte: new Date(new Date(record.date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(record.date).setHours(23, 59, 59, 999))
          }
        });
        
        if (!existingRecord) {
          // Create new record
          const newAttendance = new Attendance(record);
          await newAttendance.save();
          added++;
          newEmployees.add(record.employeeNumber);
        } else {
          // Check if needs update
          let isChanged = false;
          
          if (!existingRecord.employeeName && record.employeeName) {
            existingRecord.employeeName = record.employeeName;
            isChanged = true;
          }
          
          // Update time out if this is a newer record for the same day
          if (record.timeIn > existingRecord.timeIn) {
            existingRecord.timeOut = record.timeIn;
            isChanged = true;
          }
          
          if (isChanged) {
            await existingRecord.save();
            updated++;
          } else {
            unchanged++;
          }
        }
      } catch (recordError) {
        console.error('Error processing attendance record:', recordError);
        errors++;
      }
    }
    
    console.log(`Sync completed: ${added} new records, ${updated} updated, ${unchanged} unchanged, ${errors} errors`);
    
    // If any new attendance records, notify HR and admins
    if (added > 0) {
      notifyNewAttendance(added, Array.from(newEmployees));
    }
    
    const result = {
      success: true,
      message: `Sync completed: ${added} new records, ${updated} updated`,
      count: added + updated,
      added,
      updated,
      unchanged,
      errors
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
    syncScheduler = cron.schedule(CONFIG.syncInterval, async () => {
      console.log(`Running scheduled attendance sync at ${new Date().toISOString()}`);
      try {
        await syncAttendanceLogs();
      } catch (error) {
        console.error('Scheduled sync error:', error);
      }
    });
    
    return {
      success: true,
      message: `Automatic sync started with schedule: ${CONFIG.syncInterval}`
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
  
  syncScheduler.stop();
  syncScheduler = null;
  
  return {
    success: true,
    message: 'Automatic sync stopped'
  };
};

// Initialize module - start automatic sync
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
  syncAttendanceLogs,
  getSyncStatus,
  startAutoSync,
  stopAutoSync
};