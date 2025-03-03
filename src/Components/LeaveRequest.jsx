import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Upload, 
  X, 
  AlertCircle, 
  Check, 
  Info,
  FileText,
  Clock,
  ChevronDown
} from 'lucide-react';
import '../assets/css/LeaveRequest.css';
import API_BASE_URL from '../config/api.js';

const LeaveRequest = () => {
  const [leaveData, setLeaveData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'annual',
    reason: '',
  });
  
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [leaveQuotas, setLeaveQuotas] = useState({
    annual: { total: 20, used: 5, remaining: 15 },
    sick: { total: 10, used: 2, remaining: 8 },
    personal: { total: 5, used: 0, remaining: 5 },
    unpaid: { total: 0, used: 0, remaining: 0 },
    maternity: { total: 90, used: 0, remaining: 90 },
    paternity: { total: 14, used: 0, remaining: 14 },
    bereavement: { total: 5, used: 0, remaining: 5 },
    study: { total: 10, used: 0, remaining: 10 }
  });
  const [showQuotaInfo, setShowQuotaInfo] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const fetchLeaveHistory = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      
      const response = await fetch(`${API_BASE_URL}/api/leaves?employeeEmail=${encodeURIComponent(userData.email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave history');
      }

      const data = await response.json();
      
      // Sort by date (newest first)
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Take only the 3 most recent
      setLeaveHistory(sortedData.slice(0, 3));
      
      // Calculate used leave days
      const usedLeaves = data.reduce((acc, leave) => {
        if (leave.status === 'approved') {
          if (!acc[leave.leaveType]) acc[leave.leaveType] = 0;
          
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          acc[leave.leaveType] += diffDays;
        }
        return acc;
      }, {});
      
      // Update quotas with used days
      const updatedQuotas = {...leaveQuotas};
      Object.keys(usedLeaves).forEach(type => {
        if (updatedQuotas[type]) {
          updatedQuotas[type].used = usedLeaves[type];
          updatedQuotas[type].remaining = updatedQuotas[type].total - usedLeaves[type];
        }
      });
      
      setLeaveQuotas(updatedQuotas);
      
    } catch (error) {
      console.error('Error fetching leave history:', error);
    }
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const calculateLeaveDuration = () => {
    if (!leaveData.startDate || !leaveData.endDate) return null;
    
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    
    if (end < start) return null;
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  const getQuotaStatusClass = (type) => {
    const quota = leaveQuotas[type];
    if (!quota) return '';
    
    const percentRemaining = (quota.remaining / quota.total) * 100;
    
    if (percentRemaining < 25) return 'quota-low';
    if (percentRemaining < 50) return 'quota-medium';
    return 'quota-good';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Validate dates
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    
    if (end < start) {
      setError('End date cannot be before start date');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Add leave request data
      Object.keys(leaveData).forEach(key => {
        formData.append(key, leaveData[key]);
      });
      
      // Add documents
      documents.forEach(doc => {
        formData.append('documents', doc);
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/leaves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit leave request');
      }

      const result = await response.json();
      setSuccess('Leave request submitted successfully!');

      // Reset form
      setLeaveData({
        startDate: '',
        endDate: '',
        leaveType: 'annual',
        reason: '',
      });
      setDocuments([]);
      
      // Refresh leave history
      fetchLeaveHistory();

    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError(error.message || 'Failed to submit leave request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="leave-request-container">
      <div className="leave-request-header">
        <h1>Submit Leave Request</h1>
        <p className="header-description">
          Request time off for planned absence. All requests require management approval.
        </p>
      </div>
      
      <div className="leave-content-grid">
        <div className="leave-form-card">
          {error && (
            <div className="notification error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="notification success">
              <Check size={20} />
              <span>{success}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Start Date <span className="required">*</span></label>
                <div className="input-icon-wrapper">
                  <Calendar className="field-icon" size={18} />
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={leaveData.startDate}
                    onChange={(e) => setLeaveData(prev => ({ ...prev, startDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]} // Today's date as min
                  />
                </div>
              </div>

              <div className="form-field">
                <label>End Date <span className="required">*</span></label>
                <div className="input-icon-wrapper">
                  <Calendar className="field-icon" size={18} />
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={leaveData.endDate}
                    onChange={(e) => setLeaveData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={leaveData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {calculateLeaveDuration() && (
              <div className="leave-duration-info">
                <Clock size={16} />
                <span>Duration: <strong>{calculateLeaveDuration()} day{calculateLeaveDuration() !== 1 ? 's' : ''}</strong></span>
              </div>
            )}

            <div className="form-field">
              <div className="leave-type-header">
                <label>Leave Type <span className="required">*</span></label>
                <button 
                  type="button" 
                  className="quota-info-toggle"
                  onClick={() => setShowQuotaInfo(!showQuotaInfo)}
                >
                  <Info size={16} />
                  <span>Quota Info</span>
                  <ChevronDown size={16} className={`chevron ${showQuotaInfo ? 'open' : ''}`} />
                </button>
              </div>
              
              {showQuotaInfo && (
                <div className="quota-info">
                  <div className="quota-table">
                    <div className="quota-header">
                      <div>Type</div>
                      <div>Total</div>
                      <div>Used</div>
                      <div>Remaining</div>
                    </div>
                    {Object.entries(leaveQuotas).map(([type, quota]) => (
                      <div key={type} className="quota-row">
                        <div className="leave-type-name">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div>{quota.total}</div>
                        <div>{quota.used}</div>
                        <div className={getQuotaStatusClass(type)}>{quota.remaining}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <select
                required
                className="form-select"
                value={leaveData.leaveType}
                onChange={(e) => setLeaveData(prev => ({ ...prev, leaveType: e.target.value }))}
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="bereavement">Bereavement Leave</option>
                <option value="study">Study Leave</option>
              </select>
              
              <div className="quota-status">
                <span className="quota-label">Available:</span>
                <span className={`quota-value ${getQuotaStatusClass(leaveData.leaveType)}`}>
                  {leaveQuotas[leaveData.leaveType]?.remaining || 0} days
                </span>
              </div>
            </div>

            <div className="form-field">
              <label>Reason for Leave <span className="required">*</span></label>
              <textarea
                required
                className="form-textarea"
                placeholder="Please provide details about your leave request..."
                value={leaveData.reason}
                onChange={(e) => setLeaveData(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
              ></textarea>
            </div>

            <div className="form-field">
              <label>Supporting Documents</label>
              <p className="field-description">
                Upload relevant documents (e.g., medical certificates for sick leave)
              </p>
              <div className="document-upload">
                <input
                  type="file"
                  id="document-upload"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="document-upload" className="upload-label">
                  <Upload size={24} />
                  <div className="upload-text">
                    <span className="upload-title">Click to upload documents</span>
                    <span className="upload-hint">(PDF, Word, or Images)</span>
                  </div>
                </label>
              </div>

              {documents.length > 0 && (
                <div className="document-list">
                  {documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <div className="document-info">
                        <FileText size={16} />
                        <span className="document-name">{doc.name}</span>
                      </div>
                      <button
                        type="button"
                        className="remove-document"
                        onClick={() => removeDocument(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>
        
        <div className="leave-sidebar">
          <div className="sidebar-card leave-policy">
            <h3>Leave Policy</h3>
            <ul className="policy-list">
              <li>All leave requests require approval from your manager</li>
              <li>For sick leave over 3 days, a medical certificate is required</li>
              <li>Annual leave should be requested at least 2 weeks in advance</li>
              <li>Maternity leave requires documentation from a healthcare provider</li>
              <li>Unused annual leave days are carried over up to a maximum of 5 days</li>
            </ul>
          </div>
          
          <div className="sidebar-card recent-requests">
            <h3>Recent Requests</h3>
            {leaveHistory.length === 0 ? (
              <p className="no-history">No recent leave requests found.</p>
            ) : (
              <div className="history-list">
                {leaveHistory.map((leave, index) => (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <span className={`status-badge ${leave.status}`}>
                        {leave.status}
                      </span>
                      <span className="leave-date">{formatDate(leave.createdAt)}</span>
                    </div>
                    <div className="leave-details">
                      <div className="leave-type-label">{leave.leaveType} Leave</div>
                      <div className="leave-duration">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;