import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import API_BASE_URL from '../config/api.js';
import '../assets/css/AttendanceManagement.css';

const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    console.log('Attendance Management Component Mounted');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token length:', token ? token.length : 'No token');

    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      console.log('Fetching attendance data');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/attendance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Full API Response:', JSON.stringify(responseData, null, 2));

      // Diagnose data structure
      console.log('Response data type:', typeof responseData);
      console.log('Response data keys:', Object.keys(responseData));
      
      // More flexible data extraction
      let attendanceArray = [];
      if (Array.isArray(responseData)) {
        attendanceArray = responseData;
      } else if (responseData.data) {
        attendanceArray = Array.isArray(responseData.data) 
          ? responseData.data 
          : [responseData.data];
      } else if (responseData.success && responseData.data) {
        attendanceArray = responseData.data;
      }

      console.log('Processed attendance array:', attendanceArray);
      console.log('Attendance array length:', attendanceArray.length);

      // Validate data
      if (attendanceArray.length === 0) {
        console.warn('No attendance records found');
      }

      setAttendanceData(attendanceArray);
      
      // Extract unique departments
      const uniqueDepartments = [...new Set(attendanceArray.map(record => record.department))];
      setDepartments(uniqueDepartments);
      
      setFilteredData(attendanceArray);
      setLoading(false);
    } catch (error) {
      console.error('FULL Error in fetchAttendanceData:', error);
      setError(error.message);
      setLoading(false);
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
    const headers = ['Department', 'Name', 'No.', 'Date/Time', 'Location ID', 'ID Number', 'VerifyCode', 'CardNo'];
    const csvData = filteredData.map(record => [
      record.department,
      record.employeeName,
      record.employeeNumber,
      formatDateTime(record.date || record.timeIn),
      record.location,
      record._id,
      record.verifyMethod,
      'N/A'
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
      link.setAttribute('download', `attendance_${format(selectedDate, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Debugging render states
  console.log('Render State:', {
    loading,
    error,
    attendanceDataLength: attendanceData.length,
    filteredDataLength: filteredData.length
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading attendance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  // Extensive logging for no records scenario
  useEffect(() => {
    if (filteredData.length === 0) {
      console.warn('No records after filtering');
      console.log('Original attendance data:', attendanceData);
    }
  }, [filteredData, attendanceData]);

  // If no data, show a detailed message
  if (filteredData.length === 0) {
    return (
      <div className="attendance-container">
        <div className="attendance-card">
          <div className="card-header">
            <h2>No Attendance Records Found</h2>
            <div>
              <p>Attendance Data Length: {attendanceData.length}</p>
              <p>Filtered Data Length: {filteredData.length}</p>
              <p>Departments: {departments.join(', ')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <div className="card-header">
          <div className="card-title">
            <Users className="icon" />
            <h2>Attendance Management</h2>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search className="search-icon" />
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
              className="department-select"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="date-input"
            />
            <button onClick={exportToCSV} className="export-button">
              <Download className="icon" />
              Export
            </button>
          </div>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Name</th>
                  <th>No.</th>
                  <th>Date/Time</th>
                  <th>Location ID</th>
                  <th>ID Number</th>
                  <th>VerifyCode</th>
                  <th>CardNo</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((record) => (
                  <tr key={record._id}>
                    <td>{record.department}</td>
                    <td>
                      <div className="employee-info">
                        <div className="employee-name">{record.employeeName}</div>
                      </div>
                    </td>
                    <td>{record.employeeNumber}</td>
                    <td>{formatDateTime(record.date || record.timeIn)}</td>
                    <td>{record.location}</td>
                    <td>{record._id}</td>
                    <td>
                      <span className="verify-method">{record.verifyMethod}</span>
                    </td>
                    <td>N/A</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;