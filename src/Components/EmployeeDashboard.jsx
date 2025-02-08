import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card';
import { Calendar, AlertTriangle, Circle } from 'lucide-react';
import '../assets/css/EmployeeDashboard.css';
import API_BASE_URL from '../config/api.js';
const EmployeeDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [userBranch, setUserBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBranchAnnouncements = async (branchId) => {
    try {
      console.log('Fetching announcements for branchId:', branchId);
      const response = await fetch(`${API_BASE_URL}/api/announcements/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch announcements');
      const data = await response.json();
      console.log('Received announcements:', data);
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          console.log('User data from localStorage:', userData);
          
          // First get the employee document using the user's email
          const empResponse = await fetch(`${API_BASE_URL}/api/employees/byemail/${userData.email}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
      
          if (!empResponse.ok) {
            console.error('Employee response status:', empResponse.status);
            throw new Error('Failed to fetch user data');
          }
          
          const data = await empResponse.json();
          console.log('Employee data received:', data);
      
          // Get branch data
          const branchResponse = await fetch(`${API_BASE_URL}/api/branches`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!branchResponse.ok) throw new Error('Failed to fetch branch data');
          const branches = await branchResponse.json();
          console.log('Branches data:', branches);
          
          // Find the branch by name
          const userBranch = branches.find(branch => branch.name === data.professionalDetails.branch);
          console.log('Found user branch:', userBranch);
          
          if (userBranch) {
            setUserBranch(data.professionalDetails.branch);
            fetchBranchAnnouncements(userBranch._id);
          } else {
            console.warn('No matching branch found for:', data.professionalDetails.branch);
          }
        } catch (err) {
          console.error('Error in fetchUserData:', err);
          setError(err.message);
        }
      };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log('Fetching leave history for user:', userData.email);
        
        const response = await fetch(`${API_BASE_URL}/api/leaves?employeeEmail=${encodeURIComponent(userData.email)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leave history');
        }

        const data = await response.json();
        console.log('Received leave history:', data);
        setLeaveHistory(data);
      } catch (err) {
        console.error('Error fetching leave history:', err);
        setLeaveHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen -mt-16">
      <div className="text-xl text-gray-600">Loading...</div>
    </div>
  );

  if (error) return (
    <div className="dashboard-container">
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-red-600">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">

      <div className="announcements-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Branch Announcements</h2>
          {userBranch && (
            <div className="text-gray-600">
              Branch: {userBranch}
            </div>
          )}
        </div>
        <div className="announcements-grid">
          {announcements.length === 0 ? (
            <div className="announcement-card">
              <div className="text-gray-500 text-center">
                No announcements at this time for {userBranch || 'your branch'}.
              </div>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement._id} className="announcement-card">
                <div className="announcement-header">
                  <div className="priority-badge">
                    <Circle size={8} fill={getStatusColor(announcement.priority)} />
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                  </div>
                </div>
                <h3 className="announcement-title">{announcement.title}</h3>
                <p className="announcement-content">{announcement.content}</p>
                <div className="announcement-footer">
                  Expires: {formatDate(announcement.expiresAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="leave-section">
        <h2 className="section-title">Recent Leave Requests</h2>
        <div className="leave-grid">
          {leaveHistory.length === 0 ? (
            <div className="leave-card">
              No leave history found.
            </div>
          ) : (
            leaveHistory.map((leave) => (
              <div key={leave._id} className="leave-card">
                <div className="leave-header">
                  <span className="leave-type">
                    {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                  </span>
                  <span className={`status-badge ${leave.status}`}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </span>
                </div>
                <div className="leave-dates">
                  <Calendar size={16} />
                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                </div>
                <p className="leave-reason">{leave.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;