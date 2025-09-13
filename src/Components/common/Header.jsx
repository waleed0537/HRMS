import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import '../../assets/css/header.css';
import NotificationDropdown from '../NotificationDropdown';
import API_BASE_URL from '../../config/api.js';

const Header = ({ user: propUser, onLogout }) => {
  // Add a local state for user data that always reads from localStorage
  const [localUser, setLocalUser] = useState(propUser);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  
  // This useEffect will ensure we always have the latest user data from localStorage
  useEffect(() => {
    const refreshUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setLocalUser(userData);
        } else {
          setLocalUser(propUser);
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        setLocalUser(propUser);
      }
    };

    // Initial load
    refreshUserFromStorage();

    // Set up event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        refreshUserFromStorage();
      }
    };

    // Set up event listener for custom roleChange event
    const handleRoleChange = () => {
      refreshUserFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('roleChange', handleRoleChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('roleChange', handleRoleChange);
    };
  }, [propUser]);
const handleViewProfile = () => {
  navigate('/profile');
};
  // Load avatar dynamically based on user profile pic
  useEffect(() => {
    const loadAvatar = async () => {
      // Use localUser instead of props user to ensure we have the latest data
      if (localUser?.profilePic) {
        try {
          // Use dynamic import to get the avatar
          const avatarModule = await import(`../../assets/avatars/avatar-${localUser.profilePic}.jpg`);
          setAvatarSrc(avatarModule.default);
        } catch (error) {
          console.error('Failed to load avatar:', error);
          setAvatarSrc(null);
        }
      } else {
        setAvatarSrc(null);
      }
    };
    
    loadAvatar();
  }, [localUser?.profilePic]);

  // Fetch notifications and calculate unread count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const endpoint = localUser?.role === 'hr_manager' 
          ? `/api/hr/notifications` 
          : `/api/notifications`;

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setNotifications(data);
        
        // Calculate unread notifications count
        const unreadNotifications = data.filter(notification => !notification.read);
        setUnreadCount(unreadNotifications.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (localUser) {
      fetchNotifications();
    }
  }, [localUser]);

  // Handle marking a notification as read
  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local notifications state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      );

      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

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
    // Use localUser instead of propUser
    const userName = localUser?.email ? localUser.email.split('@')[0] : 'User';
    
    // Get first initial for fallback
    const initial = userName.charAt(0).toUpperCase();
    
    // If we have successfully loaded the avatar image
    if (avatarSrc) {
      return (
        <div className="app-header__profile-avatar">
          <img 
            src={avatarSrc} 
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

  // Use localUser instead of propUser to get the most updated role
  const userEmail = localUser?.email || 'User';
  const userRole = localUser?.role || 'employee';

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
              {unreadCount > 0 && (
                <span className="app-header__notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <>
                <div 
                  className="app-header__dropdown-overlay"
                  onClick={() => setShowNotifications(false)}
                ></div>
                <NotificationDropdown 
                  notifications={notifications} 
                  onMarkAsRead={handleMarkAsRead} 
                />
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
                  {userEmail ? userEmail.split('@')[0] : 'User'}
                </p>
                <p className="app-header__profile-role">{userRole}</p>
              </div>
              
              {renderAvatar()}
            </button>
            
            {showProfileDropdown && (
              <>
                <div 
                  className="app-header__dropdown-overlay"
                  onClick={() => setShowProfileDropdown(false)}
                ></div>
                <div className="app-header__profile-dropdown" onClick={handleViewProfile}>
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