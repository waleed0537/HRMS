// components/EnhancedAnnouncementsList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Building, AlertTriangle, RefreshCw, Clock, Bell } from 'lucide-react';
import '../assets/css/AnnouncementsList.css';
import API_BASE_URL from '../config/api.js';

const EnhancedAnnouncementsList = ({ branchId, showAllForAdmin = false, refreshTrigger }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // URL will be different based on whether we want all announcements or just one branch
      const url = showAllForAdmin 
        ? `${API_BASE_URL}/api/announcements` 
        : `${API_BASE_URL}/api/announcements/${branchId}`;
      
      console.log('Fetching announcements from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received announcements data:', data);
      
      // More lenient date filtering - only filter if announcement is more than 1 day expired
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
      
      // Filter out only announcements that are significantly expired (more than 1 day)
      const activeAnnouncements = data.filter(announcement => {
        if (!announcement.expiresAt) {
          console.log('Announcement missing expiry date, keeping it:', announcement.title);
          return true; // Keep announcements without expiry date
        }
        
        const expiryDate = new Date(announcement.expiresAt);
        const isExpired = expiryDate < oneDayAgo;
        
        if (isExpired) {
          console.log('Filtering out expired announcement:', announcement.title, 'expired on:', expiryDate.toLocaleDateString());
        } else {
          console.log('Keeping announcement:', announcement.title, 'expires:', expiryDate.toLocaleDateString());
        }
        
        return !isExpired;
      });
      
      // Sort announcements by creation date (newest first)
      activeAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`Showing ${activeAnnouncements.length} out of ${data.length} announcements`);
      setAnnouncements(activeAnnouncements);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [branchId, showAllForAdmin]);

  // Fetch announcements when component mounts or dependencies change
  useEffect(() => {
    if (showAllForAdmin || branchId) {
      fetchAnnouncements();
    }
  }, [fetchAnnouncements, refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete announcement: ${response.status}`);
      }

      // Remove the deleted announcement from state
      setAnnouncements(prev => prev.filter(announcement => announcement._id !== id));
      console.log('Successfully deleted announcement:', id);
      
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError(`Failed to delete announcement: ${error.message}`);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchAnnouncements();
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0; // Expires within 24 hours
  };

  // Group announcements by branch when showing all
  const groupAnnouncementsByBranch = () => {
    if (!showAllForAdmin) return { '': announcements };
    
    return announcements.reduce((groups, announcement) => {
      const branchName = announcement.branchId?.name || 'Unknown Branch';
      if (!groups[branchName]) {
        groups[branchName] = [];
      }
      groups[branchName].push(announcement);
      return groups;
    }, {});
  };

  const renderAnnouncementItem = (announcement) => (
    <div 
      key={announcement._id} 
      className={`announcement-item ${isExpiringSoon(announcement.expiresAt) ? 'expiring-soon' : ''}`}
    >
      <div className="announcement-header">
        <h3 className="announcement-title">{announcement.title}</h3>
        <div className="announcement-meta-top">
          <span className={`announcement-priority ${getPriorityClass(announcement.priority)}`}>
            {announcement.priority || 'medium'}
          </span>
          {isExpiringSoon(announcement.expiresAt) && (
            <span className="expiring-badge">
              <Clock size={12} />
              Expires Soon
            </span>
          )}
        </div>
      </div>
      
      <div className="announcement-content">
        {announcement.content}
      </div>
      
      <div className="announcement-footer">
        <div className="announcement-meta">
          <span className="created-by">By: {announcement.createdBy?.email || 'Unknown'}</span>
          <span className="dot-separator">•</span>
          <span className="creation-date">
            Created: {formatDate(announcement.createdAt)}
          </span>
          {announcement.expiresAt && (
            <>
              <span className="dot-separator">•</span>
              <span className="expiry-date">
                Expires: {formatDate(announcement.expiresAt)}
              </span>
            </>
          )}
        </div>
        
        <button 
          className="delete-button" 
          onClick={() => handleDelete(announcement._id)}
          title="Delete announcement"
          aria-label="Delete announcement"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="announcements-loading">
        <div className="loading-spinner"></div>
        <p>Loading announcements...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="announcements-error">
        <AlertTriangle size={24} />
        <p>Error loading announcements: {error}</p>
        <button onClick={handleRetry} className="retry-button">
          <RefreshCw size={16} />
          Retry {retryCount > 0 && `(${retryCount})`}
        </button>
      </div>
    );
  }

  // Empty state
  if (!announcements.length) {
    return (
      <div className="announcements-empty">
        <Bell size={32} />
        <p>No active announcements</p>
        <span className="empty-subtitle">
          {showAllForAdmin 
            ? 'No announcements found across all branches' 
            : 'No announcements for this branch yet'
          }
        </span>
      </div>
    );
  }

  // Group announcements by branch when in admin mode
  const groupedAnnouncements = groupAnnouncementsByBranch();

  return (
    <div className="announcements-list">
      {showAllForAdmin ? (
        // Admin view: Show grouped by branch
        <div className="admin-announcements-view">
          {Object.entries(groupedAnnouncements).map(([branchName, branchAnnouncements]) => (
            <div key={branchName} className="branch-announcements-group">
              <div className="branch-header">
                <Building size={16} />
                <h3>{branchName}</h3>
                <span className="announcement-count">
                  {branchAnnouncements.length} announcement{branchAnnouncements.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="branch-announcements-content">
                {branchAnnouncements.length === 0 ? (
                  <div className="empty-branch-message">
                    <p>No active announcements for this branch</p>
                  </div>
                ) : (
                  branchAnnouncements.map(renderAnnouncementItem)
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Standard view: Show all announcements for a single branch
        <div className="single-branch-announcements">
          {announcements.map(renderAnnouncementItem)}
        </div>
      )}
    </div>
  );
};

export default EnhancedAnnouncementsList;