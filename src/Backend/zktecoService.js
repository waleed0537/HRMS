// zktecoService.js - Modified to only get data from database, no direct device connection
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');
const User = require('./models/Users');
const SyncStatus = require('./models/SyncStatus'); // Add this model to your project if needed

// Cache for database queries
let queryCache = {
  syncStatus: {
    data: null,
    timestamp: null,
    ttl: 15 * 1000 // 15 seconds cache
  }
};

// Get sync status from database (created by the attendance-sync-daemon)
const getSyncStatus = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (queryCache.syncStatus.data &&
      queryCache.syncStatus.timestamp &&
      (now - queryCache.syncStatus.timestamp < queryCache.syncStatus.ttl)) {
      console.log('Using cached sync status');
      return queryCache.syncStatus.data;
    }

    // Try to get the latest sync status record from the database
    let syncStatusRecord;
    if (typeof SyncStatus === 'undefined' || SyncStatus === null) {
      // If SyncStatus model isn't available, return simulated status
      console.log('SyncStatus model not available, using synthetic status');
      const lastAttendance = await Attendance.findOne().sort({ createdAt: -1 });

      syncStatusRecord = {
        timestamp: lastAttendance?.createdAt || new Date(),
        success: true,
        message: 'System is using automated sync daemon.',
        recordsProcessed: 0,
        count: 0,
        added: 0
      };
    } else {
      // Retrieve the actual latest sync status
      syncStatusRecord = await SyncStatus.findOne().sort({ timestamp: -1 }).lean();

      if (!syncStatusRecord) {
        // Fallback if no sync status records found
        const lastAttendance = await Attendance.findOne().sort({ createdAt: -1 });
        syncStatusRecord = {
          timestamp: lastAttendance?.createdAt || new Date(),
          success: true,
          message: 'System uses automated sync daemon, no status records found.',
          recordsProcessed: 0,
          count: 0,
          added: 0,
          config: {
            ip: 'managed by daemon',
            port: 'managed by daemon'
          }
        };
      }
    }

    // Format the response to match the expected structure
    const result = {
      success: syncStatusRecord.success,
      timestamp: syncStatusRecord.timestamp,
      message: syncStatusRecord.message || 'Syncing managed by daemon process',
      count: syncStatusRecord.recordsProcessed || 0,
      added: syncStatusRecord.recordsAdded || 0,
      config: syncStatusRecord.deviceInfo || {
        ip: 'managed by daemon',
        port: 'managed by daemon'
      }
    };

    // Update cache
    queryCache.syncStatus.data = result;
    queryCache.syncStatus.timestamp = now;

    return result;
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      success: false,
      timestamp: new Date(),
      message: `Error fetching sync status: ${error.message}`,
      count: 0,
      config: {
        ip: 'unknown',
        port: 'unknown'
      }
    };
  }
};

// Get attendance data from database only
const getAttendanceData = async (options = {}) => {
  try {
    console.log('Fetching attendance data from database...');

    // Build query based on options
    const query = {};

    // Filter by date if provided
    if (options.date) {
      const queryDate = new Date(options.date);
      const startOfDay = new Date(queryDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(queryDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Apply any other filters
    if (options.employeeNumber) {
      query.employeeNumber = options.employeeNumber;
    }

    if (options.department) {
      query.department = options.department;
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .sort({ timeIn: -1 })
      .limit(options.limit || 500)
      .lean();

    console.log(`Retrieved ${attendanceRecords.length} attendance records from database`);
    return attendanceRecords;
  } catch (error) {
    console.error('Error fetching attendance data from database:', error);
    throw error;
  }
};

// Simulate a sync operation - this only returns the current status
// but doesn't actually do any syncing as that's handled by the daemon
// Update this section in zktecoService.js - around line 263-264 in the syncAttendanceLogs function
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
        const recordTimestamp = new Date(log.timestamp);
        
        // Skip invalid dates
        if (isNaN(recordTimestamp.getTime())) {
          console.warn(`Skipping record with invalid date: ${log.timestamp}`);
          errors++;
          continue;
        }

        // Get the time in hours and minutes
        const hours = recordTimestamp.getHours();
        const minutes = recordTimestamp.getMinutes();
        
        // CRITICAL UPDATE: Create a date object for the appropriate day
        // If time is after midnight and before noon (assuming night shift ends by noon)
        // we treat it as previous day's attendance
        const recordDate = new Date(recordTimestamp);
        
        // Check if this is a late night/early morning check-in (between 12:00 AM and 11:59 AM)
        // and adjust the date to previous day
        if (hours >= 0 && hours < 12) {
          // This is early morning attendance (after midnight, e.g., 1:05 AM)
          // Subtract one day to make it part of the previous day's records
          recordDate.setDate(recordDate.getDate() - 1);
          console.log(`Adjusted date for early morning attendance: ${recordTimestamp} → ${recordDate}`);
        }

        // Get user ID and name exactly like Python script
        const uid = log.uid || log.id; // Ensure we get the correct user ID field
        const name = nameMap[uid] || 'Unknown';
        
        console.log(`Processing record: ${uid}\t${name}\t${recordTimestamp} (assigned to ${recordDate.toDateString()})`);
        
        // Generate a record
        const record = {
          employeeName: name,
          employeeNumber: uid.toString(), // Store as string for compatibility
          deviceUserId: uid, // Important: store the actual device ID
          department: log.department || 'General', // Default department
          date: recordDate, // Use the adjusted date (previous day for after-midnight check-ins)
          timeIn: recordTimestamp, // Keep the actual timestamp for clock-in time
          location: options.ip || CONFIG.ip,
          verifyMethod: log.type?.toString() || '0'
        };
        
        // For database filtering, get the day range for the adjusted date
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
                date: record.date, // The adjusted date
                timeIn: record.timeIn, // The actual check-in time
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

// Simulate a connection test - returns information about the daemon
const testConnection = async () => {
  try {
    console.log('Simulating connection test - actual connection is handled by daemon process');

    // Get latest sync status to provide information about the daemon
    const status = await getSyncStatus();

    // Count today's records for informational purposes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await Attendance.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    return {
      success: true,
      message: 'Device connection managed by daemon process',
      deviceInfo: {
        ip: 'See ecosystem.config.js',
        port: 'See ecosystem.config.js',
        managedBy: 'PM2 daemon process',
        lastSync: status.timestamp ? new Date(status.timestamp).toLocaleString() : 'Unknown',
        todayRecords: todayCount
      }
    };
  } catch (error) {
    console.error('Error in test connection:', error);
    return {
      success: false,
      message: `Error checking connection status: ${error.message}`,
      error: error.message
    };
  }
};

// Empty function stubs for compatibility - these operations are handled by the daemon
const startAutoSync = () => {
  return {
    success: true,
    message: 'Auto-sync is managed by PM2 daemon process'
  };
};

const stopAutoSync = () => {
  return {
    success: true,
    message: 'Auto-sync is managed by PM2 daemon process'
  };
};

// Don't need this function anymore but keep for API compatibility
const getUsersFromDevice = async () => {
  console.log('getUsersFromDevice is not needed as device connection is handled by daemon');
  return [];
};

// Export the functions with the same API structure for backward compatibility
module.exports = {
  testConnection,
  getAttendanceData,
  getUsersFromDevice,
  syncAttendanceLogs,
  getSyncStatus,
  startAutoSync,
  stopAutoSync
};