import React, { useState } from 'react';
import { Mail, Phone, MapPin, Building } from 'lucide-react';
import '../assets/css/EmployeeDetails.css';

const EmployeeDetails = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');

  // Sample branch transfer history
  const employeeHistory = [
    {
      date: '2024-01-15',
      change: 'Role Change',
      details: 'Promoted from Junior Developer to Senior Developer',
      branch: 'Main Branch',
      impact: 'Led development of new features resulting in 30% efficiency increase',
      supervisor: 'Jane Smith'
    },
    {
      date: '2023-08-01',
      change: 'Branch Transfer',
      details: 'Strategic relocation to strengthen Main Branch operations',
      branch: 'East Branch → Main Branch',
      impact: 'Successfully integrated new development team, improved delivery time by 25%',
      supervisor: 'Mike Johnson'
    },
    {
      date: '2023-03-20',
      change: 'Performance Recognition',
      details: 'Quarterly Excellence Award',
      branch: 'East Branch',
      impact: 'Consistently exceeded targets, mentored 3 junior team members',
      supervisor: 'Sarah Williams'
    }
  ];

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
              {employeeHistory.map((item, index) => (
                <div key={index} className="history-item">
                  <p className="date">{item.date}</p>
                  <h4 className="change">{item.change}</h4>
                  <p className="details">{item.details}</p>
                  <p className="branch">{item.branch}</p>
                  <div className="history-impact">
                    <p><strong>Impact:</strong> {item.impact}</p>
                    <p><strong>Supervisor:</strong> {item.supervisor}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;