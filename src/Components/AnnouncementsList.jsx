// components/EnhancedAnnouncementsList.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, Building, AlertTriangle } from 'lucide-react';
import '../assets/css/AnnouncementsList.css';
import API_BASE_URL from '../config/api.js';

const EnhancedAnnouncementsList = ({ branchId, showAllForAdmin = false }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [branchId, showAllForAdmin]);

  // More robust date filtering function for EnhancedAnnouncementsList.jsx

const fetchAnnouncements = async () => {
  try {
    setLoading(true);
    
    // URL will be different based on whether we want all announcements or just one branch
    const url = showAllForAdmin 
      ? `${API_BASE_URL}/api/announcements` 
      : `${API_BASE_URL}/api/announcements/${branchId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }

    const data = await response.json();
    
    // Get the current date and explicitly set the time to the beginning of the day
    const now = new Date();
    console.log('Current system date:', now.toISOString());
    
    // Filter out expired announcements with detailed logging
    const activeAnnouncements = data.filter(announcement => {
      // Make sure expiresAt exists
      if (!announcement.expiresAt) {
        console.log('Announcement missing expiry date:', announcement.title);
        return false;
      }
      
      // Parse the expiry date
      const expiryDate = new Date(announcement.expiresAt);
      
      // Log both dates for comparison in a readable format
      console.log(
        'Comparing dates for:', announcement.title,
        '\nExpiry date:', expiryDate.toLocaleDateString(),
        '\nCurrent date:', now.toLocaleDateString(),
        '\nExpired?', expiryDate < now
      );
      
      // Keep only if expiry date is in the future (not expired)
      return expiryDate > now;
    });
    
    console.log(`Filtered ${data.length - activeAnnouncements.length} expired out of ${data.length} total`);
    
    setAnnouncements(activeAnnouncements);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    setError(error.message);
    setLoading(false);
  }
};

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
        throw new Error('Failed to delete announcement');
      }

      setAnnouncements(announcements.filter(announcement => announcement._id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) return <div className="loading">Loading announcements...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!announcements.length) return <div className="empty">No announcements found</div>;

  // Group announcements by branch when in admin mode
  const groupedAnnouncements = groupAnnouncementsByBranch();

  return (
    <div className="announcements-list">
      {showAllForAdmin ? (
        // Show grouped by branch for admin
        Object.entries(groupedAnnouncements).map(([branchName, branchAnnouncements]) => (
          <div key={branchName} className="branch-announcements-group">
            <div className="branch-header">
              <Building size={16} />
              <h3>{branchName}</h3>
              <span className="announcement-count">{branchAnnouncements.length} announcement{branchAnnouncements.length !== 1 ? 's' : ''}</span>
            </div>
            
            {branchAnnouncements.length === 0 ? (
              <div className="empty-branch-message">No active announcements</div>
            ) : (
              branchAnnouncements.map((announcement) => (
                <div key={announcement._id} className="announcement-item">
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <span className={`announcement-priority priority-${announcement.priority || 'medium'}`}>
                      {announcement.priority || 'medium'}
                    </span>
                  </div>
                  
                  <div className="announcement-content">
                    {announcement.content}
                  </div>
                  
                  <div className="announcement-footer">
                    <div className="announcement-meta">
                      <span>By: {announcement.createdBy?.email || 'Unknown'}</span>
                      <span className="dot-separator">•</span>
                      <span className="expiry-date">
                        Expires: {formatDate(announcement.expiresAt)}
                      </span>
                    </div>
                    
                    <button 
                      className="delete-button" 
                      onClick={() => handleDelete(announcement._id)}
                      title="Delete announcement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ))
      ) : (
        // Standard view for a single branch
        announcements.map((announcement) => (
          <div key={announcement._id} className="announcement-item">
            <div className="announcement-header">
              <h3 className="announcement-title">{announcement.title}</h3>
              <span className={`announcement-priority priority-${announcement.priority || 'medium'}`}>
                {announcement.priority || 'medium'}
              </span>
            </div>
            
            <div className="announcement-content">
              {announcement.content}
            </div>
            
            <div className="announcement-footer">
              <div className="announcement-meta">
                <span>By: {announcement.createdBy?.email || 'Unknown'}</span>
                <span className="dot-separator">•</span>
                <span className="expiry-date">
                  Expires: {formatDate(announcement.expiresAt)}
                </span>
              </div>
              
              <button 
                className="delete-button" 
                onClick={() => handleDelete(announcement._id)}
                title="Delete announcement"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default EnhancedAnnouncementsList;