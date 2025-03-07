import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Download, FilterIcon, Grid, List, LayoutGrid, 
  Search, User, Building, Tag, Calendar, MoreHorizontal, ChevronDown,
  ExternalLink, Star, AlertTriangle, Briefcase, ShieldCheck, UserX,
  Clock, ArrowUpDown, ChevronUp, X
} from 'lucide-react';
import '../assets/css/EmployeeCards.css';
import EmployeeDetails from './EmployeeDetails';
import API_BASE_URL from '../config/api.js';

const EmployeeCards = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCards, setShowCards] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'compact'
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [avatarErrors, setAvatarErrors] = useState({});
  
  // Advanced filters
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    departments: 0,
    branches: 0
  });

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  useEffect(() => {
    // Apply filters whenever filter state changes
    applyFilters();
  }, [employees, selectedBranch, searchTerm, statusFilter, departmentFilter, roleFilter, sortConfig]);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
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
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const endpoint = user.role === 'hr_manager' ? '/api/hr/employees' : '/api/employees';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);
      
      // Calculate metrics
      const departments = new Set(data.map(emp => emp.professionalDetails.department));
      const branchNames = new Set(data.map(emp => emp.professionalDetails.branch));
      const activeEmployees = data.filter(emp => emp.professionalDetails.status === 'active');
      const inactiveEmployees = data.filter(emp => emp.professionalDetails.status !== 'active');
      
      setMetrics({
        totalEmployees: data.length,
        activeEmployees: activeEmployees.length,
        inactiveEmployees: inactiveEmployees.length,
        departments: departments.size,
        branches: branchNames.size
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching employees:', err);
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

  // Get the initials for the avatar
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Handle avatar image error
  const handleAvatarError = (employeeId) => {
    setAvatarErrors(prev => ({
      ...prev,
      [employeeId]: true
    }));
  };

  // Get profile picture number based on employee data
  const getProfilePicNumber = (employee) => {
    // If employee has a userId with profilePic property
    if (employee.userId && employee.userId.profilePic) {
      return employee.userId.profilePic;
    }
    
    // Try to get a consistent number based on email
    const email = employee.personalDetails?.email;
    if (email) {
      return (email.charCodeAt(0) % 11) + 1;
    }
    
    // Fallback to a random number
    return Math.floor(Math.random() * 11) + 1;
  };

  // Render employee avatar with image or fallback to initials
  const renderAvatar = (employee, size = 'standard') => {
    const employeeId = employee._id;
    const hasAvatarError = avatarErrors[employeeId];
    const profilePicNum = getProfilePicNumber(employee);
    const initials = getInitials(employee.personalDetails.name);
    
    let className;
    let borderRadius = '50%';
    
    if (size === 'small') {
      className = 'list-avatar';
    } else if (size === 'compact') {
      className = 'compact-avatar';
    } else {
      className = 'employee-avatar';
      borderRadius = size === 'grid' ? '2rem' : '50%';
    }
    
    if (hasAvatarError) {
      return (
        <div className={className}>
          {initials}
        </div>
      );
    }
    
    return (
      <div className={className}>
        <img 
          src={`/src/avatars/avatar-${profilePicNum}.jpg`}
          alt={employee.personalDetails.name}
          style={{ width: '100%', height: '100%', borderRadius, objectFit: 'cover' }}
          onError={() => handleAvatarError(employeeId)}
        />
      </div>
    );
  };

  const generateReport = () => {
    const filteredEmps = filteredEmployees;

    const reportContent = [
      'Employee Report',
      `Generated on: ${new Date().toLocaleDateString()}\n`,
      selectedBranch ? `Branch: ${selectedBranch}\n` : 'All Branches\n',
      'Employee List:',
      ...filteredEmps.map(emp => [
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

  const resetFilters = () => {
    setSelectedBranch('');
    setSearchTerm('');
    setStatusFilter('');
    setDepartmentFilter('');
    setRoleFilter('');
    setIsAdvancedFiltersOpen(false);
    setFilteredEmployees(employees);
  };

  const applyFilters = () => {
    let result = [...employees];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        emp => 
          emp.personalDetails.name.toLowerCase().includes(term) ||
          emp.personalDetails.email.toLowerCase().includes(term) ||
          emp.personalDetails.contact.toLowerCase().includes(term) ||
          emp.professionalDetails.role.toLowerCase().includes(term)
      );
    }

    // Branch filter
    if (selectedBranch) {
      result = result.filter(emp => emp.professionalDetails.branch === selectedBranch);
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(emp => emp.professionalDetails.status === statusFilter);
    }

    // Department filter
    if (departmentFilter) {
      result = result.filter(emp => emp.professionalDetails.department === departmentFilter);
    }

    // Role filter
    if (roleFilter) {
      result = result.filter(emp => emp.professionalDetails.role === roleFilter);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        // Handle nested properties
        if (sortConfig.key === 'name') {
          aValue = a.personalDetails.name;
          bValue = b.personalDetails.name;
        } else if (sortConfig.key === 'email') {
          aValue = a.personalDetails.email;
          bValue = b.personalDetails.email;
        } else if (sortConfig.key === 'status') {
          aValue = a.professionalDetails.status;
          bValue = b.professionalDetails.status;
        } else if (sortConfig.key === 'branch') {
          aValue = a.professionalDetails.branch;
          bValue = b.professionalDetails.branch;
        } else if (sortConfig.key === 'department') {
          aValue = a.professionalDetails.department;
          bValue = b.professionalDetails.department;
        } else if (sortConfig.key === 'role') {
          aValue = a.professionalDetails.role;
          bValue = b.professionalDetails.role;
        } else if (sortConfig.key === 'rating') {
          // Handle potential undefined ratings
          aValue = a.rating || 0;
          bValue = b.rating || 0;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredEmployees(result);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get unique departments and roles for filters
  const getDepartments = () => {
    const departments = new Set(employees.map(emp => emp.professionalDetails.department));
    return Array.from(departments).filter(Boolean);
  };

  const getRoles = () => {
    const roles = new Set(employees.map(emp => emp.professionalDetails.role));
    return Array.from(roles).filter(Boolean);
  };

  // Format role display
  const formatRole = (role) => {
    if (!role) return 'N/A';
    return role
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch(status) {
      case 'active':
        return <ShieldCheck size={16} className="status-icon status-active" />;
      case 'resigned':
        return <UserX size={16} className="status-icon status-resigned" />;
      case 'terminated':
        return <AlertTriangle size={16} className="status-icon status-terminated" />;
      case 'on_leave':
        return <Clock size={16} className="status-icon status-on-leave" />;
      default:
        return null;
    }
  };

  // Determine badge color based on role
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'hr_manager':
        return 'role-badge-hr';
      case 't1_member':
        return 'role-badge-t1';
      case 'operational_manager':
        return 'role-badge-ops';
      case 'agent':
        return 'role-badge-agent';
      default:
        return 'role-badge-default';
    }
  };

  if (loading) {
    return (
      <div className="employee-cards-loading">
        <div className="loading-spinner"></div>
        <p>Loading employee data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-cards-error">
        <AlertTriangle size={48} className="error-icon" />
        <h3>Failed to load employees</h3>
        <p>{error}</p>
        <button onClick={fetchEmployees} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="employee-cards-container">
      {showCards ? (
        <>
          <div className="employee-dashboard-header">
            <h2 className="employee-section-title" style={{fontSize: '1.75rem',fontWeight:'400'}}>Employee Directory</h2>
            <div className="metrics-summary">
              <div className="metric-item">
                <span className="metric-value">{metrics.totalEmployees}</span>
                <span className="metric-label">Total</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{metrics.activeEmployees}</span>
                <span className="metric-label">Active</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{metrics.inactiveEmployees}</span>
                <span className="metric-label">Inactive</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{metrics.departments}</span>
                <span className="metric-label">Departments</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{metrics.branches}</span>
                <span className="metric-label">Branches</span>
              </div>
            </div>
          </div>
          
          <div className="controls-section">
            <div className="search-controls">
              <div className="search-bar">
                <Search className="search-icon" size={18} />
                <input 
                  type="text" 
                  placeholder="Search employees..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search-btn" 
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="view-controls">
                <button 
                  className={`view-control-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid size={18} />
                </button>
                <button 
                  className={`view-control-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={18} />
                </button>
                <button 
                  className={`view-control-btn ${viewMode === 'compact' ? 'active' : ''}`}
                  onClick={() => setViewMode('compact')}
                  title="Compact View"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
            
            <div className="filter-actions">
              <div className="branch-filter">
                <Building size={18} className="filter-icon" />
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
              
              <button 
                className={`advanced-filter-toggle ${isAdvancedFiltersOpen ? 'active' : ''}`}
                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              >
                <FilterIcon size={18} />
                <span>Advanced</span>
                {isAdvancedFiltersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              <button 
                onClick={generateReport} 
                className="generate-report-btn"
                title="Download employee report"
              >
                <Download size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          {isAdvancedFiltersOpen && (
            <div className="advanced-filters-panel">
              <div className="filter-group">
                <label>Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Department</label>
                <select 
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Departments</option>
                  {getDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Role</label>
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Roles</option>
                  {getRoles().map(role => (
                    <option key={role} value={role}>{formatRole(role)}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group sort-by">
                <label>Sort By</label>
                <div className="sort-dropdown">
                  <select 
                    value={sortConfig.key}
                    onChange={(e) => requestSort(e.target.value)}
                    className="filter-select"
                  >
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="status">Status</option>
                    <option value="branch">Branch</option>
                    <option value="department">Department</option>
                    <option value="role">Role</option>
                    <option value="rating">Rating</option>
                  </select>
                  <button 
                    className="sort-direction-btn"
                    onClick={() => setSortConfig({
                      ...sortConfig,
                      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
                    })}
                    title={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    <ArrowUpDown size={16} className={sortConfig.direction === 'asc' ? '' : 'rotated'} />
                  </button>
                </div>
              </div>
              
              <button 
                className="reset-filters-btn"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          )}
          
          {filteredEmployees.length === 0 ? (
            <div className="no-results-container">
              <User size={48} className="no-results-icon" />
              <h3>No Employees Found</h3>
              <p>Try adjusting your search or filters</p>
              {(searchTerm || selectedBranch || statusFilter || departmentFilter || roleFilter) && (
                <button 
                  className="reset-search-btn"
                  onClick={resetFilters}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' && (
                <div className="employee-grid-container">
                  {filteredEmployees.map((emp) => (
                    <div className="employee-card" key={emp._id}>
                      <div className="employee-card-header">
                        {renderAvatar(emp, 'grid')}
                        <div className="employee-header-info">
                          <h3 className="employee-name">{emp.personalDetails.name}</h3>
                          <div className="employee-role-badge">
                            <span className={`role-badge ${getRoleBadgeColor(emp.professionalDetails.role)}`}>
                              {formatRole(emp.professionalDetails.role)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="employee-card-content">
                        <div className="employee-info-group">
                          <div className="employee-info-item">
                            <Mail className="info-icon" size={16} />
                            <span className="info-text">{emp.personalDetails.email}</span>
                          </div>
                          <div className="employee-info-item">
                            <Phone className="info-icon" size={16} />
                            <span className="info-text">{emp.personalDetails.contact}</span>
                          </div>
                          <div className="employee-info-item">
                            <Building className="info-icon" size={16} />
                            <span className="info-text">{emp.professionalDetails.branch}</span>
                          </div>
                          <div className="employee-info-item">
                            <Briefcase className="info-icon" size={16} />
                            <span className="info-text">{emp.professionalDetails.department || 'General'}</span>
                          </div>
                        </div>
                        
                        <div className="employee-status-section">
                          <div className={`status-badge status-${emp.professionalDetails.status}`}>
                            {getStatusIcon(emp.professionalDetails.status)}
                            <span className="status-text">
                              {emp.professionalDetails.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="employee-card-footer">
                        <div className="employee-rating">
                          <Star className="rating-icon" size={18} />
                          <span className="rating-value">{emp.rating || 'N/A'}</span>
                        </div>
                        <button 
                          className="view-profile-btn"
                          onClick={() => handleProfileClick(emp)}
                        >
                          <ExternalLink size={16} />
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {viewMode === 'list' && (
                <div className="employee-list-container">
                  <div className="employee-list-header">
                    <div className="list-header-cell flex-small" onClick={() => requestSort('name')}>
                      <span>Name</span>
                      {sortConfig.key === 'name' && (
                        <ChevronDown className={`sort-icon ${sortConfig.direction === 'desc' ? 'rotated' : ''}`} size={16} />
                      )}
                    </div>
                    <div className="list-header-cell flex-medium" onClick={() => requestSort('email')}>
                      <span>Contact</span>
                      {sortConfig.key === 'email' && (
                        <ChevronDown className={`sort-icon ${sortConfig.direction === 'desc' ? 'rotated' : ''}`} size={16} />
                      )}
                    </div>
                    <div className="list-header-cell flex-medium" onClick={() => requestSort('role')}>
                      <span>Position</span>
                      {sortConfig.key === 'role' && (
                        <ChevronDown className={`sort-icon ${sortConfig.direction === 'desc' ? 'rotated' : ''}`} size={16} />
                      )}
                    </div>
                    <div className="list-header-cell flex-medium" onClick={() => requestSort('branch')}>
                      <span>Branch</span>
                      {sortConfig.key === 'branch' && (
                        <ChevronDown className={`sort-icon ${sortConfig.direction === 'desc' ? 'rotated' : ''}`} size={16} />
                      )}
                    </div>
                    <div className="list-header-cell flex-small" onClick={() => requestSort('status')}>
                      <span>Status</span>
                      {sortConfig.key === 'status' && (
                        <ChevronDown className={`sort-icon ${sortConfig.direction === 'desc' ? 'rotated' : ''}`} size={16} />
                      )}
                    </div>
                    <div className="list-header-cell flex-small">
                      <span>Action</span>
                    </div>
                  </div>
                  
                  {filteredEmployees.map((emp) => (
                    <div className="employee-list-item" key={emp._id}>
                      <div className="list-cell flex-small employee-name-cell">
                        {renderAvatar(emp, 'small')}
                        <div className="list-name-info">
                          <span className="list-name">{emp.personalDetails.name}</span>
                          <span className="list-department">{emp.professionalDetails.department || 'General'}</span>
                        </div>
                      </div>
                      <div className="list-cell flex-medium employee-contact-cell">
                        <div className="list-contact-info">
                          <div className="list-contact-item">
                            <Mail className="list-contact-icon" size={14} />
                            <span>{emp.personalDetails.email}</span>
                          </div>
                          <div className="list-contact-item">
                            <Phone className="list-contact-icon" size={14} />
                            <span>{emp.personalDetails.contact}</span>
                          </div>
                        </div>
                      </div>
                      <div className="list-cell flex-medium">
                        <span className={`role-badge ${getRoleBadgeColor(emp.professionalDetails.role)}`}>
                          {formatRole(emp.professionalDetails.role)}
                        </span>
                      </div>
                      <div className="list-cell flex-medium">
                        <div className="branch-tag">
                          <Building size={14} className="branch-icon" />
                          <span>{emp.professionalDetails.branch}</span>
                        </div>
                      </div>
                      <div className="list-cell flex-small">
                        <div className={`status-badge status-${emp.professionalDetails.status}`}>
                          {getStatusIcon(emp.professionalDetails.status)}
                          <span className="status-text">
                            {emp.professionalDetails.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="list-cell flex-small">
                        <button 
                          className="view-btn list-view-btn"
                          onClick={() => handleProfileClick(emp)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {viewMode === 'compact' && (
                <div className="employee-compact-container">
                  {filteredEmployees.map((emp) => (
                    <div className="employee-compact-item" key={emp._id}>
                      <div className="compact-employee-header">
                        {renderAvatar(emp, 'compact')}
                        <div className={`compact-status-indicator status-${emp.professionalDetails.status}`}>
                          {getStatusIcon(emp.professionalDetails.status)}
                        </div>
                      </div>
                      <div className="compact-employee-info">
                        <h3 className="compact-name">{emp.personalDetails.name}</h3>
                        <div className="compact-role">
                          <span className={`role-badge-sm ${getRoleBadgeColor(emp.professionalDetails.role)}`}>
                            {formatRole(emp.professionalDetails.role)}
                          </span>
                        </div>
                        <div className="compact-branch">
                          <Building size={14} className="compact-icon" />
                          <span>{emp.professionalDetails.branch}</span>
                        </div>
                      </div>
                      <button
                        className="compact-view-btn"
                        onClick={() => handleProfileClick(emp)}
                        style={{ fontSize: '0.7rem', padding: '0.4rem 0' }}
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <EmployeeDetails 
          employee={selectedEmployee} 
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default EmployeeCards;