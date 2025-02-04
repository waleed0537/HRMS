import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./Components/common/sidebar";
import Header from "./Components/common/Header";
import SignIn from "./Components/signin";
import StaffRequests from './Components/StaffRequests';
import LeaveRequest from './Components/LeaveRequest';
import ManageLeaves from './Components/ManageLeaves';
import EmployeeManagement from './Components/EmployeeManagement';
import EmployeeDetails from './Components/EmployeeDetails';
import EmployeeCards from './Components/EmployeeCards';
import LeaveHistory from './Components/LeaveHistory';
import EmployeeProfile from './Components/EmployeeProfile';
import '../src/assets/css/global.css';

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user data on component mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <SignIn onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <Header user={user} onLogout={handleLogout} />
        <main className="p-6 pt-20 ml-64 min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="/employees" element={<EmployeeCards />} />

            {/* Staff Management Routes */}
            <Route
              path="/staff-requests"
              element={
                user?.isAdmin ? (
                  <StaffRequests />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/manage-employees"
              element={
                user?.isAdmin ? (
                  <EmployeeManagement />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            {/* Leave Management Routes */}
            <Route path="/leave-request" element={<LeaveRequest />} />
            <Route
              path="/manage-leaves"
              element={
                user?.isAdmin || user?.role === 'hr_manager' ? (
                  <ManageLeaves />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            {/* Other Routes */}
            <Route
              path="/leave-history"
              element={
                user?.isAdmin ? (
                  <LeaveHistory />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route 
              path="/profile" 
              element={
                isAuthenticated ? (
                  <EmployeeProfile />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route path="/projects" element={<div>Projects Page</div>} />
            <Route path="/tickets" element={<div>Tickets Page</div>} />
            <Route path="/clients" element={<div>Clients Page</div>} />
            <Route path="/accounts" element={<div>Accounts Page</div>} />
            <Route path="/payroll" element={<div>Payroll Page</div>} />
            <Route path="/app" element={<div>App Page</div>} />
            <Route path="/other-pages" element={<div>Other Pages</div>} />
            <Route path="/ui-components" element={<div>UI Components</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;