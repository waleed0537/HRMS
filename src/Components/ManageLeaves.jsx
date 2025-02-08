import React, { useState, useEffect } from 'react';
import { Check, X, FileText, Download, Eye } from 'lucide-react';
import '../assets/css/ManageLeaves.css';

const ManageLeaves = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Response status:', response.status);
        throw new Error('Failed to fetch leave requests');
      }

      const data = await response.json();
      console.log('Fetched leave requests:', data);
      setLeaveRequests(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update leave request status');
      }

      // Refresh the leave requests list
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error updating leave request:', error);
      alert('Failed to update leave request. Please try again.');
    }
  };

  const handleDocumentView = (doc) => {
    setSelectedDocument(doc);
  };

  const downloadDocument = async (doc) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/${doc.path}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download document');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading leave requests...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="manage-leaves-container">
      <div className="header-section">
        <h2 className="page-title">Manage Leave Requests</h2>
        
        <div className="filter-section">
          <span>Filter by status:</span>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="no-leaves">No leave requests found.</div>
      ) : (
        <div className="leaves-grid">
          {filteredRequests.map((leave) => (
            <div key={leave._id} className="leave-card">
              <div className="card-header">
                <div className="employee-info">
                  <h3>{leave.employeeName}</h3>
                  <div className="employee-email">{leave.employeeEmail}</div>
                </div>
                <span className={`status-badge ${getStatusClass(leave.status)}`}>
                  {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                </span>
              </div>

              <div className="leave-details">
                <div className="detail-row">
                  <span className="detail-label">Leave Type:</span>
                  <span className="detail-value">{leave.leaveType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{formatDate(leave.startDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">End Date:</span>
                  <span className="detail-value">{formatDate(leave.endDate)}</span>
                </div>
              </div>

              <div className="leave-reason">
                <strong>Reason:</strong><br />
                {leave.reason}
              </div>

              {leave.documents && leave.documents.length > 0 && (
                <div className="attachments-section">
                  <div className="attachments-title">Attachments:</div>
                  <div className="attachment-list">
                    {leave.documents.map((doc, index) => (
                      <div key={index} className="attachment-item">
                        <FileText size={14} />
                        <span>{doc.name}</span>
                        <button
                          onClick={() => handleDocumentView(doc)}
                          className="view-btn"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="view-btn"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leave.status === 'pending' && (
                <div className="action-buttons">
                  <button
                    className="action-btn approve-btn"
                    onClick={() => handleStatusUpdate(leave._id, 'approved')}
                  >
                    <Check size={18} />
                    Approve
                  </button>
                  <button
                    className="action-btn reject-btn"
                    onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedDocument && (
        <div className="document-preview" onClick={() => setSelectedDocument(null)}>
          <button className="close-preview">
            <X size={20} />
          </button>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            {selectedDocument.path.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={`http://localhost:5000/${selectedDocument.path}`}
                alt="Document preview"
                style={{ maxWidth: '100%', maxHeight: '80vh' }}
              />
            ) : (
              <div className="document-fallback">
                <FileText size={48} />
                <p>This document type cannot be previewed.</p>
                <button
                  className="action-btn view-btn"
                  onClick={() => downloadDocument(selectedDocument)}
                >
                  <Download size={18} />
                  Download Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeaves;