import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar, ReferenceLine
} from 'recharts';
import {
  Bell, CheckCircle, XCircle, Calendar, Circle, User,
  Clock, FileText, TrendingUp, AlertTriangle, Activity,
  Briefcase, ChevronRight, Mail, Phone, MapPin, Building,
  Coffee, Clock8, Award, Target, ArrowUp, ArrowDown, Flag,
  Star, Users, GitMerge, Heart, Zap, Check, BarChart2, MessageCircle
} from 'lucide-react';
import '../assets/css/EmployeeDashboard.css';
import API_BASE_URL from '../config/api.js';

const COLORS = ['#6dbfb8', '#be95be', '#71a3c1', '#75ba75', '#b3be62', '#fec76f', '#f5945c', '#f15bb5', '#00b4d8', '#0077b6'];
// Define gradient colors for different performance levels
const PERFORMANCE_GRADIENTS = {
  poor: { from: '#FF4A55', to: '#FF7F7F' },
  fair: { from: '#FF9700', to: '#FFB366' },
  good: { from: '#66FF66', to: '#B3FFB3' },
  excellent: { from: '#66B3FF', to: '#99CCFF' },
};

const EmployeeDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [userBranch, setUserBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyQuotas, setWeeklyQuotas] = useState({
    meetings: { total: 5, completed: 3 },
    tasks: { total: 15, completed: 10 },
    training: { total: 2, completed: 1 }
  });
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Performance metrics - the key data that will drive our gauge
  const [performanceMetrics, setPerformanceMetrics] = useState({
    overall: 78,
    productivity: 82,
    quality: 75,
    attendance: 90,
    communication: 70
  });
  const [milestones, setMilestones] = useState([]);
  const [goals, setGoals] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [hoveredMetric, setHoveredMetric] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);
  {/* Add this helper function to your component */ }
  const getPerformanceLabel = (value) => {
    if (value >= 90) return "EXCELLENT";
    if (value >= 80) return "VERY GOOD";
    if (value >= 70) return "GOOD";
    if (value >= 60) return "FAIR";
    return "NEEDS IMPROVEMENT";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));

      // Fetch profile
      const profileRes = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setProfile(profileData);

      // Fetch branch data
      const branchRes = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!branchRes.ok) throw new Error('Failed to fetch branches');
      const branches = await branchRes.json();

      // Find branch by name
      const branch = branches.find(b => b.name === profileData.professionalDetails.branch);
      if (branch) {
        setUserBranch(branch.name);

        // Fetch branch announcements
        fetchBranchAnnouncements(branch._id);
      }

      // Fetch leave history
      fetchLeaveHistory(userData.email);

      // Generate mock data for other sections
      generateMockData(profileData);

      // Generate mock data for new features
      generatePerformanceData();
      generateMilestonesAndGoals();
      generateTopPerformers();

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Existing functions - just including the essential ones
  const fetchBranchAnnouncements = async (branchId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch announcements');
      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const fetchLeaveHistory = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leaves?employeeEmail=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch leave history');
      const data = await response.json();

      setLeaveHistory(data);
    } catch (err) {
      console.error('Error fetching leave history:', err);
    }
  };

  const generateMockData = (profileData) => {
    // Generate mock attendance data
    const mockAttendance = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const hoursWorked = Math.random() * 3 + 6; // 6-9 hours

      mockAttendance.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hoursWorked: parseFloat(hoursWorked.toFixed(1))
      });
    }

    setAttendanceData(mockAttendance);

    // Generate upcoming holidays
    const mockHolidays = [
      { name: 'New Year\'s Day', date: '2024-01-01' },
      { name: 'Martin Luther King Jr. Day', date: '2024-01-15' },
      { name: 'President\'s Day', date: '2024-02-19' },
      { name: 'Memorial Day', date: '2024-05-27' },
      { name: 'Independence Day', date: '2024-07-04' }
    ];

    setUpcomingHolidays(mockHolidays);

    // Generate team members
    const mockTeamMembers = [
      { id: 1, name: 'John Smith', role: 'Team Lead', avatar: 'JS' },
      { id: 2, name: 'Sarah Johnson', role: 'HR Manager', avatar: 'SJ' },
      { id: 3, name: 'Michael Brown', role: 'Developer', avatar: 'MB' },
      { id: 4, name: 'Emily Davis', role: 'Designer', avatar: 'ED' }
    ];

    setTeamMembers(mockTeamMembers);

    // Generate recent activities
    const mockActivities = [
      { id: 1, type: 'leave', title: 'Leave Approved', description: 'Your annual leave request has been approved', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'success' },
      { id: 2, type: 'profile', title: 'Profile Updated', description: 'Your profile information was updated', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'success' },
      { id: 3, type: 'attendance', title: 'Attendance Recorded', description: 'Check-in at 9:00 AM', timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'success' }
    ];

    setRecentActivities(mockActivities);
  };

  // Generate mock performance data
  const generatePerformanceData = () => {
    // This would be fetched from API in a real application
    const metrics = {
      overall: Math.floor(Math.random() * 20) + 70, // 70-90
      productivity: Math.floor(Math.random() * 20) + 70,
      quality: Math.floor(Math.random() * 20) + 70,
      attendance: Math.floor(Math.random() * 20) + 70,
      communication: Math.floor(Math.random() * 20) + 70
    };

    setPerformanceMetrics(metrics);
  };

  // Generate mock milestones and goals
  const generateMilestonesAndGoals = () => {
    // Mock milestones (completed achievements)
    const mockMilestones = [
      { id: 1, title: 'Project Alpha Completion', date: '2023-11-15', description: 'Successfully delivered Project Alpha on time and within budget', icon: 'flag' },
      { id: 2, title: 'Employee of the Month', date: '2023-10-01', description: 'Recognized for outstanding performance and teamwork', icon: 'award' },
      { id: 3, title: 'Training Certification', date: '2023-09-20', description: 'Completed Advanced Development Certification', icon: 'award' },
      { id: 4, title: 'Perfect Attendance', date: '2023-08-30', description: 'Maintained perfect attendance record for 3 months', icon: 'clock' }
    ];

    setMilestones(mockMilestones);

    // Mock goals (targets to achieve)
    const mockGoals = [
      { id: 1, title: 'Complete Project Beta', deadline: '2024-02-28', progress: 5, description: 'Delivering all requirements for Project Beta' },
      { id: 2, title: 'Technical Skill Development', deadline: '2024-03-15', progress: 40, description: 'Master new framework for upcoming projects' },
      { id: 3, title: 'Mentoring Junior Team Member', deadline: '2024-04-30', progress: 80, description: 'Support onboarding and development of junior staff' }
    ];

    setGoals(mockGoals);
  };

  // Generate mock top performers
  const generateTopPerformers = () => {
    const mockPerformers = [
      { id: 1, name: 'Emma Wilson', avatar: 'EW', performance: 92, role: 'Senior Developer', change: 3 },
      { id: 2, name: 'James Anderson', avatar: 'JA', performance: 88, role: 'UI/UX Designer', change: 1 },
      { id: 3, name: 'Olivia Martinez', avatar: 'OM', performance: 86, role: 'QA Specialist', change: -1 },
      { id: 4, name: 'William Taylor', avatar: 'WT', performance: 84, role: 'Backend Developer', change: 2 },
      { id: 5, name: 'Sophia Clark', avatar: 'SC', performance: 82, role: 'Project Coordinator', change: 0 }
    ];

    setTopPerformers(mockPerformers);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'approved':
        return <CheckCircle size={16} className="emp-dashboard__status-icon emp-dashboard__status-icon--success" />;
      case 'error':
      case 'rejected':
        return <XCircle size={16} className="emp-dashboard__status-icon emp-dashboard__status-icon--error" />;
      default:
        return <Clock size={16} className="emp-dashboard__status-icon emp-dashboard__status-icon--pending" />;
    }
  };

  const getMilestoneIcon = (iconName) => {
    switch (iconName) {
      case 'flag': return <Flag size={18} />;
      case 'award': return <Award size={18} />;
      case 'star': return <Star size={18} />;
      case 'clock': return <Clock size={18} />;
      default: return <CheckCircle size={18} />;
    }
  };

  // Helper functions for performance metrics
  const getPerformanceCategory = (score) => {
    if (score < 25) return 'poor';
    if (score < 50) return 'fair';
    if (score < 75) return 'good';
    return 'excellent';
  };
  const getPerformanceIcon = (key) => {
    // Placeholder for icon logic
    return '🏆';
  };
  const getPerformanceSummary = (value) => {
    if (value >= 90) return 'Excellent performance. Keep up the great work!';
    if (value >= 80) return 'Good performance. Continue improving.';
    if (value >= 70) return 'Average performance. Focus on key improvement areas.';
    return 'Performance needs improvement. Please schedule a meeting with your manager.';
  };



  // Get the gradient colors for the gauge needle based on performance
  const getGaugeColors = (value) => {
    if (value >= 90) return { start: '#10B981', end: '#34D399' }; // Excellent - Green
    if (value >= 75) return { start: '#3B82F6', end: '#60A5FA' }; // Good - Blue
    if (value >= 60) return { start: '#F59E0B', end: '#FBBF24' }; // Average - Yellow/Orange
    return { start: 'FF4A55', end: '#F87171' }; // Needs Improvement - Red
  };


  if (loading) return (
    <div className="emp-dashboard__loading">
      <div className="emp-dashboard__loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="emp-dashboard">
      <div className="emp-dashboard__error">
        <AlertTriangle size={24} />
        <p>{error}</p>
        <button onClick={fetchData} className="emp-dashboard__retry-button">Retry</button>
      </div>
    </div>
  );

  // Get the colors for the main performance gauge
  const gaugeColors = {
    start: '#FF4A55',
    end: '#FF9700',
  };

  return (
    <div className="emp-dashboard">
      <div className="emp-dashboard__header">
        <h1>Employee Dashboard</h1>
        <div className="emp-dashboard__date">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="emp-dashboard__grid">
        {/* Row 1: Profile, Weekly Quotas, and Attendance */}
        <div className="emp-dashboard__profile-card">
          <div className="emp-dashboard__card-header">
            <h3>Profile</h3>
          </div>
          <div className="emp-dashboard__profile-header">
            <div className="emp-dashboard__profile-avatar">
              {profile?.personalDetails?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="emp-dashboard__profile-info">
              <h3>{profile?.personalDetails?.name}</h3>
              <p>{profile?.professionalDetails?.role}</p>
            </div>
          </div>
          <div className="emp-dashboard__profile-details">
            <div className="emp-dashboard__profile-detail-item">
              <Mail size={16} />
              <span>{profile?.personalDetails?.email}</span>
            </div>
            <div className="emp-dashboard__profile-detail-item">
              <Phone size={16} />
              <span>{profile?.personalDetails?.contact}</span>
            </div>
            <div className="emp-dashboard__profile-detail-item">
              <Building size={16} />
              <span>{profile?.professionalDetails?.branch}</span>
            </div>
            <div className="emp-dashboard__profile-detail-item">
              <Briefcase size={16} />
              <span>{profile?.professionalDetails?.department}</span>
            </div>
          </div>
          <div className="emp-dashboard__card-footer">
            <button className="emp-dashboard__view-profile-btn">
              View Full Profile <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Weekly Quotas (renamed from Leave Quotas) */}
        <div className="emp-dashboard__quotas-card">
          <div className="emp-dashboard__card-header">
            <h3>Weekly Quotas</h3>
            <span>Progress for this week</span>
          </div>
          <div className="emp-dashboard__quotas-chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Meetings', total: weeklyQuotas.meetings.total, completed: weeklyQuotas.meetings.completed },
                { name: 'Tasks', total: weeklyQuotas.tasks.total, completed: weeklyQuotas.tasks.completed },
                { name: 'Training', total: weeklyQuotas.training.total, completed: weeklyQuotas.training.completed }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total" stackId="a" fill="#6dbfb8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" stackId="b" fill="#be95be" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="emp-dashboard__quotas-summary">
            {Object.entries(weeklyQuotas).map(([type, quota]) => (
              <div className="emp-dashboard__quota-item" key={type}>
                <div className="emp-dashboard__quota-label">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div className="emp-dashboard__quota-progress">
                  <div className="emp-dashboard__quota-bar">
                    <div
                      className="emp-dashboard__quota-fill"
                      style={{ width: `${(quota.completed / quota.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="emp-dashboard__quota-value">
                  <span className="emp-dashboard__completed">{quota.completed}</span>
                  <span className="emp-dashboard__total">/{quota.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="emp-dashboard__attendance-card">
          <div className="emp-dashboard__card-header">
            <h3>Weekly Attendance</h3>
            <span>Hours Worked</span>
          </div>
          <div className="emp-dashboard__attendance-chart">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="hoursWorked"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorHours)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="emp-dashboard__attendance-summary">
            <div className="emp-dashboard__summary-item">
              <Clock8 size={20} className="emp-dashboard__summary-icon" />
              <div className="emp-dashboard__summary-content">
                <span className="emp-dashboard__summary-label">Average Hours</span>
                <span className="emp-dashboard__summary-value">
                  {(attendanceData.reduce((sum, day) => sum + day.hoursWorked, 0) / attendanceData.length).toFixed(1)}
                </span>
              </div>
            </div>
            <div className="emp-dashboard__summary-item">
              <Calendar size={20} className="emp-dashboard__summary-icon" />
              <div className="emp-dashboard__summary-content">
                <span className="emp-dashboard__summary-label">Present Days</span>
                <span className="emp-dashboard__summary-value">{attendanceData.length}/7</span>
              </div>
            </div>
          </div>
        </div>



        {/* Performance Gauge */}
        <div className="emp-dashboard__performance-gauge-container">
          <div className="emp-dashboard__card-header">
            <h3>Performance Metrics</h3>
            <span>Overall Assessment</span>
          </div>

          <div className="emp-dashboard__modern-gauge-wrapper">
            <div className="emp-dashboard__gauge-title">EMPLOYEE PERFORMANCE</div>
            <div className="emp-dashboard__gauge-subtitle">{performanceMetrics.overall}</div>

            <div className="emp-dashboard__modern-gauge">
              {/* Main Gauge */}
              <div className="emp-dashboard__gauge-container">
                {/* Gauge Track Background */}
                <div className="emp-dashboard__gauge-track">
                  {/* Subtle tick marks */}
                  <div className="emp-dashboard__tick-marks">
                    {[...Array(11)].map((_, i) => (
                      <div
                        key={i}
                        className="emp-dashboard__tick"
                        style={{ transform: `rotate(${i * 18 - 90}deg)` }}
                      ></div>
                    ))}
                  </div>

                  {/* Value labels */}
                  <div className="emp-dashboard__value-labels">
                    <span className="emp-dashboard__value-label emp-dashboard__value-0">0</span>
                    <span className="emp-dashboard__value-label emp-dashboard__value-25">25</span>
                    <span className="emp-dashboard__value-label emp-dashboard__value-50">50</span>
                    <span className="emp-dashboard__value-label emp-dashboard__value-75">75</span>
                    <span className="emp-dashboard__value-label emp-dashboard__value-100">100</span>
                  </div>
                </div>

                {/* Performance levels directly on gauge */}
                {/* <div className="emp-dashboard__gauge-expectations">
                  <div className="emp-dashboard__expectation emp-dashboard__expectation-below">
                    BELOW<br />EXPECTATIONS
                  </div>
                  <div className="emp-dashboard__expectation emp-dashboard__expectation-exceeds">
                    EXCEEDS<br />EXPECTATIONS
                  </div>
                </div> */}

                {/* Performance keywords around the gauge */}
                {/* <div className="emp-dashboard__gauge-keywords">
                  <span className="emp-dashboard__keyword emp-dashboard__keyword-teamwork">TEAMWORK</span>
                  <span className="emp-dashboard__keyword emp-dashboard__keyword-quality">QUALITY</span>
                  <span className="emp-dashboard__keyword emp-dashboard__keyword-initiative">INITIATIVE</span>
                  <span className="emp-dashboard__keyword emp-dashboard__keyword-productivity">PRODUCTIVITY</span>
                </div> */}

                {/* Gauge Fill - Set rotation based on performance score */}
                <div
                  className="emp-dashboard__gauge-fill"
                  style={{
                    transform: `rotate(${(performanceMetrics.overall / 100) * 180 - 90}deg)`
                  }}
                ></div>

                {/* Center Display */}
                <div className="emp-dashboard__gauge-center">
                  <div className="emp-dashboard__gauge-percentage">
                    {performanceMetrics.overall}%
                  </div>
                  <div className="emp-dashboard__gauge-rating">
                    {getPerformanceLabel(performanceMetrics.overall)}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metric Pills - Simplified */}
            <div className="emp-dashboard__metric-cards">
              <div className="emp-dashboard__metric-pill">
                <div className="emp-dashboard__metric-icon emp-dashboard__metric-icon--productivity">
                  <BarChart2 size={16} />
                </div>
                <div className="emp-dashboard__metric-name">Productivity</div>
                <div className="emp-dashboard__metric-value">{performanceMetrics.productivity}%</div>
              </div>

              <div className="emp-dashboard__metric-pill">
                <div className="emp-dashboard__metric-icon emp-dashboard__metric-icon--quality">
                  <CheckCircle size={16} />
                </div>
                <div className="emp-dashboard__metric-name">Quality</div>
                <div className="emp-dashboard__metric-value">{performanceMetrics.quality}%</div>
              </div>

              <div className="emp-dashboard__metric-pill">
                <div className="emp-dashboard__metric-icon emp-dashboard__metric-icon--attendance">
                  <Clock size={16} />
                </div>
                <div className="emp-dashboard__metric-name">Attendance</div>
                <div className="emp-dashboard__metric-value">{performanceMetrics.attendance}%</div>
              </div>

              <div className="emp-dashboard__metric-pill">
                <div className="emp-dashboard__metric-icon emp-dashboard__metric-icon--communication">
                  <MessageCircle size={16} />
                </div>
                <div className="emp-dashboard__metric-name">Communication</div>
                <div className="emp-dashboard__metric-value">{performanceMetrics.communication}%</div>
              </div>
            </div>
          </div>
        </div>


        <div className="emp-dashboard__top-performers-card">
          <div className="emp-dashboard__card-header">
            <h3>Top Performers</h3>
            <span>This Month</span>
          </div>
          <div className="emp-dashboard__top-performers-list">
            {topPerformers.slice(0, 4).map((performer, index) => (
              <div className="emp-dashboard__performer-item" key={performer.id}>
                <div className="emp-dashboard__performer-rank">{index + 1}</div>
                <div className="emp-dashboard__performer-avatar" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  {performer.avatar}
                </div>
                <div className="emp-dashboard__performer-details">
                  <h4 className="emp-dashboard__performer-name">{performer.name}</h4>
                  <span className="emp-dashboard__performer-role">{performer.role}</span>
                </div>
                <div className="emp-dashboard__performer-score">
                  <div className="emp-dashboard__score-value">{performer.performance}%</div>
                  <div className={`emp-dashboard__score-change ${performer.change > 0 ? 'emp-dashboard__score-change--positive' : performer.change < 0 ? 'emp-dashboard__score-change--negative' : ''}`}>
                    {performer.change > 0 ? (
                      <ArrowUp size={12} />
                    ) : performer.change < 0 ? (
                      <ArrowDown size={12} />
                    ) : null}
                    {performer.change !== 0 && `${Math.abs(performer.change)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Two cards side by side - Goals and Milestones */}
        <div className="emp-dashboard__goals-card">
          <div className="emp-dashboard__card-header">
            <h3>My Goals</h3>
            <span>Current Progress</span>
          </div>
          <div className="emp-dashboard__goals-list">
            {goals.length === 0 ? (
              <div className="emp-dashboard__empty-goals">
                <Target size={24} />
                <p>No active goals found</p>
              </div>
            ) : (
              goals.map(goal => (
                <div className="emp-dashboard__goal-item" key={goal.id}>
                  <div className="emp-dashboard__goal-header">
                    <h4>{goal.title}</h4>
                    <span className="emp-dashboard__goal-deadline">Due: {formatDate(goal.deadline)}</span>
                  </div>
                  <div className="emp-dashboard__goal-progress-container">
                    <div className="emp-dashboard__goal-progress-bar">
                      <div
                        className="emp-dashboard__goal-progress-fill"
                        style={{
                          width: `${goal.progress}%`,
                          background: `linear-gradient(90deg, ${PERFORMANCE_GRADIENTS[getPerformanceCategory(goal.progress)].from}, ${PERFORMANCE_GRADIENTS[getPerformanceCategory(goal.progress)].to})`
                        }}
                      ></div>
                    </div>
                    <div className="emp-dashboard__goal-progress-text">
                      <span className="emp-dashboard__goal-progress-label">Progress</span>
                      <span className="emp-dashboard__goal-progress-value">{goal.progress}%</span>
                    </div>
                  </div>
                  <p className="emp-dashboard__goal-description">{goal.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="emp-dashboard__milestones-card">
          <div className="emp-dashboard__card-header">
            <h3>My Achievements</h3>
            <span>Recent Milestones</span>
          </div>
          <div className="emp-dashboard__milestones-list">
            {milestones.length === 0 ? (
              <div className="emp-dashboard__empty-milestones">
                <Award size={24} />
                <p>No milestones achieved yet</p>
              </div>
            ) : (
              milestones.map(milestone => (
                <div className="emp-dashboard__milestone-item" key={milestone.id}>
                  <div className="emp-dashboard__milestone-icon">
                    {getMilestoneIcon(milestone.icon)}
                  </div>
                  <div className="emp-dashboard__milestone-content">
                    <div className="emp-dashboard__milestone-header">
                      <h4>{milestone.title}</h4>
                      <span className="emp-dashboard__milestone-date">{formatDate(milestone.date)}</span>
                    </div>
                    <p className="emp-dashboard__milestone-description">{milestone.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Row 4: Two cards side by side - Activities and Announcements */}
        <div className="emp-dashboard__activities-card">
          <div className="emp-dashboard__card-header">
            <h3>Recent Activities</h3>
          </div>
          <div className="emp-dashboard__activities-list">
            {recentActivities.map(activity => (
              <div className="emp-dashboard__activity-item" key={activity.id}>
                <div className="emp-dashboard__activity-icon">
                  {activity.type === 'leave' ? <Calendar size={16} /> :
                    activity.type === 'profile' ? <User size={16} /> :
                      <Clock size={16} />}
                </div>
                <div className="emp-dashboard__activity-content">
                  <div className="emp-dashboard__activity-header">
                    <h4>{activity.title}</h4>
                    <span className="emp-dashboard__activity-time">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p>{activity.description}</p>
                </div>
                <div className="emp-dashboard__activity-status">
                  {getStatusIcon(activity.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="emp-dashboard__announcements-card">
          <div className="emp-dashboard__card-header">
            <h3>Branch Announcements</h3>
            {userBranch && (
              <span className="emp-dashboard__branch-tag">{userBranch}</span>
            )}
          </div>
          <div className="emp-dashboard__announcements-list">
            {announcements.length === 0 ? (
              <div className="emp-dashboard__empty-announcements">
                <Bell size={24} />
                <p>No announcements at this time</p>
              </div>
            ) : (
              announcements.map(announcement => (
                <div className="emp-dashboard__announcement-item" key={announcement._id}>
                  <div className="emp-dashboard__announcement-priority">
                    <Circle size={8} fill={getStatusColor(announcement.priority)} />
                    <span>{announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}</span>
                  </div>
                  <h4>{announcement.title}</h4>
                  <p>{announcement.content}</p>
                  <div className="emp-dashboard__announcement-footer">
                    <span>Expires: {formatDate(announcement.expiresAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;