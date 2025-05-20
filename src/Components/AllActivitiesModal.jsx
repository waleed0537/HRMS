import React, { useState, useEffect } from 'react';
import {
  X, Search, Calendar, Filter, RefreshCw, AlertCircle, Building,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, CheckCircle, XCircle, Download
} from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/AllActivitiesModal.css';
import { useToast } from './common/ToastContent.jsx';

const AllActivitiesModal = ({ isOpen, onClose, isHrView = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [userBranch, setUserBranch] = useState('');
  const { success, error: toastError } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Activity type options
  const notificationTypes = [
    { id: 'leave', label: 'Leave Requests' },
    { id: 'account', label: 'Account Activities' },
    { id: 'application', label: 'Job Applications' }
  ];
  
  // Status options
  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadUserBranchAndNotifications();
      if (!isHrView) {
        fetchBranches();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (notifications.length > 0) {
      applyFilters();
    }
  }, [searchTerm, dateRange, selectedStatus, selectedTypes, selectedBranch, notifications]);

  useEffect(() => {
    // Calculate total pages whenever filtered notifications or items per page changes
    if (filteredNotifications.length > 0) {
      setTotalPages(Math.ceil(filteredNotifications.length / itemsPerPage));
      // Reset to first page when filter changes
      setCurrentPage(1);
    } else {
      setTotalPages(1);
    }
  }, [filteredNotifications, itemsPerPage]);

  // Load the current user's branch info, then fetch notifications
  const loadUserBranchAndNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // First get the user profile to determine their branch
      const profileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to load user profile');
      }

      const userData = await profileResponse.json();
      
      // Extract branch name
      const branch = userData.professionalDetails?.branch || '';
      setUserBranch(branch);
      
      // Now fetch notifications
      if (isHrView) {
        // For HR, use the HR-specific endpoint
        await fetchHrNotifications(branch);
      } else {
        // For admin, fetch all notifications
        await fetchAllNotifications();
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user information');
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
      // Non-critical error, don't set the main error state
    }
  };
  
  const fetchHrNotifications = async (branchName) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Use the HR-specific endpoint
      const response = await fetch(`${API_BASE_URL}/api/hr/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If HR endpoint fails, try the general endpoint
        const fallbackResponse = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const allNotifications = await fallbackResponse.json();
        
        // Filter notifications to only show those related to this HR's branch
        const branchNotifications = allNotifications.filter(notification => {
          // Check metadata for branch
          if (notification.metadata && notification.metadata.branchName) {
            return notification.metadata.branchName.toLowerCase() === branchName.toLowerCase();
          }
          
          // Also check message text for branch name
          return notification.message.toLowerCase().includes(branchName.toLowerCase());
        });
        
        setNotifications(branchNotifications);
        setFilteredNotifications(branchNotifications);
      } else {
        // HR endpoint returned successfully
        const data = await response.json();
        setNotifications(data);
        setFilteredNotifications(data);
      }
      
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching HR notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };
  
  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // For admin, use regular notifications endpoint
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
      setFilteredNotifications(data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (isHrView) {
      fetchHrNotifications(userBranch);
    } else {
      fetchAllNotifications();
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];
    
    // Filter by search term (in title or message)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(notification => 
        (notification.title && notification.title.toLowerCase().includes(term)) ||
        (notification.message && notification.message.toLowerCase().includes(term))
      );
    }
    
    // Filter by date range
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        return notificationDate >= fromDate;
      });
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      // Set time to end of day
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        return notificationDate <= toDate;
      });
    }
    
    // Filter by notification type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(notification => 
        selectedTypes.includes(notification.type)
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(notification => {
        // Check if the notification contains status in different places
        if (notification.status) {
          return notification.status === selectedStatus;
        }
        
        // Also check message for status terms
        if (notification.message) {
          const message = notification.message.toLowerCase();
          
          switch (selectedStatus) {
            case 'approved':
              return message.includes('approved');
            case 'rejected':
              return message.includes('rejected');
            case 'pending':
              return message.includes('pending') || 
                    message.includes('requested') || 
                    (!message.includes('approved') && !message.includes('rejected'));
            default:
              return true;
          }
        }
        
        return true;
      });
    }
    
    // Filter by branch (admin only)
    if (!isHrView && selectedBranch !== 'all') {
      filtered = filtered.filter(notification => {
        // Check metadata for branch
        if (notification.metadata && notification.metadata.branchName) {
          return notification.metadata.branchName === selectedBranch;
        }
        
        // Also check message for branch name
        if (notification.message) {
          return notification.message.includes(selectedBranch);
        }
        
        return false;
      });
    }
    
    setFilteredNotifications(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateRange({ from: '', to: '' });
    setSelectedStatus('all');
    setSelectedTypes([]);
    setSelectedBranch('all');
  };

  const handleTypeToggle = (typeId) => {
    setSelectedTypes(prevTypes => {
      if (prevTypes.includes(typeId)) {
        return prevTypes.filter(id => id !== typeId);
      } else {
        return [...prevTypes, typeId];
      }
    });
  };

  const getDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time from now
  const getTimeFromNow = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    // For older notifications, show actual date
    return time.toLocaleDateString();
  };

  // Get avatar initials based on notification
  const getInitials = (notification) => {
    // For profile edits
    if (notification.type === 'account' && 
        (notification.message.toLowerCase().includes('profile edited') ||
         notification.message.toLowerCase().includes('profile updated') ||
         notification.message.toLowerCase().includes('employee profile'))) {
      return 'EP';
    }
    
    // For leave requests
    if (notification.type === 'leave') {
      return 'LV';
    }
    
    // For staff requests
    if (notification.type === 'account' && 
        notification.message.toLowerCase().includes('staff')) {
      return 'SR';
    }
    
    // For job applications
    if (notification.type === 'application') {
      return 'JA';
    }
    
    // Extract from name in message if possible
    const nameMatch = notification.message?.match(/^([A-Z][a-z]+)(\s[A-Z][a-z]+)?/);
    if (nameMatch && nameMatch[0]) {
      if (nameMatch[2]) {
        return (nameMatch[1][0] + nameMatch[2][0]).toUpperCase();
      }
      return nameMatch[1].substring(0, 2).toUpperCase();
    }
    
    // Default fallbacks by type
    const typeMap = {
      'account': 'AC',
      'role': 'RO',
      'application': 'AP',
      'leave': 'LV'
    };
    
    return typeMap[notification.type] || 'NT';
  };

  // Get notification title
  const getNotificationTitle = (notification) => {
    // Use the provided title if available
    if (notification.title) {
      return notification.title;
    }
    
    // For employee profile edits - prioritize detecting this
    if (notification.type === 'account' && 
        (notification.message.toLowerCase().includes('profile edited') ||
         notification.message.toLowerCase().includes('profile updated') ||
         notification.message.toLowerCase().includes('employee profile'))) {
      return 'Edit Profile';
    }
    
    // For leave requests
    if (notification.type === 'leave') {
      if (notification.message.toLowerCase().includes('approved')) {
        return 'Leave Approved';
      } else if (notification.message.toLowerCase().includes('rejected')) {
        return 'Leave Rejected';
      } else {
        return 'New Leave Request';
      }
    }
    
    // For staff account requests
    if (notification.type === 'account' && 
        notification.message.toLowerCase().includes('staff')) {
      return 'New Staff Request';
    }
    
    // For application notifications
    if (notification.type === 'application') {
      return 'New Job Application';
    }
    
    // Fallback based on type
    const typeMap = {
      'account': 'Account Update',
      'role': 'Role Changed',
      'application': 'New Application',
      'leave': 'Leave Request'
    };
    
    return typeMap[notification.type] || 'Notification';
  };

  // Get background color for avatar
  const getAvatarColor = (notification) => {
    const type = notification.type;
    const title = getNotificationTitle(notification);
    
    // For employee profile edits
    if (title === 'Edit Profile') {
      return '#3b82f6'; // Blue for profile edits
    }
    
    // Custom colors based on notification type
    if (type === 'leave' || title.includes('Leave')) {
      return '#f87171'; // Red for leave
    }
    
    if (type === 'account' && title.includes('Staff')) {
      return '#a78bfa'; // Purple for staff requests
    }
    
    if (type === 'application' || title.includes('Job')) {
      return '#fbbf24'; // Yellow/orange for applications
    }
    
    // Default fallbacks by type
    const colorMap = {
      'account': '#a78bfa', // Purple
      'role': '#60a5fa',    // Blue
      'application': '#fbbf24', // Yellow
      'leave': '#f87171'    // Red
    };
    
    return colorMap[type] || '#94a3b8'; // Default slate color
  };

  // Get status indicator
  // In AllActivitiesModal.jsx, replace the existing getStatusIndicator function with this improved version:

// Get status indicator with improved detection
const getStatusIndicator = (notification) => {
  // First check if notification has status property directly
  if (notification.status) {
    return notification.status;
  }
  
  // Check metadata for status information
  if (notification.metadata && notification.metadata.status) {
    return notification.metadata.status;
  }
  
  // Infer from title if it contains status keywords
  const title = getNotificationTitle(notification);
  const titleLower = title.toLowerCase();
  if (titleLower.includes('approved') || titleLower.includes('accepted')) {
    return 'approved';
  }
  if (titleLower.includes('rejected') || titleLower.includes('denied')) {
    return 'rejected';
  }
  
  // Check message text for status keywords
  const message = notification.message?.toLowerCase() || '';
  
  // Look for clear status indicators
  if (message.includes('has been approved') || 
      message.includes('is approved') ||
      message.includes('successfully approved') ||
      message.includes('been accepted') ||
      message.includes('marked as complete') ||
      message.includes('successfully completed')) {
    return 'approved';
  }
  
  if (message.includes('has been rejected') || 
      message.includes('is rejected') ||
      message.includes('was denied') ||
      message.includes('not approved') ||
      message.includes('request denied') ||
      message.includes('has failed')) {
    return 'rejected';
  }
  
  // Additional check for leave-specific messages
  if (notification.type === 'leave') {
    if (message.includes('leave approved') || message.includes('leave has been approved')) {
      return 'approved';
    }
    if (message.includes('leave rejected') || message.includes('leave has been rejected')) {
      return 'rejected';
    }
  }
  
  // Additional check for account requests
  if (notification.type === 'account') {
    if (message.includes('account approved') || message.includes('request approved')) {
      return 'approved';
    }
    if (message.includes('account rejected') || message.includes('request rejected')) {
      return 'rejected';
    }
  }
  
  // Check for application status
  if (notification.type === 'application') {
    if (message.includes('shortlisted') || message.includes('selected')) {
      return 'approved';
    }
  }
  
  // If we've reached this point and haven't found a status, add debugging
  console.log('Status not found for notification:', {
    id: notification._id,
    title: title,
    message: message,
    type: notification.type
  });
  
  // Default to pending if no status is found
  return 'pending';
}

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'approved':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'error':
      case 'rejected':
        return <XCircle size={16} className="status-icon error" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  };

  // Export notifications as CSV
  const exportToCSV = () => {
    // Define which data to export (filtered notifications)
    const data = filteredNotifications.map(notification => ({
      Date: new Date(notification.createdAt).toLocaleDateString(),
      Time: new Date(notification.createdAt).toLocaleTimeString(),
      Title: getNotificationTitle(notification),
      Message: notification.message,
      Type: notification.type,
      Status: getStatusIndicator(notification),
      Branch: notification.metadata?.branchName || ''
    }));
    
    // Convert to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row)
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render pagination controls
  const renderPagination = () => {
    // Get current page of notifications
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
    
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredNotifications.length)} of {filteredNotifications.length} activities
        </div>
        <div className="pagination-controls">
          <button 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1}
            className="pagination-button"
            title="First page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1}
            className="pagination-button"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="pagination-current">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages}
            className="pagination-button"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)} 
            disabled={currentPage === totalPages}
            className="pagination-button"
            title="Last page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
        <div className="items-per-page">
          <label htmlFor="itemsPerPage">Show: </label>
          <select 
            id="itemsPerPage" 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="items-per-page-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    );
  };

  // Get current page of notifications
  const getCurrentPageItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
  };

  if (!isOpen) return null;

  return (
    <div className="activity-history-modal-overlay">
      <div className="activity-history-modal">
        <div className="activity-history-header">
          <div className="activity-history-title">
            <h2>Activity History{isHrView && userBranch ? ` - ${userBranch} Branch` : ''}</h2>
          </div>
          <div className="activity-history-actions">
            <button 
              className="activity-history-export-button" 
              onClick={exportToCSV}
              title="Export as CSV"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button className="activity-history-close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="activity-history-search-row">
          <div className="activity-history-search-container">
            <Search size={18} className="activity-history-search-icon" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="activity-history-search-input"
            />
          </div>
          
          <div className="activity-history-filter-container">
            <button 
              className={`activity-history-filter-toggle ${filterOpen ? 'active' : ''}`}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
          </div>
        </div>
        
        {filterOpen && (
          <div className="activity-history-filter-panel">
            <div className="activity-history-filter-section date-range-section">
              <h3 className="activity-history-filter-title">DATE RANGE</h3>
              <div className="activity-history-date-filters">
                <div className="activity-history-date-item">
                  <label htmlFor="from-date">From:</label>
                  <input
                    type="date"
                    id="from-date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="activity-history-date-input"
                  />
                </div>
                <div className="activity-history-date-item">
                  <label htmlFor="to-date">To:</label>
                  <input
                    type="date"
                    id="to-date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="activity-history-date-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="activity-history-filter-section type-section">
              <h3 className="activity-history-filter-title">ACTIVITY TYPE</h3>
              <div className="activity-history-type-filters">
                {notificationTypes.map(type => (
                  <div key={type.id} className="activity-history-type-item">
                    <input
                      type="checkbox"
                      id={`type-${type.id}`}
                      checked={selectedTypes.includes(type.id)}
                      onChange={() => handleTypeToggle(type.id)}
                      className="activity-history-type-checkbox"
                    />
                    <label htmlFor={`type-${type.id}`}>{type.label}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="activity-history-filter-section status-section">
              <h3 className="activity-history-filter-title">STATUS</h3>
              <div className="activity-history-status-filters">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="activity-history-status-select"
                >
                  {statusOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {!isHrView && (
              <div className="activity-history-filter-section branch-section">
                <h3 className="activity-history-filter-title">BRANCH</h3>
                <div className="activity-history-branch-filters">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="activity-history-branch-select"
                  >
                    <option value="all">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className="activity-history-filter-actions">
              <button 
                className="activity-history-reset-filters"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
        
        <div className="activity-history-content">
          {loading ? (
            <div className="activity-history-loading">
              <div className="activity-history-spinner"></div>
              <p>Loading activities...</p>
            </div>
          ) : error ? (
            <div className="activity-history-error">
              <AlertCircle size={42} />
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button className="activity-history-retry" onClick={refreshData}>
                <RefreshCw size={18} />
                Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="activity-history-empty">
              <AlertCircle size={42} />
              <h3>No activities found</h3>
              <p>Try adjusting your filters or search criteria</p>
              <button className="activity-history-reset" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="activity-history-table">
                <div className="activity-history-table-header">
                  <div className="activity-history-col activity-col">ACTIVITY</div>
                  <div className="activity-history-col details-col">DETAILS</div>
                  <div className="activity-history-col time-col">TIME</div>
                  <div className="activity-history-col status-col">STATUS</div>
                </div>
                <div className="activity-history-table-body">
                  {getCurrentPageItems().map((notification, index) => {
                    const title = getNotificationTitle(notification);
                    const initials = getInitials(notification);
                    const avatarColor = getAvatarColor(notification);
                    const status = getStatusIndicator(notification);
                    const branch = notification.metadata?.branchName || '';
                    const timeAgo = getTimeFromNow(notification.createdAt);
                    
                    return (
                      <div key={notification._id || index} className="activity-history-row">
                        <div className="activity-history-col activity-col">
                          <div className="activity-history-type-wrapper">
                            <div 
                              className="activity-history-avatar" 
                              style={{ backgroundColor: avatarColor }}
                            >
                              {initials}
                            </div>
                            <div className="activity-history-title">
                              {title}
                              <span className="activity-history-type">{notification.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="activity-history-col details-col">
                          <div className="activity-history-details">{notification.message}</div>
                        </div>
                        <div className="activity-history-col time-col">
                          <div className="activity-history-time">{timeAgo}</div>
                          <div className="activity-history-date">{getDisplayDate(notification.createdAt)}</div>
                        </div>
                        <div className="activity-history-col status-col">
                          <div className={`activity-history-status status-${status}`}>
                            {getStatusIcon(status)}
                            <span>{status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="activity-history-pagination">
                <div className="activity-history-page-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} activities
                </div>
                <div className="activity-history-page-controls">
                  <button 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                    className="activity-history-page-button"
                    title="First page"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="activity-history-page-button"
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="activity-history-current-page">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="activity-history-page-button"
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages}
                    className="activity-history-page-button"
                    title="Last page"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
                <div className="activity-history-page-size">
                  <label htmlFor="itemsPerPage">Show: </label>
                  <select 
                    id="itemsPerPage" 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="activity-history-page-size-select"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllActivitiesModal;