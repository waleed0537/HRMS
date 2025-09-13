import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import { useToast } from './common/ToastContent.jsx';

import {
  Bell, CheckCircle, XCircle, Download, Users, Calendar,
  TrendingUp, CreditCard, DollarSign, Activity, Briefcase,
  ChevronRight, AlertTriangle, FilePlus, Eye, Clock, Archive,
  Award, Code, MessageCircle, Layers, GitPullRequest, Building,
  BarChart2, TrendingDown, ArrowRight, ShoppingBag, Target
} from 'lucide-react';
import AnnouncementModal from './AnnouncementModal.jsx';
import AnnouncementsList from './AnnouncementsList.jsx';
import API_BASE_URL from '../config/api.js';
import '../assets/css/HrDashboard.css';
import EnhancedLeaderboardModal from './EnhancedLeaderboardModal.jsx';
import HrRecentActivity from './HrRecentActivity';
import '../assets/css/RecentActivity.css';
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

// Mock branch revenue data
const BRANCH_REVENUE_BY_TEAM = [
  { month: 'Jan', 'Sales': 25000, 'Support': 18000, 'Marketing': 15000, 'Operations': 12000, total: 70000 },
  { month: 'Feb', 'Sales': 22000, 'Support': 15000, 'Marketing': 12000, 'Operations': 11000, total: 60000 },
  { month: 'Mar', 'Sales': 28000, 'Support': 20000, 'Marketing': 16000, 'Operations': 14000, total: 78000 },
  { month: 'Apr', 'Sales': 26000, 'Support': 19000, 'Marketing': 14000, 'Operations': 13000, total: 72000 },
  { month: 'May', 'Sales': 30000, 'Support': 22000, 'Marketing': 17000, 'Operations': 15000, total: 84000 },
  { month: 'Jun', 'Sales': 35000, 'Support': 25000, 'Marketing': 20000, 'Operations': 18000, total: 98000 },
  { month: 'Jul', 'Sales': 32000, 'Support': 23000, 'Marketing': 18000, 'Operations': 16000, total: 89000 },
  { month: 'Aug', 'Sales': 28000, 'Support': 20000, 'Marketing': 16000, 'Operations': 14000, total: 78000 },
  { month: 'Sep', 'Sales': 24000, 'Support': 17000, 'Marketing': 14000, 'Operations': 12000, total: 67000 },
  { month: 'Oct', 'Sales': 27000, 'Support': 19000, 'Marketing': 15000, 'Operations': 13000, total: 74000 },
  { month: 'Nov', 'Sales': 30000, 'Support': 22000, 'Marketing': 17000, 'Operations': 15000, total: 84000 },
  { month: 'Dec', 'Sales': 38000, 'Support': 28000, 'Marketing': 22000, 'Operations': 20000, total: 108000 }
];

// Project Status Data for branch
const BRANCH_PROJECT_STATUS = {
  totalProjects: 16,
  ongoing: 11,
  completed: 5,
  totalRevenue: 450000,
  monthlyRevenue: 48000,
  weeklyRevenue: 12000
};

// Top Performers for branch
const BRANCH_TOP_PERFORMERS = [
  { name: 'Sara Ahmed', username: '@Ahmed', performance: 92, department: 'Sales', avatar: 'SA' },
  { name: 'Ali Hassan', username: '@Hassan', performance: 87, department: 'Support', avatar: 'AH' },
  { name: 'Fatima Khan', username: '@Khan', performance: 84, department: 'Marketing', avatar: 'FK' },
  { name: 'Omar Malik', username: '@Malik', performance: 79, department: 'Operations', avatar: 'OM' },
  { name: 'Zainab Ali', username: '@Ali', performance: 76, department: 'Sales', avatar: 'ZA' },
  { name: 'Tariq Shah', username: '@Shah', performance: 75, department: 'Support', avatar: 'TS' }
];

