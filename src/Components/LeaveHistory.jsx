import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, Download, Filter, Search, 
  RefreshCw, ChevronLeft, ChevronRight, 
  FileText, Check, X, Clock, AlertTriangle,
  User, Calendar as CalendarIcon, ArrowRight
} from 'lucide-react';
import '../assets/css/LeaveHistory.css';
import API_BASE_URL from '../config/api.js';

const COLORS = ['#6dbfb8', '#be95be', '#71a3c1', '#b3be62', '#fec76f', '#f5945c'];

const LeaveHistory = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quotas, setQuotas] = useState({
    annual: { total: 20, used: 0 },
    sick: { total: 10, used: 0 },
    personal: { total: 5, used: 0 },
    unpaid: { total: 0, used: 0 },
    maternity: { total: 90, used: 0 },
    paternity: { total: 14, used: 0 }
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Stats
  const [leaveStats, setLeaveStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  // Chart data
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchEmployees();
    const mockQuotas = {
      annual: { total: 20, used: 8 },
      sick: { total: 10, used: 3 },
      personal: { total: 5, used: 2 },
      unpaid: { total: 0, used: 1 },
      maternity: { total: 90, used: 0 },
      paternity: { total: 14, used: 0 }
    };
    setQuotas(mockQuotas);
    generateChartData(mockQuotas);
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchLeaveHistory(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
      // Select first employee by default if exists
      if (data.length > 0) {
        setSelectedEmployee(data[0]._id);
      }
    } catch (err) {
      setError('Error fetching employees. Please try again.');
      setLoading(false);
    }
  };

  const fetchLeaveHistory = async (employeeId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/leaves/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave history');
      }

      const data = await response.json();
      setLeaveHistory(data);
      
      // Calculate stats
      const stats = data.reduce((acc, leave) => {
        acc[leave.status] = (acc[leave.status] || 0) + 1;
        return acc;
      }, {});
      
      setLeaveStats({
        pending: stats.pending || 0,
        approved: stats.approved || 0,
        rejected: stats.rejected || 0
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const generateChartData = (quotaData) => {
    const data = Object.keys(quotaData).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      total: quotaData[key].total,
      used: quotaData[key].used,
      remaining: quotaData[key].total - quotaData[key].used
    }));
    
    setChartData(data);
  };

  const handleGenerateReport = () => {
    const employee = employees.find(emp => emp._id === selectedEmployee);
    if (!employee) return;
    
    const employeeName = employee.personalDetails?.name || 'Employee';
    
    // Create report content
    const reportContent = [
      `Leave History Report for ${employeeName}`,
      `Generated on ${new Date().toLocaleDateString()}\n`,
      'Leave Quotas:',
      ...Object.entries(quotas).map(([type, { total, used }]) => 
        `${type.charAt(0).toUpperCase() + type.slice(1)}: ${used}/${total} days used`
      ),
      '\nLeave History:',
      ...leaveHistory.map(leave => {
        const startDate = new Date(leave.startDate).toLocaleDateString();
        const endDate = new Date(leave.endDate).toLocaleDateString();
        return `- ${leave.leaveType} leave (${startDate} to ${endDate}): ${leave.status}`;
      })
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employeeName.replace(/\s+/g, '_')}_Leave_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleQuotaChange = (type, value) => {
    const newValue = parseInt(value, 10) || 0;
    
    setQuotas(prev => {
      const newQuotas = {
        ...prev,
        [type]: {
          ...prev[type],
          total: newValue
        }
      };
      
      generateChartData(newQuotas);
      return newQuotas;
    });
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setDateFilter({ from: '', to: '' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleApproveLeave = async (leaveId) => {
    // Implement API call to approve leave
    alert(`Approve leave: ${leaveId}`);
  };

  const handleRejectLeave = async (leaveId) => {
    // Implement API call to reject leave
    alert(`Reject leave: ${leaveId}`);
  };

  // Filter leave history based on filters
  const filteredLeaveHistory = leaveHistory.filter(leave => {
    // Status filter
    if (statusFilter && leave.status !== statusFilter) return false;
    
    // Type filter
    if (typeFilter && leave.leaveType !== typeFilter) return false;
    
    // Date filter
    if (dateFilter.from) {
      const fromDate = new Date(dateFilter.from);
      const leaveStartDate = new Date(leave.startDate);
      if (leaveStartDate < fromDate) return false;
    }
    
    if (dateFilter.to) {
      const toDate = new Date(dateFilter.to);
      const leaveEndDate = new Date(leave.endDate);
      if (leaveEndDate > toDate) return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !leave.leaveType.toLowerCase().includes(query) &&
        !leave.reason.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    return true;
  });

  // Pagination
  const indexOfLastLeave = currentPage * itemsPerPage;
  const indexOfFirstLeave = indexOfLastLeave - itemsPerPage;
  const currentLeaves = filteredLeaveHistory.slice(indexOfFirstLeave, indexOfLastLeave);
  const totalPages = Math.ceil(filteredLeaveHistory.length / itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveTypeBadgeClass = (leaveType) => {
    switch(leaveType) {
      case 'annual': return 'leave-type-annual';
      case 'sick': return 'leave-type-sick';
      case 'personal': return 'leave-type-personal';
      case 'unpaid': return 'leave-type-unpaid';
      case 'maternity': return 'leave-type-maternity';
      default: return 'leave-type-other';
    }
  };

  return (
    <div className="leave-history-container">
      <div className="leave-history-header">
        <div className="header-content">
          <h2>Leave History</h2>
          <p className="leave-history-subtitle">Manage and monitor employee leave balances and requests</p>
        </div>
        <button onClick={handleGenerateReport} className="generate-report-btn">
          <Download size={16} />
          Generate Report
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="leave-icon pending-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h4 className="stat-value">{leaveStats.pending}</h4>
            <p className="stat-label">Pending Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="leave-icon approved-icon">
            <Check size={24} />
          </div>
          <div className="stat-content">
            <h4 className="stat-value">{leaveStats.approved}</h4>
            <p className="stat-label">Approved Leaves</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="leave-icon rejected-icon">
            <X size={24} />
          </div>
          <div className="stat-content">
            <h4 className="stat-value">{leaveStats.rejected}</h4>
            <p className="stat-label">Rejected Requests</p>
          </div>
        </div>
      </div>

      <div className="employee-dropdown-container">
        <label className="employee-dropdown-label">Select Employee</label>
        <select 
          value={selectedEmployee} 
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="employee-dropdown"
        >
          <option value="">Select an employee</option>
          {employees.map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employee.personalDetails?.name || 'Unknown'}
            </option>
          ))}
        </select>
      </div>

      <div className="leave-content">
        <div className="quota-section">
          <div className="section-header">
            <h3>Leave Quotas</h3>
          </div>
          <div className="quota-chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 8, 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#A389D4" />
                <Bar dataKey="used" name="Used" fill="#1dc4e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="quota-grid">
            {Object.entries(quotas).map(([type, { total, used }]) => (
              <div key={type} className="quota-item">
                <label className="quota-label">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
                <input
                  type="number"
                  min="0"
                  value={total}
                  onChange={(e) => handleQuotaChange(type, e.target.value)}
                  className="quota-input"
                />
                <span>Used: {used}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="history-section">
          <div className="section-header">
            <h3>Leave History</h3>
          </div>
          
          <div className="history-filters">
            <div className="filter-item">
              <label className="filter-label">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Type</label>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="unpaid">Unpaid</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">From</label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter({...dateFilter, from: e.target.value})}
                className="filter-input"
              />
            </div>
            <div className="filter-item">
              <label className="filter-label">To</label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter({...dateFilter, to: e.target.value})}
                className="filter-input"
              />
            </div>
            <div className="filter-actions">
              <button onClick={handleResetFilters} className="filter-button filter-reset">
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">
              <RefreshCw size={20} />
              Loading leave history...
            </div>
          ) : error ? (
            <div className="error-message">
              <AlertTriangle size={20} />
              {error}
            </div>
          ) : currentLeaves.length === 0 ? (
            <div className="no-history">
              <div className="no-history-icon">📅</div>
              <h4>No leave records found</h4>
              <p>Try adjusting your filters or select a different employee</p>
            </div>
          ) : (
            <>
              <div className="history-list">
                {currentLeaves.map((leave) => (
                  <div key={leave._id} className="history-item">
                    <div className="history-header">
                      <span className={`leave-type-badge ${getLeaveTypeBadgeClass(leave.leaveType)}`}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                      </span>
                      <span className={`status-badge ${leave.status}`}>
                        {leave.status === 'approved' ? <Check size={14} /> : 
                        leave.status === 'rejected' ? <X size={14} /> : 
                        <Clock size={14} />}
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </div>
                    <div className="date-range">
                      <Calendar size={16} className="date-range-icon" />
                      <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                    </div>
                    <div className="history-details">
                      <h4>Reason for Leave</h4>
                      <p>{leave.reason}</p>
                    </div>
                    <div className="history-footer">
                      <div className="documents">
                        <FileText size={16} className="document-icon" />
                        <span>{leave.documents?.length || 0} Document(s)</span>
                      </div>
                      {leave.status === 'pending' && (
                        <div className="approve-reject-buttons">
                          <button 
                            onClick={() => handleApproveLeave(leave._id)}
                            className="leave-action-btn btn-approve"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectLeave(leave._id)}
                            className="leave-action-btn btn-reject"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`pagination-arrow ${currentPage === 1 ? 'disabled' : ''}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`pagination-item ${currentPage === i + 1 ? 'active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`pagination-arrow ${currentPage === totalPages ? 'disabled' : ''}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;