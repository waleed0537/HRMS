// sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  FolderKanban, 
  Ticket, 
  UserSquare2, 
  CircleDollarSign, 
  AppWindow, 
  Files, 
  PenSquare, 
  Menu, 
  X,
  UserPlus 
} from 'lucide-react';
import EmployeeCards from '../EmployeeCards';
import '../../assets/css/sidebar.css';

const Sidebar = () => {
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin when component mounts
    const user = JSON.parse(localStorage.getItem('user'));
    setIsAdmin(user?.isAdmin || false);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = isMobileMenuOpen ? 'auto' : 'hidden';
  };

  // Cleanup effect for body scroll
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
          <button className="close-button" onClick={toggleMobileMenu}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="nav-container">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FolderKanban className="h-5 w-5" />
            <span>Projects</span>
          </NavLink>

          <NavLink to="/tickets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Ticket className="h-5 w-5" />
            <span>Tickets</span>
          </NavLink>

          <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UserSquare2 className="h-5 w-5" />
            <span>Our Clients</span>
          </NavLink>

          <div className={`employee-section ${employeesOpen ? 'active' : ''}`}>
            <button className="employee-button" onClick={() => setEmployeesOpen(!employeesOpen)}>
              <Users className="h-5 w-5" />
              <span>Employees</span>
            </button>

            {employeesOpen && (
              <div className="submenu">
                <div className="submenu-content">
                  <EmployeeCards />
                </div>
              </div>
            )}
          </div>

          <NavLink to="/accounts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CircleDollarSign className="h-5 w-5" />
            <span>Accounts</span>
          </NavLink>

          <NavLink to="/payroll" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users className="h-5 w-5" />
            <span>Payroll</span>
          </NavLink>

          <NavLink to="/app" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <AppWindow className="h-5 w-5" />
            <span>App</span>
          </NavLink>

          <NavLink to="/other-pages" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Files className="h-5 w-5" />
            <span>Other Pages</span>
          </NavLink>

          <NavLink to="/ui-components" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <PenSquare className="h-5 w-5" />
            <span>UI Components</span>
          </NavLink>

          {/* Admin-only Add Staff Button */}
          {isAdmin && (
            <NavLink to="/staff-requests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserPlus className="h-5 w-5" />
              <span>Add Staff</span>
            </NavLink>
          )}
        </nav>
      </div>
      
      {isMobileMenuOpen && <div className="overlay" onClick={toggleMobileMenu}></div>}
    </>
  );
};

export default Sidebar;