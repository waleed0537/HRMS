import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import NotificationDropdown from '../NotificationDropdown';
import '../../assets/css/header.css';

const Header = ({ user, onLogout }) => {
 const [showProfile, setShowProfile] = useState(false);
 const [showNotifications, setShowNotifications] = useState(false);
 const [unreadCount, setUnreadCount] = useState(0);
 const navigate = useNavigate();

 useEffect(() => {
   fetchUnreadCount();
   const interval = setInterval(fetchUnreadCount, 30000);
   return () => clearInterval(interval);
 }, []);

 const fetchUnreadCount = async () => {
   try {
     const response = await fetch(`${API_BASE_URL}/api/notifications`, {
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('token')}`
       }
     });
     const notifications = await response.json();
     setUnreadCount(notifications.filter(n => !n.read).length);
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
           <button 
             className="notification-btn"
             onClick={toggleNotifications}
           >
             <Bell size={20} color="white" />
             {unreadCount > 0 && (
               <span className="notification-dot">{unreadCount}</span>
             )}
           </button>
           {showNotifications && (
             <>
               <NotificationDropdown onClose={() => setShowNotifications(false)} />
               <div className="dropdown-overlay" onClick={() => setShowNotifications(false)} />
             </>
           )}
         </div>

         <div className="header-profile-container">
           <button
             className="header-profile-btn"
             onClick={() => setShowProfile(!showProfile)}
           >
             <div className="header-profile-avatar">
               <span>{user ? getInitials(user.email) : 'U'}</span>
             </div>
             <div className="header-profile-info">
               <p className="header-profile-name">{user?.email || 'User'}</p>
               <p className="header-profile-role">{user?.role || 'Role'}</p>
             </div>
           </button>

           {showProfile && (
             <>
               <div className="header-profile-dropdown">
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
               <div className="dropdown-overlay" onClick={() => setShowProfile(false)} />
             </>
           )}
         </div>
       </div>
     </div>
   </header>
 );
};

export default Header;