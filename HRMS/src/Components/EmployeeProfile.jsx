import React, { useState, useEffect } from 'react';
import { Mail, Phone, Building, Star, Calendar, FileText } from 'lucide-react';
import '../assets/css/EmployeeProfile.css';

const EmployeeProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  const fetchEmployeeProfile = async () => {
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        throw new Error('No user data found');
      }

      // Fetch employee data using user ID
      const response = await fetch(`http://localhost:5000/api/employees/profile/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      console.log('Fetched profile data:', data); // For debugging
      setProfileData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!profileData) {
    return <div className="error">No profile data found</div>;
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {getInitials(profileData.personalDetails?.name || 'User Name')}
          </div>
          <div className="profile-title">
            <h1>{profileData.personalDetails?.name}</h1>
            <p className="profile-role">{profileData.professionalDetails?.role}</p>
            <span className={`status-badge status-${profileData.professionalDetails?.status?.toLowerCase()}`}>
              {profileData.professionalDetails?.status}
            </span>
          </div>
        </div>

        <div className="profile-content">
          <div className="info-section">
            <h2>Personal Information</h2>
            <div className="info-item">
              <Mail size={20} />
              <span className="info-label">Email</span>
              <span className="info-value">{profileData.personalDetails?.email}</span>
            </div>
            <div className="info-item">
              <Phone size={20} />
              <span className="info-label">Phone</span>
              <span className="info-value">{profileData.personalDetails?.contact}</span>
            </div>
            <div className="info-item">
              <Building size={20} />
              <span className="info-label">Branch</span>
              <span className="info-value">{profileData.professionalDetails?.branch}</span>
            </div>
            <div className="info-item">
              <Calendar size={20} />
              <span className="info-label">Joined Date</span>
              <span className="info-value">
                {new Date(profileData.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="info-section">
            <h2>Professional Information</h2>
            <div className="info-item">
              <FileText size={20} />
              <span className="info-label">Employee ID</span>
              <span className="info-value">{profileData.personalDetails?.id}</span>
            </div>
            <div className="info-item">
              <Building size={20} />
              <span className="info-label">Department</span>
              <span className="info-value">
                {profileData.professionalDetails?.department || 'Not Assigned'}
              </span>
            </div>
            <div className="info-item">
              <Star size={20} />
              <span className="info-label">Rating</span>
              <span className="info-value">{profileData.rating || 'N/A'}</span>
            </div>
          </div>
        </div>

        {profileData.documents && profileData.documents.length > 0 && (
          <div className="documents-section">
            <h2>Documents</h2>
            <div className="documents-grid">
              {profileData.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <span className="doc-name">{doc.name}</span>
                  <span className="doc-date">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;