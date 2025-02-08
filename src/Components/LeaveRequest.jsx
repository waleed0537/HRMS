// src/Components/LeaveRequest.jsx
import React, { useState } from 'react';
import { Calendar, Upload, X } from 'lucide-react';
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

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

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

    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError(error.message || 'Failed to submit leave request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="leave-request-container">
      <div className="leave-form-card">
        <h2 className="leave-title">Submit Leave Request</h2>
        
        {error && (
          <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message bg-green-100 text-green-700 p-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label>Start Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={leaveData.startDate}
                onChange={(e) => setLeaveData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label>End Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={leaveData.endDate}
                onChange={(e) => setLeaveData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Leave Type</label>
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
          </div>

          <div className="form-field">
            <label>Reason for Leave</label>
            <textarea
              required
              className="form-textarea"
              placeholder="Please provide details about your leave request..."
              value={leaveData.reason}
              onChange={(e) => setLeaveData(prev => ({ ...prev, reason: e.target.value }))}
            ></textarea>
          </div>

          <div className="form-field">
            <label>Supporting Documents</label>
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
                <span>Click to upload documents</span>
                <span className="upload-hint">(PDF, Word, or Images)</span>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="document-list">
                {documents.map((doc, index) => (
                  <div key={index} className="document-item">
                    <span className="document-name">{doc.name}</span>
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
    </div>
  );
};

export default LeaveRequest;