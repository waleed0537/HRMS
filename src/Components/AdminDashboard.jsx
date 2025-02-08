import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bell, CheckCircle, XCircle, Download } from 'lucide-react';
import AnnouncementModal from './AnnouncementModal';
import AnnouncementsList from './AnnouncementsList';
import '../assets/css/AdminDashboard.css';
import API_BASE_URL from '../config/api.js';
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

      processEmployeeStats(employeesData, leavesData);
      processLeaveStats(leavesData);
      processTeamPerformance(employeesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setNotificationMessage('Failed to fetch dashboard data');
      setNotificationType('error');
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

    const departmentData = Object.entries(departments).map(([name, count]) => ({
      name,
      value: count
    }));

    console.log('Status counts:', { active, onLeave, total: employees.length });

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
      const branch = emp.professionalDetails?.branch;
      if (!branch) return acc;
      
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
        `${stat.month}: ${stat.leaves} leave requests`
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
      const response = await fetch('http://localhost:5000/api/announcements', {
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

      <div className="stats-grid">
        <div className="stats-card">
          <h3 className="card-title">Total Employees</h3>
          <div className="stats-value">{employeeStats.total}</div>
          <div className="stats-detail">
            Active: {employeeStats.active} | On Leave: {employeeStats.onLeave}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="stats-card">
          <h3 className="card-title">Leave Trends</h3>
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
        </div>

        <div className="stats-card">
          <h3 className="card-title">Team Performance</h3>
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
        </div>

        <div className="stats-card">
          <h3 className="card-title">Department Distribution</h3>
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
        </div>
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