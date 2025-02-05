import React, { useState } from 'react';
import '../assets/css/BranchAnnouncementForm.css';

const BranchAnnouncementForm = ({ user, onAnnouncementCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [branch, setBranch] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          branch,
          createdBy: user.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create announcement');
      }

      const newAnnouncement = await response.json();
      onAnnouncementCreated(newAnnouncement);
      
      // Reset form
      setTitle('');
      setContent('');
      setBranch('');
      setExpiresAt('');
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError(error.message);
    }
  };

  return (
    <div className="announcement-form-container">
      <h2>Create Branch Announcement</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Branch</label>
          <select 
            value={branch} 
            onChange={(e) => setBranch(e.target.value)}
            required
          >
            <option value="">Select Branch</option>
            {user.managedBranches?.map((branchName) => (
              <option key={branchName} value={branchName}>
                {branchName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement Title"
            required
          />
        </div>

        <div className="form-group">
          <label>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Announcement Details"
            required
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Expiration Date (Optional)</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-button">
          Create Announcement
        </button>
      </form>
    </div>
  );
};

export default BranchAnnouncementForm;