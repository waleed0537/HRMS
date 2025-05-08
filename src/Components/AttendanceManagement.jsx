import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertTriangle, Check, X, Calendar, ChevronLeft, ChevronRight, Database, Clock } from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/AttendanceManagement.css';

const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const refreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Date filter
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const formattedSelectedDate = selectedDate.toISOString().split('T')[0];

  // Start auto-refresh on component mount
  useEffect(() => {
    // Set ref to track if component is mounted
    isMountedRef.current = true;
    
    // Initial data fetch and daemon status check
    checkDaemonStatus();
    fetchAttendanceData(formattedSelectedDate);
    
    // Start auto-refresh interval (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log('Auto-refresh triggered');
        fetchAttendanceData(formattedSelectedDate);
        checkDaemonStatus();
      }
    }, 30000);
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Function to check the status of the attendance sync daemon
  const checkDaemonStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get the sync status from the server
      const response = await fetch(`${API_BASE_URL}/api/attendance/sync-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get daemon status. Status: ${response.status}`);
      }
      
      const statusData = await response.json();
      
      setDaemonStatus({
        lastSync: statusData.timestamp ? new Date(statusData.timestamp) : null,
        success: statusData.success,
        message: statusData.message,
        count: statusData.count || 0,
        config: statusData.config
      });
      
      // Clear any previous status message
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error getting daemon status:', error);
      setStatusMessage({
        type: 'error',
        text: `Unable to get daemon status: ${error.message}`
      });
    }
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
          'Authorization': `Bearer ${token}`
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

  // Function to manually refresh data from database
  const refreshData = async () => {
    if (refreshing || !isMountedRef.current) return;
    
    try {
      setRefreshing(true);
      setStatusMessage({ type: 'info', text: 'Refreshing attendance data...' });
      
      // Refresh attendance data for the currently selected date
      await fetchAttendanceData(formattedSelectedDate);
      await checkDaemonStatus();
      
      setStatusMessage({ 
        type: 'success', 
        text: 'Data refreshed successfully!' 
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setStatusMessage({ 
        type: 'error', 
        text: `Error: ${error.message}` 
      });
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatusMessage(prevMessage => 
              prevMessage && prevMessage.type === 'success' ? null : prevMessage
            );
          }
        }, 3000);
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

  const formatLastSync = (date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} minutes ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hours ago`;
    
    return date.toLocaleString();
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
              onClick={refreshData}
              className={`attendance-refresh-button ${refreshing ? 'refreshing' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw className={`attendance-icon ${refreshing ? 'spinning' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        
        {/* Daemon Status Information */}
        {daemonStatus && (
          <div className="attendance-daemon-status">
            <div className="daemon-status-header">
              <Database size={16} className="daemon-icon" />
              <span>Attendance Sync Daemon Status</span>
            </div>
            <div className="daemon-status-details">
              <div className="daemon-status-item">
                <span className="daemon-status-label">Last Sync:</span>
                <span className="daemon-status-value">
                  {daemonStatus.lastSync ? formatLastSync(daemonStatus.lastSync) : 'Unknown'}
                </span>
              </div>
              <div className="daemon-status-item">
                <span className="daemon-status-label">Status:</span>
                <span className={`daemon-status-value ${daemonStatus.success ? 'success' : 'error'}`}>
                  {daemonStatus.success ? 'Active' : 'Error'}
                </span>
              </div>
              <div className="daemon-status-item">
                <span className="daemon-status-label">Records:</span>
                <span className="daemon-status-value">{daemonStatus.count || 0}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Status Message */}
        {statusMessage && (
          <div className={`attendance-status-message ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}
        
        {/* Auto-refresh indicator */}
        <div className="attendance-auto-refresh-indicator">
          <div className={`refresh-pulse ${refreshing ? 'active' : ''}`}></div>
          <span>Auto-refresh: Active (every 30 seconds)</span>
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
                {selectedDate.toDateString() === today.toDateString() && daemonStatus?.lastSync && (
                  <div className="attendance-daemon-info">
                    <p>Last sync by daemon: {formatLastSync(daemonStatus.lastSync)}</p>
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
                      <th>Department</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record, index) => (
                      <tr key={record._id || index}>
                        <td>{record.deviceUserId || record.employeeNumber || 'N/A'}</td>
                        <td>{record.employeeName || 'Unknown'}</td>
                        <td>
                          <span className="attendance-present-badge">
                            <Check size={16} className="attendance-present-icon" />
                          </span>
                        </td>
                        <td>{record.department || 'General'}</td>
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