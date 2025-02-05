import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  CircleDollarSign, 
  AppWindow, 
  Menu, 
  X,
  UserPlus,
  Calendar,
  FileText,
  History,
  UserSquare2,
  ChevronDown,
  ChevronUp,
  Building
} from 'lucide-react';
import EmployeeCards from '../EmployeeCards';
import '../../assets/css/sidebar.css';

const Sidebar = ({ user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [showEmployees, setShowEmployees] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.isAdmin || false);
    setIsEmployee(user?.role === 'employee' || user?.role === 'agent');
  }, [user]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden';
  };

  const toggleEmployees = () => {
    setShowEmployees(!showEmployees);
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
          </div>
          <span className="logo-text">My-Task</span>
      
        </div>

        <nav className="nav-container">
          {/* Core Navigation */}
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>

          {/* Employee Section - Only for admin and HR */}
          {/* Admin and HR sections */}
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

              <NavLink to="/edit-profiles" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText className="h-5 w-5" />
                <span>Edit Profiles</span>
              </NavLink>
            </>
          )}

          {/* Leave Management Section */}
          <div className="section-divider">Leave Management</div>
          
          {/* Employee-only views */}
          {isEmployee && (
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

          {/* Admin and HR Manager leave management */}
          {(isAdmin || user?.role === 'hr_manager') && (
            <NavLink to="/manage-leaves" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText className="h-5 w-5" />
              <span>Manage Leaves</span>
            </NavLink>
          )}

          {/* Admin-only leave history */}
          {isAdmin && (
            <NavLink to="/leave-history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History className="h-5 w-5" />
              <span>Leave History & Quotas</span>
            </NavLink>
          )}

          {/* Finance Section */}
          <div className="section-divider">Finance</div>
          
          <NavLink to="/accounts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CircleDollarSign className="h-5 w-5" />
            <span>Accounts</span>
          </NavLink>

          {/* Additional Features */}
          <div className="section-divider">Additional Features</div>
          
          <NavLink to="/app" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <AppWindow className="h-5 w-5" />
            <span>App</span>
          </NavLink>

          {/* Admin-only sections */}
          {isAdmin && (
            <>
              <div className="section-divider">Administration</div>
              
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
        </nav>
      </div>
      
      {isMobileMenuOpen && <div className="overlay" onClick={toggleMobileMenu}></div>}
    </>
  );
};

export default Sidebar;