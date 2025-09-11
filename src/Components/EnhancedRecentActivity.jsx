import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/RecentActivity.css';
import AllActivitiesModal from './AllActivitiesModal';

const EnhancedRecentActivity = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAllActivitiesModalOpen, setIsAllActivitiesModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
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
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
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
    const nameMatch = notification.message.match(/^([A-Z][a-z]+)(\s[A-Z][a-z]+)?/);
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
    // For employee profile edits - prioritize detecting this
    if (notification.type === 'account' && 
        (notification.message.toLowerCase().includes('profile edited') ||
         notification.message.toLowerCase().includes('profile updated') ||
         notification.message.toLowerCase().includes('employee profile')|| 
         notification.message.toLowerCase().includes('modified profile'))) {
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
    
    // Use the provided title if available
    if (notification.title) {
      return notification.title;
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
  const getAvatarColor = (type, title) => {
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
  const getStatusIndicator = (notification) => {
    const message = notification.message.toLowerCase();
    
    if (message.includes('approved') || message.includes('completed') || 
        message.includes('accepted') || message.includes('confirmed')) {
      return <div className="status-indicator success" title="Approved/Completed"></div>;
    }
    
    if (message.includes('rejected') || message.includes('denied') || 
        message.includes('failed')) {
      return <div className="status-indicator error" title="Rejected/Failed"></div>;
    }
    
    return <div className="status-indicator pending" title="Pending"></div>;
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

  // Get a cleaner description from the notification message
  const getCleanDescription = (notification) => {
    const fullMessage = notification.message;
    
    // Remove any repetitive title information
    const title = getNotificationTitle(notification);
    let cleanMessage = fullMessage;
    
    // If message starts with or contains the title, try to extract the important part
    if (fullMessage.includes(title)) {
      cleanMessage = fullMessage.replace(title, '').trim();
      // Remove common starting characters like "-", ":", etc.
      cleanMessage = cleanMessage.replace(/^[-:]\s*/, '');
    }
    
    // Make sure we have at least some content
    if (!cleanMessage || cleanMessage.length < 3) {
      return fullMessage;
    }
    
    // Capitalize first letter
    return cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
  };

  // Handle refresh click
  const handleRefresh = () => {
    fetchNotifications();
  };

  // Handle view all click
  const handleViewAll = () => {
    setIsAllActivitiesModalOpen(true);
  };

  return (
    <div className="recent-activity-card">
      <div className="recent-activity-header">
        <h2>Recent Activity</h2>
        <button onClick={handleRefresh} className="refresh-button" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="recent-activity-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-button">Retry</button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>No recent activities found</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.slice(0, 7).map((notification, index) => {
              const title = getNotificationTitle(notification);
              const avatarInitials = getInitials(notification);
              const avatarColor = getAvatarColor(notification.type, title);
              const statusIndicator = getStatusIndicator(notification);
              const timeAgo = getTimeFromNow(notification.createdAt);
              const description = getCleanDescription(notification);
              
              return (
                <div key={notification._id || index} className="notification-item">
                  <div 
                    className="avatar" 
                    style={{backgroundColor: avatarColor}}
                  >
                    {avatarInitials}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">{title}</div>
                    <div className="notification-description">{description}</div>
                  </div>
                  
                  <div className="notification-meta">
                    <div className="notification-time">{timeAgo}</div>
                    {statusIndicator}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="recent-activity-footer">
        <button onClick={handleViewAll} className="view-all-button">
          View all activity
          <CheckCircle size={14} />
        </button>
      </div>

      {/* All Activities Modal */}
      <AllActivitiesModal 
        isOpen={isAllActivitiesModalOpen} 
        onClose={() => setIsAllActivitiesModalOpen(false)}
        isHrView={false} // This is for Admin view
      />
    </div>
  );
};

export default EnhancedRecentActivity;