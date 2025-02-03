import React, { useState, useEffect } from 'react';
import EmployeeDetails from './EmployeeDetails';
import { Mail, Phone } from 'lucide-react';
import '../assets/css/EmployeeCards.css';
import Header from '../Components/common/Header';

const EmployeeCards = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCards, setShowCards] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleProfileClick = (emp) => {
    const formattedEmployee = {
      ...emp,
      firstName: emp.personalDetails.name.split(' ')[0],
      lastName: emp.personalDetails.name.split(' ')[1] || '',
      email: emp.personalDetails.email,
      phone: emp.personalDetails.contact,
      role: emp.professionalDetails.role,
      status: emp.professionalDetails.status,
      branch: emp.professionalDetails.branch,
      rating: emp.rating || 'N/A'
    };
    setSelectedEmployee(formattedEmployee);
    setShowCards(false);
  };

  const handleCloseDetails = () => {
    setSelectedEmployee(null);
    setShowCards(true);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="employee-cards-container">
      <Header />
      {showCards && (
        <div className="employee-grid">
          {employees.map((emp) => (
            <div key={emp._id} className="employee-card">
              <div className="employee-header">
                <div className="employee-avatar">
                  {getInitials(emp.personalDetails.name)}
                </div>
                <div className="employee-info">
                  <h3>{emp.personalDetails.name}</h3>
                  <p className="role">{emp.professionalDetails.role}</p>
                  <span className={`status ${emp.professionalDetails.status.toLowerCase()}`}>
                    {emp.professionalDetails.status}
                  </span>
                </div>
              </div>
              
              <div className="contact-info">
                <p>
                  <Mail className="icon" size={16} />
                  {emp.personalDetails.email}
                </p>
                <p>
                  <Phone className="icon" size={16} />
                  {emp.personalDetails.contact}
                </p>
              </div>
              
              <div className="employee-footer">
                <div className="rating">
                  <span className="star">★</span>
                  <span>{emp.rating || 'N/A'}</span>
                </div>
                <div className="button-group">
                  <button 
                    className="view-btn"
                    onClick={() => handleProfileClick(emp)}
                  >
                    View Profile
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