import React, { useState, useEffect } from 'react';
import { 
  Check, X, FileText, Download, Eye, Grid, List, LayoutGrid,
  FileSpreadsheet, Mail, Phone, Calendar, Filter, RefreshCw,
  Search, ChevronDown, AlertCircle, Clock, Calendar as CalendarIcon,
  User, ArrowUp, ArrowDown, MoreVertical, Trash
} from 'lucide-react';
import { format } from 'date-fns';
import API_BASE_URL from '../config/api.js';
import '../assets/css/ManageLeaves.css';

const ManageLeaves = () => {
  // State management
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    dateRange: 'all',
    employeeName: ''
  });
  
  // View state
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'compact'
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  // Unique values for filtering
  const [uniqueLeaveTypes, setUniqueLeaveTypes] = useState([]);
  const [uniqueEmployees, setUniqueEmployees] = useState([]);

  // Fetch leave requests on component mount
  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // Apply filters, search and sorting when dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [leaveRequests, filters, searchTerm, sortConfig]);

  // Show temporary notification
  const setTempNotification = (message, type = 'info') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Refresh data with visual indicator
  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchLeaveRequests();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Fetch leave requests from API
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const endpoint = user.role === 'hr_manager' ? '/api/hr/leaves' : '/api/leaves';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const data = await response.json();
      setLeaveRequests(data);
      
      // Extract unique values for filters
      const leaveTypes = [...new Set(data.map(leave => leave.leaveType))];
      const employees = [...new Set(data.map(leave => leave.employeeName))];
      
      setUniqueLeaveTypes(leaveTypes);
      setUniqueEmployees(employees);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...leaveRequests];

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(leave => leave.status === filters.status);
    }

    // Apply leave type filter
    if (filters.leaveType !== 'all') {
      result = result.filter(leave => leave.leaveType === filters.leaveType);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const pastDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          result = result.filter(leave => {
            const leaveDate = new Date(leave.createdAt);
            return leaveDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          pastDate.setDate(pastDate.getDate() - 7);
          result = result.filter(leave => {
            const leaveDate = new Date(leave.createdAt);
            return leaveDate >= pastDate;
          });
          break;
        case 'month':
          pastDate.setMonth(pastDate.getMonth() - 1);
          result = result.filter(leave => {
            const leaveDate = new Date(leave.createdAt);
            return leaveDate >= pastDate;
          });
          break;
        default:
          break;
      }
    }

    // Apply employee name filter
    if (filters.employeeName) {
      result = result.filter(leave => leave.employeeName === filters.employeeName);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(leave => 
        leave.employeeName.toLowerCase().includes(searchLower) ||
        leave.employeeEmail.toLowerCase().includes(searchLower) ||
        leave.leaveType.toLowerCase().includes(searchLower) ||
        leave.reason.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle dates
        if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate' || sortConfig.key === 'createdAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredRequests(result);
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Handle status update
  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update leave request status');
      }

      // Update leave request in state
      setLeaveRequests(prev => 
        prev.map(leave => 
          leave._id === id ? { ...leave, status } : leave
        )
      );

      // Show notification
      setTempNotification(`Leave request ${status}`, 'success');

      // Close detail view if open
      if (selectedLeave && selectedLeave._id === id) {
        setSelectedLeave(null);
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      setTempNotification(`Failed to update status: ${error.message}`, 'error');
    }
  };

  // Handle document view
  const handleDocumentView = (doc) => {
    setSelectedDocument(doc);
  };

  // Download document
  const downloadDocument = async (doc) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/${doc.path}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download document');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setTempNotification('Document downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      setTempNotification('Failed to download document', 'error');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate duration between two dates
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both the start and end dates
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      leaveType: 'all',
      dateRange: 'all',
      employeeName: ''
    });
    setSearchTerm('');
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Employee', 'Email', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Reason', 'Status', 'Submitted On'];
      const csvData = filteredRequests.map(leave => [
        leave.employeeName,
        leave.employeeEmail,
        leave.leaveType,
        formatDate(leave.startDate),
        formatDate(leave.endDate),
        calculateDuration(leave.startDate, leave.endDate),
        leave.reason,
        leave.status,
        formatDate(leave.createdAt)
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_requests_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTempNotification('CSV exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setTempNotification('Failed to export CSV', 'error');
    }
  };

  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  // Get leave type class for styling
  const getLeaveTypeClass = (leaveType) => {
    switch (leaveType) {
      case 'annual': return 'type-annual';
      case 'sick': return 'type-sick';
      case 'personal': return 'type-personal';
      case 'maternity': return 'type-maternity';
      case 'paternity': return 'type-paternity';
      case 'bereavement': return 'type-bereavement';
      case 'unpaid': return 'type-unpaid';
      default: return 'type-other';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Check size={16} className="status-icon-approved" />;
      case 'rejected': return <X size={16} className="status-icon-rejected" />;
      default: return <Clock size={16} className="status-icon-pending" />;
    }
  };

  // Render Grid View
  const renderGridView = () => (
    <div className="leave-grid-container">
      {filteredRequests.map(leave => (
        <div key={leave._id} className="leave-card">
          <div className="leave-card-header">
            <div className="leave-card-employee">
              <div className="employee-avatar">
                {leave.employeeName.charAt(0).toUpperCase()}
              </div>
              <div className="employee-info">
                <h3>{leave.employeeName}</h3>
                <span className="employee-email">{leave.employeeEmail}</span>
              </div>
            </div>
            <div className={`leave-status ${getStatusClass(leave.status)}`}>
              {getStatusIcon(leave.status)}
              <span>{leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}</span>
            </div>
          </div>
          
          <div className="leave-card-body">
            <div className="leave-details">
              <div className={`leave-type ${getLeaveTypeClass(leave.leaveType)}`}>
                {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
              </div>
              <div className="leave-dates">
                <CalendarIcon size={16} className="icon" />
                <span>{formatDate(leave.startDate)} — {formatDate(leave.endDate)}</span>
              </div>
              <div className="leave-duration">
                <Clock size={16} className="icon" />
                <span>{calculateDuration(leave.startDate, leave.endDate)}</span>
              </div>
            </div>
            
            <div className="leave-reason">
              <h4>Reason:</h4>
              <p>{leave.reason}</p>
            </div>
            
            {leave.documents && leave.documents.length > 0 && (
              <div className="leave-documents">
                <h4>Documents:</h4>
                <div className="documents-list">
                  {leave.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <FileText size={16} className="icon" />
                      <span>{doc.name}</span>
                      <div className="document-actions">
                        <button
                          onClick={() => handleDocumentView(doc)}
                          className="doc-action-btn view"
                          title="View document"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="doc-action-btn download"
                          title="Download document"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="leave-card-footer">
            <div className="leave-submitted">
              <Calendar size={16} className="icon" />
              <span>Submitted: {formatDate(leave.createdAt)}</span>
            </div>
            
            {leave.status === 'pending' && (
              <div className="leave-actions">
                <button
                  onClick={() => handleStatusUpdate(leave._id, 'approved')}
                  className="action-btn approve-btn"
                >
                  <Check size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                  className="action-btn reject-btn"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="leave-list-container">
      <div className="leave-list-header">
        <div className="leave-list-header-item employee" onClick={() => handleSort('employeeName')}>
          <span>Employee</span>
          {sortConfig.key === 'employeeName' && (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          )}
        </div>
        <div className="leave-list-header-item type" onClick={() => handleSort('leaveType')}>
          <span>Type</span>
          {sortConfig.key === 'leaveType' && (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          )}
        </div>
        <div className="leave-list-header-item dates" onClick={() => handleSort('startDate')}>
          <span>Dates</span>
          {sortConfig.key === 'startDate' && (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          )}
        </div>
        <div className="leave-list-header-item status" onClick={() => handleSort('status')}>
          <span>Status</span>
          {sortConfig.key === 'status' && (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          )}
        </div>
        <div className="leave-list-header-item actions">
          <span>Actions</span>
        </div>
      </div>
      
      {filteredRequests.map(leave => (
        <div key={leave._id} className="leave-list-item">
          <div className="leave-list-item-cell employee">
            <div className="employee-avatar-sm">
              {leave.employeeName.charAt(0).toUpperCase()}
            </div>
            <div className="employee-info-sm">
              <div className="employee-name">{leave.employeeName}</div>
              <div className="employee-email">{leave.employeeEmail}</div>
            </div>
          </div>
          
          <div className="leave-list-item-cell type">
            <div className={`leave-type-badge ${getLeaveTypeClass(leave.leaveType)}`}>
              {leave.leaveType}
            </div>
          </div>
          
          <div className="leave-list-item-cell dates">
            <div className="date-range">
              <div>{formatDate(leave.startDate)}</div>
              <div>to</div>
              <div>{formatDate(leave.endDate)}</div>
            </div>
            <div className="duration-badge">
              {calculateDuration(leave.startDate, leave.endDate)}
            </div>
          </div>
          
          <div className="leave-list-item-cell status">
            <div className={`status-badge ${getStatusClass(leave.status)}`}>
              {getStatusIcon(leave.status)}
              <span>{leave.status}</span>
            </div>
          </div>
          
          <div className="leave-list-item-cell actions">
            <button
              onClick={() => setSelectedLeave(leave)}
              className="list-action-btn view-btn"
              title="View details"
            >
              <Eye size={16} />
            </button>
            
            {leave.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusUpdate(leave._id, 'approved')}
                  className="list-action-btn approve-btn"
                  title="Approve"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                  className="list-action-btn reject-btn"
                  title="Reject"
                >
                  <X size={16} />
                </button>
              </>
            )}
            
            <button className="list-action-btn more-btn">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Render Compact View
  const renderCompactView = () => (
    <div className="leave-compact-container">
      {filteredRequests.map(leave => (
        <div key={leave._id} className="leave-compact-item">
          <div className="leave-compact-header">
            <div className="employee-avatar-sm">
              {leave.employeeName.charAt(0).toUpperCase()}
            </div>
            <div className={`status-indicator ${getStatusClass(leave.status)}`}>
              {getStatusIcon(leave.status)}
            </div>
          </div>
          
          <div className="leave-compact-body">
            <h3 className="compact-employee-name">{leave.employeeName}</h3>
            <div className={`compact-leave-type ${getLeaveTypeClass(leave.leaveType)}`}>
              {leave.leaveType} Leave
            </div>
            <div className="compact-date-range">
              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
            </div>
          </div>
          
          <div className="leave-compact-footer">
            {leave.status === 'pending' ? (
              <div className="compact-actions">
                <button 
                  onClick={() => handleStatusUpdate(leave._id, 'approved')}
                  className="compact-btn approve"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                  className="compact-btn reject"
                >
                  Reject
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setSelectedLeave(leave)}
                className="compact-btn view"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="manage-leaves-container">
      {/* Page Header */}
      <div className="leaves-header">
        <div className="leaves-title">
          <h1>Manage Leave Requests</h1>
          <p>Review and manage employee leave requests</p>
        </div>
        
        <div className="leaves-actions">
          <button 
            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={refreshData}
            title="Refresh data"
          >
            <RefreshCw size={18} />
          </button>
          
          <button 
            className="export-btn"
            onClick={exportToCSV}
            title="Export to CSV"
          >
            <FileSpreadsheet size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* Filter and Search Bar */}
      <div className="filters-bar">
        <div className="view-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={18} />
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'compact' ? 'active' : ''}`}
            onClick={() => setViewMode('compact')}
            title="Compact view"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
        
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button 
          className={`filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle filters"
        >
          <Filter size={18} />
          <span>Filters</span>
          <ChevronDown size={16} className={`filter-chevron ${showFilters ? 'active' : ''}`} />
        </button>
      </div>
      
      {/* Expandable Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Leave Type</label>
            <select
              value={filters.leaveType}
              onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Types</option>
              {uniqueLeaveTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Employee</label>
            <select
              value={filters.employeeName}
              onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
              className="filter-select"
            >
              <option value="">All Employees</option>
              {uniqueEmployees.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          
          <button className="reset-filters-btn" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      )}
      
      {/* Notifications */}
      {notification.visible && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {/* Main Content */}
      <div className="leaves-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading leave requests...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} />
            <h3>Error Loading Leave Requests</h3>
            <p>{error}</p>
            <button onClick={refreshData} className="retry-btn">
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <CalendarIcon size={48} />
            <h3>No Leave Requests Found</h3>
            <p>Try adjusting your filters or search criteria</p>
            {(filters.status !== 'all' || filters.leaveType !== 'all' || filters.dateRange !== 'all' || filters.employeeName || searchTerm) && (
              <button onClick={resetFilters} className="clear-filters-btn">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="results-summary">
              <span>Showing {filteredRequests.length} of {leaveRequests.length} leave requests</span>
            </div>
            
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'compact' && renderCompactView()}
          </>
        )}
      </div>
      
      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="document-modal" onClick={() => setSelectedDocument(null)}>
          <div className="modal-overlay"></div>
          <div className="document-modal-content">
            <button className="close-modal" onClick={() => setSelectedDocument(null)}>
              <X size={24} />
            </button>
            
            <div className="document-preview">
              {selectedDocument.path.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={`${API_BASE_URL}/${selectedDocument.path}`}
                  alt="Document preview"
                  className="document-image"
                />
              ) : (
                <div className="document-fallback">
                  <FileText size={64} />
                  <p>Document preview not available</p>
                  <p className="document-name">{selectedDocument.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadDocument(selectedDocument);
                    }}
                    className="download-document-btn"
                  >
                    <Download size={18} />
                    Download Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Leave Detail Modal */}
      {selectedLeave && (
        <div className="leave-detail-modal">
          <div className="modal-overlay" onClick={() => setSelectedLeave(null)}></div>
          <div className="leave-detail-content">
            <button className="close-modal" onClick={() => setSelectedLeave(null)}>
              <X size={24} />
            </button>
            
            <div className="leave-detail-header">
              <div className="detail-employee-info">
                <div className="detail-avatar">
                  {selectedLeave.employeeName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{selectedLeave.employeeName}</h2>
                  <p className="detail-email">{selectedLeave.employeeEmail}</p>
                </div>
              </div>
              
              <div className={`detail-status ${getStatusClass(selectedLeave.status)}`}>
                {getStatusIcon(selectedLeave.status)}
                <span>{selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}</span>
              </div>
            </div>
            
            <div className="leave-detail-body">
              <div className="detail-section">
                <h3>Leave Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Type</label>
                    <div className={`detail-leave-type ${getLeaveTypeClass(selectedLeave.leaveType)}`}>
                      {selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1)} Leave
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <label>Duration</label>
                    <p>{calculateDuration(selectedLeave.startDate, selectedLeave.endDate)}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Start Date</label>
                    <p>{formatDate(selectedLeave.startDate)}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>End Date</label>
                    <p>{formatDate(selectedLeave.endDate)}</p>
                  </div>
                  
                  <div className="detail-item">
                    <label>Submitted On</label>
                    <p>{formatDate(selectedLeave.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="detail-section reason-section">
                <h3>Reason for Leave</h3>
                <p className="detail-reason">{selectedLeave.reason}</p>
              </div>
              
              {selectedLeave.documents && selectedLeave.documents.length > 0 && (
                <div className="detail-section">
                  <h3>Supporting Documents</h3>
                  <div className="detail-documents">
                    {selectedLeave.documents.map((doc, index) => (
                      <div key={index} className="detail-document-item">
                        <FileText size={20} className="icon" />
                        <span>{doc.name}</span>
                        <div className="detail-document-actions">
                          <button
                            onClick={() => handleDocumentView(doc)}
                            className="detail-doc-btn view"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="detail-doc-btn download"
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="leave-detail-footer">
              {selectedLeave.status === 'pending' ? (
                <div className="detail-actions">
                  <button
                    onClick={() => handleStatusUpdate(selectedLeave._id, 'approved')}
                    className="detail-action-btn approve"
                  >
                    <Check size={18} />
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedLeave._id, 'rejected')}
                    className="detail-action-btn reject"
                  >
                    <X size={18} />
                    Reject Request
                  </button>
                </div>
              ) : (
                <div className="status-timestamp">
                  {selectedLeave.status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(selectedLeave.updatedAt || selectedLeave.createdAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeaves;