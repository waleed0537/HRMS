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
import { useToast } from './common/ToastContent.jsx';

const StaffRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'compact'
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const toast = useToast();

  const fetchRequests = async (showToast = false) => {
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
      
      // Only show toast when explicitly refreshing
      if (showToast) {
        toast.success('Successfully refreshed requests');
      }
    } catch (err) {
      setError(err.message);
      if (showToast) {
        toast.error('Error fetching staff requests: ' + err.message);
      }
    } finally {
      setLoading(false);
      // Add a small delay to make the refresh animation visible
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    // Initial fetch without toast
    fetchRequests(false);
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
      setProcessingId(userId);
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

      // Get the request that's being processed to show the name in toast
      const requestBeingProcessed = requests.find(req => req._id === userId);
      const requestName = requestBeingProcessed ? 
        (requestBeingProcessed.name || requestBeingProcessed.email.split('@')[0]) : 
        'Staff member';
      
      // Update the requests list without refetching
      setRequests(prevRequests => 
        prevRequests.filter(request => request._id !== userId)
      );

      setFilteredRequests(prevRequests => 
        prevRequests.filter(request => request._id !== userId)
      );
      
      // Show toast notification with the person's name
      if (status === 'approved') {
        toast.success(`${requestName}'s request approved successfully`);
      } else {
        toast.error(`${requestName}'s request rejected`);
      }
      
    } catch (err) {
      toast.error(`Failed to ${status} request: ${err.message}`);
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle manual refresh button click with toast
  const handleRefreshClick = () => {
    fetchRequests(true);
  };

  // Function to get profile picture number based on email
  const getProfilePicNumber = (email) => {
    // Generate a consistent number (1-11) based on email
    if (!email) return 1; // Default avatar
    
    // Use the first character of the email to determine avatar index (1-11)
    return (email.charCodeAt(0) % 11) + 1;
  };

  // Function to generate user's initials from email or name
  const getInitials = (request) => {
    if (request.name) {
      return request.name.split(' ')
        .map(part => part[0]?.toUpperCase() || '')
        .join('')
        .slice(0, 2);
    }

    // Fallback to email if name isn't available
    if (!request.email) return '?';
    
    // Get username part before @ symbol
    const username = request.email.split('@')[0];
    
    // Generate initials from username (handle common formats like first.last or first_last)
    if (username.includes('.') || username.includes('_')) {
      const parts = username.split(/[._]/);
      return parts.map(part => part[0]?.toUpperCase() || '').join('').slice(0, 2);
    }
    
    // If no separator, use first two characters or just the first if only one char
    return username.length > 1 ? username.slice(0, 2).toUpperCase() : username.toUpperCase();
  };

  // Updated render avatar function to match Header.jsx implementation
  const renderAvatar = (request) => {
    const initial = getInitials(request);
    const profilePicNum = getProfilePicNumber(request.email);
    
    return (
      <div className="staff-request-avatar">
        <img 
          src={`/src/avatars/avatar-${profilePicNum}.jpg`}
          alt={getDisplayName(request)}
          style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
          onError={(e) => {
            // If image fails to load, replace with initial
            e.target.style.display = 'none';
            e.target.parentNode.classList.add('initial-avatar');
            e.target.parentNode.innerText = initial;
          }}
        />
      </div>
    );
  };

  // Render compact avatar
  const renderCompactAvatar = (request) => {
    const initial = getInitials(request);
    const profilePicNum = getProfilePicNumber(request.email);
    
    return (
      <div className="staff-request-compact-avatar">
        <img 
          src={`/src/avatars/avatar-${profilePicNum}.jpg`}
          alt={getDisplayName(request)}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
          onError={(e) => {
            // If image fails to load, replace with initial
            e.target.style.display = 'none';
            e.target.parentNode.classList.add('initial-avatar');
            e.target.parentNode.innerText = initial;
          }}
        />
      </div>
    );
  };

  // Render list avatar
  const renderListAvatar = (request) => {
    const initial = getInitials(request);
    const profilePicNum = getProfilePicNumber(request.email);
    
    return (
      <div className="staff-request-list-avatar">
        <img 
          src={`/src/avatars/avatar-${profilePicNum}.jpg`}
          alt={getDisplayName(request)}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
          onError={(e) => {
            // If image fails to load, replace with initial
            e.target.style.display = 'none';
            e.target.parentNode.classList.add('initial-avatar');
            e.target.parentNode.innerText = initial;
          }}
        />
      </div>
    );
  };

  // Get display name (prefer actual name over email)
  const getDisplayName = (request) => {
    if (request.name) {
      return request.name;
    }
    
    // If no name, format the email as a name
    const username = request.email.split('@')[0];
    
    // Convert username like "john.doe" or "john_doe" to "John Doe"
    if (username.includes('.') || username.includes('_')) {
      return username
        .split(/[._]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    // Just capitalize the first letter of the username
    return username.charAt(0).toUpperCase() + username.slice(1);
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
          {renderAvatar(request)}
          
          <div className="staff-request-content">
            <h3 className="staff-request-email">{getDisplayName(request)}</h3>
            <div className="staff-request-email" style={{fontSize: '12px', marginTop: '-8px', marginBottom: '8px', color: '#64748b'}}>
              {request.email}
            </div>
            
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
              disabled={processingId === request._id}
            >
              <UserCheck size={18} />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleStatusUpdate(request._id, 'rejected')}
              className="staff-request-reject-btn"
              aria-label="Reject request"
              disabled={processingId === request._id}
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
            {renderListAvatar(request)}
            
            <div className="staff-request-list-info">
              <h3 className="staff-request-list-email">{getDisplayName(request)}</h3>
              <div className="staff-request-list-meta">
                <span className="staff-request-list-email">{request.email}</span>
                <span className="staff-request-divider">•</span>
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
              disabled={processingId === request._id}
            >
              <UserCheck size={18} />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleStatusUpdate(request._id, 'rejected')}
              className="staff-request-list-reject-btn"
              aria-label="Reject request"
              disabled={processingId === request._id}
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
          {renderCompactAvatar(request)}
          
          <div className="staff-request-compact-content">
            <h3 className="staff-request-compact-email">{getDisplayName(request)}</h3>
            <p className="staff-request-compact-email" style={{fontSize: '11px', margin: '0 0 4px'}}>{request.email}</p>
            <p className="staff-request-compact-role">{formatRole(request.role)}</p>
          </div>
          
          <div className="staff-request-compact-actions">
            <button
              onClick={() => handleStatusUpdate(request._id, 'approved')}
              className="staff-request-compact-approve-btn"
              aria-label="Approve request"
              title="Approve"
              disabled={processingId === request._id}
            >
              <CheckCircle size={20} />
            </button>
            <button
              onClick={() => handleStatusUpdate(request._id, 'rejected')}
              className="staff-request-compact-reject-btn"
              aria-label="Reject request"
              title="Reject"
              disabled={processingId === request._id}
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
        <h2 style={{fontSize:'1.75rem',fontWeight:'400',color:'#be95be'}}>Pending Staff Requests</h2>
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
            onClick={handleRefreshClick}
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
      
      {/* Content Area */}
      <div className="staff-requests-content">
        {loading ? (
          <div className="staff-requests-loading">
            <div className="staff-requests-spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : error && filteredRequests.length === 0 ? (
          <div className="staff-requests-error">
            <AlertCircle size={40} />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="staff-requests-retry-btn" onClick={handleRefreshClick}>
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