import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar,
  ComposedChart, Scatter, Treemap, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, ZAxis, Brush,
  ReferenceLine
} from 'recharts';
import { useToast } from './common/ToastContent.jsx';

import {
  Bell, CheckCircle, XCircle, Download, Users, Calendar,
  TrendingUp, CreditCard, DollarSign, Activity, Briefcase,
  ChevronRight, AlertTriangle, FilePlus, Eye, Clock, Archive,
  Award, Code, MessageCircle, Layers, GitPullRequest, ShoppingBag,
  CreditCard as Card, BarChart2, PieChart as PieChartIcon, Target,
  TrendingDown, Filter, RefreshCw, ChevronDown, Calendar as CalendarIcon,
  Database, Zap, Search, BarChart as BarChartIcon, ArrowUpRight,
  ArrowDownRight, LineChart as LineChartIcon, Sliders, MoreHorizontal,
  Info, HelpCircle, Share2, ArrowRight, Settings, Building
} from 'lucide-react';
import AnnouncementModal from './AnnouncementModal';
import AnnouncementsList from './AnnouncementsList';
import '../assets/css/AdminDashboard.css';
import API_BASE_URL from '../config/api.js';
import LeaderboardModal from './EnhancedLeaderboardModal';
import EnhancedLeaderboardModal from './EnhancedLeaderboardModal.jsx';
import '../assets/css/RecentActivity.css';
import EnhancedRecentActivity from './EnhancedRecentActivity';


// Enhanced color palette with more vibrant options
const COLORS = [
  '#6dbfb8', '#be95be', '#71a3c1', '#75ba75', '#b3be62', 
  '#fec76f', '#f5945c', '#f15bb5', '#00b4d8', '#0077b6'
];

// Enhanced gradient colors for charts
const GRADIENT_COLORS = {
  blue: ['#3b82f6', '#1d4ed8'],
  purple: ['#8b5cf6', '#6d28d9'],
  pink: ['#ec4899', '#be185d'],
  teal: ['#14b8a6', '#0f766e'],
  orange: ['#f97316', '#c2410c'],
  indigo: ['#6366f1', '#4338ca'],
  green: ['#10b981', '#047857'],
  yellow: ['#f59e0b', '#b45309']
};

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

// Mock data for CRM features
const MOCK_SALES_METRICS = {
  today: {
    total: 24580,
    count: 32,
    average: 768,
    target: 30000,
    achieved: 81.9,
    growth: 8.3
  },
  month: {
    total: 528450,
    count: 687,
    average: 769,
    target: 650000,
    achieved: 81.3,
    growth: 12.5
  },
  year: {
    total: 5842900,
    count: 7598,
    average: 769,
    target: 7500000,
    achieved: 77.9,
    growth: 16.8
  }
};

// Monthly Revenue by Team
const REVENUE_BY_TEAM = [
  { month: 'Jan', 'UI/UX Team': 45000, 'Development': 35000, 'QA Team': 30000, 'Web Team': 40000, total: 150000 },
  { month: 'Feb', 'UI/UX Team': 25000, 'Development': 20000, 'QA Team': 18000, 'Web Team': 22000, total: 85000 },
  { month: 'Mar', 'UI/UX Team': 35000, 'Development': 15000, 'QA Team': 30000, 'Web Team': 20000, total: 100000 },
  { month: 'Apr', 'UI/UX Team': 25000, 'Development': 20000, 'QA Team': 10000, 'Web Team': 15000, total: 70000 },
  { month: 'May', 'UI/UX Team': 20000, 'Development': 20000, 'QA Team': 15000, 'Web Team': 25000, total: 80000 },
  { month: 'Jun', 'UI/UX Team': 35000, 'Development': 25000, 'QA Team': 40000, 'Web Team': 30000, total: 130000 },
  { month: 'Jul', 'UI/UX Team': 30000, 'Development': 30000, 'QA Team': 25000, 'Web Team': 20000, total: 105000 },
  { month: 'Aug', 'UI/UX Team': 25000, 'Development': 25000, 'QA Team': 15000, 'Web Team': 15000, total: 80000 },
  { month: 'Sep', 'UI/UX Team': 20000, 'Development': 15000, 'QA Team': 20000, 'Web Team': 15000, total: 70000 },
  { month: 'Oct', 'UI/UX Team': 60000, 'Development': 20000, 'QA Team': 35000, 'Web Team': 25000, total: 140000 },
  { month: 'Nov', 'UI/UX Team': 35000, 'Development': 30000, 'QA Team': 20000, 'Web Team': 25000, total: 110000 },
  { month: 'Dec', 'UI/UX Team': 30000, 'Development': 25000, 'QA Team': 25000, 'Web Team': 20000, total: 100000 }
];

