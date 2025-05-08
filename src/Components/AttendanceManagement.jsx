import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertTriangle, Check, X, Upload, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/AttendanceManagement.css';

const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const autoSyncIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Date filter
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const formattedSelectedDate = selectedDate.toISOString().split('T')[0];

  // Start auto-sync on component mount
  useEffect(() => {
    // Set ref to track if component is mounted
    isMountedRef.current = true;
    
    // Initial data fetch and connection test
    testDeviceConnection();
    fetchAttendanceData(formattedSelectedDate);
    
    // FIXED: Changed from 5 seconds to 5 minutes
    // Start auto-sync interval (every 5 minutes)
    autoSyncIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log('Auto-sync triggered');
        syncAttendanceData(true); // true = silent mode
      }
    }, 300000); // Changed from 5000 (5 seconds) to 300000 (5 minutes)
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
      }
    };
  }, []);

  // Function to test device connection by trying to get data
  const testDeviceConnection = async () => {
    try {
      setConnectionStatus({ status: 'testing', message: 'Testing connection...' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Try to get actual data from the device to test connection
      const response = await fetch(`${API_BASE_URL}/api/attendance/test-connection`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to test connection. Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Only show success if we actually got user data from the device
      if (result.success && result.userCount > 0) {
        setConnectionStatus({ 
          status: 'success', 
          message: `Connected successfully! Retrieved ${result.userCount} users.`,
          info: result.deviceInfo 
        });
      } else {
        setConnectionStatus({ 
          status: 'error', 
          message: result.success ? 'Connected but no user data retrieved' : (result.message || 'Failed to connect to device')
        });
      }
    } catch (error) {
      console.error('Error testing device connection:', error);
      setConnectionStatus({ 
        status: 'error', 
        message: `Connection test failed: ${error.message}` 
      });
    }
    
    // Clear connection status after 3 seconds if successful
    setTimeout(() => {
      if (isMountedRef.current) {
        setConnectionStatus(prev => prev?.status === 'success' ? null : prev);
      }
    }, 3000);
  };

  // Function to fetch attendance data for specific date
  const fetchAttendanceData = async (date) => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get attendance data for the selected date
      const response = await fetch(`${API_BASE_URL}/api/attendance?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();
      
      // Extract attendance data from response
      let attendanceArray = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        attendanceArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        attendanceArray = responseData;
      }
      
      console.log(`Loaded ${attendanceArray.length} attendance records for ${date}`);
      setAttendanceData(attendanceArray);
      
    } catch (error) {
      console.error('Error in fetchAttendanceData:', error);
      setError(`Failed to load attendance data: ${error.message}`);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Update attendance data when date changes
  useEffect(() => {
    fetchAttendanceData(formattedSelectedDate);
  }, [selectedDate]);

  // Function to manually sync attendance data from ZKTeco device
  const syncAttendanceData = async (silent = false) => {
    if (syncing || !isMountedRef.current) return;
    
    try {
      setSyncing(true);
      if (!silent) {
        setSyncStatus({ type: 'info', text: 'Syncing attendance data...' });
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/attendance/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sync attendance data. Status: ${response.status}, Message: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (!silent) {
          setSyncStatus({ 
            type: 'success', 
            text: result.message || `Sync completed successfully. ${result.count} records processed.` 
          });
        }
        
        // Refresh attendance data for the currently selected date
        await fetchAttendanceData(formattedSelectedDate);
      } else {
        if (!silent) {
          setSyncStatus({ 
            type: 'error', 
            text: result.message || 'Sync failed. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Error syncing attendance data:', error);
      if (!silent) {
        setSyncStatus({ 
          type: 'error', 
          text: `Error: ${error.message}` 
        });
      }
    } finally {
      if (isMountedRef.current) {
        setSyncing(false);
        
        // Clear success message after 3 seconds
        if (!silent) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setSyncStatus(prevMessage => 
                prevMessage && prevMessage.type === 'success' ? null : prevMessage
              );
            }
          }, 3000);
        }
      }
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Time';
    }
  };

  // Date navigation functions
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading && attendanceData.length === 0) {
    return (
      <div className="attendance-loading-container">
        <div className="attendance-loading-spinner"></div>
        <div className="attendance-loading-text">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <div className="attendance-card-header">
          <div className="attendance-card-title">
            <Clock className="attendance-icon" />
            <h2>Attendance Management</h2>
          </div>
          <div className="attendance-header-actions">
            <button 
              onClick={testDeviceConnection}
              className="attendance-test-button"
              disabled={syncing}
            >
              Test Connection
            </button>
            <button 
              onClick={() => syncAttendanceData(false)}
              className={`attendance-sync-button ${syncing ? 'syncing' : ''}`}
              disabled={syncing}
            >
              <RefreshCw className={`attendance-icon ${syncing ? 'spinning' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
        
        {/* Connection Status Message */}
        {connectionStatus && (
          <div className={`attendance-connection-message ${connectionStatus.status}`}>
            {connectionStatus.message}
            {connectionStatus.info && (
              <span className="attendance-device-info">
                Device: {connectionStatus.info.deviceName || 'ZKTeco Device'}
              </span>
            )}
          </div>
        )}
        
        {/* Sync Message */}
        {syncStatus && (
          <div className={`attendance-sync-message ${syncStatus.type}`}>
            {syncStatus.text}
          </div>
        )}
        
        {/* Auto-sync status indicator */}
        <div className="attendance-auto-sync-indicator">
          <div className={`sync-pulse ${syncing ? 'active' : ''}`}></div>
          <span>Auto-sync: Active (every 5 minutes)</span>
        </div>
        
        {/* Date navigation */}
        <div className="attendance-date-navigation">
          <button 
            onClick={goToPreviousDay} 
            className="attendance-date-nav-button"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="attendance-date-display">
            <div className="attendance-selected-date">
              {formatDateForDisplay(selectedDate)}
            </div>
            <input
              type="date"
              value={formattedSelectedDate}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="attendance-date-picker"
            />
          </div>
          
          <button 
            onClick={goToNextDay} 
            className="attendance-date-nav-button"
          >
            <ChevronRight size={18} />
          </button>
          
          <button 
            onClick={goToToday}
            className="attendance-today-button"
            disabled={
              selectedDate.getDate() === today.getDate() &&
              selectedDate.getMonth() === today.getMonth() &&
              selectedDate.getFullYear() === today.getFullYear()
            }
          >
            Today
          </button>
        </div>
        
        <div className="attendance-card-content">
          <div className="attendance-table-container">
            {error ? (
              <div className="attendance-error-container">
                <AlertTriangle size={32} />
                <div className="attendance-error-message">{error}</div>
                <button onClick={() => fetchAttendanceData(formattedSelectedDate)} className="attendance-retry-button">
                  Retry
                </button>
              </div>
            ) : attendanceData.length === 0 ? (
              <div className="attendance-no-records">
                <p>No attendance records found for {formatDateForDisplay(selectedDate)}.</p>
                {selectedDate.toDateString() === today.toDateString() && (
                  <div className="attendance-sync-indicator">
                    <RefreshCw className="spinning" size={24} />
                    <p>Sync in progress...</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="attendance-table-info">
                  Showing {attendanceData.length} records for {formatDateForDisplay(selectedDate)}
                </div>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Present</th>
                      <th>Company</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                  {attendanceData.map((record, index) => (
                      <tr key={record._id || index}>
                        <td>
                          {/* Force deviceUserId to be displayed as a number */}
                          {record.deviceUserId !== undefined ? record.deviceUserId : (record.employeeNumber || 'N/A')}
                        </td>
                        <td>{record.employeeName || 'Unknown'}</td>
                        <td>
                          <span className="attendance-present-badge">
                            <Check size={16} className="attendance-present-icon" />
                          </span>
                        </td>
                        <td>Company</td>
                        <td>{formatDateTime(record.date || record.timeIn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;