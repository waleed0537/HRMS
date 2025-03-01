import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Search } from 'lucide-react';
import NotificationDropdown from '../NotificationDropdown';
import '../../assets/css/header.css';

const Header = ({ user, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const notifications = await response.json();
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setShowProfile(false);
  };

  const getInitials = (email) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0].toUpperCase())
      .join('');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showProfile) setShowProfile(false);
    if (showSearch) setShowSearch(false);
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
    if (showNotifications) setShowNotifications(false);
    if (showSearch) setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showNotifications) setShowNotifications(false);
    if (showProfile) setShowProfile(false);
  };

  return (
    <header className="app-header">
      <div className="app-header__container">
        {/* Mobile Search Toggle */}
        <button className="app-header__search-toggle" onClick={toggleSearch}>
          <Search size={20} color="white" />
        </button>

        {/* Search Container - Hidden on mobile until toggled */}
        <div className={`app-header__search ${showSearch ? 'app-header__search--active' : ''}`}>
          <input
            type="search"
            placeholder="Search..."
            className="app-header__search-input"
          />
          <span className="app-header__search-icon">🔍</span>
          <button className="app-header__search-close" onClick={() => setShowSearch(false)}>
            <X size={18} color="#666" />
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
                <span className="app-header__notification-badge">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <>
                <NotificationDropdown 
                  onClose={() => setShowNotifications(false)}
                />
                <div 
                  className="app-header__dropdown-overlay"
                  onClick={() => setShowNotifications(false)}
                ></div>
              </>
            )}
          </div>

          <div className="app-header__profile">
            <button
              className="app-header__profile-btn"
              onClick={toggleProfile}
            >
              <div className="app-header__profile-avatar">
                <span>{user ? getInitials(user.email) : 'U'}</span>
              </div>
              <div className="app-header__profile-info">
                <p className="app-header__profile-name">{user?.email || 'User'}</p>
                <p className="app-header__profile-role">{user?.role || 'Role'}</p>
              </div>
            </button>

            {showProfile && (
              <>
                <div className="app-header__profile-dropdown">
                  <button className="app-header__dropdown-item" onClick={() => navigate('/profile')}>
                    👤 Profile
                  </button>
                  <button className="app-header__dropdown-item" onClick={() => navigate('/settings')}>
                    ⚙️ Settings
                  </button>
                  <div className="app-header__dropdown-divider"></div>
                  <button className="app-header__dropdown-item app-header__dropdown-item--logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
                <div 
                  className="app-header__dropdown-overlay"
                  onClick={() => setShowProfile(false)}
                ></div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Search Overlay */}
      {showSearch && <div className="app-header__search-overlay" onClick={() => setShowSearch(false)}></div>}
    </header>
  );
};

export default Header;