// Project Status Data
const PROJECT_STATUS = {
  totalProjects: 48,
  ongoing: 32,
  completed: 16,
  totalRevenue: 1250000,
  monthlyRevenue: 120000,
  weeklyRevenue: 28000
};

// Top Performers Data - Updated to match attachment-2
const TOP_PERFORMERS = [
  { name: 'Luke Short', username: '@Short', performance: 80, branch: 'Lahore', avatar: 'LS' },
  { name: 'John Hard', username: '@rdace', performance: 70, branch: 'Karachi', avatar: 'JH' },
  { name: 'Paul Rees', username: '@Rees', performance: 77, branch: 'Islamabad', avatar: 'PR' },
  { name: 'Rachel Parr', username: '@Parr', performance: 85, branch: 'Lahore', avatar: 'RP' },
  { name: 'Eric Reid', username: '@Eric', performance: 95, branch: 'Karachi', avatar: 'ER' },
  { name: 'Jan Ince', username: '@Ince', performance: 97, branch: 'Islamabad', avatar: 'JI' }
];

// Mock data for sales distribution by product
const MOCK_SALES_DISTRIBUTION = [
  { name: 'Product A', value: 35 },
  { name: 'Product B', value: 25 },
  { name: 'Product C', value: 20 },
  { name: 'Product D', value: 15 },
  { name: 'Other', value: 5 }
];

// Mock detailed data for top performers with additional metrics
const MOCK_TOP_PERFORMERS = {
  employees: [
    { id: 1, name: "Aisha Khan", avatar: "AK", sales: 89500, growth: 12.4, branch: "Lahore", conversion: 68, avgDeal: 5200, targets: 95 },
    { id: 2, name: "Zain Ahmed", avatar: "ZA", sales: 78200, growth: 8.7, branch: "Karachi", conversion: 62, avgDeal: 4800, targets: 89 },
    { id: 3, name: "Sara Malik", avatar: "SM", sales: 67500, growth: 15.3, branch: "Islamabad", conversion: 72, avgDeal: 4400, targets: 92 },
    { id: 4, name: "Tariq Hassan", avatar: "TH", sales: 62300, growth: 4.2, branch: "Lahore", conversion: 58, avgDeal: 4100, targets: 82 },
    { id: 5, name: "Fatima Ali", avatar: "FA", sales: 58900, growth: 9.5, branch: "Karachi", conversion: 65, avgDeal: 3950, targets: 86 }
  ],
  branches: [
    { id: 1, name: "Lahore", sales: 210400, growth: 14.2, employees: 24, conversion: 65, retention: 87, satisfaction: 92 },
    { id: 2, name: "Karachi", sales: 185600, growth: 10.8, employees: 22, conversion: 61, retention: 82, satisfaction: 88 },
    { id: 3, name: "Islamabad", sales: 156300, growth: 12.5, employees: 18, conversion: 63, retention: 85, satisfaction: 90 },
    { id: 4, name: "Multan", sales: 104800, growth: 8.3, employees: 15, conversion: 58, retention: 79, satisfaction: 85 },
    { id: 5, name: "Peshawar", sales: 89700, growth: 6.9, employees: 12, conversion: 56, retention: 76, satisfaction: 83 }
  ]
};

