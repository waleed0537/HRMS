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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Perform search if query is not empty
    if (query.trim()) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  };

  const performSearch = async (query) => {
    try {
      // Replace with your actual search API endpoint
      const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result) => {
    // Navigate based on result type
    switch(result.type) {
      case 'employee':
        navigate(`/employees/${result.id}`);
        break;
      case 'leave':
        navigate(`/leave-request/${result.id}`);
        break;
      case 'project':
        navigate(`/projects/${result.id}`);
        break;
      case 'ticket':
        navigate(`/tickets/${result.id}`);
        break;
      default:
        // Generic fallback or do nothing
        console.log('Unhandled result type:', result);
    }
    
    // Close search and clear results
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
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
        
          
          <button className="app-header__search-close" onClick={() => setShowSearch(false)}>
            <X size={18} color="#666" />
          </button>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="app-header__search-results">
              {searchResults.map((result, index) => (
                <div 
                  key={result.id} 
                  className="app-header__search-result-item"
                  onClick={() => handleSearchResultClick(result)}
                >
                  <span className="app-header__search-result-icon">
                    {result.type === 'employee' && '👤'}
                    {result.type === 'leave' && '📅'}
                    {result.type === 'project' && '📊'}
                    {result.type === 'ticket' && '🎫'}
                  </span>
                  <span className="app-header__search-result-text">
                    {result.name || result.title}
                  </span>
                </div>
              ))}
            </div>
          )}
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

    </header>
  );
};

export default Header;