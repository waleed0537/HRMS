import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import HRMSLandingPage from './Components/HRMSLadingPage';
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
import HrDashboard from './Components/HumanResourceDashboard';

import '../src/assets/css/global.css';
// Import the default export for the provider
import ToastProvider from './Components/common/ToastContent';

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
    } else if (userData.role === 'hr_manager') {
      navigate('/hr-dashboard');
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

  if (!isAuthenticated) {
    return (
      <ToastProvider position="top-right">
        <Routes>
          <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignIn onLogin={handleLogin} />} />
          <Route path="/apply" element={<ApplicantForm />} />
          <Route path="/" element={<HRMSLandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider position="top-right">
      <div className="zoom-container">
        <div className="flex h-screen bg-gray-50">
          <Sidebar user={user} />
          <div className="flex-1">
            <Header user={user} onLogout={handleLogout} />
            <main className="p-6 pt-20 ml-64 min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={
                  user?.isAdmin
                    ? <Navigate to="/admin-dashboard" replace />
                    : (user?.role === 'hr_manager'
                      ? <Navigate to="/hr-dashboard" replace />
                      : <Navigate to="/dashboard" replace />)
                } />
                <Route path="/dashboard" element={
                  !user?.isAdmin && user?.role !== 'hr_manager' ? (
                    <EmployeeDashboard />
                  ) : (
                    user?.isAdmin
                      ? <Navigate to="/admin-dashboard" replace />
                      : <Navigate to="/hr-dashboard" replace />
                  )
                } />
                <Route path="/admin-dashboard" element={
                  user?.isAdmin ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="/hr-dashboard" element={
                  user?.role === 'hr_manager' ? (
                    <HrDashboard />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="/attendance" element={
                  user?.isAdmin || user?.role === 'hr_manager' ? (
                    <AttendanceManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/employees" element={<EmployeeCards />} />
                <Route path="/leave-request" element={<LeaveRequest />} />
                <Route path="/profile" element={<EmployeeProfile />} />
                <Route path="/staff-requests" element={
                  user?.isAdmin || user?.role === 'hr_manager' ? (
                    <StaffRequests />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/applicants" element={
                  user?.isAdmin || user?.role === 'hr_manager' || user?.role === 't1_member' ? (
                    <ApplicantsManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/manage-employees" element={
                  user?.isAdmin ? (
                    <EmployeeManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/holidays" element={
                  user?.isAdmin || user?.role === 'hr_manager' ? (
                    <Holiday />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/branch-management" element={
                  user?.isAdmin ? (
                    <BranchManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/edit-profiles" element={
                  user?.isAdmin || user?.role === 'hr_manager' ? (
                    <EditProfiles />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/manage-leaves" element={
                  user?.isAdmin || user?.role === 'hr_manager' ? (
                    <ManageLeaves />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/leave-history" element={
                  user?.isAdmin ? (
                    <LeaveHistory />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                } />
                <Route path="/projects" element={<div>Projects Page</div>} />
                <Route path="/tickets" element={<div>Tickets Page</div>} />
                <Route path="/clients" element={<div>Clients Page</div>} />
                <Route path="/accounts" element={<div>Accounts Page</div>} />
                <Route path="/payroll" element={<div>Payroll Page</div>} />
                <Route path="/app" element={<div>App Page</div>} />
                <Route path="/other-pages" element={<div>Other Pages</div>} />
                <Route path="/ui-components" element={<div>UI Components</div>} />
                <Route path="/apply" element={<ApplicantForm />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;