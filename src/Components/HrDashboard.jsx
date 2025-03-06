import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Bell, CheckCircle, XCircle, Download, Users, Calendar, 
  TrendingUp, CreditCard, DollarSign, Activity, Briefcase,
  ChevronRight, AlertTriangle, FilePlus, Eye, Clock, Archive,
  Award, Code, MessageCircle, Layers, GitPullRequest, Building
} from 'lucide-react';
import AnnouncementModal from './AnnouncementModal';
import AnnouncementsList from './AnnouncementsList';
import API_BASE_URL from '../config/api.js';
import '../assets/css/HrDashboard.css';
// Enhanced color palette
const COLORS = [
  '#6dbfb8', '#be95be', '#71a3c1', '#75ba75', '#b3be62', 
  '#fec76f', '#f5945c', '#f15bb5', '#00b4d8', '#0077b6'
];

// Avatar backgrounds for activities
const AVATAR_COLORS = [
  'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
  'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)',
  'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)',
  'linear-gradient(to top, #c471f5 0%, #fa71cd 100%)'
];

const HrDashboard = () => {
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
  const [userBranch, setUserBranch] = useState('');
  const [branchId, setBranchId] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryCards, setSummaryCards] = useState([
    { title: 'Branch Employees', value: 0, change: 0, icon: Users, color: '#4361ee' },
    { title: 'Pending Leaves', value: 0, change: 0, icon: Calendar, color: '#7209b7' },
    { title: 'Applicants', value: 0, change: 0, icon: Archive, color: '#f72585' },
    { title: 'Attendance Rate', value: 0, change: 0, icon: Clock, color: '#4cc9f0' }
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
    // First fetch user profile to get the branch
    fetchUserBranch();
  }, []);

  // After getting the branch, fetch dashboard data
  useEffect(() => {
    if (userBranch && branchId) {
      fetchDashboardData();
    }
  }, [userBranch, branchId, timeRange]);

  const fetchUserBranch = async () => {
    try {
      const token = localStorage.getItem('token');
      // First get the user profile to determine their branch
      const profileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profileData = await profileResponse.json();
      const branchName = profileData.professionalDetails?.branch;
      
      if (!branchName) {
        throw new Error('User branch not found');
      }
      
      setUserBranch(branchName);
      
      // Now fetch the branch ID
      const branchesResponse = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!branchesResponse.ok) {
        throw new Error('Failed to fetch branches');
      }
      
      const branchesData = await branchesResponse.json();
      const branch = branchesData.find(b => b.name === branchName);
      
      if (!branch) {
        throw new Error('Branch not found');
      }
      
      setBranchId(branch._id);
      
    } catch (err) {
      console.error('Error fetching user branch:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

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

      // Fetch only employees from user's branch
      const allEmployees = await safelyFetchData('/api/employees');
      const employeesData = allEmployees.filter(
        emp => emp.professionalDetails?.branch === userBranch
      );
      
      // Fetch leave requests for this branch
      const allLeaves = await safelyFetchData('/api/leaves');
      const branchEmployeeEmails = employeesData.map(emp => emp.personalDetails?.email);
      const leavesData = allLeaves.filter(
        leave => branchEmployeeEmails.includes(leave.employeeEmail)
      );
      
      // Fetch applicants for this branch
      const applicantsData = await safelyFetchData('/api/hr/applicants');
      
      // Only proceed if we have the minimum required data
      if (Array.isArray(employeesData)) {
        processEmployeeStats(employeesData, leavesData);
        processLeaveStats(leavesData);
        processTeamPerformance(employeesData);
        generateRecentActivity(employeesData, leavesData, applicantsData);
        generateKpiData();
        updateSummaryCards(employeesData, leavesData, applicantsData);
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
    // For HR dashboard, we'll focus on performance by department within the branch
    const deptPerformance = employees.reduce((acc, emp) => {
      const dept = emp.professionalDetails?.department || 'Unassigned';
      
      if (!acc[dept]) {
        acc[dept] = {
          name: dept,
          performance: emp.rating || 0,
          count: 1,
          attendance: Math.random() * 30, // Mock data
          productivity: Math.random() * 100, // Mock data
          quality: Math.random() * 5 // Mock data
        };
      } else {
        acc[dept].performance += emp.rating || 0;
        acc[dept].count += 1;
      }
      return acc;
    }, {});

    const performanceData = Object.values(deptPerformance).map(({ name, performance, count, attendance, productivity, quality }) => ({
      name,
      rating: parseFloat((performance / count).toFixed(1)) || 3.5, // Default to 3.5 if no ratings
      attendance: Math.round(attendance),
      productivity: Math.round(productivity),
      quality: parseFloat(quality.toFixed(1))
    }));

    setTeamPerformance(performanceData);
  };

  const generateRecentActivity = (employees, leaves, applicants) => {
    // Generate avatars
    const generateAvatar = (name) => {
      if (!name) return '';
      return name.split(' ').map(part => part[0]).join('').toUpperCase();
    };
    
    // Create activity items from real branch data
    const activities = [
      ...leaves.slice(0, 3).map((leave, index) => ({
        id: `leave-${leave._id}`,
        type: 'leave',
        title: `Leave ${leave.status === 'approved' ? 'Approved' : leave.status === 'rejected' ? 'Rejected' : 'Requested'}`,
        description: `${leave.employeeName} - ${leave.leaveType} leave`,
        timestamp: leave.updatedAt || leave.createdAt,
        status: leave.status,
        avatar: generateAvatar(leave.employeeName),
        avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        icon: Calendar
      })),
      ...employees.slice(0, 2).map((emp, index) => ({
        id: `emp-${emp._id}`,
        type: 'employee',
        title: 'Employee Update',
        description: `${emp.personalDetails?.name} profile was updated`,
        timestamp: emp.updatedAt || emp.createdAt,
        status: 'success',
        avatar: generateAvatar(emp.personalDetails?.name),
        avatarColor: AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length],
        icon: Users
      }))
    ];
    
    // Add applicant activities if available
    if (applicants && applicants.length > 0) {
      const applicantActivities = applicants.slice(0, 2).map((applicant, index) => ({
        id: `applicant-${applicant._id || Math.random()}`,
        type: 'applicant',
        title: 'New Applicant',
        description: `${applicant.personalDetails?.name || 'Applicant'} for ${applicant.jobDetails?.position || 'position'}`,
        timestamp: applicant.createdAt || new Date().toISOString(),
        status: 'pending',
        avatar: applicant.personalDetails?.name ? applicant.personalDetails.name[0].toUpperCase() : 'A',
        avatarColor: AVATAR_COLORS[(index + 5) % AVATAR_COLORS.length],
        icon: Archive
      }));
      
      activities.push(...applicantActivities);
    }
    
    // Add some extra HR-related activities
    const mockActivities = [
      {
        id: 'attendance-1',
        type: 'attendance',
        title: 'Attendance Alert',
        description: 'Multiple employees late today',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'pending',
        avatar: 'AT',
        avatarColor: AVATAR_COLORS[0],
        icon: Clock
      },
      {
        id: 'training-1',
        type: 'training',
        title: 'Training Completed',
        description: 'Team completed compliance training',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'success',
        avatar: 'TR',
        avatarColor: AVATAR_COLORS[1],
        icon: Award
      }
    ];
    
    // Combine real and mock activities
    const allActivities = [...activities, ...mockActivities];

    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setRecentActivity(allActivities.slice(0, 6));
  };

  const generateKpiData = () => {
    // Generate HR-specific KPI data
    const data = [
      { name: 'Recruitment', value: 75 },
      { name: 'Onboarding', value: 85 },
      { name: 'Retention', value: 92 },
      { name: 'Training', value: 65 }
    ];
    
    setKpiData(data);
  };

  const updateSummaryCards = (employees, leaves, applicants) => {
    const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
    const applicantCount = applicants ? applicants.length : Math.floor(Math.random() * 10) + 2; // Mock if no real data
    const attendanceRate = 95; // Mock attendance rate (percentage)

    setSummaryCards([
      { title: 'Branch Employees', value: employees.length, change: 2.5, icon: Users, color: '#4361ee' },
      { title: 'Pending Leaves', value: pendingLeaves, change: -1.2, icon: Calendar, color: '#7209b7' },
      { title: 'Applicants', value: applicantCount, change: 4.7, icon: Archive, color: '#f72585' },
      { title: 'Attendance Rate', value: attendanceRate, isPercentage: true, change: 0.8, icon: Clock, color: '#4cc9f0' }
    ]);
  };

  const generateReport = () => {
    const reportContent = [
      `HR Dashboard Report - ${userBranch} Branch`,
      `Generated on: ${new Date().toLocaleDateString()}\n`,
      'Employee Statistics:',
      `Total Branch Employees: ${employeeStats.total}`,
      `Active Employees: ${employeeStats.active}`,
      `Employees on Leave: ${employeeStats.onLeave}\n`,
      'Department Distribution:',
      ...employeeStats.departments.map(dept => 
        `${dept.name}: ${dept.value} employees`
      ),
      '\nDepartment Performance Metrics:',
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
    a.download = `hr_dashboard_report_${userBranch}_${new Date().toISOString().split('T')[0]}.txt`;
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
    } catch (error) {
      console.error('Error details:', error);
      setNotificationMessage(error.message || 'Failed to create announcement. Please try again.');
      setNotificationType('error');
    }
  };

  const formatValue = (value, isCurrency = false, isPercentage = false) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(value);
    }
    
    if (isPercentage) {
      return `${value}%`;
    }
    
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success':
      case 'approved':
        return <CheckCircle size={18} className="status-icon success" />;
      case 'error':
      case 'rejected':
        return <XCircle size={18} className="status-icon error" />;
      default:
        return <Clock size={18} className="status-icon pending" />;
    }
  };

  // Format relative time for activities
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="zoom-container">
    <div className="hr-dashboard">
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

      <div className="hr-dashboard-header">
        <div className="header-content">
          <h1>HR Dashboard - {userBranch} Branch</h1>
          <div className="time-filters">
         
          </div>
        </div>
        <div className="hr-dashboard-actions">
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

      <div className="hr-summary-cards">
        {summaryCards.map((card, index) => (
          <div className="hr-summary-card" key={index}>
            <div className="card-icon" style={{ backgroundColor: `${card.color}15` }}>
              <card.icon size={24} color={card.color} />
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <div className="card-value">{formatValue(card.value, card.isCurrency, card.isPercentage)}</div>
              <div className={`card-change ${card.change >= 0 ? 'positive' : 'negative'}`}>
                {card.change >= 0 ? <TrendingUp size={16} /> : <TrendingUp size={16} className="down" />}
                {Math.abs(card.change)}% from last {timeRange}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hr-dashboard-grid">
        {/* Employee Distribution Chart */}
        <div className="hr-chart-card employee-distribution">
          <div className="hr-card-header">
            <h2>Department Distribution</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={employeeStats.departments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {employeeStats.departments.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="transparent"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} employees`, 'Count']} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer employee-stats-footer">
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

        {/* Leave Trends Chart */}
        <div className="hr-chart-card leave-trends">
          <div className="hr-card-header">
            <h2>Leave Trends</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={leaveStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6dbfb8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6dbfb8" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#be95be" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#be95be" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3e4d68" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3e4d68" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '12px'
                  }} 
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8} 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="approved" 
                  stackId="1" 
                  stroke="#6dbfb8" 
                  fill="url(#colorApproved)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="pending" 
                  stackId="1" 
                  stroke="#be95be" 
                  fill="url(#colorPending)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="rejected" 
                  stackId="1" 
                  stroke="#3e4d68" 
                  fill="url(#colorRejected)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer leave-legend-footer">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#6dbfb8' }}></span>
              <span>Approved</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#be95be' }}></span>
              <span>Pending</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#3e4d68' }}></span>
              <span>Rejected</span>
            </div>
          </div>
        </div>

        {/* Department Performance Chart */}
        <div className="hr-chart-card department-performance">
          <div className="hr-card-header">
            <h2>Department Performance</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={teamPerformance}
                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar 
                  dataKey="rating" 
                  name="Rating" 
                  fill="#be95be" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="productivity" 
                  name="Productivity" 
                  fill="#6dbfb8" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={300}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <button className="view-details-btn">
              View detailed report <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* HR KPI Metrics Chart */}
        <div className="hr-chart-card hr-metrics">
          <div className="hr-card-header">
            <h2>HR Performance Metrics</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="90%" 
                barSize={20} 
                data={kpiData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                  cornerRadius={12}
                  label={{
                    position: 'insideStart',
                    fill: '#fff',
                    fontWeight: 600,
                    fontSize: 12
                  }}
                >
                  {kpiData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </RadialBar>
                <Legend
                  iconType="circle"
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Progress']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '12px'
                  }}  
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <div className="progress-summary">
              Overall HR performance: 
              <span className="highlight">{Math.round(kpiData.reduce((sum, item) => sum + item.value, 0) / kpiData.length)}%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="hr-chart-card recent-activity">
          <div className="hr-card-header">
            <h2>Recent Branch Activity</h2>
          </div>
          <div className="card-body activity-list">
            {recentActivity.map((activity, index) => (
              <div className="activity-item" key={index}>
                <div className="activity-avatar" style={{ background: activity.avatarColor }}>
                  {activity.avatar}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <h4>{activity.title}</h4>
                    <span className="activity-time">
                      {getRelativeTime(activity.timestamp)}
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

        {/* Announcements */}
        <div className="hr-chart-card announcements">
          <div className="hr-card-header">
            <h2>Branch Announcements</h2>
            <button 
              className="create-btn"
              onClick={() => setIsAnnouncementModalOpen(true)}
            >
              <FilePlus size={16} />
              Create
            </button>
          </div>
          {branchId ? (
            <AnnouncementsList branchId={branchId} className="announcements-wrapper" />
          ) : (
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
    </div>
  );
};

export default HrDashboard;