import React, { useState } from 'react';
import EmployeeDetails from './EmployeeDetails';
import '../assets/css/EmployeeCards.css';
import Header from '../Components/common/Header'

const EmployeeCards = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCards, setShowCards] = useState(true);
  
  const employees = [
    {
      firstName: 'Luke',
      lastName: 'Short',
      role: 'UI/UX Designer',
      email: 'luke.short@company.com',
      phone: '+1 234 567 8900',
      rating: 4.5,
      status: 'Active'
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'Developer',
      email: 'sarah.j@company.com',
      phone: '+1 234 567 8901',
      rating: 4.8,
      status: 'Active'
    }
  ];

  const handleProfileClick = (emp) => {
    setSelectedEmployee(emp);
    setShowCards(false);
  };

  const handleCloseDetails = () => {
    setSelectedEmployee(null);
    setShowCards(true);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  return (
    <div>
      <Header />
      {showCards && (
        <div className="employee-grid">
          {employees.map((emp, index) => (
            <div key={index} className="employee-card">
              <div className="employee-header">
                <div className="employee-avatar">
                  {getInitials(emp.firstName, emp.lastName)}
                </div>
                <div className="employee-info">
                  <h3>{emp.firstName} {emp.lastName}</h3>
                  <p className="role">{emp.role}</p>
                  <span className={`status ${emp.status.toLowerCase()}`}>
                    {emp.status}
                  </span>
                </div>
              </div>
              
              <div className="contact-info">
                <p><i className="icon">📧</i> {emp.email}</p>
                <p><i className="icon">📱</i> {emp.phone}</p>
              </div>
              
              <div className="employee-footer">
                <div className="rating">
                  <span className="star">★</span> {emp.rating}
                </div>
                <div className="button-group">
                  <button className="view-btn" onClick={() => handleProfileClick(emp)}>
                    Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEmployee && (
        <EmployeeDetails 
          employee={selectedEmployee} 
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default EmployeeCards;