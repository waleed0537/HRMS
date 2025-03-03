import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Bell, CheckCircle, XCircle, Download, Users, Calendar, 
  TrendingUp, CreditCard, DollarSign, Activity, Briefcase,
  ChevronRight, AlertTriangle, FilePlus, Eye, Clock, Archive
} from 'lucide-react';
import AnnouncementModal from './AnnouncementModal';
import AnnouncementsList from './AnnouncementsList';
import '../assets/css/AdminDashboard.css';
import API_BASE_URL from '../config/api.js';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminDashboard = () => {
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [leaveStats, setLeaveStats] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    departments: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [summaryCards, setSummaryCards] = useState([
    { title: 'Total Employees', value: 0, change: 0, icon: Users, color: '#0088FE' },
    { title: 'Pending Leaves', value: 0, change: 0, icon: Calendar, color: '#00C49F' },
    { title: 'This Month Revenue', value: 0, change: 0, icon: DollarSign, color: '#FFBB28' },
    { title: 'Active Projects', value: 0, change: 0, icon: Briefcase, color: '#FF8042' }
  ]);

  useEffect(() => {
    if (notificationMessage) {
      const timer = setTimeout(() => {
        setNotificationMessage('');
        setNotificationType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMessage]);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Safely fetch data with error handling for each call
      const safelyFetchData = async (url) => {
        try {
          const response = await fetch(`${API_BASE_URL}${url}`, { headers });
          if (!response.ok) {
            console.warn(`Failed to fetch from ${url} with status: ${response.status}`);
            return [];
          }
          return await response.json();
        } catch (error) {
          console.warn(`Error fetching ${url}:`, error);
          return [];
        }
      };

      // Fetch employee and leave data - these are essential
      const employeesData = await safelyFetchData('/api/employees');
      const leavesData = await safelyFetchData('/api/leaves');
      
      // Projects endpoint might not exist in your API, so handle it gracefully
      // We're not using await Promise.all here to avoid one failing request affecting others
      let projectsData = [];
      try {
        const response = await fetch(`${API_BASE_URL}/api/projects`, { headers });
        if (response.ok) {
          projectsData = await response.json();
        }
      } catch (error) {
        console.warn('Projects API endpoint not available:', error);
        // Continue with empty projects data
      }

      // Only proceed if we have the minimum required data
      if (Array.isArray(employeesData) && Array.isArray(leavesData)) {
        processEmployeeStats(employeesData, leavesData);
        processLeaveStats(leavesData);
        processTeamPerformance(employeesData);
        generateRecentActivity(employeesData, leavesData, projectsData);
        generateKpiData();
        updateSummaryCards(employeesData, leavesData, projectsData);
      } else {
        // If essential data isn't available, show error
        setNotificationMessage('Failed to fetch essential dashboard data');
        setNotificationType('error');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error in dashboard data processing:', error);
      setNotificationMessage('Error processing dashboard data');
      setNotificationType('error');
      setIsLoading(false);
    }
  };

  const processEmployeeStats = (employees, leaves) => {
    const active = employees.filter(emp => 
      emp.professionalDetails?.status === 'active'
    ).length;

    const currentDate = new Date();
    const onLeave = leaves.filter(leave => {
      if (leave.status !== 'approved') return false;
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      return currentDate >= startDate && currentDate <= endDate;
    }).length;

    const departments = employees.reduce((acc, emp) => {
      const dept = emp.professionalDetails?.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const departmentData = Object.entries(departments).map(([name, value]) => ({
      name,
      value
    }));

    setEmployeeStats({
      total: employees.length,
      active,
      onLeave,
      departments: departmentData
    });
  };

  const processLeaveStats = (leaves) => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push(month.toLocaleString('default', { month: 'short' }));
    }

    const monthlyStats = leaves.reduce((acc, leave) => {
      const month = new Date(leave.startDate).toLocaleString('default', { month: 'short' });
      const status = leave.status;
      
      if (!acc[month]) {
        acc[month] = { approved: 0, pending: 0, rejected: 0, total: 0, month };
      }
      
      acc[month][status] = (acc[month][status] || 0) + 1;
      acc[month].total += 1;
      
      return acc;
    }, {});

    const leaveData = last6Months.map(month => ({
      month,
      approved: monthlyStats[month]?.approved || 0,
      pending: monthlyStats[month]?.pending || 0,
      rejected: monthlyStats[month]?.rejected || 0,
      total: monthlyStats[month]?.total || 0
    }));

    setLeaveStats(leaveData);
  };

  const processTeamPerformance = (employees) => {
    const branchPerformance = employees.reduce((acc, emp) => {
      const branch = emp.professionalDetails?.branch;
      if (!branch) return acc;
      
      if (!acc[branch]) {
        acc[branch] = {
          name: branch,
          performance: emp.rating || 0,
          count: 1,
          attendance: Math.random() * 30, // Mock data
          productivity: Math.random() * 100, // Mock data
          quality: Math.random() * 5 // Mock data
        };
      } else {
        acc[branch].performance += emp.rating || 0;
        acc[branch].count += 1;
      }
      return acc;
    }, {});

    const performanceData = Object.values(branchPerformance).map(({ name, performance, count, attendance, productivity, quality }) => ({
      name,
      rating: parseFloat((performance / count).toFixed(1)),
      attendance: Math.round(attendance),
      productivity: Math.round(productivity),
      quality: parseFloat(quality.toFixed(1))
    }));

    setTeamPerformance(performanceData);
  };

  const generateRecentActivity = (employees, leaves, projects) => {
    // Create mock activity data based on real data
    const activities = [
      ...leaves.slice(0, 3).map(leave => ({
        id: `leave-${leave._id}`,
        type: 'leave',
        title: `Leave ${leave.status === 'approved' ? 'Approved' : leave.status === 'rejected' ? 'Rejected' : 'Requested'}`,
        description: `${leave.employeeName} - ${leave.leaveType} leave`,
        timestamp: leave.updatedAt || leave.createdAt,
        status: leave.status
      })),
      ...employees.slice(0, 2).map(emp => ({
        id: `emp-${emp._id}`,
        type: 'employee',
        title: 'New Employee',
        description: `${emp.personalDetails?.name} joined as ${emp.professionalDetails?.role}`,
        timestamp: emp.createdAt,
        status: 'success'
      })),
      ...(projects || []).slice(0, 2).map(project => ({
        id: `project-${project.id || Math.random()}`,
        type: 'project',
        title: 'Project Update',
        description: `${project.name || 'Project'} - ${project.status || 'In Progress'}`,
        timestamp: project.updatedAt || new Date().toISOString(),
        status: project.status === 'completed' ? 'success' : 'pending'
      }))
    ];

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setRecentActivity(activities.slice(0, 5));
  };

  const generateKpiData = () => {
    // Generate mock KPI data
    const data = [
      { name: 'Onboarding', value: 85 },
      { name: 'Retention', value: 92 },
      { name: 'Attendance', value: 78 },
      { name: 'Training', value: 65 }
    ];
    
    setKpiData(data);
  };

  const updateSummaryCards = (employees, leaves, projects) => {
    const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
    const revenue = Math.floor(Math.random() * 100000) + 50000; // Mock revenue data
    const activeProjects = (projects || []).filter(p => p.status !== 'completed').length || Math.floor(Math.random() * 20) + 5;

    setSummaryCards([
      { title: 'Total Employees', value: employees.length, change: 2.5, icon: Users, color: '#0088FE' },
      { title: 'Pending Leaves', value: pendingLeaves, change: -1.2, icon: Calendar, color: '#00C49F' },
      { title: 'This Month Revenue', value: revenue, isCurrency: true, change: 4.7, icon: DollarSign, color: '#FFBB28' },
      { title: 'Active Projects', value: activeProjects, change: 0.8, icon: Briefcase, color: '#FF8042' }
    ]);
  };

  const generateReport = () => {
    const reportContent = [
      'Administrative Dashboard Report',
      `Generated on: ${new Date().toLocaleDateString()}\n`,
      'Employee Statistics:',
      `Total Employees: ${employeeStats.total}`,
      `Active Employees: ${employeeStats.active}`,
      `Employees on Leave: ${employeeStats.onLeave}\n`,
      'Department Distribution:',
      ...employeeStats.departments.map(dept => 
        `${dept.name}: ${dept.value} employees`
      ),
      '\nTeam Performance Metrics:',
      ...teamPerformance.map(team =>
        `${team.name}: ${team.rating} average rating`
      ),
      '\nLeave Statistics:',
      ...leaveStats.map(stat =>
        `${stat.month}: ${stat.total} leave requests (${stat.approved} approved, ${stat.pending} pending, ${stat.rejected} rejected)`
      )
    ].join('\n');

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_dashboard_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCreateAnnouncement = async (announcementData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(announcementData)
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create announcement');
      }
  
      setNotificationMessage('Announcement created successfully!');
      setNotificationType('success');
      setIsAnnouncementModalOpen(false);
      setSelectedBranch(announcementData.branchId);
    } catch (error) {
      console.error('Error details:', error);
      setNotificationMessage(error.message || 'Failed to create announcement. Please try again.');
      setNotificationType('error');
    }
  };

  const formatValue = (value, isCurrency = false) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(value);
    }
    
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success':
      case 'approved':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'error':
      case 'rejected':
        return <XCircle size={16} className="status-icon error" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  };

  return (
    <div className="admin-dashboard">
      {notificationMessage && (
        <div className={`notification-banner ${notificationType}`}>
          {notificationType === 'success' ? (
            <CheckCircle size={20} className="notification-icon" />
          ) : (
            <XCircle size={20} className="notification-icon" />
          )}
          {notificationMessage}
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="time-filters">
            <button 
              className={`time-filter-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button 
              className={`time-filter-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button 
              className={`time-filter-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Year
            </button>
          </div>
        </div>
        <div className="dashboard-actions">
          <button 
            className="report-button"
            onClick={generateReport}
          >
            <Download size={20} />
            Download Report
          </button>
          <button 
            className="announcement-button"
            onClick={() => setIsAnnouncementModalOpen(true)}
          >
            <Bell size={20} />
            Create Announcement
          </button>
        </div>
      </div>

      <div className="summary-cards">
        {summaryCards.map((card, index) => (
          <div className="summary-card" key={index}>
            <div className="card-icon" style={{ backgroundColor: `${card.color}20` }}>
              <card.icon size={24} color={card.color} />
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <div className="card-value">{formatValue(card.value, card.isCurrency)}</div>
              <div className={`card-change ${card.change >= 0 ? 'positive' : 'negative'}`}>
                {card.change >= 0 ? <TrendingUp size={16} /> : <TrendingUp size={16} className="down" />}
                {Math.abs(card.change)}% from last {timeRange}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <div className="chart-card employee-distribution">
          <div className="admin-card-header">
            <h2>Employee Distribution</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={employeeStats.departments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {employeeStats.departments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} employees`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <div className="stat-item">
              <span className="stat-label">Active</span>
              <span className="stat-value">{employeeStats.active}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">On Leave</span>
              <span className="stat-value">{employeeStats.onLeave}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total</span>
              <span className="stat-value">{employeeStats.total}</span>
            </div>
          </div>
        </div>

        <div className="chart-card leave-trends">
          <div className="admin-card-header">
            <h2>Leave Trends</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={leaveStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="approved" stackId="1" stroke="#4caf50" fill="#4caf50" />
                <Area type="monotone" dataKey="pending" stackId="1" stroke="#ff9800" fill="#ff9800" />
                <Area type="monotone" dataKey="rejected" stackId="1" stroke="#f44336" fill="#f44336" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#4caf50' }}></span>
              <span>Approved</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#ff9800' }}></span>
              <span>Pending</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#f44336' }}></span>
              <span>Rejected</span>
            </div>
          </div>
        </div>

        <div className="chart-card team-performance">
          <div className="admin-card-header">
            <h2>Team Performance</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rating" name="Rating" fill="#8884d8" />
                <Bar dataKey="productivity" name="Productivity" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <button className="view-details-btn">
              View detailed report <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="chart-card key-metrics">
          <div className="admin-card-header">
            <h2>Key Performance Metrics</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="10%" 
                outerRadius="80%" 
                barSize={10} 
                data={kpiData}>
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                  cornerRadius={10}
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <div className="progress-summary">
              Overall performance score: 
              <span className="highlight">{Math.round(kpiData.reduce((sum, item) => sum + item.value, 0) / kpiData.length)}%</span>
            </div>
          </div>
        </div>

        <div className="chart-card recent-activity">
          <div className="admin-card-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="card-body activity-list">
            {recentActivity.map((activity, index) => (
              <div className="activity-item" key={index}>
                <div className="activity-icon">
                  {activity.type === 'leave' ? <Calendar size={16} /> : 
                   activity.type === 'employee' ? <Users size={16} /> : 
                   <Briefcase size={16} />}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <h4>{activity.title}</h4>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p>{activity.description}</p>
                </div>
                <div className="activity-status">
                  {getStatusIcon(activity.status)}
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <button className="view-all-btn">
              View all activity <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="chart-card announcements">
          <div className="admin-card-header">
            <h2>Branch Announcements</h2>
            <button 
              className="create-btn"
              onClick={() => setIsAnnouncementModalOpen(true)}
            >
              <FilePlus size={16} />
              Create
            </button>
          </div>
          {selectedBranch && <AnnouncementsList branchId={selectedBranch} className="announcements-wrapper" />}
          {!selectedBranch && (
            <div className="empty-state">
              <AlertTriangle size={32} />
              <p>No branch selected for announcements</p>
              <button 
                className="create-announcement-btn"
                onClick={() => setIsAnnouncementModalOpen(true)}
              >
                Create your first announcement
              </button>
            </div>
          )}
        </div>
      </div>

      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />
    </div>
  );
};

export default AdminDashboard;