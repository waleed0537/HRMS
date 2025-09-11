// Update sidebar.jsx to refresh user data from localStorage

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users, LayoutDashboard, CircleDollarSign, AppWindow, Menu, X,
  UserPlus, Calendar, FileText, History, UserSquare2, Building, Clock
} from 'lucide-react';
import '../../assets/css/sidebar.css';

const Sidebar = ({ user: propUser }) => {
  // Add local state for user data that reads from localStorage
  const [localUser, setLocalUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('');

  // This useEffect will always read the latest data from localStorage
  useEffect(() => {
    const refreshUserData = () => {
      try {
        const storedUserData = localStorage.getItem('user');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setLocalUser(userData);
          setIsAdmin(userData?.isAdmin || false);
          setUserRole(userData?.role || '');
        } else {
          // Fallback to props if no localStorage data
          setLocalUser(propUser);
          setIsAdmin(propUser?.isAdmin || false);
          setUserRole(propUser?.role || '');
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        // Fallback to props
        setLocalUser(propUser);
        setIsAdmin(propUser?.isAdmin || false);
        setUserRole(propUser?.role || '');
      }
    };

    // Initial load
    refreshUserData();

    // Set up listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        refreshUserData();
      }
    };

    // Set up listener for custom roleChange event
    const handleRoleChange = () => {
      refreshUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('roleChange', handleRoleChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('roleChange', handleRoleChange);
    };
  }, [propUser]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden';
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // If we don't have user data yet, show minimal sidebar
  if (!localUser) {
    return (
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">
            <span className="logo-text">My-Task</span>
          </div>
        </div>
        <div className="loading-sidebar">Loading...</div>
      </div>
    );
  }

  return (
    <>
     <div className="zoom-container">
      <button type="button" className="mobile-menu-button" onClick={toggleMobileMenu}>
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-section">
          <div className="logo-icon">
            
            <span className="logo-text">My-Task</span>
          </div>
        </div>

        <nav className="nav-container">
          {isAdmin ? (
            <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span>Admin Dashboard</span>
            </NavLink>
          ) : userRole === 'hr_manager' ? (
            <NavLink to="/hr-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span>HR Dashboard</span>
            </NavLink>
          ) : (
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
          )}

          {userRole !== 'employee' && (
            <>
              <div className="section-divider">Employees</div>
              <NavLink to="/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users className="h-5 w-5" />
                <span>Employees</span>
              </NavLink>
            </>
          )}

          {!isAdmin && (
            <>
              <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <UserSquare2 className="h-5 w-5" />
                <span>My Profile</span>
              </NavLink>
              <NavLink to="/leave-request" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Calendar className="h-5 w-5" />
                <span>Submit Leave Request</span>
              </NavLink>
            </>
          )}

          {(isAdmin || userRole === 'hr_manager') && (
            <>
              <div className="section-divider">Administration</div>
              {(isAdmin || userRole === 'hr_manager') && (
                <NavLink to="/staff-requests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <UserPlus className="h-5 w-5" />
                  <span>Staff Requests</span>
                </NavLink>
              )}
              
              {isAdmin && (
                <NavLink to="/branch-management" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Building className="h-5 w-5" />
                  <span>Branch Management</span>
                </NavLink>
              )}
              
              <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Clock className="h-5 w-5" />
                <span>Attendance</span>
              </NavLink>
              
              <NavLink to="/edit-profiles" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText className="h-5 w-5" />
                <span>Edit Profiles</span>
              </NavLink>
              
              <NavLink to="/manage-leaves" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText className="h-5 w-5" />
                <span>Manage Leaves</span>
              </NavLink>
            </>
          )}

          {isAdmin && (
            <NavLink to="/leave-history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History className="h-5 w-5" />
              <span>Leave History & Quotas</span>
            </NavLink>
          )}
          
          {(isAdmin || userRole === 'hr_manager') && (
            <NavLink to="/holidays" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar className="h-5 w-5" />
              <span>Holidays</span>
            </NavLink>
          )}
          
          {(isAdmin || userRole === 'hr_manager' || userRole === 't1_member') && (
            <NavLink to="/applicants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users className="h-5 w-5" />
              <span>Job Applications</span>
            </NavLink>
          )}
          
          <div className="section-divider">Finance</div>
          <NavLink to="/accounts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CircleDollarSign className="h-5 w-5" />
            <span>Accounts</span>
          </NavLink>

          <div className="section-divider">Additional Features</div>
          <NavLink to="/app" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <AppWindow className="h-5 w-5" />
            <span>App</span>
          </NavLink>
        </nav>
      </div>

      {isMobileMenuOpen && <div className="overlay" onClick={toggleMobileMenu} />}
      </div>
    </>
  );
};

export default Sidebar;