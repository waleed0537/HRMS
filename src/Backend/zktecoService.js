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
const syncAttendanceLogs = async () => {
  console.log('Simulating sync operation - actual sync is handled by daemon process');
  
  try {
    // Get latest sync status to inform the client about the last sync
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
      message: `Sync managed by daemon process. Last daemon sync: ${status.timestamp ? new Date(status.timestamp).toLocaleString() : 'Unknown'}`,
      count: todayCount,
      todayCount,
      lastSync: status.timestamp,
      source: 'daemon'
    };
  } catch (error) {
    console.error('Error simulating sync operation:', error);
    return {
      success: false,
      message: `Error checking sync status: ${error.message}`,
      error: error.message
    };
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