import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Grid, List, LayoutGrid } from 'lucide-react';
import '../assets/css/StaffRequests.css';
import API_BASE_URL from '../config/api.js';

const StaffRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'compact'

  const fetchRequests = async () => {
    try {
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
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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

      setSuccessMessage(`Successfully ${status} the request`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderRequest = (request) => {
    switch (viewMode) {
      case 'list':
        return (
          <div className="request-list-item">
            <div className="request-list-header">
              <div className="request-list-avatar">
                {request.email[0].toUpperCase()}
              </div>
              <div className="request-list-info">
                <h3>{request.email}</h3>
                <div className="request-list-meta">
                  <span>{request.role.replace(/_/g, ' ').toUpperCase()}</span>
                  <span>•</span>
                  <span>{request.branchName}</span>
                </div>
              </div>
            </div>
            <div className="request-list-date">
              {new Date(request.createdAt).toLocaleDateString()}
            </div>
            <div className="request-list-actions">
              <button
                onClick={() => handleStatusUpdate(request._id, 'approved')}
                className="approve-button"
              >
                <UserCheck size={18} />
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate(request._id, 'rejected')}
                className="reject-button"
              >
                <UserX size={18} />
                Reject
              </button>
            </div>
          </div>
        );

      case 'compact':
        return (
          <div className="request-compact-item">
            <div className="request-compact-content">
              <div className="request-compact-avatar">
                {request.email[0].toUpperCase()}
              </div>
              <div className="request-compact-info">
                <h3>{request.email}</h3>
                <p className="role-label">{request.role.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
              <div className="request-compact-actions">
                <button
                  onClick={() => handleStatusUpdate(request._id, 'approved')}
                  className="approve-button-compact"
                  title="Approve"
                >
                  <UserCheck size={16} />
                </button>
                <button
                  onClick={() => handleStatusUpdate(request._id, 'rejected')}
                  className="reject-button-compact"
                  title="Reject"
                >
                  <UserX size={16} />
                </button>
              </div>
            </div>
          </div>
        );

      default: // grid view
        return (
          <div className="request-card">
            <div className="request-info">
              <div className="avatar">
                {request.email[0].toUpperCase()}
              </div>
              <div className="user-details">
                <h3>{request.email}</h3>
                <div className="user-meta">
                  <span>{request.role.replace(/_/g, ' ').toUpperCase()}</span> • {request.branchName}
                </div>
                <div className="request-date">
                  Requested on: {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="button-group">
              <button
                onClick={() => handleStatusUpdate(request._id, 'approved')}
                className="approve-button"
              >
                <UserCheck size={18} />
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate(request._id, 'rejected')}
                className="reject-button"
              >
                <UserX size={18} />
                Reject
              </button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="staff-requests">
        <div className="loading-message">Loading pending requests...</div>
      </div>
    );
  }

  return (
    <div className="staff-requests">
      <div className="requests-header">
        <h2 className="staff-requests-title">Pending Staff Requests</h2>
        <div className="view-controls">
          <button 
            className={`view-control-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={20} />
            Grid
          </button>
          <button 
            className={`view-control-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={20} />
            List
          </button>
          <button 
            className={`view-control-btn ${viewMode === 'compact' ? 'active' : ''}`}
            onClick={() => setViewMode('compact')}
          >
            <LayoutGrid size={20} />
            Compact
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {requests.length === 0 ? (
        <div className="empty-message">
          No pending requests found
        </div>
      ) : (
        <div className={`requests-${viewMode}-container`}>
          {requests.map((request) => (
            <React.Fragment key={request._id}>
              {renderRequest(request)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffRequests;