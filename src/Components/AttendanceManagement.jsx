import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon, Search, Filter, RefreshCw, Download,
  ChevronLeft, ChevronRight, Check, Clock, X
} from 'lucide-react';
import API_BASE_URL from '../config/api';
import '../assets/css/AttendanceManagement.css';

// Calendar component for date selection
const CalendarDropdown = ({ selectedDate, onDateChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const calendarRef = useRef(null);
  
  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar days for current month view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    // Previous month days to fill start of calendar
    const prevMonthDays = [];
    if (firstDayOfMonth > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevMonthYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
      
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        prevMonthDays.push({
          day: daysInPrevMonth - i,
          month: prevMonth,
          year: prevMonthYear,
          isCurrentMonth: false
        });
      }
    }
    
    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }
    
    // Next month days to fill end of calendar grid (to complete 6 rows)
    const nextMonthDays = [];
    const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
    const daysNeeded = 42 - totalDaysSoFar; // 6 rows of 7 days
    
    if (daysNeeded > 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextMonthYear = month === 11 ? year + 1 : year;
      
      for (let i = 1; i <= daysNeeded; i++) {
        nextMonthDays.push({
          day: i,
          month: nextMonth,
          year: nextMonthYear,
          isCurrentMonth: false
        });
      }
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };
  
  // Navigate to previous month
  const goToPrevMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Format month name
  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Handle day click
  const handleDayClick = (day) => {
    const newDate = new Date(day.year, day.month, day.day);
    onDateChange(newDate);
    onClose();
  };
  
  // Check if a day is today
  const isToday = (day) => {
    const today = new Date();
    return (
      day.day === today.getDate() &&
      day.month === today.getMonth() &&
      day.year === today.getFullYear()
    );
  };
  
  // Check if a day is the selected date
  const isSelectedDate = (day) => {
    return (
      day.day === selectedDate.getDate() &&
      day.month === selectedDate.getMonth() &&
      day.year === selectedDate.getFullYear()
    );
  };
  
  // Handle clicks outside of calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Days of week
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Calendar days
  const calendarDays = generateCalendarDays();
  
  return (
    <div className="atm-calendar-dropdown" ref={calendarRef}>
      <div className="atm-calendar-header">
        <button className="atm-calendar-nav-button" onClick={goToPrevMonth}>
          <ChevronLeft size={16} />
        </button>
        <div className="atm-calendar-month">{formatMonth(currentMonth)}</div>
        <button className="atm-calendar-nav-button" onClick={goToNextMonth}>
          <ChevronRight size={16} />
        </button>
        <button className="atm-calendar-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      
      <div className="atm-calendar-weekdays">
        {weekdays.map(day => (
          <div key={day} className="atm-calendar-weekday">{day}</div>
        ))}
      </div>
      
      <div className="atm-calendar-grid">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`atm-calendar-day 
              ${!day.isCurrentMonth ? 'atm-calendar-day-muted' : ''} 
              ${isToday(day) ? 'atm-calendar-day-today' : ''} 
              ${isSelectedDate(day) ? 'atm-calendar-day-selected' : ''}`}
            onClick={() => handleDayClick(day)}
          >
            {day.day}
          </div>
        ))}
      </div>
    </div>
  );
};

