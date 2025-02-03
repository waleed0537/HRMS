import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./Components/common/sidebar";
import Header from "./Components/common/Header";
import SignIn from "./Components/signin";
import StaffRequests from './Components/StaffRequests';
import EmployeeManagement from './Components/EmployeeManagement';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing auth token and user data
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <SignIn onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header user={user} onLogout={handleLogout} />
        <main className="p-6 pt-20 ml-64 min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="/employees/profile" element={<div>Employee Profile Page</div>} />
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
            <Route path="/projects" element={<div>Projects</div>} />
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
            <Route path="/tickets" element={<div>Tickets</div>} />
            <Route path="/clients" element={<div>Our Clients</div>} />
            <Route path="/accounts" element={<div>Accounts</div>} />
            <Route path="/payroll" element={<div>Payroll</div>} />
            <Route path="/app" element={<div>App</div>} />
            <Route path="/other-pages" element={<div>Other Pages</div>} />
            <Route path="/ui-components" element={<div>UI Components</div>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;