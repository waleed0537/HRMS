import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Check, Clock, Upload, Settings } from 'lucide-react';
import API_BASE_URL from '../config/api';
import '../assets/css/AttendanceSyncStatus.css';

const AttendanceSyncStatus = ({ onManualSync }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/attendance/sync-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sync status: ${response.status}`);
      }

      const data = await response.json();
      setSyncStatus(data);
    } catch (err) {
      console.error('Error fetching sync status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();

    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => {
    if (onManualSync) {
      onManualSync();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatTimeSince = (timestamp) => {
    if (!timestamp) return 'Never synced';

    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMs = now - syncTime;

    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  if (loading && !syncStatus) {
    return (
      <div className="loading-container">
        <div className="loading-icon">
          <RefreshCw size={16} />
        </div>
        <span className="loading-text">Loading sync status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={18} className="error-icon" />
        <span className="error-text">Error: {error}</span>
      </div>
    );
  }

  if (!syncStatus) {
    return (
      <div className="no-status-container">
        <AlertTriangle size={18} className="no-status-icon" />
        <span className="no-status-text">No sync status available</span>
      </div>
    );
  }

  const statusColor = syncStatus.success ? 'success' : 'failed';
  const statusIcon = syncStatus.success ? <Check size={18} className="success-icon" /> : <AlertTriangle size={18} className="failed-icon" />;

  return (
    <div className={`status-container ${statusColor}`}>
      <div className="status-header">
        <div className="status-icon-container">
          {statusIcon}
          <h3 className="status-title">Attendance Sync Status</h3>
        </div>
        <div className="status-buttons">
          <button onClick={fetchSyncStatus} className="refresh-button" title="Refresh Status">
            <RefreshCw size={16} className="refresh-icon" />
          </button>
          <button onClick={handleManualSync} className="sync-button" title="Sync Now">
            <Upload size={14} className="sync-icon" />
            Sync Now
          </button>
        </div>
      </div>

      <div className="status-details">
        <div className="status-card">
          <div className="status-card-header">
            <Clock size={12} className="clock-icon" />
            Last Sync
          </div>
          <div className="status-card-content" title={formatTimestamp(syncStatus.timestamp)}>
            {formatTimeSince(syncStatus.timestamp)}
          </div>
        </div>

        <div className="status-card">
          <div className="status-card-header">Status</div>
          <div className="status-card-content">
            {syncStatus.success ? 'Success' : 'Failed'}
          </div>
        </div>

        <div className="status-card">
          <div className="status-card-header">Records</div>
          <div className="status-card-content">
            {syncStatus.count || 0} processed
            {syncStatus.added > 0 && ` (${syncStatus.added} new)`}
          </div>
        </div>
      </div>

      {syncStatus.message && (
        <div className="status-message">
          {syncStatus.message}
        </div>
      )}

      <div className="device-info">
        <Settings size={10} className="settings-icon" />
        Device: {syncStatus.config?.ip}:{syncStatus.config?.port}
      </div>
    </div>
  );
};

export default AttendanceSyncStatus;
