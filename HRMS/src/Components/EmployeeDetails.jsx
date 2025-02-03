import React, { useState } from 'react';
import '../assets/css/EmployeeDetails.css';

const EmployeeDetails = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');

  const employeeHistory = [
    {
      date: '2024-01-15',
      change: 'Role Change',
      details: 'Promoted to Senior Developer',
      branch: 'Main Branch'
    },
    {
      date: '2023-08-01',
      change: 'Branch Transfer',
      details: 'Transferred from East Branch to Main Branch',
      branch: 'East Branch → Main Branch'
    },
    {
      date: '2023-03-20',
      change: 'Employment Milestone',
      details: 'Completed 2 years of service',
      branch: 'East Branch'
    }
  ];

  return (
    <div className="employee-details">
      <div className="details-header">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <div className="employee-profile">
          <div className="large-avatar">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <h2>{employee.firstName} {employee.lastName}</h2>
          <p>{employee.role}</p>
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
                <p>{employee.email}</p>
              </div>
              <div className="info-item">
                <span>Phone</span>
                <p>{employee.phone}</p>
              </div>
              <div className="info-item">
                <span>Status</span>
                <p className={`status ${employee.status.toLowerCase()}`}>
                  {employee.status}
                </p>
              </div>
              <div className="info-item">
                <span>Rating</span>
                <p>{employee.rating} ★</p>
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