const HrDashboard = () => {
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [leaveStats, setLeaveStats] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const { success, error: toastError } = useToast();



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
  const [salesViewMode, setSalesViewMode] = useState('monthly');
  const [performerTimeRange, setPerformerTimeRange] = useState('month');
  const [summaryCards, setSummaryCards] = useState([
    { title: 'Branch Employees', value: 0, change: 0, icon: Users, color: '#4361ee' },
    { title: 'Pending Leaves', value: 0, change: 0, icon: Calendar, color: '#7209b7' },
    { title: 'Branch Revenue', value: 0, change: 0, icon: DollarSign, color: '#f72585' },
    { title: 'Attendance Rate', value: 0, isPercentage: true, change: 0, icon: Clock, color: '#4cc9f0' }
  ]);



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
      setIsLoading(true);
      setError(null);

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
      const leavesData = await safelyFetchData('/api/hr/leaves');

      if (!leavesData || leavesData.length === 0) {
        console.log('No leaves found using HR endpoint, trying management endpoint...');
        const managementLeaves = await safelyFetchData('/api/leaves/management');
        if (managementLeaves && managementLeaves.length > 0) {
          processLeaveStats(managementLeaves);
        } else {
          // Still no data - create empty placeholder data for the chart
          createEmptyLeaveStats();
        }
      } else {
        processLeaveStats(leavesData);
      }
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
  const createEmptyLeaveStats = () => {
    const last6Months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push(month.toLocaleString('default', { month: 'short' }));
    }

    const emptyData = last6Months.map(month => ({
      month,
      approved: 0,
      pending: 0,
      rejected: 0,
      total: 0
    }));

    setLeaveStats(emptyData);
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

    // Add some sales/performance related activities
    const salesActivities = [
      {
        id: 'sale-1',
        type: 'sale',
        title: 'Sales Target Achieved',
        description: `${userBranch} Sales team exceeded their monthly target by 8%`,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        status: 'success',
        avatar: 'ST',
        avatarColor: AVATAR_COLORS[2],
        icon: Target
      },
      {
        id: 'sale-2',
        type: 'sale',
        title: 'Major Deal Closed',
        description: 'Sara Ahmed closed a deal worth $25,000',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        status: 'success',
        avatar: 'SA',
        avatarColor: AVATAR_COLORS[0],
        icon: ShoppingBag
      }
    ];

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

    // Combine all activities
    const allActivities = [...activities, ...salesActivities, ...mockActivities];

    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setRecentActivity(allActivities.slice(0, 6));
  };

  const generateKpiData = () => {
    // Generate HR-specific KPI data for the branch
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
    const branchRevenue = BRANCH_PROJECT_STATUS.monthlyRevenue; // Use mock data for revenue

    setSummaryCards([
      { title: 'Branch Employees', value: employees.length, change: 2.5, icon: Users, color: '#4361ee' },
      { title: 'Pending Leaves', value: pendingLeaves, change: -1.2, icon: Calendar, color: '#7209b7' },
      { title: 'Branch Revenue', value: branchRevenue, isCurrency: true, change: 4.7, icon: DollarSign, color: '#f72585' },
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
      ),
      '\nBranch Revenue Statistics:',
      `Monthly Revenue: $${BRANCH_PROJECT_STATUS.monthlyRevenue.toLocaleString()}`,
      `Total Projects: ${BRANCH_PROJECT_STATUS.totalProjects}`,
      `Ongoing Projects: ${BRANCH_PROJECT_STATUS.ongoing}`,
      `Completed Projects: ${BRANCH_PROJECT_STATUS.completed}`
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

  // Fix for HrDashboard.jsx handleCreateAnnouncement function
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

    success('Announcement created successfully!');
    setIsAnnouncementModalOpen(false);
    
    // Trigger refresh by toggling userBranch or using a refresh counter
    const currentBranch = userBranch;
    setUserBranch('');
    setTimeout(() => setUserBranch(currentBranch), 100);
    
  } catch (err) {
    console.error('Error details:', err);
    toastError(err.message || 'Failed to create announcement. Please try again.');
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
    switch (status) {
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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="tooltip-item" style={{ color: entry.color }}>
              <span className="tooltip-key">{entry.name}: </span>
              <span className="tooltip-value">
                {entry.name.toLowerCase().includes('sales') ||
                  entry.name === 'Support' ||
                  entry.name === 'Marketing' ||
                  entry.name === 'Operations' ?
                  `$${entry.value.toLocaleString()}` :
                  entry.unit === '%' ?
                    `${entry.value}%` :
                    entry.value.toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <AlertTriangle size={24} />
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="zoom-container">
      <div className="hr-dashboard">


        <div className="hr-dashboard-header">
          <div className="header-content">
            <h1>HR Dashboard - {userBranch} Branch</h1>
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
                  {card.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} className="down" />}
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
                      <stop offset="5%" stopColor="#6dbfb8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6dbfb8" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#be95be" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#be95be" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3e4d68" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3e4d68" stopOpacity={0.1} />
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
          <HrRecentActivity />

          {/* Announcements */}
          <div className="hr-chart-card announcements">
  <div className="hr-card-header">
    <h2>Branch Announcements</h2>
    <div className="announcement-controls">
      <button
        className="hr-create-btn"
        onClick={() => setIsAnnouncementModalOpen(true)}
      >
        <FilePlus size={16} />
        Create
      </button>
    </div>
  </div>
  <div className="card-body announcements-container">
    {branchId ? (
      <AnnouncementsList 
        branchId={branchId}
        refreshTrigger={userBranch} // This will refresh when branch data changes
      />
    ) : (
      <div className="hr-empty-state">
        <AlertTriangle size={32} />
        <p>Branch not loaded</p>
        <span className="empty-subtitle">
          Please wait while we load your branch information
        </span>
        <button
          className="retry-button"
          onClick={() => fetchUserBranch()}
          style={{ marginTop: '12px' }}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    )}
  </div>

</div>
        </div>

        {/* Revenue and Projects Row */}
        <div className="revenue-projects-row">
          {/* Team Revenue Chart */}
          <div className="chart-card revenue-chart">
            <div className="admin-card-header">
              <h2>Revenue Performance by Department</h2>
              <div className="chart-controls">
                <div className="view-selector">
                  <button
                    className={`view-btn ${salesViewMode === 'monthly' ? 'active' : ''}`}
                    onClick={() => setSalesViewMode('monthly')}
                  >
                    <Calendar size={14} />
                    <span>Monthly</span>
                  </button>
                  <button
                    className={`view-btn ${salesViewMode === 'quarterly' ? 'active' : ''}`}
                    onClick={() => setSalesViewMode('quarterly')}
                  >
                    <BarChart2 size={14} />
                    <span>Quarterly</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={BRANCH_REVENUE_BY_TEAM}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Sales" stackId="a" fill="#be95be" />
                  <Bar dataKey="Support" stackId="a" fill="#71a3c1" />
                  <Bar dataKey="Marketing" stackId="a" fill="#75ba75" />
                  <Bar dataKey="Operations" stackId="a" fill="#b3be62" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card-footer">
              <div className="trend-summary">
                <span className="highlight-text">+12.7%</span> revenue growth compared to last year
              </div>
              <div className="chart-action-buttons">
                <button className="chart-action-btn">
                  <ArrowRight size={14} />
                  <span>Full Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Project Stats Container */}
          <div className="project-stats-container">
            {/* Projects Card */}
            <div className="chart-card project-card">
              <div className="admin-card-header">
                <h2>Branch Projects Overview</h2>
              </div>
              <div className="card-body">
                <div className="project-metrics">
                  <div className="metric-item">
                    <div className="metric-icon">
                      <Briefcase size={18} />
                    </div>
                    <div className="metric-details">
                      <div className="metric-value">{BRANCH_PROJECT_STATUS.totalProjects}</div>
                      <div className="metric-label">Total Projects</div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-icon active-icon">
                      <Activity size={18} />
                    </div>
                    <div className="metric-details">
                      <div className="metric-value">{BRANCH_PROJECT_STATUS.ongoing}</div>
                      <div className="metric-label">Ongoing</div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-icon completed-icon">
                      <CheckCircle size={18} />
                    </div>
                    <div className="metric-details">
                      <div className="metric-value">{BRANCH_PROJECT_STATUS.completed}</div>
                      <div className="metric-label">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="chart-card revenue-card">
              <div className="admin-card-header">
                <h2>Branch Revenue</h2>
              </div>
              <div className="card-body">
                <div className="revenue-metrics">
                  <div className="revenue-metric">
                    <div className="revenue-value">{formatValue(BRANCH_PROJECT_STATUS.totalRevenue, true)}</div>
                    <div className="revenue-label">Total Revenue</div>
                    <div className="revenue-period">Year to Date</div>
                  </div>
                  <div className="revenue-metric">
                    <div className="revenue-value">{formatValue(BRANCH_PROJECT_STATUS.monthlyRevenue, true)}</div>
                    <div className="revenue-label">Monthly Revenue</div>
                    <div className="revenue-trend positive">
                      <TrendingUp size={14} />
                      <span>+4.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers Section */}
        <div className="top-performers-section">
          <div className="top-performers-header">
            <h2>Top Branch Performers</h2>
            <div className="performer-filters">
              <div className="time-filter">
                <button
                  className={`time-filter-btn ${performerTimeRange === 'month' ? 'active' : ''}`}
                  onClick={() => setPerformerTimeRange('month')}
                >
                  Month
                </button>
                <button
                  className={`time-filter-btn ${performerTimeRange === 'quarter' ? 'active' : ''}`}
                  onClick={() => setPerformerTimeRange('quarter')}
                >
                  Quarter
                </button>
                <button
                  className={`time-filter-btn ${performerTimeRange === 'year' ? 'active' : ''}`}
                  onClick={() => setPerformerTimeRange('year')}
                >
                  Year
                </button>
              </div>
            </div>
          </div>

          <div className="performer-cards">
            {BRANCH_TOP_PERFORMERS.map((performer, index) => (
              <div className="performer-card" key={index}>
                <div className="performer-avatar" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  {performer.avatar}
                </div>
                <div className="performer-info">
                  <div className="performer-name">{performer.name}</div>
                  <div className="performer-username">{performer.username}</div>
                  <div className="performer-branch">{performer.department}</div>
                  <div className="performer-progress-container">
                    <div className="performer-progress-bar">
                      <div
                        className="performer-progress-fill"
                        style={{
                          width: `${performer.performance}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                    <div className="performer-progress-value">{performer.performance}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add the View Details button */}
          <div className="view-details-container">
            <button
              className="view-details-button"
              onClick={() => setIsLeaderboardModalOpen(true)}
            >
              View Branch Leaderboard
            </button>
          </div>
        </div>

        <AnnouncementModal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          onSubmit={handleCreateAnnouncement}
          userBranch={branchId ? { id: branchId, name: userBranch } : null}
        />


        <EnhancedLeaderboardModal
          isOpen={isLeaderboardModalOpen}
          onClose={() => setIsLeaderboardModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default HrDashboard;






