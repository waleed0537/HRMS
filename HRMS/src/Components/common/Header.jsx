import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/Header.css';

const Header = ({ user, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

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

  return (
    <header className="header">
      <div className="header-container">
        <div className="search-container">
          <input
            type="search"
            placeholder="Search..."
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="header-actions">
          <div className="notification-container">
            <button className="notification-btn">
              🔔
              <span className="notification-dot"></span>
            </button>
          </div>

          <div className="profile-container">
            <button
              className="profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="profile-info">
                <p className="profile-name">{user?.email || 'User'}</p>
                <p className="profile-role">{user?.role || 'Role'}</p>
              </div>
              <div className="profile-avatar">
                <span>{user ? getInitials(user.email) : 'U'}</span>
              </div>
            </button>

            {showProfile && (
              <>
                <div className="profile-dropdown">
                  <button className="dropdown-item" onClick={() => navigate('/profile')}>
                    👤 Profile
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/settings')}>
                    ⚙️ Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
                <div 
                  className="dropdown-overlay"
                  onClick={() => setShowProfile(false)}
                ></div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;