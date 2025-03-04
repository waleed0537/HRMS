// EmployeeDetails.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building, Briefcase, ArrowLeft, Calendar, FileText, Award, Clock } from 'lucide-react';
import '../assets/css/EmployeeDetails.css';
import API_BASE_URL from '../config/api.js';

const EmployeeDetails = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (employee?._id || employee?.personalDetails?._id) {
      const employeeId = employee._id || employee.personalDetails._id;
      fetchEmployeeHistory(employeeId);
    }
  }, [employee]);

  const fetchEmployeeHistory = async (employeeId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setEmployeeHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!employee) {
    return null;
  }

  // Get the initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const employeeName = employee.firstName 
    ? `${employee.firstName} ${employee.lastName || ''}`
    : employee.personalDetails?.name || 'Unknown';

  return (
    <div className="employee-detail-container">
      <div className="employee-detail-header">
        <button className="back-button" onClick={onClose}>
          <ArrowLeft size={20} />
          <span>Back to List</span>
        </button>
      </div>
      
      <div className="employee-detail-content">
        <div className="employee-profile-card">
          <div className="employee-avatar">
            {getInitials(employeeName)}
          </div>
          <div className="employee-profile-info">
            <h2>{employeeName}</h2>
            <p className="employee-role">{employee.role || employee.professionalDetails?.role || 'Employee'}</p>
            <div className="employee-status-container">
              <span className={`employee-status ${(employee.status || 'active').toLowerCase()}`}>
                {employee.status || employee.professionalDetails?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        <div className="employee-detail-tabs">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Basic Information
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Employment History
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="info-section">
              <div className="section-card">
                <h3 className="section-title">Contact Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <Mail size={16} />
                      <span>Email</span>
                    </div>
                    <div className="info-value">
                      {employee.email || employee.personalDetails?.email || 'No email provided'}
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">
                      <Phone size={16} />
                      <span>Phone</span>
                    </div>
                    <div className="info-value">
                      {employee.phone || employee.personalDetails?.contact || 'No phone provided'}
                    </div>
                  </div>
                  
                  {(employee.address || employee.personalDetails?.address) && (
                    <div className="info-item full-width">
                      <div className="info-label">
                        <MapPin size={16} />
                        <span>Address</span>
                      </div>
                      <div className="info-value">
                        {employee.address || employee.personalDetails?.address}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="section-card">
                <h3 className="section-title">Employment Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <Building size={16} />
                      <span>Branch</span>
                    </div>
                    <div className="info-value">
                      {employee.branch || employee.professionalDetails?.branch || 'No branch assigned'}
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">
                      <Briefcase size={16} />
                      <span>Department</span>
                    </div>
                    <div className="info-value">
                      {employee.department || employee.professionalDetails?.department || 'No department assigned'}
                    </div>
                  </div>
                  
                  {employee.rating && (
                    <div className="info-item">
                      <div className="info-label">
                        <span className="star-icon">★</span>
                        <span>Performance Rating</span>
                      </div>
                      <div className="info-value">
                        <span className="rating">{employee.rating}</span>
                        <span className="rating-text">
                          {employee.rating >= 4.5 ? 'Excellent' : 
                           employee.rating >= 3.5 ? 'Good' : 
                           employee.rating >= 2.5 ? 'Average' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {employee.joinDate && (
                    <div className="info-item">
                      <div className="info-label">
                        <Calendar size={16} />
                        <span>Join Date</span>
                      </div>
                      <div className="info-value">
                        {formatDate(employee.joinDate)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-section">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading employment history...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>Error loading history: {error}</p>
                </div>
              ) : employeeHistory.length > 0 ? (
                <div className="history-timeline">
                  {employeeHistory.map((item, index) => (
                    <div key={index} className="history-event">
                      <div className="event-icon">
                        {item.type === 'milestone' ? <Award size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="event-content">
                        <div className="event-header">
                          <h4 className="event-title">{item.change}</h4>
                          <div className="event-date">
                            <Calendar size={14} />
                            <span>{formatDate(item.date)}</span>
                          </div>
                        </div>
                        <p className="event-details">{item.details}</p>
                        {item.branch && <div className="event-branch">{item.branch}</div>}
                        {item.impact && (
                          <div className="event-impact">
                            <h5>Impact:</h5>
                            <p>{item.impact}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FileText size={48} className="empty-icon" />
                  <h3>No History Records</h3>
                  <p>There are no employment history records available for this employee.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;