// Monthly Sales Trend (expanded with more detailed breakdown)
const MOCK_SALES_TREND = {
  monthly: [
    { month: 'Jan', year: '2023', employeeSales: 380000, branchSales: 420000, target: 400000, leads: 750, conversions: 128 },
    { month: 'Feb', year: '2023', employeeSales: 400000, branchSales: 450000, target: 410000, leads: 780, conversions: 135 },
    { month: 'Mar', year: '2023', employeeSales: 450000, branchSales: 490000, target: 425000, leads: 820, conversions: 146 },
    { month: 'Apr', year: '2023', employeeSales: 470000, branchSales: 520000, target: 450000, leads: 880, conversions: 158 },
    { month: 'May', year: '2023', employeeSales: 450000, branchSales: 510000, target: 465000, leads: 850, conversions: 152 },
    { month: 'Jun', year: '2023', employeeSales: 480000, branchSales: 550000, target: 475000, leads: 900, conversions: 167 },
    { month: 'Jul', year: '2023', employeeSales: 500000, branchSales: 580000, target: 490000, leads: 950, conversions: 180 },
    { month: 'Aug', year: '2023', employeeSales: 520000, branchSales: 610000, target: 500000, leads: 980, conversions: 192 },
    { month: 'Sep', year: '2023', employeeSales: 490000, branchSales: 560000, target: 510000, leads: 920, conversions: 175 },
    { month: 'Oct', year: '2023', employeeSales: 510000, branchSales: 590000, target: 520000, leads: 940, conversions: 182 },
    { month: 'Nov', year: '2023', employeeSales: 540000, branchSales: 630000, target: 530000, leads: 980, conversions: 196 },
    { month: 'Dec', year: '2023', employeeSales: 580000, branchSales: 670000, target: 550000, leads: 1050, conversions: 215 }
  ],
  yearly: {
    '2021': 3850000,
    '2022': 4320000,
    '2023': 5100000,
    '2024': 5830000
  }
};

// Enhanced Branch Sales data with more metrics for comparison
const MOCK_BRANCH_SALES = [
  {
    branch: "Lahore", salesMonth: 210400, salesCount: 273, avgPerEmployee: 8767, growth: 14.2,
    conversionRate: 68, customerSatisfaction: 92, retention: 87, targetCompletion: 105
  },
  {
    branch: "Karachi", salesMonth: 185600, salesCount: 241, avgPerEmployee: 8436, growth: 10.8,
    conversionRate: 65, customerSatisfaction: 88, retention: 82, targetCompletion: 98
  },
  {
    branch: "Islamabad", salesMonth: 156300, salesCount: 203, avgPerEmployee: 8683, growth: 12.5,
    conversionRate: 67, customerSatisfaction: 90, retention: 85, targetCompletion: 101
  },
  {
    branch: "Multan", salesMonth: 104800, salesCount: 136, avgPerEmployee: 6987, growth: 8.3,
    conversionRate: 62, customerSatisfaction: 85, retention: 79, targetCompletion: 92
  },
  {
    branch: "Peshawar", salesMonth: 89700, salesCount: 116, avgPerEmployee: 7475, growth: 6.9,
    conversionRate: 58, customerSatisfaction: 83, retention: 76, targetCompletion: 90
  },
  {
    branch: "Faisalabad", salesMonth: 72600, salesCount: 94, avgPerEmployee: 6600, growth: 5.2,
    conversionRate: 55, customerSatisfaction: 80, retention: 74, targetCompletion: 87
  },
  {
    branch: "Quetta", salesMonth: 58700, salesCount: 76, avgPerEmployee: 5870, growth: 3.8,
    conversionRate: 52, customerSatisfaction: 78, retention: 70, targetCompletion: 85
  }
];

// Enhanced branch performance comparison data with multiple metrics
const MOCK_BRANCH_COMPARISON = MOCK_BRANCH_SALES.map(branch => ({
  branch: branch.branch,
  sales: branch.salesMonth / 1000, // Convert to thousands for cleaner display
  conversions: branch.conversionRate,
  satisfaction: branch.customerSatisfaction,
  retention: branch.retention,
  growth: branch.growth,
  target: branch.targetCompletion
}));

// Weekly sales data for detailed time analysis
const MOCK_WEEKLY_SALES = [
  { day: 'Mon', sales: 12500, leads: 85, conversions: 23 },
  { day: 'Tue', sales: 14800, leads: 92, conversions: 27 },
  { day: 'Wed', sales: 16200, leads: 105, conversions: 31 },
  { day: 'Thu', sales: 15600, leads: 98, conversions: 28 },
  { day: 'Fri', sales: 17500, leads: 120, conversions: 34 },
  { day: 'Sat', sales: 9800, leads: 72, conversions: 18 },
  { day: 'Sun', sales: 7200, leads: 65, conversions: 14 }
];