const AttendanceManagement = () => {
  // State declarations
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState(['General', 'IT', 'HR', 'Finance', 'Operations']);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: 'Never synced',
    status: 'Failed',
    records: 0
  });

  // Fetch attendance data on component mount and date change
  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Format date for API request (YYYY-MM-DD)
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/api/attendance?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();

      // Process records to show proper time display
      const processedRecords = (data.data || []).map(record => {
        // Format the time for display
        let timeDisplay = '';
        if (record.timeIn) {
          const timeIn = new Date(record.timeIn);
          const hours = timeIn.getHours();

          // For after-midnight check-ins, add a visual indicator
          if (hours >= 0 && hours < 12) {
            timeDisplay = `${timeIn.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })} (+1)`;  // Add "+1" to indicate next day
          } else {
            timeDisplay = timeIn.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } else {
          timeDisplay = '-';
        }

        return {
          ...record,
          timeDisplay
        };
      });

      setAttendanceRecords(processedRecords);
      setError(null);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle manual sync
  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();

      setSyncStatus({
        lastSync: new Date().toLocaleString(),
        status: result.success ? 'Success' : 'Failed',
        records: result.count || 0
      });

      // Refresh attendance data
      fetchAttendanceData();
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus({
        ...syncStatus,
        status: 'Failed'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to handle date navigation
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (direction === 'today') {
      newDate.setDate(new Date().getDate());
      newDate.setMonth(new Date().getMonth());
      newDate.setFullYear(new Date().getFullYear());
    }
    setSelectedDate(newDate);
    setCalendarOpen(false);
  };

  // Function to format date for display
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Convert attendance records to CSV
  const convertToCSV = (records) => {
    if (!records || records.length === 0) {
      return '';
    }
    
    // Define the CSV headers
    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Date',
      'Time In',
      'Status',
      'Location'
    ];
    
    // Create the CSV header row
    let csvContent = headers.join(',') + '\n';
    
    // Format each record as a CSV row
    records.forEach(record => {
      const date = new Date(record.date);
      const formattedDate = date.toLocaleDateString();
      
      const timeIn = record.timeIn ? new Date(record.timeIn) : null;
      const formattedTime = timeIn ? timeIn.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) : '-';
      
      const row = [
        record.employeeNumber || record.deviceUserId || '',
        record.employeeName || 'Unknown',
        record.department || 'General',
        formattedDate,
        formattedTime,
        (record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Present'),
        record.location || ''
      ];
      
      // Properly escape fields with commas or quotes
      const escapedRow = row.map(field => {
        if (field && (String(field).includes(',') || String(field).includes('"'))) {
          return `"${String(field).replace(/"/g, '""')}"`;
        }
        return field;
      });
      
      csvContent += escapedRow.join(',') + '\n';
    });
    
    return csvContent;
  };
  
  // Function to trigger CSV download
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    
    // Append to document, click to download, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up by revoking the object URL
    URL.revokeObjectURL(url);
  };

  // Function to handle export
  const handleExport = () => {
    if (isExporting || filteredRecords.length === 0) return;
    
    setIsExporting(true);
    try {
      // Create filename with date
      const dateStr = selectedDate.toISOString().split('T')[0];
      let filename = `attendance_${dateStr}`;
      
      // Add department to filename if filtered
      if (selectedDepartment) {
        filename += `_${selectedDepartment}`;
      }
      
      filename += '.csv';
      
      // Get records to export (either filtered or all)
      const recordsToExport = filteredRecords;
      
      // Convert to CSV and download
      const csvContent = convertToCSV(recordsToExport);
      downloadCSV(csvContent, filename);
      
      // Show success message or notification here if needed
    } catch (err) {
      console.error('Export error:', err);
      // Show error message or notification here if needed
    } finally {
      setIsExporting(false);
    }
  };

  // Filter records based on search and department
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = searchTerm === '' ||
      (record.employeeName && record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.employeeNumber && record.employeeNumber.toString().includes(searchTerm));

    const matchesDepartment = selectedDepartment === '' ||
      record.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // Check if selected date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Toggle calendar open/closed
  const toggleCalendar = () => {
    setCalendarOpen(!calendarOpen);
  };

  return (
    <div className="atm-container">
      <div className="atm-main-content">
        <div className="atm-header">
          <div className="atm-title-section">
            <CalendarIcon className="atm-header-icon" size={24} />
            <h1>Attendance Management</h1>
          </div>

          <div className="atm-header-actions">
            <button
              className={`atm-sync-button ${isSyncing ? 'atm-syncing' : ''}`}
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw size={16} className={isSyncing ? 'atm-spinning' : ''} />
              <span>Sync Now</span>
            </button>

            <button 
              className={`atm-export-button ${isExporting ? 'atm-syncing' : ''}`} 
              onClick={handleExport}
              disabled={isExporting || filteredRecords.length === 0}
              title={filteredRecords.length === 0 ? "No records to export" : "Export to CSV"}
            >
              <Download size={16} className={isExporting ? 'atm-spinning' : ''} />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="atm-date-navigation">
          <button
            className="atm-date-nav-button"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="atm-date-display">
            <div className="atm-selected-date-container" onClick={toggleCalendar}>
              <span className="atm-selected-date">{formatDate(selectedDate)}</span>
              <CalendarIcon size={16} className="atm-calendar-toggle-icon" />
            </div>
            
            {calendarOpen && (
              <CalendarDropdown 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onClose={() => setCalendarOpen(false)}
              />
            )}
          </div>

          <button
            className="atm-date-nav-button"
            onClick={() => navigateDate('next')}
          >
            <ChevronRight size={20} />
          </button>

          <button
            className="atm-today-button"
            onClick={() => navigateDate('today')}
            disabled={isToday(selectedDate)}
          >
            Today
          </button>
        </div>

        <div className="atm-filters">
          <div className="atm-search-container">
            <Search className="atm-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="atm-search-input"
            />
            {searchTerm && (
              <button
                className="atm-clear-search"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="atm-filter-container">
            <Filter className="atm-filter-icon" size={16} />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="atm-department-filter"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="atm-content">
          {loading ? (
            <div className="atm-loading-container">
              <div className="atm-loading-spinner"></div>
              <span className="atm-loading-text">Loading attendance records...</span>
            </div>
          ) : error ? (
            <div className="atm-error-container">
              <span className="atm-error-icon">⚠️</span>
              <div className="atm-error-message">{error}</div>
              <button className="atm-retry-button" onClick={fetchAttendanceData}>
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="atm-no-records">
              <Clock size={40} className="atm-no-records-icon" />
              <p>No attendance records found for this date</p>
              {(searchTerm || selectedDepartment) && (
                <p>Try adjusting your search or filters</p>
              )}
            </div>
          ) : (
            <>
              <div className="atm-table-info">
                Showing {filteredRecords.length} of {attendanceRecords.length} records
                {(searchTerm || selectedDepartment) && ' (filtered)'}
              </div>

              <div className="atm-table-container">
                <table className="atm-table">
                  <thead>
                    <tr>
                      <th className="atm-col-id">ID</th>
                      <th className="atm-col-name">Name</th>
                      <th className="atm-col-department">Department</th>
                      <th className="atm-col-time">Time</th>
                      <th className="atm-col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, index) => (
                      <tr key={index}>
                        <td>{record.employeeNumber || record.deviceUserId || '-'}</td>
                        <td>{record.employeeName || 'Unknown'}</td>
                        <td>{record.department || 'General'}</td>
                        <td>
                          {record.timeDisplay || '-'}
                        </td>
                        <td>
                          <div className={`atm-status-badge ${record.status || 'present'}`}>
                            <Check size={14} className="atm-status-icon" />
                            <span>{record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Present'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="atm-stats-sidebar">
        <div className="atm-stats-card">
          <h3 className="atm-stats-title">
            <Clock size={16} className="atm-stats-icon" />
            Today's Summary
          </h3>

          <div className="atm-stat-items">
            <div className="atm-stat-item">
              <span className="atm-stat-label">Total</span>
              <span className="atm-stat-value">{attendanceRecords.length}</span>
            </div>

            <div className="atm-stat-item">
              <span className="atm-stat-label">Present</span>
              <span className="atm-stat-value">
                {attendanceRecords.filter(r => r.status === 'present' || !r.status).length}
              </span>
            </div>

            <div className="atm-stat-item">
              <span className="atm-stat-label">Late</span>
              <span className="atm-stat-value">
                {attendanceRecords.filter(r => r.status === 'late').length}
              </span>
            </div>
          </div>
        </div>

        <div className="atm-department-stats-card">
          <h3 className="atm-stats-title">
            <Filter size={16} className="atm-stats-icon" />
            Department Stats
          </h3>

          <div className="atm-department-list">
            {departments.map(dept => {
              const count = attendanceRecords.filter(r => r.department === dept).length;
              return (
                <div key={dept} className="atm-department-item">
                  <span className="atm-dept-name">{dept}</span>
                  <span className="atm-dept-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;