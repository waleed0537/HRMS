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
import EditProfiles from './Components/EditProfile';
import BranchManagement from './Components/BranchManagement';
import AdminDashboard from './Components/AdminDashboard';
import AttendanceManagement from './Components/AttendanceManagement';
import EmployeeDashboard from './Components/EmployeeDashboard';
import Holiday from './Components/Holiday';
import ApplicantForm from './Components/ApplicantForm';
import ApplicantsManagement from './Components/ApplicantsManagement';
import '../src/assets/css/global.css';

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    if (userData.isAdmin) {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
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

  // Special routes that don't require authentication
  const publicRoutes = ['/apply'];
  const currentPath = window.location.pathname;
  
  if (publicRoutes.includes(currentPath)) {
    return (
      <Routes>
        <Route path="/apply" element={<ApplicantForm />} />
      </Routes>
    );
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
            {/* Root redirect based on user role */}
            <Route path="/" element={
              user?.isAdmin 
                ? <Navigate to="/admin-dashboard" replace /> 
                : <Navigate to="/dashboard" replace />
            } />

            {/* All your existing routes... */}
            <Route path="/dashboard" element={
              !user?.isAdmin ? (
                <EmployeeDashboard />
              ) : (
                <Navigate to="/admin-dashboard" replace />
              )
            } />
              <Route path="/admin-dashboard" element={
                user?.isAdmin ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } />
              {/* Attendance Management Route */}
              <Route
                path="/attendance"
                element={
                  user?.isAdmin || user?.role === 'hr_manager' ? (
                    <AttendanceManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              {/* Common Routes */}
              <Route path="/employees" element={<EmployeeCards />} />
              <Route path="/leave-request" element={<LeaveRequest />} />
              <Route path="/profile" element={<EmployeeProfile />} />

              {/* Admin Only Routes */}
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
  path="/applicants"
  element={
    user?.isAdmin || user?.role === 'hr_manager' || user?.role === 't1_member' ? (
      <ApplicantsManagement />
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
              <Route
    path="/holidays"
    element={
      user?.isAdmin || user?.role === 'hr_manager' ? (
        <Holiday />
      ) : (
        <Navigate to="/dashboard" replace />
      )
    }
  />
              <Route
                path="/branch-management"
                element={
                  user?.isAdmin ? (
                    <BranchManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Admin & HR Manager Routes */}
              <Route
                path="/edit-profiles"
                element={
                  user?.isAdmin || user?.role === 'hr_manager' ? (
                    <EditProfiles />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
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

              {/* Admin Only Routes */}
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

              {/* Other Routes */}
              <Route path="/projects" element={<div>Projects Page</div>} />
              <Route path="/tickets" element={<div>Tickets Page</div>} />
              <Route path="/clients" element={<div>Clients Page</div>} />
              <Route path="/accounts" element={<div>Accounts Page</div>} />
              <Route path="/payroll" element={<div>Payroll Page</div>} />
              <Route path="/app" element={<div>App Page</div>} />
              <Route path="/other-pages" element={<div>Other Pages</div>} />
              <Route path="/ui-components" element={<div>UI Components</div>} />
              <Route path="/apply" element={<ApplicantForm />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  export default App;