const AdminDashboard = () => {
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

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
  const [salesMetricPeriod, setSalesMetricPeriod] = useState('month');
  const [performerTimeRange, setPerformerTimeRange] = useState('month');
  const [salesViewMode, setSalesViewMode] = useState('employee');
  const [performanceMetric, setPerformanceMetric] = useState('sales');
  const [showSalesComparisonType, setShowSalesComparisonType] = useState('branches');
  const [branches, setBranches] = useState([]);
  const { success, error } = useToast();


  const [selectedBranchMetrics, setSelectedBranchMetrics] = useState([
    'sales', 'conversions', 'satisfaction', 'retention', 'growth'
  ]);
  const [summaryCards, setSummaryCards] = useState([
    { title: 'Total Employees', value: 0, change: 0, icon: Users, color: '#4361ee' },
    { title: 'Pending Leaves', value: 0, change: 0, icon: Calendar, color: '#7209b7' },
    { title: 'This Month Revenue', value: 0, change: 0, icon: DollarSign, color: '#f72585' },
    { title: 'Active Projects', value: 0, change: 0, icon: Briefcase, color: '#4cc9f0' }
  ]);

 

  useEffect(() => {
    fetchDashboardData();
    fetchBranches(); 
  }, [timeRange]);
  const fetchBranches = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/branches`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setBranches(data);
    }
  } catch (error) {
    console.error('Error fetching branches:', error);
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
    // Generate avatars
    const generateAvatar = (name) => {
      if (!name) return '';
      return name.split(' ').map(part => part[0]).join('').toUpperCase();
    };

    // Create mock activity data based on real data with enhanced variety
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
        title: 'New Employee',
        description: `${emp.personalDetails?.name} joined as ${emp.professionalDetails?.role}`,
        timestamp: emp.createdAt,
        status: 'success',
        avatar: generateAvatar(emp.personalDetails?.name),
        avatarColor: AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length],
        icon: Users
      })),
      ...(projects || []).slice(0, 2).map((project, index) => ({
        id: `project-${project.id || Math.random()}`,
        type: 'project',
        title: 'Project Update',
        description: `${project.name || 'Project'} - ${project.status || 'In Progress'}`,
        timestamp: project.updatedAt || new Date().toISOString(),
        status: project.status === 'completed' ? 'success' : 'pending',
        avatar: project.name ? project.name[0].toUpperCase() : 'P',
        avatarColor: AVATAR_COLORS[(index + 5) % AVATAR_COLORS.length],
        icon: Briefcase
      }))
    ];

    // Add some extra variety with mock sales activities 
    const mockSalesActivities = [
      {
        id: 'sale-1',
        type: 'sale',
        title: 'Major Sale Closed',
        description: 'Aisha Khan closed a deal worth $12,500 with ABC Corp',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'success',
        avatar: 'AK',
        avatarColor: AVATAR_COLORS[6],
        icon: ShoppingBag
      },
      {
        id: 'sale-2',
        type: 'sale',
        title: 'Sales Target Achieved',
        description: 'Lahore branch has achieved 105% of monthly target',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        status: 'success',
        avatar: 'LB',
        avatarColor: AVATAR_COLORS[2],
        icon: Target
      }
    ];

    // Add some extra variety with mock activities
    const mockActivities = [
      {
        id: 'code-1',
        type: 'code',
        title: 'Code Review Completed',
        description: 'Frontend dashboard components reviewed and approved',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'success',
        avatar: 'CR',
        avatarColor: AVATAR_COLORS[0],
        icon: Code
      },
      {
        id: 'message-1',
        type: 'message',
        title: 'New Comment',
        description: 'Sarah commented on task HR-432 - Employee onboarding',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'pending',
        avatar: 'SC',
        avatarColor: AVATAR_COLORS[1],
        icon: MessageCircle
      },
      {
        id: 'pull-1',
        type: 'pull',
        title: 'Pull Request Merged',
        description: 'Feature: Improved leave request workflow',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        status: 'success',
        avatar: 'PR',
        avatarColor: AVATAR_COLORS[2],
        icon: GitPullRequest
      },
      {
        id: 'award-1',
        type: 'award',
        title: 'Achievement Unlocked',
        description: 'Team completed quarterly targets ahead of schedule',
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        status: 'success',
        avatar: 'AW',
        avatarColor: AVATAR_COLORS[3],
        icon: Award
      }
    ];

    // Combine real and mock activities
    const allActivities = [...activities, ...mockSalesActivities, ...mockActivities];

    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setRecentActivity(allActivities.slice(0, 6)); // Show more activities
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
      { title: 'Total Employees', value: employees.length, change: 2.5, icon: Users, color: '#4361ee' },
      { title: 'Pending Leaves', value: pendingLeaves, change: -1.2, icon: Calendar, color: '#7209b7' },
      { title: 'This Month Revenue', value: revenue, isCurrency: true, change: 4.7, icon: DollarSign, color: '#f72585' },
      { title: 'Active Projects', value: activeProjects, change: 0.8, icon: Briefcase, color: '#4cc9f0' }
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
      ),
      '\nSales Metrics:',
      `Total Sales (This Month): $${MOCK_SALES_METRICS.month.total.toLocaleString()}`,
      `Sales Count: ${MOCK_SALES_METRICS.month.count}`,
      `Average Sale Value: $${MOCK_SALES_METRICS.month.average.toLocaleString()}`,
      `Target Achievement: ${MOCK_SALES_METRICS.month.achieved}%`,
      '\nTop Performing Branches:',
      ...MOCK_BRANCH_SALES.slice(0, 3).map(branch =>
        `${branch.branch}: $${branch.salesMonth.toLocaleString()} (${branch.growth > 0 ? '+' : ''}${branch.growth}% growth)`
      ),
      '\nTop Performing Employees:',
      ...MOCK_TOP_PERFORMERS.employees.slice(0, 3).map(emp =>
        `${emp.name}: $${emp.sales.toLocaleString()} (${emp.growth > 0 ? '+' : ''}${emp.growth}% growth)`
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

    success('Announcement created successfully!');
    setIsAnnouncementModalOpen(false);
    
    // Trigger refresh by updating selectedBranch or use a refresh counter
    setSelectedBranch(prev => prev === announcementData.branchId ? null : announcementData.branchId);
    setTimeout(() => setSelectedBranch(announcementData.branchId), 100);
    
  } catch (err) {
    console.error('Error details:', err);
    error(err.message || 'Failed to create announcement. Please try again.');
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

  // Enhanced tooltip for all charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="tooltip-item" style={{ color: entry.color }}>
              <span className="tooltip-key">{entry.name}: </span>
              <span className="tooltip-value">
                {entry.name.toLowerCase().includes('sales') || entry.dataKey?.includes('Team') ?
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

  // Toggle metrics visibility in the branch radar chart
  const toggleBranchMetric = (metric) => {
    if (selectedBranchMetrics.includes(metric)) {
      if (selectedBranchMetrics.length > 1) { // Ensure at least one metric is selected
        setSelectedBranchMetrics(selectedBranchMetrics.filter(m => m !== metric));
      }
    } else {
      setSelectedBranchMetrics([...selectedBranchMetrics, metric]);
    }
  };

  // Filter branch comparison data based on selected metrics
  const getFilteredBranchData = useCallback(() => {
    return MOCK_BRANCH_COMPARISON.map(branch => {
      const filtered = {};
      selectedBranchMetrics.forEach(metric => {
        filtered[metric] = branch[metric];
      });
      return {
        branch: branch.branch,
        ...filtered
      };
    });
  }, [selectedBranchMetrics]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="zoom-container">
      <div className="admin-dashboard">
       

        <div className="dashboard-header">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
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
              <div className="card-icon" style={{ backgroundColor: `${card.color}15` }}>
                <card.icon size={24} color={card.color} />
              </div>
              <div className="card-content">
                <h3>{card.title}</h3>
                <div className="card-value">{formatValue(card.value, card.isCurrency)}</div>
                <div className={`card-change ${card.change >= 0 ? 'positive' : 'negative'}`}>
                  {card.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(card.change)}% from last {timeRange}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-dashboard-grid">
          {/* Employee Distribution Chart */}
          <div className="chart-card employee-distribution">
            <div className="admin-card-header">
              <h2>Employee Distribution</h2>
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
          <div className="chart-card leave-trends">
            <div className="admin-card-header">
              <h2>Leave Trends</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={leaveStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
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
                    stroke="#10b981"
                    fill="url(#colorApproved)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#colorPending)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="rejected"
                    stackId="1"
                    stroke="#ef4444"
                    fill="url(#colorRejected)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card-footer leave-legend-footer">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                <span>Approved</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Pending</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                <span>Rejected</span>
              </div>
            </div>
          </div>

          {/* Team Performance Chart */}
          <div className="chart-card team-performance">
            <div className="admin-card-header">
              <h2>Team Performance</h2>
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
          <div className="chart-card key-metrics">
            <div className="admin-card-header">
              <h2>Key Performance Metrics</h2>
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
                Overall performance:
                <span className="highlight">{Math.round(kpiData.reduce((sum, item) => sum + item.value, 0) / kpiData.length)}%</span>
              </div>
            </div>
          </div>

          {/* Recent Activity List */}
          <EnhancedRecentActivity />

{/* Announcements */}
<div className="chart-card announcements">
  <div className="admin-card-header">
    <h2>Branch Announcements</h2>
    <div className="announcement-controls">
      <button
        className="create-btn"
        onClick={() => setIsAnnouncementModalOpen(true)}
      >
        <FilePlus size={16} />
        Create
      </button>
    </div>
  </div>
  <div className="card-body announcements-container">
    {/* Use the EnhancedAnnouncementsList component with proper props */}
    <AnnouncementsList 
      showAllForAdmin={true}
      refreshTrigger={selectedBranch} // This will refresh when selectedBranch changes
    />
  </div>

</div>
        </div>

        {/* Revenue and Projects Row */}
        <div className="revenue-projects-row">
          {/* Team Revenue Chart */}
          <div className="chart-card revenue-chart">
            <div className="admin-card-header">
              <h2>Team Revenue Performance</h2>
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
                  data={REVENUE_BY_TEAM}
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
                  <Bar dataKey="UI/UX Team" stackId="a" fill="#be95be" />
                  <Bar dataKey="Development" stackId="a" fill="#71a3c1" />
                  <Bar dataKey="QA Team" stackId="a" fill="#75ba75" />
                  <Bar dataKey="Web Team" stackId="a" fill="#b3be62" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card-footer">
              <div className="trend-summary">
                <span className="highlight-text">+15.4%</span> revenue growth compared to last year
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
                <h2>Projects Overview</h2>
              </div>
              <div className="card-body">
                <div className="project-metrics">
                  <div className="metric-item">
                    <div className="metric-icon">
                      <Briefcase size={18} />
                    </div>
                    <div className="metric-details">
                      <div className="metric-value">{PROJECT_STATUS.totalProjects}</div>
                      <div className="metric-label">Total Projects</div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-icon active-icon">
                      <Activity size={18} />
                    </div>
                    <div className="metric-details">
                      <div className="metric-value">{PROJECT_STATUS.ongoing}</div>
                      <div className="metric-label">Ongoing</div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-icon completed-icon">
                      <CheckCircle size={18} />
                    </div>
                    <div className="metric-details">
                      <div className="metric-value">{PROJECT_STATUS.completed}</div>
                      <div className="metric-label">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="chart-card revenue-card">
              <div className="admin-card-header">
                <h2>Revenue Generation</h2>
              </div>
              <div className="card-body">
                <div className="revenue-metrics">
                  <div className="revenue-metric">
                    <div className="revenue-value">{formatValue(PROJECT_STATUS.totalRevenue, true)}</div>
                    <div className="revenue-label">Total Revenue</div>
                    <div className="revenue-period">Year to Date</div>
                  </div>
                  <div className="revenue-metric">
                    <div className="revenue-value">{formatValue(PROJECT_STATUS.monthlyRevenue, true)}</div>
                    <div className="revenue-label">Monthly Revenue</div>
                    <div className="revenue-trend positive">
                      <TrendingUp size={14} />
                      <span>+4.7%</span>
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
            <h2>Top Performers</h2>
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
            {TOP_PERFORMERS.map((performer, index) => (
              <div className="performer-card" key={index}>
                <div className="performer-avatar" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  {performer.avatar}
                </div>
                <div className="performer-info">
                  <div className="performer-name">{performer.name}</div>
                  <div className="performer-username">{performer.username}</div>
                  <div className="performer-branch">{performer.branch}</div>
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
              View Leaderboard
            </button>
          </div>
        </div>

        {/* All other existing content... */}
        
        {/* Add the LeaderboardModal component */}
        <EnhancedLeaderboardModal 
          isOpen={isLeaderboardModalOpen} 
          onClose={() => setIsLeaderboardModalOpen(false)} 
        />

        <AnnouncementModal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          onSubmit={handleCreateAnnouncement}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;