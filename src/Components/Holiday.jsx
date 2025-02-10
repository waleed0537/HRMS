// src/Components/Holiday.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X 
} from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/Holiday.css';

const Holiday = () => {
  const [holidays, setHolidays] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    holidayName: '',
    holidayDate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/holidays`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch holidays');
      const data = await response.json();
      setHolidays(data);
    } catch (error) {
      setError('Failed to fetch holidays');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to add holiday');
      
      setSuccess('Holiday added successfully');
      setShowForm(false);
      setFormData({ holidayName: '', holidayDate: '' });
      fetchHolidays();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/holidays/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete holiday');
      
      setSuccess('Holiday deleted successfully');
      fetchHolidays();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="holiday-container">
      <div className="holiday-header">
        <h2 className="page-title">Holidays</h2>
        <button
          className="add-button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Add Holiday
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="holiday-form">
          <h3>Add New Holiday</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label>Holiday Name</label>
                <input
                  type="text"
                  value={formData.holidayName}
                  onChange={(e) => setFormData({
                    ...formData,
                    holidayName: e.target.value
                  })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.holidayDate}
                  onChange={(e) => setFormData({
                    ...formData,
                    holidayDate: e.target.value
                  })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="cancel-button">
                <X size={20} />
                Cancel
              </button>
              <button type="submit" className="submit-button">
                <Save size={20} />
                Save Holiday
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="holidays-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Holiday Day</th>
              <th>Holiday Date</th>
              <th>Holiday Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday, index) => (
              <tr key={holiday._id}>
                <td>{index + 1}</td>
                <td>{holiday.holidayDay}</td>
                <td>{new Date(holiday.holidayDate).toLocaleDateString()}</td>
                <td>{holiday.holidayName}</td>
                <td>
                  <button
                    onClick={() => handleDelete(holiday._id)}
                    className="delete-button"
                    title="Delete holiday"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Holiday;