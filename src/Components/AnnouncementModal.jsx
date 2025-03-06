// components/AnnouncementModal.jsx
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Calendar, Bell, Flag, Clock, Building } from 'lucide-react';
import { useToast } from './common/ToastContent.jsx';
import '../assets/css/AnnouncementModal.css';
import API_BASE_URL from '../config/api.js';

const AnnouncementModal = ({ isOpen, onClose, onSubmit }) => {
  const { success, error } = useToast(); // Use the toast hook
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    branchId: '',
    priority: 'medium',
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      // Set default expiry date to 7 days from now
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        expiresAt: defaultExpiry.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
      error('Unable to load branches. Please try again.'); // Use toast for error
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.content.trim()) errors.content = 'Content is required';
    if (!formData.branchId) errors.branchId = 'Branch is required';
    if (!formData.expiresAt) errors.expiresAt = 'Expiration date is required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    onSubmit(formData)
      .then(() => {
        success('Announcement created successfully!'); // Use toast for success
        setFormData({
          title: '',
          content: '',
          branchId: '',
          priority: 'medium',
          expiresAt: ''
        });
        onClose();
      })
      .catch(err => {
        error(err.message || 'Failed to create announcement'); // Use toast for error
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="announcement-modal-overlay">
      <div className="announcement-modal-container">
        <div className="announcement-modal-header">
          <div className="announcement-modal-title">
            <Bell size={22} />
            <h2>Create Branch Announcement</h2>
          </div>
          <button className="announcement-modal-close-button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="announcement-modal-form">
          <div className="announcement-modal-form-grid">
            <div className="announcement-modal-form-group">
              <label className="announcement-modal-label">
                <span>Title</span>
                {fieldErrors.title && <span className="announcement-modal-field-error">{fieldErrors.title}</span>}
              </label>
              <div className="announcement-modal-input-wrapper">
                <input
                  type="text"
                  className={`announcement-modal-input ${fieldErrors.title ? 'announcement-modal-input-error' : ''}`}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (fieldErrors.title) {
                      setFieldErrors({...fieldErrors, title: ''});
                    }
                  }}
                  placeholder="Announcement Title"
                />
              </div>
            </div>

            <div className="announcement-modal-form-row">
              <div className="announcement-modal-form-group">
                <label className="announcement-modal-label">
                  <span>Branch</span>
                  {fieldErrors.branchId && <span className="announcement-modal-field-error">{fieldErrors.branchId}</span>}
                </label>
                <div className="announcement-modal-input-wrapper">
                  <Building size={18} className="announcement-modal-input-icon" />
                  <select
                    className={`announcement-modal-select ${fieldErrors.branchId ? 'announcement-modal-input-error' : ''}`}
                    value={formData.branchId}
                    onChange={(e) => {
                      setFormData({ ...formData, branchId: e.target.value });
                      if (fieldErrors.branchId) {
                        setFieldErrors({...fieldErrors, branchId: ''});
                      }
                    }}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="announcement-modal-form-group">
                <label className="announcement-modal-label">Priority</label>
                <div className="announcement-modal-priority-selector">
                  {['low', 'medium', 'high'].map(priority => (
                    <button
                      key={priority}
                      type="button"
                      className={`announcement-modal-priority-btn ${formData.priority === priority ? 'active' : ''}`}
                      style={{
                        '--priority-color': getPriorityColor(priority)
                      }}
                      onClick={() => setFormData({...formData, priority})}
                    >
                      <Flag size={16} />
                      <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="announcement-modal-form-group">
              <label className="announcement-modal-label">
                <span>Expires At</span>
                {fieldErrors.expiresAt && <span className="announcement-modal-field-error">{fieldErrors.expiresAt}</span>}
              </label>
              <div className="announcement-modal-input-wrapper">
                <Clock size={18} className="announcement-modal-input-icon" />
                <input
                  type="datetime-local"
                  className={`announcement-modal-input ${fieldErrors.expiresAt ? 'announcement-modal-input-error' : ''}`}
                  value={formData.expiresAt}
                  onChange={(e) => {
                    setFormData({ ...formData, expiresAt: e.target.value });
                    if (fieldErrors.expiresAt) {
                      setFieldErrors({...fieldErrors, expiresAt: ''});
                    }
                  }}
                />
              </div>
            </div>

            <div className="announcement-modal-form-group">
              <label className="announcement-modal-label">
                <span>Content</span>
                {fieldErrors.content && <span className="announcement-modal-field-error">{fieldErrors.content}</span>}
              </label>
              <div className="announcement-modal-input-wrapper">
                <textarea
                  className={`announcement-modal-textarea ${fieldErrors.content ? 'announcement-modal-input-error' : ''}`}
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    if (fieldErrors.content) {
                      setFieldErrors({...fieldErrors, content: ''});
                    }
                  }}
                  placeholder="Announcement content..."
                  rows={5}
                />
              </div>
            </div>
          </div>

          <div className="announcement-modal-actions">
            <button 
              type="button" 
              className="announcement-modal-cancel-button" 
              onClick={onClose}
            >
              <X size={18} />
              Cancel
            </button>
            <button 
              type="submit" 
              className="announcement-modal-submit-button"
              disabled={loading}
            >
              <Check size={18} />
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;