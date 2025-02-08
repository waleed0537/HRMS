import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building, User, Briefcase, FileText } from 'lucide-react';
import '../assets/css/EmployeeProfile.css';
import API_BASE_URL from '../config/api.js';
const EmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProfile();
  }, []);

  if (error) return <div className="error-container">Error loading profile: {error}</div>;
  if (!profile) return <div className="loading-container">Loading...</div>;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {getInitials(profile.personalDetails.name)}
          </div>
          <div className="profile-overview">
            <h1>{profile.personalDetails.name}</h1>
            <p className="profile-id">ID: {profile.personalDetails.id}</p>
            <span className={`status-badge status-${profile.professionalDetails.status}`}>
              {profile.professionalDetails.status}
            </span>
          </div>
          <div className="profile-key-info">
            <div className="key-info-item">
              <label>Department</label>
              <span>{profile.professionalDetails.department}</span>
            </div>
            <div className="key-info-item">
              <label>Role</label>
              <span>{profile.professionalDetails.role}</span>
            </div>
            <div className="key-info-item">
              <label>Branch</label>
              <span>{profile.professionalDetails.branch}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-details-grid">
        <div className="details-card">
          <div className="card-title">
            <User size={20} />
            <h2>Personal Information</h2>
          </div>
          <div className="details-content">
            <div className="details-row">
              <div className="detail-item">
                <label><Mail size={16} /> Email</label>
                <span>{profile.personalDetails.email}</span>
              </div>
              <div className="detail-item">
                <label><Phone size={16} /> Contact</label>
                <span>{profile.personalDetails.contact}</span>
              </div>
            </div>
            <div className="detail-item full-width">
              <label><MapPin size={16} /> Address</label>
              <span>{profile.personalDetails.address}</span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-title">
            <Briefcase size={20} />
            <h2>Professional Details</h2>
          </div>
          <div className="details-content">
            <div className="details-row">
              <div className="detail-item">
                <label><Building size={16} /> Department</label>
                <span>{profile.professionalDetails.department}</span>
              </div>
              <div className="detail-item">
                <label><FileText size={16} /> Status</label>
                <span className="status-text">{profile.professionalDetails.status}</span>
              </div>
            </div>
            <div className="details-row">
              <div className="detail-item">
                <label><User size={16} /> Role</label>
                <span>{profile.professionalDetails.role}</span>
              </div>
              <div className="detail-item">
                <label><Building size={16} /> Branch</label>
                <span>{profile.professionalDetails.branch}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;