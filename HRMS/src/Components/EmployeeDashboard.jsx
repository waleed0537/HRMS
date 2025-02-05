import React, { useState, useEffect } from 'react';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const [user, setUser] = useState(null);
  const [leaveStats, setLeaveStats] = useState({
    total: 0,
    used: 0,
    remaining: 0
  });
  const [announcements, setAnnouncements] = useState([]);
  const [currentLeaveStatus, setCurrentLeaveStatus] = useState('Active');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);

        // Fetch leave statistics
        const leaveResponse = await fetch(`http://localhost:5000/api/leaves/stats/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const leaveData = await leaveResponse.json();
        setLeaveStats(leaveData);

        // Check current leave status
        const statusResponse = await fetch(`http://localhost:5000/api/employees/leave-status/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const statusData = await statusResponse.json();
        setCurrentLeaveStatus(statusData.status);

        // Fetch branch-specific announcements
        const announcementsResponse = await fetch(`http://localhost:5000/api/announcements/${userData.branch}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const announcementsData = await announcementsResponse.json();
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="employee-dashboard-container">
      <h1>Employee Dashboard</h1>

      {/* Personal Stats Card */}
      <div className="status-card">
        <h2>My Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-icon status-clock"></div>
            <div>
              <p className="status-label">Current Status</p>
              <p className="status-value">{currentLeaveStatus}</p>
            </div>
          </div>
          <div className="status-item">
            <div className="status-icon status-calendar"></div>
            <div>
              <p className="status-label">Leave Days</p>
              <p className="status-value">{leaveStats.total} Total</p>
            </div>
          </div>
          <div className="status-item">
            <div className="status-icon status-book"></div>
            <div>
              <p className="status-label">Remaining Leaves</p>
              <p className="status-value">{leaveStats.remaining}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="announcements-card">
        <h2>Branch Announcements</h2>
        <div className="announcements-content">
          {announcements.length === 0 ? (
            <p className="no-announcements">No current announcements</p>
          ) : (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="announcement-item"
                >
                  <h3>{announcement.title}</h3>
                  <p>{announcement.content}</p>
                  <p className="announcement-date">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;