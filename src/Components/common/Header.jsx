import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import '../../assets/css/header.css';
import NotificationDropdown from '../NotificationDropdown';

const Header = ({ user, onLogout }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const location = useLocation();

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    
    // Convert route to title case
    return path.substring(1).split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    if (showNotifications) setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showProfileDropdown) setShowProfileDropdown(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  // Function to render either an avatar image or a text-based avatar with user's initial
  const renderAvatar = () => {
    // Extract user name from email (before the @) for display
    const userName = user?.email ? user.email.split('@')[0] : 'User';
    
    // Get first initial for fallback
    const initial = userName.charAt(0).toUpperCase();
    
    // If user has a profilePic number, try to use the avatar image
    if (user?.profilePic) {
      return (
        <div className="app-header__profile-avatar">
          <img 
            src={`/src/avatars/avatar-${user.profilePic}.jpg`} 
            alt="Profile Avatar" 
            style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
            onError={(e) => {
              // If image fails to load, replace with initial
              e.target.style.display = 'none';
              e.target.parentNode.classList.add('initial-avatar');
              e.target.parentNode.innerText = initial;
            }}
          />
        </div>
      );
    }
    
    // Fallback to initial-based avatar
    return (
      <div 
        className="app-header__profile-avatar initial-avatar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#474787',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        {initial}
      </div>
    );
  };

  return (
    <header className="app-header">
      <div className="app-header__container">
        <button 
          className="app-header__search-toggle" 
          onClick={toggleMobileSearch}
        >
          <Search size={20} color="white" />
        </button>

        <div className={`app-header__search ${showMobileSearch ? 'app-header__search--active' : ''}`}>
          <Search className="app-header__search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="app-header__search-input" 
          />
          <button 
            className="app-header__search-close" 
            onClick={toggleMobileSearch}
          >
            <Search size={20} />
          </button>
        </div>

        <div className="app-header__actions">
          <div className="app-header__notification">
            <button 
              className="app-header__notification-btn"
              onClick={toggleNotifications}
            >
              <Bell size={20} color="white" />
              <span className="app-header__notification-badge">3</span>
            </button>
            
            {showNotifications && (
              <>
                <div 
                  className="app-header__dropdown-overlay"
                  onClick={() => setShowNotifications(false)}
                ></div>
                <NotificationDropdown />
              </>
            )}
          </div>
          
          <div className="app-header__profile">
            <button 
              className="app-header__profile-btn"
              onClick={toggleProfileDropdown}
            >
              <div className="app-header__profile-info">
                <p className="app-header__profile-name">
                  {user.email ? user.email.split('@')[0] : 'User'}
                </p>
                <p className="app-header__profile-role">{user.role}</p>
              </div>
              
              {renderAvatar()}
            </button>
            
            {showProfileDropdown && (
              <>
                <div 
                  className="app-header__dropdown-overlay"
                  onClick={() => setShowProfileDropdown(false)}
                ></div>
                <div className="app-header__profile-dropdown">
                  <button className="app-header__dropdown-item">
                    <User size={18} />
                    My Profile
                  </button>
                  <button className="app-header__dropdown-item">
                    <Settings size={18} />
                    Settings
                  </button>
                  <div className="app-header__dropdown-divider"></div>
                  <button 
                    className="app-header__dropdown-item app-header__dropdown-item--logout"
                    onClick={onLogout}
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {showMobileSearch && (
        <div 
          className="app-header__search-overlay"
          onClick={() => setShowMobileSearch(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;