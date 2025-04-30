import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Calendar, Users, RefreshCw, AlertTriangle, Upload, X, Settings, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import API_BASE_URL from '../config/api.js';
import '../assets/css/AttendanceManagement.css';
import AttendanceSyncStatus from './AttendanceSyncStatus';

const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [department, setDepartment] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(50);

  useEffect(() => {
    fetchAttendanceData();
  }, [currentPage, selectedDate, dateRange]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams();
      
      // Date filtering
      if (selectedDate) {
        params.append('date', format(new Date(selectedDate), 'yyyy-MM-dd'));
      } else if (dateRange.start && dateRange.end) {
        params.append('startDate', format(new Date(dateRange.start), 'yyyy-MM-dd'));
        params.append('endDate', format(new Date(dateRange.end), 'yyyy-MM-dd'));
      }
      
      // Pagination
      params.append('page', currentPage);
      params.append('limit', recordsPerPage);

      const response = await fetch(`${API_BASE_URL}/api/attendance?${params.toString()}`, {
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
      
      console.log(`Loaded ${attendanceArray.length} attendance records`);
      setAttendanceData(attendanceArray);
      
      // Set pagination information
      if (responseData.totalRecords) {
        setTotalRecords(responseData.totalRecords);
        setTotalPages(Math.ceil(responseData.totalRecords / recordsPerPage));
      }
      
      // Extract unique departments
      const uniqueDepartments = [...new Set(
        attendanceArray
          .filter(record => record.department)
          .map(record => record.department)
      )];
      
      setDepartments(uniqueDepartments);
      setFilteredData(attendanceArray);
    } catch (error) {
      console.error('Error in fetchAttendanceData:', error);
      setError(`Failed to load attendance data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to test device connection
  const testDeviceConnection = async () => {
    try {
      setConnectionStatus({ status: 'testing', message: 'Testing connection...' });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
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
      
      if (result.success) {
        setConnectionStatus({ 
          status: 'success', 
          message: 'Device connected successfully',
          info: result.deviceInfo 
        });
      } else {
        setConnectionStatus({ 
          status: 'error', 
          message: result.message || 'Failed to connect to device'
        });
        // If connection fails, show CSV upload option
        setShowCsvUpload(true);
      }
    } catch (error) {
      console.error('Error testing device connection:', error);
      setConnectionStatus({ 
        status: 'error', 
        message: `Connection test failed: ${error.message}` 
      });
      // If connection test fails, show CSV upload option
      setShowCsvUpload(true);
    }
    
    // Clear connection status after 5 seconds if successful
    setTimeout(() => {
      setConnectionStatus(prev => prev?.status === 'success' ? null : prev);
    }, 5000);
  };

  // Function to manually sync attendance data from ZKTeco device
  const syncAttendanceData = async () => {
    try {
      setSyncing(true);
      setSyncMessage({ type: 'info', text: 'Syncing attendance data from device...' });
      
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
        setSyncMessage({ 
          type: 'success', 
          text: result.message || `Sync completed successfully. ${result.count} records processed.` 
        });
        
        // Refresh attendance data
        await fetchAttendanceData();
      } else {
        setSyncMessage({ 
          type: 'error', 
          text: result.message || 'Sync failed. Please try again.' 
        });
        // If sync fails, show CSV upload option
        setShowCsvUpload(true);
      }
    } catch (error) {
      console.error('Error syncing attendance data:', error);
      setSyncMessage({ 
        type: 'error', 
        text: `Error: ${error.message}` 
      });
      // If sync fails, show CSV upload option
      setShowCsvUpload(true);
    } finally {
      setSyncing(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSyncMessage(prevMessage => 
          prevMessage && prevMessage.type === 'success' ? null : prevMessage
        );
      }, 5000);
    }
  };

  // Handle CSV file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel')) {
      setCsvFile(file);
    } else {
      alert('Please select a valid CSV file');
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Upload CSV file
  const uploadCsvFile = async () => {
    if (!csvFile) {
      setSyncMessage({ type: 'error', text: 'Please select a CSV file first' });
      return;
    }

    try {
      setUploading(true);
      setSyncMessage({ type: 'info', text: 'Uploading CSV attendance data...' });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('csv', csvFile);

      const response = await fetch(`${API_BASE_URL}/api/attendance/import-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`CSV upload failed. Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSyncMessage({
          type: 'success',
          text: `CSV imported successfully: ${result.added} added, ${result.updated} updated`
        });
        
        // Refresh attendance data
        await fetchAttendanceData();
        
        // Reset file input
        setCsvFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setSyncMessage({
          type: 'error',
          text: result.message || 'CSV import failed. Please check the file format.'
        });
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setSyncMessage({
        type: 'error',
        text: `CSV upload error: ${error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Department', 'Name', 'No.', 'Date/Time', 'Location ID', 'VerifyCode'];
      const csvData = filteredData.map(record => [
        record.department || 'N/A',
        record.employeeName || 'N/A',
        record.employeeNumber || 'N/A',
        formatDateTime(record.date || record.timeIn),
        record.location || 'N/A',
        record.verifyMethod || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error in exportToCSV:', error);
      alert('Failed to export CSV. Please check the console for details.');
    }
  };

  // Filtering function
  const applyFilters = () => {
    let result = [...attendanceData];

    // Filter by search term (name or employee number)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(record => 
        (record.employeeName && record.employeeName.toLowerCase().includes(searchTermLower)) ||
        (record.employeeNumber && record.employeeNumber.toString().includes(searchTermLower))
      );
    }

    // Filter by department
    if (department) {
      result = result.filter(record => record.department === department);
    }

    setFilteredData(result);
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, department, attendanceData]);

  if (loading && attendanceData.length === 0) {
    return (
      <div className="zk-loading-container">
        <div className="zk-loading-spinner"></div>
        <div className="zk-loading-text">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className="zk-attendance-container">
      <div className="zk-attendance-card">
        <div className="zk-card-header">
          <div className="zk-card-title">
            <Users className="zk-icon" />
            <h2>Attendance Management</h2>
          </div>
          <div className="zk-header-actions">
            <div className="zk-search-box">
              <Search className="zk-search-icon" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="zk-department-select"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate ? format(new Date(selectedDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value) : null;
                setSelectedDate(newDate);
                // Clear date range if single date is selected
                if (newDate) {
                  setDateRange({ start: null, end: null });
                }
              }}
              className="zk-date-input"
              placeholder="Select Date"
            />
            <button 
              onClick={testDeviceConnection}
              className="zk-test-button"
              disabled={syncing || uploading}
            >
              Test Connection
            </button>
            <button 
              onClick={syncAttendanceData} 
              className={`zk-sync-button ${syncing ? 'syncing' : ''}`}
              disabled={syncing || uploading}
            >
              <RefreshCw className={`zk-icon ${syncing ? 'spinning' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button onClick={exportToCSV} className="zk-export-button">
              <Download className="zk-icon" />
              Export
            </button>
          </div>
        </div>
        
        {/* Sync Status Component */}
        <AttendanceSyncStatus onManualSync={syncAttendanceData} />
        
        {/* Connection Status Message */}
        {connectionStatus && (
          <div className={`zk-connection-message ${connectionStatus.status}`}>
            {connectionStatus.message}
            {connectionStatus.info && (
              <span className="zk-device-info">
                Device: {connectionStatus.info.deviceName || 'ZKTeco Device'}
              </span>
            )}
          </div>
        )}
        
        {/* Sync Message */}
        {syncMessage && (
          <div className={`zk-sync-message ${syncMessage.type}`}>
            {syncMessage.text}
          </div>
        )}
        
        {/* CSV Upload Section */}
        {showCsvUpload && (
          <div className="zk-csv-upload-section">
            <div className="zk-csv-upload-header">
              <h3>Upload Attendance CSV from ZKTeco Device</h3>
              <button 
                className="zk-close-button" 
                onClick={() => setShowCsvUpload(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="zk-csv-upload-content">
              <p>
                If direct connection to the device isn't working, you can export the attendance 
                data from the ZKTeco software to CSV and upload it here.
              </p>
              <div className="zk-csv-upload-form">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="zk-file-input"
                  ref={fileInputRef}
                  disabled={uploading}
                />
                {csvFile && (
                  <div className="zk-selected-file">
                    <span>Selected: {csvFile.name}</span>
                    <button 
                      className="zk-remove-file" 
                      onClick={() => {
                        setCsvFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button 
                  className={`zk-upload-button ${uploading ? 'uploading' : ''}`}
                  onClick={uploadCsvFile}
                  disabled={!csvFile || uploading}
                >
                  <Upload className={`zk-icon ${uploading ? 'spinning' : ''}`} />
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Date Range Filter */}
        <div className="zk-date-range-section">
          <div className="zk-date-range-header">
            <h3>Date Range Filter</h3>
            <div className="zk-date-range-inputs">
              <div className="zk-date-range-field">
                <label>Start Date:</label>
                <input 
                  type="date"
                  value={dateRange.start ? format(new Date(dateRange.start), 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const newStart = e.target.value ? new Date(e.target.value) : null;
                    setDateRange({...dateRange, start: newStart});
                    // Clear single date if range is used
                    if (newStart) {
                      setSelectedDate(null);
                    }
                  }}
                  className="zk-date-input"
                />
              </div>
              <div className="zk-date-range-field">
                <label>End Date:</label>
                <input 
                  type="date"
                  value={dateRange.end ? format(new Date(dateRange.end), 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const newEnd = e.target.value ? new Date(e.target.value) : null;
                    setDateRange({...dateRange, end: newEnd});
                    // Clear single date if range is used
                    if (newEnd) {
                      setSelectedDate(null);
                    }
                  }}
                  className="zk-date-input"
                />
              </div>
              <button 
                className="zk-apply-date-range"
                onClick={fetchAttendanceData}
                disabled={!dateRange.start || !dateRange.end}
              >
                Apply
              </button>
              <button 
                className="zk-clear-date-range"
                onClick={() => {
                  setDateRange({ start: null, end: null });
                  setSelectedDate(null);
                  fetchAttendanceData();
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        
        <div className="zk-card-content">
          <div className="zk-table-container">
            {error ? (
              <div className="zk-error-container">
                <AlertTriangle size={32} />
                <div className="zk-error-message">{error}</div>
                <button onClick={fetchAttendanceData} className="zk-retry-button">
                  Retry
                </button>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="zk-no-records">
                <p>No records found. Try adjusting your filters or sync attendance data.</p>
                <p>Total Records: {attendanceData.length}</p>
                {(searchTerm || department || selectedDate || (dateRange.start && dateRange.end)) && (
                  <>
                    <p>Current Filters:</p>
                    <ul>
                      {searchTerm && <li>Search Term: {searchTerm}</li>}
                      {department && <li>Department: {department}</li>}
                      {selectedDate && <li>Date: {format(new Date(selectedDate), 'dd/MM/yyyy')}</li>}
                      {dateRange.start && dateRange.end && (
                        <li>Date Range: {format(new Date(dateRange.start), 'dd/MM/yyyy')} to {format(new Date(dateRange.end), 'dd/MM/yyyy')}</li>
                      )}
                    </ul>
                    <button onClick={() => {
                      setSearchTerm('');
                      setDepartment('');
                      setSelectedDate(null);
                      setDateRange({ start: null, end: null });
                      fetchAttendanceData();
                    }} className="zk-reset-button">
                      Reset Filters
                    </button>
                  </>
                )}
                
                {attendanceData.length === 0 && (
                  <div className="zk-sync-suggestion">
                    <p>No attendance records in database. Click "Sync Now" to retrieve records from device.</p>
                    <div className="zk-action-buttons">
                      <button 
                        onClick={syncAttendanceData} 
                        className="zk-sync-now-button"
                        disabled={syncing}
                      >
                        <RefreshCw className="zk-icon" />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button 
                        onClick={() => setShowCsvUpload(true)} 
                        className="zk-csv-button"
                      >
                        <Upload className="zk-icon" />
                        Upload CSV Instead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="zk-table-info">
                  Showing {filteredData.length} of {totalRecords} records
                </div>
                <table className="zk-attendance-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Name</th>
                      <th>No.</th>
                      <th>Date/Time</th>
                      <th>Status</th>
                      <th>Location ID</th>
                      <th>VerifyCode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record, index) => (
                      <tr key={record._id || index}>
                        <td>{record.department || 'N/A'}</td>
                        <td>
                          <div className="zk-employee-info">
                            <div className="zk-employee-name">{record.employeeName || 'Unknown'}</div>
                          </div>
                        </td>
                        <td>{record.employeeNumber || 'N/A'}</td>
                        <td>{formatDateTime(record.date || record.timeIn)}</td>
                        <td>
                          <span className={`zk-status-badge ${record.status || 'present'}`}>
                            {record.status || 'Present'}
                          </span>
                        </td>
                        <td>{record.location || 'N/A'}</td>
                        <td>
                          <span className="zk-verify-method">{record.verifyMethod || 'N/A'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="zk-pagination">
                    <button
                      className="zk-pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      First
                    </button>
                    <button
                      className="zk-pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </button>
                    <span className="zk-pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="zk-pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </button>
                    <button
                      className="zk-pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      Last
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;