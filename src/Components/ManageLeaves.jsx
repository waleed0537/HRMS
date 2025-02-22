import React, { useState, useEffect } from 'react';
import { 
  Check, X, FileText, Download, Eye, Grid, List, LayoutGrid,
  FileSpreadsheet, Mail, Phone, Calendar 
} from 'lucide-react';
import '../assets/css/ManageLeaves.css';
import API_BASE_URL from '../config/api.js';

const ManageLeaves = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'compact'

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const endpoint = user.role === 'hr_manager' ? '/api/hr/leaves' : '/api/leaves';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const data = await response.json();
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

      const response = await fetch(`${API_BASE_URL}/api/leaves/${id}/status`, {
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
      const response = await fetch(`${API_BASE_URL}/${doc.path}`, {
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

  const renderLeaveRequest = (leave) => {
    switch (viewMode) {
      case 'list':
        return (
          <div className="leave-list-item">
            <div className="leave-list-header">
              <div className="employee-info">
                <h3>{leave.employeeName}</h3>
                <div className="employee-email">{leave.employeeEmail}</div>
              </div>
              <span className={`status-badge ${getStatusClass(leave.status)}`}>
                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
              </span>
            </div>
            <div className="leave-list-details">
              <div className="detail-row">
                <span>Type: {leave.leaveType}</span>
                <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
              </div>
            </div>
            <div className="leave-list-actions">
              {leave.status === 'pending' && (
                <>
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
                </>
              )}
            </div>
          </div>
        );

      case 'compact':
        return (
          <div className="leave-compact-item">
            <div className="leave-compact-content">
              <div className="leave-compact-avatar">
                {leave.employeeName[0].toUpperCase()}
              </div>
              <div className="leave-compact-info">
                <h3>{leave.employeeName}</h3>
                <p className="leave-type">{leave.leaveType} Leave</p>
                <span className={`status-badge ${getStatusClass(leave.status)}`}>
                  {leave.status}
                </span>
              </div>
              {leave.status === 'pending' && (
                <div className="leave-compact-actions">
                  <button
                    onClick={() => handleStatusUpdate(leave._id, 'approved')}
                    className="approve-btn-compact"
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                    className="reject-btn-compact"
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default: // grid view
        return (
          <div className="leave-card">
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
        );
    }
  };

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
        
        <div className="controls-section">
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
      </div>

      {filteredRequests.length === 0 ? (
        <div className="no-leaves">No leave requests found.</div>
      ) : (
        <div className={`leaves-${viewMode}-container`}>
          {filteredRequests.map((leave) => (
            <React.Fragment key={leave._id}>
              {renderLeaveRequest(leave)}
            </React.Fragment>
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
                src={`${API_BASE_URL}/${selectedDocument.path}`}
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