// LeaveHistory.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText } from 'lucide-react';
import '../assets/css/LeaveHistory.css';
const LeaveHistory = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quotas, setQuotas] = useState({
    annual: 20,
    sick: 10,
    personal: 5,
    unpaid: 0,
    maternity: 90,
    paternity: 14,
    bereavement: 5,
    study: 10
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchLeaveHistory(selectedEmployee);
    } else {
      setLeaveHistory([]);
    }
  }, [selectedEmployee]);

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
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to fetch employees');
    }
  };

  // In LeaveHistory.jsx, update the fetchLeaveHistory function:
  const fetchLeaveHistory = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/leaves?employeeEmail=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch leave history');
      }
  
      const data = await response.json();
      // Verify the leaves belong to the selected employee
      const filteredData = data.filter(leave => leave.employeeEmail === email);
      setLeaveHistory(filteredData);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (e) => {
    const selectedId = e.target.value;
    setSelectedEmployee(selectedId);
    
    if (selectedId) {
      const employee = employees.find(emp => emp._id === selectedId);
      if (employee) {
        fetchLeaveHistory(employee.personalDetails.email);
      } else {
        setLeaveHistory([]);
      }
    } else {
      setLeaveHistory([]);
    }
  };

  const generateReport = () => {
    if (!selectedEmployee) {
      alert('Please select an employee to generate report');
      return;
    }

    try {
      // Find the selected employee's data
      const employee = employees.find(emp => emp._id === selectedEmployee);
      if (!employee) return;

      // Calculate leave statistics
      const leaveStats = {
        total: leaveHistory.length,
        approved: leaveHistory.filter(leave => leave.status === 'approved').length,
        pending: leaveHistory.filter(leave => leave.status === 'pending').length,
        rejected: leaveHistory.filter(leave => leave.status === 'rejected').length,
        byType: {}
      };

      // Calculate leaves by type
      leaveHistory.forEach(leave => {
        if (!leaveStats.byType[leave.leaveType]) {
          leaveStats.byType[leave.leaveType] = 0;
        }
        leaveStats.byType[leave.leaveType]++;
      });

      // Create report content
      const reportContent = [
        `Leave History Report for ${employee.personalDetails.name}`,
        `Generated on: ${new Date().toLocaleDateString()}\n`,
        'Leave Statistics:',
        `Total Leaves: ${leaveStats.total}`,
        `Approved: ${leaveStats.approved}`,
        `Pending: ${leaveStats.pending}`,
        `Rejected: ${leaveStats.rejected}\n`,
        'Leaves by Type:',
        ...Object.entries(leaveStats.byType).map(([type, count]) =>
          `${type}: ${count}`
        ),
        '\nDetailed Leave History:',
        ...leaveHistory.map(leave =>
          `\n${leave.leaveType} Leave (${leave.status})` +
          `\nFrom: ${new Date(leave.startDate).toLocaleDateString()}` +
          `\nTo: ${new Date(leave.endDate).toLocaleDateString()}` +
          `\nReason: ${leave.reason}\n`
        )
      ].join('\n');

      // Create and download the report file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave_history_${employee.personalDetails.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
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
    <div className="leave-history-container">
      <div className="leave-history-header">
        <h2>Leave History & Quotas</h2>
        <button
          className="generate-report-btn"
          onClick={generateReport}
        >
          <Download size={18} />
          Generate Report
        </button>
      </div>

      <div className="leave-content">
        <div className="quota-section">
          <h3>Leave Quotas</h3>
          <div className="quota-grid">
            {Object.entries(quotas).map(([type, quota]) => (
              <div key={type} className="quota-item">
                <label>{type.charAt(0).toUpperCase() + type.slice(1)} Leave</label>
                <input
                  type="number"
                  value={quota}
                  onChange={(e) => {
                    setQuotas(prev => ({
                      ...prev,
                      [type]: parseInt(e.target.value) || 0
                    }));
                  }}
                  min="0"
                  className="quota-input"
                />
                <span>days/year</span>
              </div>
            ))}
          </div>
        </div>

        <div className="history-section">
          <div className="employee-select">
            <select
              value={selectedEmployee}
              onChange={(e) => {
                const employee = employees.find(emp => emp._id === e.target.value);
                setSelectedEmployee(e.target.value);
                if (employee) {
                  fetchLeaveHistory(employee.personalDetails.email);
                } else {
                  setLeaveHistory([]);
                }
              }}
              className="employee-dropdown"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.personalDetails?.name || emp.personalDetails?.email}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading-message">Loading leave history...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : selectedEmployee ? (
            <div className="history-list">
              {leaveHistory.length > 0 ? (
                leaveHistory.map((leave, index) => (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <span className={`status-badge ${leave.status}`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                      <span className="date-range">
                        <Calendar size={16} />
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </span>
                    </div>
                    <div className="history-details">
                      <h4>{leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave</h4>
                      <p>{leave.reason}</p>
                    </div>
                    {leave.documents?.length > 0 && (
                      <div className="documents">
                        <FileText size={16} />
                        <span>{leave.documents.length} document(s) attached</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-history">
                  No leave history found for this employee.
                </div>
              )}
            </div>
          ) : (
            <div className="no-history">
              Please select an employee to view their leave history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;