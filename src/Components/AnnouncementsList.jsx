// components/AnnouncementsList.jsx
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import '../assets/css/AnnouncementsList.css';
import API_BASE_URL from '../config/api.js';
const AnnouncementsList = ({ branchId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (branchId) {
      fetchAnnouncements();
    }
  }, [branchId]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      setAnnouncements(data);
      setLoading(false);
    } catch (error) {
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

  if (loading) return <div className="loading">Loading announcements...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!announcements.length) return <div className="empty">No announcements found</div>;

  return (
    <div className="announcements-list">
      {announcements.map((announcement) => (
        <div key={announcement._id} className="announcement-item">
          <div className="announcement-header">
            <h3 className="announcement-title">{announcement.title}</h3>
            <span className={`announcement-priority priority-${announcement.priority}`}>
              {announcement.priority}
            </span>
          </div>
          
          <div className="announcement-content">
            {announcement.content}
          </div>
          
          <div className="announcement-footer">
            <div className="announcement-meta">
              <span>Created by: {announcement.createdBy.email}</span>
              <span>•</span>
              <span>Expires: {formatDate(announcement.expiresAt)}</span>
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
      ))}
    </div>
  );
};

export default AnnouncementsList;