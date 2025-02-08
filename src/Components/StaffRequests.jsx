import React, { useState, useEffect } from 'react';
import { UserCheck, UserX } from 'lucide-react';
import '../assets/css/StaffRequests.css';
import API_BASE_URL from '../config/api.js';
const StaffRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

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
      
      // Refresh the requests list
      fetchRequests();
    } catch (err) {
      setError(err.message);
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
      <h2 className="staff-requests-title">Pending Staff Requests</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {requests.length === 0 ? (
        <div className="empty-message">
          No pending requests found
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffRequests;