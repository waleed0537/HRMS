import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users, LayoutDashboard, CircleDollarSign, AppWindow, Menu, X,
  UserPlus, Calendar, FileText, History, UserSquare2, Building, Clock
} from 'lucide-react';
import '../../assets/css/sidebar.css';

const Sidebar = ({ user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setIsAdmin(user?.isAdmin || false);
    setUserRole(user?.role || '');
  }, [user]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden';
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <>
      <button type="button" className="mobile-menu-button" onClick={toggleMobileMenu}>
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-section">
          <div className="logo-icon">
            <Users className="h-6 w-6 text-[#474787]" />
            <span className="logo-text">My-Task</span>
          </div>
        </div>

        <nav className="nav-container">
          {isAdmin ? (
            <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span>Admin Dashboard</span>
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

          {(isAdmin || user?.role === 'hr_manager') && (
            <>
              <div className="section-divider">Administration</div>
              {isAdmin && (
                <>
                  <NavLink to="/staff-requests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <UserPlus className="h-5 w-5" />
                    <span>Staff Requests</span>
                  </NavLink>
                  <NavLink to="/manage-employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Users className="h-5 w-5" />
                    <span>Manage Employees</span>
                  </NavLink>
                  <NavLink to="/branch-management" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Building className="h-5 w-5" />
                    <span>Branch Management</span>
                  </NavLink>
                </>
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
          {(isAdmin || user?.role === 'hr_manager') && (
            <NavLink to="/holidays" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar className="h-5 w-5" />
              <span>Holidays</span>
            </NavLink>
          )}
          {(isAdmin || user?.role === 'hr_manager') && (
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
    </>
  );
};

export default Sidebar;