import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Calendar, Search, Filter, RefreshCw, Download,
  ChevronLeft, ChevronRight, Check, Clock, X, User, 
  Building, Mail, Phone, AlertTriangle, List, Grid
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
    
    // Next month days to fill end of calendar grid
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

// Main AttendanceManagement component
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
  
  // NEW: Add view mode state (compact vs. full)
  const [viewMode, setViewMode] = useState('full');
  
  // NEW: Add deduplication option 
  const [deduplicateRecords, setDeduplicateRecords] = useState(true);
  
  // Debug info ref
  const debugInfo = useRef({
    mappedRecords: 0,
    unmappedRecords: 0,
    mappingMethod: {}
  });
  
  // Track active fetch request
  const activeFetchRef = useRef(null);
  
  // In-memory cache for attendance data
  const attendanceCacheRef = useRef(new Map());

  // Optimized function to find employee by ID with multiple strategies
  const findEmployeeByIdOrNumber = useCallback((deviceUserId, employeeNumber) => {
    // Convert IDs to strings for consistent comparison
    const deviceIdStr = deviceUserId?.toString() || '';
    const empNumberStr = employeeNumber?.toString() || '';
    
    // Strategy 1: Try direct match using the mapping dictionaries (fastest)
    if (deviceIdStr && employeeMap.byId && employeeMap.byId[deviceIdStr]) {
      return { 
        employee: employeeMap.byId[deviceIdStr], 
        method: 'direct-id-map' 
      };
    }
    
    if (empNumberStr && employeeMap.byId && employeeMap.byId[empNumberStr]) {
      return { 
        employee: employeeMap.byId[empNumberStr], 
        method: 'direct-emp-number-map' 
      };
    }
    
    if (empNumberStr && employeeMap.byNumber && employeeMap.byNumber[empNumberStr]) {
      return { 
        employee: employeeMap.byNumber[empNumberStr], 
        method: 'contact-map' 
      };
    }
    
    // Strategy 2: Try full search through employees array (slower but more thorough)
    // First try matching by personalDetails.id
    const employeeByUserId = employees.find(emp => 
      emp.personalDetails && emp.personalDetails.id && 
      (emp.personalDetails.id === deviceIdStr || 
       emp.personalDetails.id === empNumberStr)
    );

    if (employeeByUserId) {
      return { 
        employee: employeeByUserId, 
        method: 'full-search-id' 
      };
    }

    // Then try matching by contact number
    const employeeByNumber = employees.find(emp => 
      emp.personalDetails && emp.personalDetails.contact && 
      (emp.personalDetails.contact === deviceIdStr || 
       emp.personalDetails.contact === empNumberStr)
    );

    if (employeeByNumber) {
      return { 
        employee: employeeByNumber, 
        method: 'full-search-contact' 
      };
    }
    
    // No match found
    return { employee: null, method: 'none' };
  }, [employeeMap, employees]);

  // Enhanced function to fetch attendance data with caching
  
  
  // Updated process attendance data function with improved time display
  const processAttendanceData = useCallback((records) => {
    const processedRecords = records.map(record => {
      // Format the time for display
      let timeDisplay = '';
      let isEarlyMorning = false;
      
      if (record.timeIn) {
        const timeIn = new Date(record.timeIn);
        const hours = timeIn.getHours();
        const minutes = timeIn.getMinutes();
        
        // Check if this is an early morning check-in (12am-6am)
        isEarlyMorning = hours >= 0 && hours < 6;
        
        // Add leading zero to minutes if needed
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
        
        // Format with AM/PM
        const amPm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        
        // Simple display without any (+1) indication since we've fixed the date issue
        timeDisplay = `${displayHours}:${minutesStr} ${amPm}`;
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

      // Create a proper date object from the record.date
      const recordDate = record.date ? new Date(record.date) : null;
      
      return {
        ...record,
        timeDisplay,
        isEarlyMorning,
        employeeDetails: employee || null,
        mappingMethod: method,
        recordDate: recordDate
      };
    });

    console.log(`Mapping results: ${debugInfo.current.mappedRecords} mapped, ${debugInfo.current.unmappedRecords} unmapped`);
    
    setAttendanceRecords(processedRecords);
    setError(null);
    setLoading(false);
  }, [findEmployeeByIdOrNumber]);
  const fetchAttendanceData = useCallback(async () => {
    if (loadingEmployees) {
      console.log('Waiting for employee data to load before fetching attendance');
      return;
    }
    
    setLoading(true);
    
    // Generate a unique ID for this fetch
    const fetchId = Date.now();
    activeFetchRef.current = fetchId;
    
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
      
      // Check if we have cached data for this date and deduplication setting
      const cacheKey = `${dateStr}-${deduplicateRecords ? 'dedup' : 'all'}`;
      if (attendanceCacheRef.current.has(cacheKey)) {
        console.log(`Using cached attendance data for ${cacheKey}`);
        const cachedData = attendanceCacheRef.current.get(cacheKey);
        
        // Only process if this is still the active fetch
        if (activeFetchRef.current === fetchId) {
          processAttendanceData(cachedData);
          setLoading(false);
        }
        return;
      }
      
      // Add a parameter to control deduplication if needed
      const dedupParam = deduplicateRecords ? 'deduplicate=true' : 'deduplicate=false';
      const response = await fetch(`${API_BASE_URL}/api/attendance?date=${dateStr}&${dedupParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      console.log(`Received ${data.data?.length || 0} attendance records`);

      // Only continue if this is still the active fetch
      if (activeFetchRef.current === fetchId) {
        // Cache the data for future use
        attendanceCacheRef.current.set(cacheKey, data.data || []);
        
        // Process attendance data
        processAttendanceData(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      
      // Only update state if this is still the active fetch
      if (activeFetchRef.current === fetchId) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [selectedDate, loadingEmployees, deduplicateRecords, processAttendanceData]);
  // Fetch employees data on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        // Check sessionStorage for cached employee data
        const cachedEmployees = sessionStorage.getItem('employeeData');
        const cacheTimestamp = sessionStorage.getItem('employeeDataTimestamp');
        
        // Use cached data if it exists and is less than 10 minutes old
        if (cachedEmployees && cacheTimestamp) {
          const cacheAge = Date.now() - parseInt(cacheTimestamp);
          if (cacheAge < 10 * 60 * 1000) { // 10 minutes
            console.log('Using cached employee data');
            const data = JSON.parse(cachedEmployees);
            setEmployees(data);
            buildEmployeeMap(data);
            setLoadingEmployees(false);
            return;
          }
        }
        
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
        
        // Cache the employee data in sessionStorage
        sessionStorage.setItem('employeeData', JSON.stringify(data));
        sessionStorage.setItem('employeeDataTimestamp', Date.now().toString());
        
        // Build employee mapping
        buildEmployeeMap(data);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load employee data: ' + err.message);
      } finally {
        setLoadingEmployees(false);
      }
    };
    
    // Helper function to build employee mapping
    const buildEmployeeMap = (data) => {
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
    };
    
    fetchEmployees();
  }, []);

  // Fetch attendance data when selected date changes
  useEffect(() => {
    if (!loadingEmployees) {
      fetchAttendanceData();
    }
  }, [selectedDate, fetchAttendanceData, loadingEmployees]);

  // Fetch attendance after employee data is loaded
  useEffect(() => {
    if (!loadingEmployees) {
      fetchAttendanceData();
    }
  }, [loadingEmployees, fetchAttendanceData]);

  // Function to handle manual sync
  const handleSync = useCallback(async () => {
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

      // Clear cache after sync to ensure fresh data
      attendanceCacheRef.current.clear();
      
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
  }, [isSyncing, syncStatus, fetchAttendanceData]);

  // Function to handle date navigation
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (direction === 'today') {
      const today = new Date();
      newDate.setFullYear(today.getFullYear());
      newDate.setMonth(today.getMonth());
      newDate.setDate(today.getDate());
    }
    setSelectedDate(newDate);
    setCalendarOpen(false);
  }, [selectedDate]);

  // Function to format date for display
  const formatDate = useCallback((date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }, []);

  // Check if selected date is today
  const isToday = useCallback((date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }, []);

  // Toggle calendar open/closed
  const toggleCalendar = useCallback(() => {
    setCalendarOpen(!calendarOpen);
  }, [calendarOpen]);

  // NEW: Toggle between view modes
  const toggleViewMode = useCallback(() => {
    setViewMode(currentMode => currentMode === 'full' ? 'compact' : 'full');
  }, []);

  // NEW: Toggle deduplication option
  const toggleDeduplication = useCallback(() => {
    setDeduplicateRecords(current => !current);
    // Clear cache when changing deduplication setting
    attendanceCacheRef.current.clear();
    // Refresh data
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Render employee details
  const renderEmployeeDetails = useCallback((employee) => {
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
  }, []);

  // Convert attendance records to CSV
  const convertToCSV = useCallback((records) => {
    if (!records || records.length === 0) {
      return '';
    }
    
    // Define the CSV headers
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
    
    // Format each record as a CSV row
    records.forEach(record => {
      const date = new Date(record.date);
      const formattedDate = date.toLocaleDateString();
      
      const timeIn = record.timeIn ? new Date(record.timeIn) : null;
      const formattedTime = timeIn ? timeIn.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) : '-';
      
      // Get employee details
      const emp = record.employeeDetails || {};
      const personal = emp.personalDetails || {};
      const professional = emp.professionalDetails || {};
      
      // Build the row
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
      
      // Properly escape fields
      const escapedRow = row.map(field => {
        if (field && (String(field).includes(',') || String(field).includes('"'))) {
          return `"${String(field).replace(/"/g, '""')}"`;
        }
        return field;
      });
      
      csvContent += escapedRow.join(',') + '\n';
    });
    
    return csvContent;
  }, []);
  
  // Function to trigger CSV download
  const downloadCSV = useCallback((csvContent, filename) => {
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
    
    // Clean up
    URL.revokeObjectURL(url);
  }, []);

  // Filtered records based on search and department
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
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
  }, [attendanceRecords, searchTerm, selectedDepartment]);

  // Function to handle export
  const handleExport = useCallback(() => {
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
      
      // Convert to CSV and download
      const csvContent = convertToCSV(filteredRecords);
      downloadCSV(csvContent, filename);
      
      console.log(`Exported ${filteredRecords.length} attendance records to CSV`);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, filteredRecords, selectedDate, selectedDepartment, convertToCSV, downloadCSV]);

  // Get department stats for the sidebar
  const departmentStats = useMemo(() => {
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
  }, [attendanceRecords, departments]);

  // Render component
  return (
    <div className="atm-container">
      <div className="atm-main-content">
        <div className="atm-header">
          <div className="atm-title-section">
            <Calendar className="atm-header-icon" size={24} />
            <h1>Attendance Management</h1>
          </div>

          <div className="atm-header-actions">
            {/* NEW: View mode toggle */}
            <button
              className="atm-view-mode-button"
              onClick={toggleViewMode}
              title={viewMode === 'full' ? "Switch to compact view" : "Switch to full view"}
            >
              {viewMode === 'full' ? <List size={16} /> : <Grid size={16} />}
            </button>

            {/* NEW: Deduplication toggle */}
            <button
              className={`atm-dedupe-button ${deduplicateRecords ? 'atm-active' : ''}`}
              onClick={toggleDeduplication}
              title={deduplicateRecords ? "Show all check-ins (including duplicates)" : "Show one check-in per employee"}
            >
              <User size={16} />
              <span>{deduplicateRecords ? "One per employee" : "All check-ins"}</span>
            </button>

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
                {!deduplicateRecords && ' (showing all check-ins)'}
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
                      
                      // Check if this is an early morning check-in (for styling)
                      const isEarlyMorning = record.isEarlyMorning;
                      
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
                            {/* Show date of the record if in full view mode */}
                            {viewMode === 'full' && record.recordDate && (
                              <div className="atm-date-debug">
                                <small>{record.recordDate.toLocaleDateString()}</small>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className={`atm-status-badge ${isEarlyMorning ? 'early-morning' : (record.status || 'present')}`}>
                              <Check size={14} className="atm-status-icon" />
                              <span>
                                {isEarlyMorning && viewMode === 'full' 
                                  ? 'Early Morning' 
                                  : (record.status 
                                    ? record.status.charAt(0).toUpperCase() + record.status.slice(1) 
                                    : 'Present')}
                              </span>
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
                <span className="atm-cache-info">
                  Cache: {attendanceCacheRef.current.size} dates
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
              <span className="atm-stat-label">Early AM</span>
              <span className="atm-stat-value">
                {attendanceRecords.filter(r => r.isEarlyMorning).length}
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

export default React.memo(AttendanceManagement);