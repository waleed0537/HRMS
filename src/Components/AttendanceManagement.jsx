import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, Search, Filter, RefreshCw, Download,
  ChevronLeft, ChevronRight, Check, Clock, X, User, 
  Building, Mail, Phone, AlertTriangle
} from 'lucide-react';
import API_BASE_URL from '../config/api';
import '../assets/css/AttendanceManagement.css';

// Calendar component for date selection (unchanged)
const CalendarDropdown = ({ selectedDate, onDateChange, onClose }) => {
  // Calendar component implementation remains the same
  // Keeping this unchanged as it's working properly
  
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

// Enhanced AttendanceManagement component with improved employee mapping
const AttendanceManagement = () => {
  // State declarations
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
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
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Use a ref to track debug info
  const debugInfo = useRef({
    mappedRecords: 0,
    unmappedRecords: 0,
    mappingMethod: {}
  });

  // Fetch employees and attendance data on component mount and date change
  useEffect(() => {
    const fetchData = async () => {
      await fetchEmployees();
      await fetchAttendanceData();
    };
    
    fetchData();
  }, [selectedDate]);

  // Function to fetch all employees and build a mapping dictionary
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      console.log('Fetching employee data for attendance mapping...');
      
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      console.log(`Fetched ${data.length} employees`);
      
      // Store the full employee data
      setEmployees(data);
      
      // Build optimized mapping dictionaries for faster lookups
      const idMap = {};
      const numberMap = {};
      const emailMap = {};
      
      // Extract unique departments for filtering
      const deptSet = new Set(['General']);
      
      // Process each employee and build the maps
      data.forEach(emp => {
        if (emp.personalDetails) {
          // Map by ID (primary identifier)
          if (emp.personalDetails.id) {
            idMap[emp.personalDetails.id.toString()] = emp;
          }
          
          // Map by contact number
          if (emp.personalDetails.contact) {
            numberMap[emp.personalDetails.contact.toString()] = emp;
          }
          
          // Map by email
          if (emp.personalDetails.email) {
            emailMap[emp.personalDetails.email.toLowerCase()] = emp;
          }
          
          // Collect departments for filtering
          if (emp.professionalDetails && emp.professionalDetails.department) {
            deptSet.add(emp.professionalDetails.department);
          }
        }
      });
      
      // Store the mapping dictionaries for efficient lookups
      setEmployeeMap({
        byId: idMap,
        byNumber: numberMap,
        byEmail: emailMap
      });
      
      // Update department list for filtering
      setDepartments(Array.from(deptSet).sort());
      
      console.log('Employee mapping built successfully');
      console.log(`ID mappings: ${Object.keys(idMap).length}`);
      console.log(`Contact mappings: ${Object.keys(numberMap).length}`);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employee data: ' + err.message);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Enhanced function to find employee by ID with multiple strategies
  const findEmployeeByIdOrNumber = (deviceUserId, employeeNumber) => {
    // Track which method found the match for debugging
    let method = 'none';
    
    // Convert IDs to strings for consistent comparison
    const deviceIdStr = deviceUserId?.toString() || '';
    const empNumberStr = employeeNumber?.toString() || '';
    
    // Strategy 1: Try direct match using the mapping dictionaries (fastest)
    if (deviceIdStr && employeeMap.byId[deviceIdStr]) {
      method = 'direct-id-map';
      return { employee: employeeMap.byId[deviceIdStr], method };
    }
    
    if (empNumberStr && employeeMap.byId[empNumberStr]) {
      method = 'direct-emp-number-map';
      return { employee: employeeMap.byId[empNumberStr], method };
    }
    
    if (empNumberStr && employeeMap.byNumber[empNumberStr]) {
      method = 'contact-map';
      return { employee: employeeMap.byNumber[empNumberStr], method };
    }
    
    // Strategy 2: Try full search through employees array (slower but more thorough)
    // First try matching by personalDetails.id
    const employeeByUserId = employees.find(emp => 
      emp.personalDetails && emp.personalDetails.id && 
      (emp.personalDetails.id === deviceIdStr || 
       emp.personalDetails.id === empNumberStr)
    );

    if (employeeByUserId) {
      method = 'full-search-id';
      return { employee: employeeByUserId, method };
    }

    // Then try matching by contact number
    const employeeByNumber = employees.find(emp => 
      emp.personalDetails && emp.personalDetails.contact && 
      (emp.personalDetails.contact === deviceIdStr || 
       emp.personalDetails.contact === empNumberStr)
    );

    if (employeeByNumber) {
      method = 'full-search-contact';
      return { employee: employeeByNumber, method };
    }
    
    // No match found
    return { employee: null, method };
  };

  // Enhanced function to fetch attendance data with improved mapping
const fetchAttendanceData = async () => {
  if (loadingEmployees) {
    console.log('Waiting for employee data to load before fetching attendance');
    return;
  }
  
  setLoading(true);
  
  // Reset debug counters
  debugInfo.current = {
    mappedRecords: 0,
    unmappedRecords: 0,
    mappingMethod: {}
  };
  
  try {
    // Format date for API request (YYYY-MM-DD)
    const dateStr = selectedDate.toISOString().split('T')[0];
    console.log(`Fetching attendance records for date: ${dateStr}`);
    
    const response = await fetch(`${API_BASE_URL}/api/attendance?date=${dateStr}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch attendance data');
    }

    const data = await response.json();
    console.log(`Received ${data.data?.length || 0} attendance records`);

    // Process records to show proper time display and map to employee details
    const processedRecords = (data.data || []).map(record => {
      // Format the time for display with timezone consideration
      let timeDisplay = '';
      if (record.timeIn) {
        const timeIn = new Date(record.timeIn);
        const hours = timeIn.getHours();
        const minutes = timeIn.getMinutes();
        
        // Create time string in 12-hour format
        let amPm = hours >= 12 ? 'PM' : 'AM';
        let displayHours = hours % 12;
        if (displayHours === 0) displayHours = 12; // Handle midnight (0 hours)
        
        // Format time display with special indicator for after-midnight check-ins
        if (hours >= 0 && hours < 8) {
          // For after-midnight check-ins, add a visual indicator (+1)
          timeDisplay = `${displayHours}:${minutes.toString().padStart(2, '0')} ${amPm} (+1)`;
        } else {
          timeDisplay = `${displayHours}:${minutes.toString().padStart(2, '0')} ${amPm}`;
        }
      } else {
        timeDisplay = '-';
      }

      // Find the corresponding employee using enhanced mapping function
      const { employee, method } = findEmployeeByIdOrNumber(record.deviceUserId, record.employeeNumber);
      
      // Update debug counters
      if (employee) {
        debugInfo.current.mappedRecords++;
        debugInfo.current.mappingMethod[method] = (debugInfo.current.mappingMethod[method] || 0) + 1;
      } else {
        debugInfo.current.unmappedRecords++;
      }

      // Create a display date for the record that accounts for after-midnight entries
      // This helps with showing night shift entries properly in the UI
      const displayDate = new Date(record.date);

      return {
        ...record,
        timeDisplay,
        displayDate,  // Add the logical date for display purposes
        employeeDetails: employee || null,
        mappingMethod: method // For debugging
      };
    });

    console.log(`Mapping results: ${debugInfo.current.mappedRecords} mapped, ${debugInfo.current.unmappedRecords} unmapped`);
    console.log('Mapping methods used:', debugInfo.current.mappingMethod);
    
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
      console.log('Starting manual attendance sync...');
      
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
      console.log('Sync result:', result);

      setSyncStatus({
        lastSync: new Date().toLocaleString(),
        status: result.success ? 'Success' : 'Failed',
        records: result.count || 0
      });

      // Refresh attendance data
      await fetchAttendanceData();
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

  // Convert attendance records to CSV with enhanced employee details
  const convertToCSV = (records) => {
    if (!records || records.length === 0) {
      return '';
    }
    
    // Define the CSV headers with enhanced fields
    const headers = [
      'Employee ID',
      'Employee Name',
      'Email',
      'Department',
      'Branch',
      'Date',
      'Time In',
      'Status',
      'Location'
    ];
    
    // Create the CSV header row
    let csvContent = headers.join(',') + '\n';
    
    // Format each record as a CSV row with enhanced employee data
    records.forEach(record => {
      const date = new Date(record.date);
      const formattedDate = date.toLocaleDateString();
      
      const timeIn = record.timeIn ? new Date(record.timeIn) : null;
      const formattedTime = timeIn ? timeIn.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) : '-';
      
      // Get employee details using the mapped data if available
      const emp = record.employeeDetails || {};
      const personal = emp.personalDetails || {};
      const professional = emp.professionalDetails || {};
      
      // Build the row with enhanced employee information
      const row = [
        personal.id || record.deviceUserId || record.employeeNumber || '',
        personal.name || record.employeeName || 'Unknown',
        personal.email || '',
        professional.department || record.department || 'General',
        professional.branch || '',
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
      
      console.log(`Exported ${recordsToExport.length} attendance records to CSV`);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Enhanced filter for records based on search and department
  const filteredRecords = attendanceRecords.filter(record => {
    // Get employee details from the mapping
    const employee = record.employeeDetails || {};
    const personal = employee.personalDetails || {};
    const professional = employee.professionalDetails || {};
    
    // Search in all employee fields
    const searchFields = [
      personal.name,
      personal.id,
      personal.email,
      personal.contact,
      professional.department,
      professional.branch,
      record.employeeNumber,
      record.deviceUserId?.toString(),
      record.employeeName
    ].filter(Boolean).map(field => field.toString().toLowerCase());
    
    // Check if any field contains the search term
    const matchesSearch = searchTerm === '' || 
      searchFields.some(field => field.includes(searchTerm.toLowerCase()));

    // Check department - prefer employee mapping if available
    const recordDepartment = professional.department || record.department || 'General';
    const matchesDepartment = selectedDepartment === '' || recordDepartment === selectedDepartment;

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

  // Render detailed employee info
  const renderEmployeeDetails = (employee) => {
    if (!employee) return null;
    
    const personal = employee.personalDetails || {};
    const professional = employee.professionalDetails || {};
    
    return (
      <div className="atm-employee-details">
        <div className="atm-employee-detail-row">
          <div className="atm-employee-detail-item">
            <Mail size={14} className="atm-detail-icon" />
            <span>{personal.email || 'No email'}</span>
          </div>
          <div className="atm-employee-detail-item">
            <Phone size={14} className="atm-detail-icon" />
            <span>{personal.contact || 'No contact'}</span>
          </div>
        </div>
        <div className="atm-employee-detail-row">
          <div className="atm-employee-detail-item">
            <Building size={14} className="atm-detail-icon" />
            <span>{professional.branch || 'No branch'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Get employee department stats for the sidebar
  const getDepartmentStats = () => {
    const stats = {};
    
    // Initialize with all departments
    departments.forEach(dept => {
      stats[dept] = 0;
    });
    
    // Count records by department
    attendanceRecords.forEach(record => {
      const employee = record.employeeDetails || {};
      const professional = employee.professionalDetails || {};
      const dept = professional.department || record.department || 'General';
      
      stats[dept] = (stats[dept] || 0) + 1;
    });
    
    return stats;
  };
  
  const departmentStats = getDepartmentStats();

  return (
    <div className="atm-container">
      <div className="atm-main-content">
        <div className="atm-header">
          <div className="atm-title-section">
            <Calendar className="atm-header-icon" size={24} />
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
              <Calendar size={16} className="atm-calendar-toggle-icon" />
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
              placeholder="Search by name, ID or email..."
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
          {loading || loadingEmployees ? (
            <div className="atm-loading-container">
              <div className="atm-loading-spinner"></div>
              <span className="atm-loading-text">
                {loadingEmployees ? 'Loading employee data...' : 'Loading attendance records...'}
              </span>
            </div>
          ) : error ? (
            <div className="atm-error-container">
              <AlertTriangle size={24} className="atm-error-icon" />
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
                      <th className="atm-col-id">User ID</th>
                      <th className="atm-col-name">Name</th>
                      <th className="atm-col-department">Department</th>
                      <th className="atm-col-branch">Branch</th>
                      <th className="atm-col-time">Time</th>
                      <th className="atm-col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, index) => {
                      // Get employee details from the mapping
                      const employee = record.employeeDetails || {};
                      const personal = employee.personalDetails || {};
                      const professional = employee.professionalDetails || {};
                      
                      // Determine what to display for each field based on employeeDetails
                      const employeeId = personal.id || record.deviceUserId || record.employeeNumber || '-';
                      const employeeName = personal.name || record.employeeName || 'Unknown';
                      const department = professional.department || record.department || 'General';
                      const branch = professional.branch || '';
                      
                      // Check if we have full employee details
                      const hasDetails = !!employee;
                      
                      return (
                        <tr key={index} className={hasDetails ? 'atm-has-details' : 'atm-no-details'}>
                          <td className="atm-employee-id">
                            <div className="atm-employee-id-wrapper">
                              <User size={14} className="atm-id-icon" />
                              <span>{employeeId}</span>
                            </div>
                          </td>
                          <td className="atm-employee-name">
                            <div className="atm-employee-name-wrapper">
                              <User size={16} className="atm-employee-icon" />
                              <span>{employeeName}</span>
                            </div>
                            {/* Expandable employee details when available */}
                            {hasDetails && renderEmployeeDetails(employee)}
                          </td>
                          <td>{department}</td>
                          <td>{branch}</td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Show mapping statistics */}
              <div className="atm-mapping-stats">
                <span className="atm-mapping-label">Employee mapping: </span>
                <span className="atm-mapping-value">
                  {debugInfo.current.mappedRecords} matched, {debugInfo.current.unmappedRecords} unmatched
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary Sidebar */}
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
            
            <div className="atm-stat-item">
              <span className="atm-stat-label">Mapped</span>
              <span className="atm-stat-value">
                {debugInfo.current.mappedRecords}
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
            {Object.entries(departmentStats).map(([dept, count]) => (
              <div key={dept} className="atm-department-item">
                <span className="atm-dept-name">{dept}</span>
                <span className="atm-dept-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;