import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MapPin, Building, Briefcase, ArrowLeft, Calendar, 
  FileText, Award, Clock, RefreshCw, User, GitBranch, FileCheck, 
  ExternalLink, AlertTriangle 
} from 'lucide-react';
import '../assets/css/EmployeeDetails.css';
import API_BASE_URL from '../config/api.js';

const EmployeeDetails = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState('history'); // Default to history tab
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (employee?._id || employee?.personalDetails?._id) {
      const employeeId = employee._id || employee.personalDetails._id;
      fetchEmployeeHistory(employeeId);
    }
    
    // Reset avatar error state when employee changes
    setAvatarError(false);
  }, [employee]);

  const fetchEmployeeHistory = async (employeeId) => {
    setLoading(true);
    try {
      console.log(`Fetching history for employee ID: ${employeeId}`);
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      console.log('History data received:', data);
      
      // Check if data is an array directly (the API seems to be returning an array)
      if (Array.isArray(data)) {
        setEmployeeHistory(data);
        setError(null);
      } else if (data.history && Array.isArray(data.history)) {
        // Handle if API returns an object with history array
        setEmployeeHistory(data.history);
        setError(null);
      } else {
        // If no valid history data format is found
        setEmployeeHistory([]);
        setError('No valid history data found');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message);
      setEmployeeHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format role names nicely
  const formatRole = (role) => {
    if (!role) return '';
    return role
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get the icon for a specific history event type
  const getEventIcon = (item) => {
    if (item.type === 'role_change' || (item.change && item.change.toLowerCase().includes('role'))) {
      return <Briefcase size={20} />;
    } else if (item.type === 'branch_transfer' || (item.change && item.change.toLowerCase().includes('transfer'))) {
      return <GitBranch size={20} />;
    } else if (item.type === 'document_upload' || item.type === 'document') {
      return <FileCheck size={20} />;
    } else if (item.type === 'status_change' || (item.change && item.change.toLowerCase().includes('status'))) {
      return <Clock size={20} />;
    } else if (item.type === 'milestone') {
      return <Award size={20} />;
    } else {
      return <Calendar size={20} />;
    }
  };

  // Get a class for the event icon background based on event type
  const getEventIconClass = (item) => {
    if (item.type === 'role_change' || (item.change && item.change.toLowerCase().includes('role'))) {
      return 'event-icon role-change';
    } else if (item.type === 'branch_transfer' || (item.change && item.change.toLowerCase().includes('transfer'))) {
      return 'event-icon transfer';
    } else if (item.type === 'document_upload' || item.type === 'document') {
      return 'event-icon document';
    } else if (item.type === 'status_change' || (item.change && item.change.toLowerCase().includes('status'))) {
      return 'event-icon status';
    } else if (item.type === 'milestone') {
      return 'event-icon milestone';
    } else {
      return 'event-icon';
    }
  };

  // Get a formatted date with relative time for recent events
  const getFormattedDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      // Format the date
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Add relative time for recent events
      if (diff === 0) {
        return `${formatted} (Today)`;
      } else if (diff === 1) {
        return `${formatted} (Yesterday)`;
      } else if (diff < 7) {
        return `${formatted} (${diff} days ago)`;
      } else {
        return formatted;
      }
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleRefreshHistory = () => {
    if (employee?._id || employee?.personalDetails?._id) {
      const employeeId = employee._id || employee.personalDetails._id;
      fetchEmployeeHistory(employeeId);
    }
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Get profile pic number from various possible sources
  const getProfilePicNumber = () => {
    if (employee.profilePic) return employee.profilePic;
    
    // Try to get a consistent number based on email
    const email = employee.email || employee.personalDetails?.email;
    if (email) {
      return (email.charCodeAt(0) % 11) + 1;
    }
    
    // Fallback to a random number
    return Math.floor(Math.random() * 11) + 1;
  };

  if (!employee) {
    return null;
  }

  // Get the employee name
  const employeeName = employee.firstName 
    ? `${employee.firstName} ${employee.lastName || ''}`
    : employee.personalDetails?.name || 'Unknown';

  return (
    <div className="employee-detail-container">
      <div className="employee-detail-header">
        <button className="back-button" onClick={onClose}>
          <ArrowLeft size={20} />
          <span>Back to List</span>
        </button>
      </div>
      
      <div className="employee-detail-content">
        <div className="employee-profile-card">
        <div className="employee-avatar">
  {!avatarError ? (
    <img 
      src={new URL(`../assets/avatars/avatar-${getProfilePicNumber()}.jpg`, import.meta.url).href}
      alt={employeeName}
      style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
      onError={handleAvatarError}
    />
  ) : (
    <span>{getInitials(employeeName)}</span>
  )}
</div>
          <div className="employee-profile-info">
            <h2>{employeeName}</h2>
            <p className="employee-role">
              {formatRole(employee.role || employee.professionalDetails?.role) || 'Employee'}
            </p>
            <div className="employee-status-container">
              <span className={`employee-status ${(employee.status || employee.professionalDetails?.status || 'active').toLowerCase().replace('_', '-')}`}>
                {(employee.status || employee.professionalDetails?.status || 'Active').replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="employee-detail-tabs">
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Calendar size={18} />
            <span>Employment History</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={18} />
            <span>Basic Information</span>
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="info-section">
              <div className="section-card">
                <h3 className="section-title">Contact Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <Mail size={16} />
                      <span>Email</span>
                    </div>
                    <div className="info-value">
                      {employee.email || employee.personalDetails?.email || 'No email provided'}
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">
                      <Phone size={16} />
                      <span>Phone</span>
                    </div>
                    <div className="info-value">
                      {employee.phone || employee.personalDetails?.contact || 'No phone provided'}
                    </div>
                  </div>
                  
                  {(employee.address || employee.personalDetails?.address) && (
                    <div className="info-item full-width">
                      <div className="info-label">
                        <MapPin size={16} />
                        <span>Address</span>
                      </div>
                      <div className="info-value">
                        {employee.address || employee.personalDetails?.address}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="section-card">
                <h3 className="section-title">Employment Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <Building size={16} />
                      <span>Branch</span>
                    </div>
                    <div className="info-value">
                      {employee.branch || employee.professionalDetails?.branch || 'No branch assigned'}
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">
                      <Briefcase size={16} />
                      <span>Department</span>
                    </div>
                    <div className="info-value">
                      {employee.department || employee.professionalDetails?.department || 'No department assigned'}
                    </div>
                  </div>
                  
                  {employee.rating && (
                    <div className="info-item">
                      <div className="info-label">
                        <span className="star-icon">★</span>
                        <span>Performance Rating</span>
                      </div>
                      <div className="info-value">
                        <span className="rating">{employee.rating}</span>
                        <span className="rating-text">
                          {employee.rating >= 4.5 ? 'Excellent' : 
                           employee.rating >= 3.5 ? 'Good' : 
                           employee.rating >= 2.5 ? 'Average' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {employee.joinDate && (
                    <div className="info-item">
                      <div className="info-label">
                        <Calendar size={16} />
                        <span>Join Date</span>
                      </div>
                      <div className="info-value">
                        {formatDate(employee.joinDate)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-section">
              <div className="history-header">
                <h3 className="history-title">Profile Actions & Milestones</h3>
                <button 
                  className="refresh-history-btn"
                  onClick={handleRefreshHistory}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading employment history...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <AlertTriangle size={36} />
                  <p>Error loading history: {error}</p>
                  <button className="retry-history-btn" onClick={handleRefreshHistory}>
                    <RefreshCw size={16} />
                    Retry
                  </button>
                </div>
              ) : employeeHistory && employeeHistory.length > 0 ? (
                <div className="history-timeline">
                  {employeeHistory.map((item, index) => (
                    <div key={index} className="history-event">
                      <div className={getEventIconClass(item)}>
                        {getEventIcon(item)}
                      </div>
                      <div className="event-content">
                        <div className="event-header">
                          <h4 className="event-title">{item.change}</h4>
                          <div className="event-date">
                            <Calendar size={14} />
                            <span>{getFormattedDate(item.date)}</span>
                          </div>
                        </div>
                        <p className="event-details">{item.details}</p>
                        {item.branch && (
                          <div className="event-branch">
                            <Building size={14} />
                            <span>{item.branch}</span>
                          </div>
                        )}
                        {item.impact && (
                          <div className="event-impact">
                            <h5>Impact:</h5>
                            <p>{item.impact}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FileText size={48} className="empty-icon" />
                  <h3>No History Records</h3>
                  <p>There are no employment history records available for this employee.</p>
                  <div className="empty-state-actions">
                    <p className="empty-state-hint">Profile actions like role changes, branch transfers, and document uploads will appear here.</p>
                    
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;