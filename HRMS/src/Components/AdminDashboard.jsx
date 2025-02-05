import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card';
import { Bell, CheckCircle, XCircle } from 'lucide-react';
import AnnouncementModal from './AnnouncementModal';
import AnnouncementsList from './AnnouncementsList';
import '../assets/css/AdminDashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
  const [selectedBranch, setSelectedBranch] = useState(null);

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
  }, []);

  // Update this function in your AdminDashboard.jsx

const handleCreateAnnouncement = async (announcementData) => {
    try {
      console.log('Sending announcement data:', announcementData); // Debug log
      
      const response = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(announcementData)
      });
  
      // Get the actual error message from the server
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

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const employeesResponse = await fetch('http://localhost:5000/api/employees', { headers });
      const employeesData = await employeesResponse.json();

      const leavesResponse = await fetch('http://localhost:5000/api/leaves', { headers });
      const leavesData = await leavesResponse.json();

      processEmployeeStats(employeesData);
      processLeaveStats(leavesData);
      processTeamPerformance(employeesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setNotificationMessage('Failed to fetch dashboard data');
      setNotificationType('error');
    }
  };

  const processEmployeeStats = (employees) => {
    const active = employees.filter(emp => emp.professionalDetails.status === 'active').length;
    const onLeave = employees.filter(emp => emp.professionalDetails.status === 'on_leave').length;
    
    const departments = employees.reduce((acc, emp) => {
      const dept = emp.professionalDetails.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const departmentData = Object.entries(departments).map(([name, count]) => ({
      name,
      value: count
    }));

    setEmployeeStats({
      total: employees.length,
      active,
      onLeave,
      departments: departmentData
    });
  };

  const processLeaveStats = (leaves) => {
    const monthlyStats = leaves.reduce((acc, leave) => {
      const month = new Date(leave.startDate).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const leaveData = Object.entries(monthlyStats).map(([month, count]) => ({
      month,
      leaves: count
    }));

    setLeaveStats(leaveData);
  };

  const processTeamPerformance = (employees) => {
    const branchPerformance = employees.reduce((acc, emp) => {
      const branch = emp.professionalDetails.branch;
      if (!acc[branch]) {
        acc[branch] = {
          name: branch,
          performance: emp.rating || 0,
          count: 1
        };
      } else {
        acc[branch].performance += emp.rating || 0;
        acc[branch].count += 1;
      }
      return acc;
    }, {});

    const performanceData = Object.values(branchPerformance).map(({ name, performance, count }) => ({
      name,
      rating: (performance / count).toFixed(1)
    }));

    setTeamPerformance(performanceData);
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
        <h1>Admin Dashboard</h1>
        <button 
          className="announcement-button"
          onClick={() => setIsAnnouncementModalOpen(true)}
        >
          <Bell size={20} />
          Create Announcement
        </button>
      </div>

      <div className="stats-grid">
        <Card>
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stats-value">{employeeStats.total}</div>
            <div className="stats-detail">
              Active: {employeeStats.active} | On Leave: {employeeStats.onLeave}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="chart-container">
        <Card>
          <CardHeader>
            <CardTitle>Leave Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={leaveStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leaves" stroke="#474787" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="stats-grid">
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rating" stroke="#474787" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={employeeStats.departments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {employeeStats.departments.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {selectedBranch && <AnnouncementsList branchId={selectedBranch} />}

      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />
    </div>
  );
};

export default AdminDashboard;