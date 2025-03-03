import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer
} from 'recharts';
import { 
  Bell, CheckCircle, XCircle, Calendar, Circle, User,
  Clock, FileText, TrendingUp, AlertTriangle, Activity,
  Briefcase, ChevronRight, Mail, Phone, MapPin, Building,
  Coffee, Clock8
} from 'lucide-react';
import '../assets/css/EmployeeDashboard.css';
import API_BASE_URL from '../config/api.js';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const EmployeeDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [userBranch, setUserBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveQuotas, setLeaveQuotas] = useState({
    annual: { total: 20, used: 0 },
    sick: { total: 10, used: 0 },
    personal: { total: 5, used: 0 }
  });
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

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
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      
      // Calculate used leave quotas
      const now = new Date();
      const thisYear = now.getFullYear();
      
      const usedLeaves = data.reduce((acc, leave) => {
        if (leave.status === 'approved' && new Date(leave.startDate).getFullYear() === thisYear) {
          acc[leave.leaveType] = (acc[leave.leaveType] || 0) + calculateDuration(leave.startDate, leave.endDate);
        }
        return acc;
      }, {});
      
      setLeaveQuotas(prev => ({
        annual: { total: 20, used: usedLeaves.annual || 0 },
        sick: { total: 10, used: usedLeaves.sick || 0 },
        personal: { total: 5, used: usedLeaves.personal || 0 }
      }));
      
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

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end - start;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
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

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="dashboard-container">
      <div className="error-message">
        <AlertTriangle size={24} />
        <p>{error}</p>
        <button onClick={fetchData} className="retry-button">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <div className="dashboard-date">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      
      <div className="employee-dashboard-grid">
        {/* Profile Summary Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.personalDetails?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="profile-info">
              <h3>{profile?.personalDetails?.name}</h3>
              <p>{profile?.professionalDetails?.role}</p>
            </div>
          </div>
          <div className="profile-details">
            <div className="profile-detail-item">
              <Mail size={16} />
              <span>{profile?.personalDetails?.email}</span>
            </div>
            <div className="profile-detail-item">
              <Phone size={16} />
              <span>{profile?.personalDetails?.contact}</span>
            </div>
            <div className="profile-detail-item">
              <Building size={16} />
              <span>{profile?.professionalDetails?.branch}</span>
            </div>
            <div className="profile-detail-item">
              <Briefcase size={16} />
              <span>{profile?.professionalDetails?.department}</span>
            </div>
          </div>
          <div className="profile-footer">
            <button className="view-profile-btn">
              View Full Profile <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Leave Quotas Card */}
        <div className="leave-quotas-card">
          <div className="card-header">
            <h3>Leave Quotas</h3>
            <span>Remaining for {new Date().getFullYear()}</span>
          </div>
          <div className="leave-quotas-chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Annual', total: leaveQuotas.annual.total, used: leaveQuotas.annual.used },
                { name: 'Sick', total: leaveQuotas.sick.total, used: leaveQuotas.sick.used },
                { name: 'Personal', total: leaveQuotas.personal.total, used: leaveQuotas.personal.used }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total" stackId="a" fill="#8884d8" />
                <Bar dataKey="used" name="Used" stackId="a" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="leave-quotas-summary">
            {Object.entries(leaveQuotas).map(([type, quota]) => (
              <div className="quota-item" key={type}>
                <div className="quota-label">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div className="quota-value">
                  <span className="remaining">{quota.total - quota.used}</span>
                  <span className="total">/{quota.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Attendance Chart Card */}
        <div className="attendance-card">
          <div className="card-header">
            <h3>Weekly Attendance</h3>
            <span>Hours Worked</span>
          </div>
          <div className="attendance-chart">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="hoursWorked" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="attendance-summary">
            <div className="summary-item">
              <Clock8 size={20} />
              <div className="summary-content">
                <span className="summary-label">Average Hours</span>
                <span className="summary-value">
                  {(attendanceData.reduce((sum, day) => sum + day.hoursWorked, 0) / attendanceData.length).toFixed(1)}
                </span>
              </div>
            </div>
            <div className="summary-item">
              <Calendar size={20} />
              <div className="summary-content">
                <span className="summary-label">Present Days</span>
                <span className="summary-value">{attendanceData.length}/7</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activities Card */}
        <div className="activities-card">
          <div className="card-header">
            <h3>Recent Activities</h3>
          </div>
          <div className="activities-list">
            {recentActivities.map(activity => (
              <div className="activity-item" key={activity.id}>
                <div className="activity-icon">
                  {activity.type === 'leave' ? <Calendar size={16} /> : 
                   activity.type === 'profile' ? <User size={16} /> : 
                   <Clock size={16} />}
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
          <div className="activities-footer">
            <button className="view-all-btn">
              View all activity <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Upcoming Holidays Card */}
        <div className="holidays-card">
          <div className="card-header">
            <h3>Upcoming Holidays</h3>
          </div>
          <div className="holidays-list">
            {upcomingHolidays.map((holiday, index) => (
              <div className="holiday-item" key={index}>
                <div className="holiday-date">
                  <span className="day">{new Date(holiday.date).getDate()}</span>
                  <span className="month">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div className="holiday-details">
                  <h4>{holiday.name}</h4>
                  <span className="holiday-day">
                    {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Team Members Card */}
        <div className="team-card">
          <div className="card-header">
            <h3>Team Members</h3>
          </div>
          <div className="team-list">
            {teamMembers.map(member => (
              <div className="team-member" key={member.id}>
                <div className="member-avatar">{member.avatar}</div>
                <div className="member-info">
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Announcements Card */}
        <div className="announcements-card">
          <div className="card-header">
            <h3>Branch Announcements</h3>
            {userBranch && (
              <span className="branch-tag">{userBranch}</span>
            )}
          </div>
          <div className="announcements-list">
            {announcements.length === 0 ? (
              <div className="empty-announcements">
                <Bell size={24} />
                <p>No announcements at this time</p>
              </div>
            ) : (
              announcements.map(announcement => (
                <div className="announcement-item" key={announcement._id}>
                  <div className="announcement-priority">
                    <Circle size={8} fill={getStatusColor(announcement.priority)} />
                    <span>{announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}</span>
                  </div>
                  <h4>{announcement.title}</h4>
                  <p>{announcement.content}</p>
                  <div className="announcement-footer">
                    <span>Expires: {formatDate(announcement.expiresAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Leave Requests Card */}
        <div className="leave-card">
          <div className="card-header">
            <h3>Leave Requests</h3>
            <button className="new-leave-btn">
              <Calendar size={14} />
              New Request
            </button>
          </div>
          <div className="leave-list">
            {leaveHistory.length === 0 ? (
              <div className="empty-leaves">
                <Calendar size={24} />
                <p>No leave history found</p>
              </div>
            ) : (
              leaveHistory.slice(0, 4).map(leave => (
                <div className="leave-item" key={leave._id}>
                  <div className="leave-type">
                    <span>{leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}</span>
                  </div>
                  <div className="leave-details">
                    <div className="leave-dates">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                    <div className="leave-reason">{leave.reason}</div>
                  </div>
                  <div className={`leave-status ${leave.status}`}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </div>
                </div>
              ))
            )}
          </div>
          {leaveHistory.length > 0 && (
            <div className="leave-footer">
              <button className="view-all-btn">
                View all leave requests <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;