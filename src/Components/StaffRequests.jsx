import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserX, 
  Grid, 
  List, 
  LayoutGrid, 
  Mail, 
  Briefcase, 
  Building,
  Calendar,
  RefreshCw,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/StaffRequests.css';

const StaffRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'compact'
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredRequests, setFilteredRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/pending-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data);
      setFilteredRequests(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      // Add a small delay to make the refresh animation visible
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRequests(requests);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = requests.filter(request => 
        request.email.toLowerCase().includes(term) || 
        request.role.toLowerCase().includes(term) ||
        request.branchName.toLowerCase().includes(term)
      );
      setFilteredRequests(filtered);
    }
  }, [searchTerm, requests]);

  const handleStatusUpdate = async (userId, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/requests/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }

      // Show success message and remove after 3 seconds
      setSuccessMessage(`Successfully ${status} the request`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the requests list
      fetchRequests();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Create a function to generate avatar colors based on email
  const getAvatarColor = (email) => {
    const colors = [
      '#4f46e5', '#7c3aed', '#8b5cf6', '#6366f1', 
      '#ec4899', '#d946ef', '#a855f7', '#3b82f6', 
      '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', 
      '#84cc16', '#eab308', '#f59e0b', '#f97316'
    ];
    
    // Generate a consistent index based on email
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) - hash) + email.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Get positive value and use modulo to get index within array bounds
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Function to generate user's initials from email
  const getInitials = (email) => {
    if (!email) return '?';
    
    // Get username part before @ symbol
    const username = email.split('@')[0];
    
    // Generate initials from username (handle common formats like first.last or first_last)
    if (username.includes('.') || username.includes('_')) {
      const parts = username.split(/[._]/);
      return parts.map(part => part[0]?.toUpperCase() || '').join('').slice(0, 2);
    }
    
    // If no separator, use first two characters or just the first if only one char
    return username.length > 1 ? username.slice(0, 2).toUpperCase() : username.toUpperCase();
  };

  // Format role name for display
  const formatRole = (role) => {
    return role
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderGridView = () => (
    <div className="staff-requests-grid">
      {filteredRequests.map((request) => (
        <div key={request._id} className="staff-request-card">
          <div className="staff-request-avatar" style={{ backgroundColor: getAvatarColor(request.email) }}>
            {getInitials(request.email)}
          </div>
          
          <div className="staff-request-content">
            <h3 className="staff-request-email">{request.email}</h3>
            
            <div className="staff-request-details">
              <div className="staff-request-detail">
                <Briefcase size={16} className="staff-request-icon" />
                <span>{formatRole(request.role)}</span>
              </div>
              
              <div className="staff-request-detail">
                <Building size={16} className="staff-request-icon" />
                <span>{request.branchName}</span>
              </div>
              
              <div className="staff-request-detail">
                <Calendar size={16} className="staff-request-icon" />
                <span>{formatDate(request.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="staff-request-actions">
            <button
              onClick={() => handleStatusUpdate(request._id, 'approved')}
              className="staff-request-approve-btn"
              aria-label="Approve request"
            >
              <UserCheck size={18} />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleStatusUpdate(request._id, 'rejected')}
              className="staff-request-reject-btn"
              aria-label="Reject request"
            >
              <UserX size={18} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="staff-requests-list">
      {filteredRequests.map((request) => (
        <div key={request._id} className="staff-request-list-item">
          <div className="staff-request-list-left">
            <div className="staff-request-list-avatar" style={{ backgroundColor: getAvatarColor(request.email) }}>
              {getInitials(request.email)}
            </div>
            
            <div className="staff-request-list-info">
              <h3 className="staff-request-list-email">{request.email}</h3>
              <div className="staff-request-list-meta">
                <span className="staff-request-list-role">{formatRole(request.role)}</span>
                <span className="staff-request-divider">•</span>
                <span className="staff-request-list-branch">{request.branchName}</span>
                <span className="staff-request-divider">•</span>
                <span className="staff-request-list-date">Requested: {formatDate(request.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="staff-request-list-actions">
            <button
              onClick={() => handleStatusUpdate(request._id, 'approved')}
              className="staff-request-list-approve-btn"
              aria-label="Approve request"
            >
              <UserCheck size={18} />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleStatusUpdate(request._id, 'rejected')}
              className="staff-request-list-reject-btn"
              aria-label="Reject request"
            >
              <UserX size={18} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompactView = () => (
    <div className="staff-requests-compact">
      {filteredRequests.map((request) => (
        <div key={request._id} className="staff-request-compact-item">
          <div className="staff-request-compact-avatar" style={{ backgroundColor: getAvatarColor(request.email) }}>
            {getInitials(request.email)}
          </div>
          
          <div className="staff-request-compact-content">
            <h3 className="staff-request-compact-email">{request.email}</h3>
            <p className="staff-request-compact-role">{formatRole(request.role)}</p>
          </div>
          
          <div className="staff-request-compact-actions">
            <button
              onClick={() => handleStatusUpdate(request._id, 'approved')}
              className="staff-request-compact-approve-btn"
              aria-label="Approve request"
              title="Approve"
            >
              <CheckCircle size={20} />
            </button>
            <button
              onClick={() => handleStatusUpdate(request._id, 'rejected')}
              className="staff-request-compact-reject-btn"
              aria-label="Reject request"
              title="Reject"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="staff-requests-container">
      <div className="staff-requests-header">
        <h1>Pending Staff Requests</h1>
        <p className="staff-requests-description">
          Review and manage new staff account requests
        </p>
      </div>
      
      <div className="staff-requests-controls">
        <div className="staff-requests-search">
          <Search className="staff-requests-search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by email, role or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="staff-requests-search-input"
          />
        </div>
        
        <div className="staff-requests-actions">
          <button 
            className={`staff-requests-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={fetchRequests}
            disabled={isRefreshing}
            aria-label="Refresh requests"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          
          <div className="staff-requests-view-toggle">
            <button 
              className={`staff-requests-view-btn ${viewMode === 'grid' ? 'active' : ''}`} 
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid size={18} />
              <span>Grid</span>
            </button>
            <button 
              className={`staff-requests-view-btn ${viewMode === 'list' ? 'active' : ''}`} 
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={18} />
              <span>List</span>
            </button>
            <button 
              className={`staff-requests-view-btn ${viewMode === 'compact' ? 'active' : ''}`} 
              onClick={() => setViewMode('compact')}
              aria-label="Compact view"
            >
              <LayoutGrid size={18} />
              <span>Compact</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Success/Error Message Bar */}
      {(successMessage || error) && (
        <div className={`staff-requests-message ${error ? 'error' : 'success'}`}>
          {error ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{error || successMessage}</span>
        </div>
      )}
      
      {/* Content Area */}
      <div className="staff-requests-content">
        {loading ? (
          <div className="staff-requests-loading">
            <div className="staff-requests-spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : error && !successMessage ? (
          <div className="staff-requests-error">
            <AlertCircle size={40} />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="staff-requests-retry-btn" onClick={fetchRequests}>
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="staff-requests-empty">
            <div className="staff-requests-empty-icon">
              <CheckCircle size={48} />
            </div>
            <h3>No pending requests</h3>
            <p>
              {searchTerm ? 'No results match your search criteria' : 'All staff requests have been processed'}
            </p>
            {searchTerm && (
              <button className="staff-requests-clear-btn" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'compact' && renderCompactView()}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffRequests;