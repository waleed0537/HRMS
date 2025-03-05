import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  List, 
  Grid, 
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon,
  Sun,
  Clock
} from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/Holiday.css';

const Holiday = () => {
  const [holidays, setHolidays] = useState([]);
  const [filteredHolidays, setFilteredHolidays] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    holidayName: '',
    holidayDate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    weekend: 0
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    // Filter holidays by selected year
    if (holidays.length > 0) {
      const filtered = holidays.filter(holiday => 
        new Date(holiday.holidayDate).getFullYear() === selectedYear
      );
      setFilteredHolidays(filtered);
      
      // Calculate stats
      const now = new Date();
      const upcoming = holidays.filter(holiday => 
        new Date(holiday.holidayDate) > now
      ).length;
      
      const weekend = filtered.filter(holiday => {
        const day = new Date(holiday.holidayDate).getDay();
        return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
      }).length;
      
      setStats({
        total: filtered.length,
        upcoming,
        weekend
      });
    }
  }, [holidays, selectedYear]);

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchHolidays = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (date) => {
    return new Date(date).toLocaleString('default', { month: 'short' });
  };

  const isWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  };

  const generateCalendarData = () => {
    const calendar = [];
    
    filteredHolidays.forEach(holiday => {
      const date = new Date(holiday.holidayDate);
      const day = date.getDate();
      const month = date.getMonth();
      const dayName = date.toLocaleString('default', { weekday: 'short' });
      
      calendar.push({
        date: holiday.holidayDate,
        day,
        month,
        dayName,
        holidayName: holiday.holidayName,
        isWeekend: isWeekend(holiday.holidayDate),
        isHoliday: true
      });
    });
    
    return calendar;
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  if (loading && holidays.length === 0) {
    return (
      <div className="holiday-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading holidays...</p>
        </div>
      </div>
    );
  }

  if (error && holidays.length === 0) {
    return (
      <div className="holiday-container">
        <div className="error-container">
          <AlertCircle size={48} />
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchHolidays} className="retry-button">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="holiday-container">
      <div className="holiday-header">
        <div className="header-content">
          <h2 className="page-title">Holiday Management</h2>
          
        </div>
        <button
          className="add-button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Add Holiday
        </button>
      </div>

      {error && (
        <div className="message error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="message success-message">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card" style={{color:'white'}}>
          <div className="stat-icon total-icon">
            <CalendarIcon size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">This year</div>
          </div>
        </div>
        
        <div className="stat-card" style={{color:'white'}}>
          <div className="stat-icon upcoming-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">Upcoming holidays</div>
          </div>
        </div>
        
        <div className="stat-card" style={{color:'white'}}>
          <div className="stat-icon weekend-icon">
            <Sun size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.weekend}</div>
            <div className="stat-label">Weekend holidays</div>
          </div>
        </div>
      </div>

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

      <div className="holidays-table-container">
        <div className="holidays-table-header">
          <h3>Holiday List</h3>
          <div className="header-actions" style={{ display: 'flex', gap: '16px' }}>
            <div className="holiday-view-toggle">
              <button 
                className={`holiday-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List size={16} />
                
              </button>
              <button 
                className={`holiday-view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <Grid size={16} />
              
              </button>
            </div>
            
            <div className="year-filter">
              <span className="year-filter-label">Filter</span>
              <select 
                className="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {getYearOptions().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="holiday-count">
              <CalendarIcon size={16} />
              <span>{filteredHolidays.length} holidays</span>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="table-wrapper">
            {filteredHolidays.length === 0 ? (
              <div className="no-holidays">
                <div className="no-holidays-icon">📅</div>
                <h4>No holidays found</h4>
                <p>No holidays have been added for {selectedYear} yet.</p>
              </div>
            ) : (
              <table className="holidays-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Holiday Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays.map((holiday, index) => (
                    <tr key={holiday._id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="holiday-date-1">
                          <div className="holiday-month-1">
                            {getMonthName(holiday.holidayDate)}
                          </div>
                          <div>{new Date(holiday.holidayDate).getDate()}, {new Date(holiday.holidayDate).getFullYear()}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`holiday-badge ${isWeekend(holiday.holidayDate) ? 'weekend' : 'weekday'}`}>
                          {holiday.holidayDay}
                        </span>
                      </td>
                      <td>{holiday.holidayName}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleDelete(holiday._id)}
                          className="action-button delete-button"
                          title="Delete holiday"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="calendar-view">
            {generateCalendarData().map((day, index) => (
              <div 
                key={index}
                className={`calendar-day ${day.isWeekend ? 'is-weekend' : ''} ${day.isHoliday ? 'is-holiday' : ''}`}
              >
                <div className="day-number">{day.day}</div>
                <div className="day-name">{day.dayName}</div>
                <div className="holiday-name">{day.holidayName}</div>
              </div>
            ))}
            {filteredHolidays.length === 0 && (
              <div className="no-holidays" style={{ gridColumn: '1 / -1' }}>
                <div className="no-holidays-icon">📅</div>
                <h4>No holidays found</h4>
                <p>No holidays have been added for {selectedYear} yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Holiday;