import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building } from 'lucide-react';
import '../assets/css/EmployeeDetails.css';

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
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}/history`, {
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

  return (
    <div className="employee-details">
      <div className="details-header">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <div className="employee-profile">
          <div className="large-avatar">
            {employee.firstName?.[0] || ''}{employee.lastName?.[0] || ''}
          </div>
          <h2>{employee.firstName} {employee.lastName}</h2>
          <p>{employee.role}</p>
          <div className="status-container">
            <span className={`status ${employee.status?.toLowerCase()}`}>
              {employee.status}
            </span>
          </div>
        </div>
      </div>

      <div className="details-nav">
        <button 
          className={`nav-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Basic Info
        </button>
        <button 
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <div className="details-body">
        <div className="details-content">
          {activeTab === 'info' && (
            <div className="info-grid">
              <div className="info-item">
                <span>Email</span>
                <p className="info-value">
                  <Mail className="info-icon" size={16} />
                  {employee.email}
                </p>
              </div>
              <div className="info-item">
                <span>Phone</span>
                <p className="info-value">
                  <Phone className="info-icon" size={16} />
                  {employee.phone}
                </p>
              </div>
              <div className="info-item">
                <span>Branch</span>
                <p className="info-value">
                  <Building className="info-icon" size={16} />
                  {employee.branch}
                </p>
              </div>
              <div className="info-item">
                <span>Rating</span>
                <p className="info-value">
                  <span className="star">★</span>
                  {employee.rating}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-list">
              {loading ? (
                <div className="loading-message">Loading history...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : employeeHistory.length > 0 ? (
                employeeHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <p className="date">{formatDate(item.date)}</p>
                    <h4 className="change">{item.change}</h4>
                    <p className="details">{item.details}</p>
                    {item.branch && <p className="branch">{item.branch}</p>}
                    {item.impact && (
                      <div className="history-impact">
                        <p><strong>Impact:</strong> {item.impact}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-history">
                  No history records found.
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