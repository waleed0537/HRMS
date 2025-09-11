import React, { useState, useEffect } from 'react';
import { Bell, UserCheck, Calendar, UserPlus } from 'lucide-react';
import '../assets/css/NotificationDropdown.css';
import API_BASE_URL from '../config/api.js';

const NotificationDropdown = ({ notifications, onMarkAsRead }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If notifications are not provided, fetch them
  const [localNotifications, setLocalNotifications] = useState(notifications || []);

  useEffect(() => {
    if (notifications) {
      setLocalNotifications(notifications);
    } else {
      fetchNotifications();
    }
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const endpoint = user.role === 'hr_manager' 
        ? `/api/hr/notifications` 
        : `/api/notifications`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setLocalNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    // If an external handler is provided, use it
    if (onMarkAsRead) {
      await onMarkAsRead(id);
      return;
    }
    
    // Otherwise, handle it internally
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const updatedNotification = await response.json();
      setLocalNotifications(localNotifications.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
      </div>
      
      <div className="notification-content">
        {loading ? (
          <div className="notification-loading">Loading...</div>
        ) : localNotifications.length === 0 ? (
          <div className="notification-empty">No notifications</div>
        ) : (
          localNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleMarkAsRead(notification._id)}
            >
              <div className="notification-item-content">
                {getIcon(notification.type)}
                <div className="notification-details">
                  <p className="notification-title">{notification.title}</p>
                  <p className="notification-message">{notification.message}</p>
                  <p className="notification-time">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper function to get icon based on notification type
const getIcon = (type) => {
  switch (type) {
    case 'account':
      return <UserCheck className="icon icon-account" />;
    case 'leave':
      return <Calendar className="icon icon-leave" />;
    case 'application':
      return <UserPlus className="icon icon-application" />;
    default:
      return <Bell className="icon icon-default" />;
  }
};

// Helper function to format time
const formatTime = (date) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diff = now - notifDate;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return notifDate.toLocaleDateString();
};

export default NotificationDropdown;