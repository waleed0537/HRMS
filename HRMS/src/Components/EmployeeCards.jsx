import React, { useState, useEffect } from 'react';
import EmployeeDetails from './EmployeeDetails';
import { Mail, Phone, Download, FilterIcon } from 'lucide-react';
import '../assets/css/EmployeeCards.css';
import Header from '../Components/common/Header';

const EmployeeCards = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCards, setShowCards] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/branches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
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

  const generateReport = () => {
    const filteredEmployees = selectedBranch 
      ? employees.filter(emp => emp.professionalDetails.branch === selectedBranch)
      : employees;

    const reportContent = [
      'Employee Report',
      `Generated on: ${new Date().toLocaleDateString()}\n`,
      selectedBranch ? `Branch: ${selectedBranch}\n` : 'All Branches\n',
      'Employee List:',
      ...filteredEmployees.map(emp => [
        `\nName: ${emp.personalDetails.name}`,
        `Email: ${emp.personalDetails.email}`,
        `Contact: ${emp.personalDetails.contact}`,
        `Role: ${emp.professionalDetails.role}`,
        `Branch: ${emp.professionalDetails.branch}`,
        `Status: ${emp.professionalDetails.status}`,
        `Rating: ${emp.rating || 'N/A'}`,
        '------------------------'
      ].join('\n'))
    ].join('\n');

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_report_${selectedBranch || 'all'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredEmployees = selectedBranch 
    ? employees.filter(emp => emp.professionalDetails.branch === selectedBranch)
    : employees;

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="employee-cards-container">
      <Header />
      {showCards && (
        <>
          <div className="filter-section">
            <div className="filter-container">
              <FilterIcon size={20} />
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="branch-select"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={generateReport} className="generate-report-btn">
              <Download size={20} />
              Download Report
            </button>
          </div>

          <div className="employee-grid">
            {filteredEmployees.map((emp) => (
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
        </>
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