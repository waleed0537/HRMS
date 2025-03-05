import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  Edit2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Users, 
  User, 
  Briefcase,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import '../assets/css/BranchManagement.css';
import API_BASE_URL from '../config/api.js';

const BranchManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hrManager: '',
    t1Member: '',
    operationalManager: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-hide success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.filter(emp => emp.professionalDetails.status === 'active'));
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch employees');
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      setBranches(data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch branches');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const url = editingBranch 
        ? `${API_BASE_URL}/api/branches/${editingBranch._id}`
        : `${API_BASE_URL}/api/branches`;
      
      const method = editingBranch ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save branch');
      
      await fetchBranches();
      setShowForm(false);
      setEditingBranch(null);
      setFormData({
        name: '',
        hrManager: '',
        t1Member: '',
        operationalManager: ''
      });
      
      setNotification({
        show: true,
        message: editingBranch ? 'Branch updated successfully' : 'Branch created successfully',
        type: 'success'
      });
      
    } catch (error) {
      setNotification({
        show: true,
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (branchId, role, employeeId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/branches/${branchId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role, employeeId })
      });

      if (!response.ok) throw new Error('Failed to update role');
      await fetchBranches();
      
      setNotification({
        show: true,
        message: 'Role updated successfully',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete branch');
      await fetchBranches();
      
      setNotification({
        show: true,
        message: 'Branch deleted successfully',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setFormData({
      name: branch.name,
      hrManager: branch.hrManager,
      t1Member: branch.t1Member,
      operationalManager: branch.operationalManager
    });
    setEditingBranch(branch);
    setShowForm(true);
    setExpandedBranch(null);
  };

  const renderEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? employee.personalDetails.name : 'Not Assigned';
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'hrManager': return <Users size={16} />;
      case 't1Member': return <User size={16} />;
      case 'operationalManager': return <Briefcase size={16} />;
      default: return <User size={16} />;
    }
  };

  return (
    <div className="branch-management">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} className="notification-icon" />
          ) : (
            <XCircle size={20} className="notification-icon" />
          )}
          {notification.message}
        </div>
      )}

      <div className="branch-header-section">
        <h2 className="title">Branch Management</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="add-button">
            <Plus size={20} />
            Add Branch
          </button>
        )}
      </div>

      {error && <div className="error-message"><XCircle size={20} /> {error}</div>}
      {success && <div className="success-message"><CheckCircle size={20} /> {success}</div>}

      {loading && !showForm && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading branch data...</p>
        </div>
      )}

      {showForm && (
        <div className="branch-form">
          <h3 className="form-title">
            {editingBranch ? (
              <><Edit2 size={20} className="form-icon" /> Edit Branch</>
            ) : (
              <><Plus size={20} className="form-icon" /> Add New Branch</>
            )}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Branch Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                  placeholder="Enter branch name"
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <label className="form-label">HR Manager</label>
                <select
                  value={formData.hrManager}
                  onChange={(e) => setFormData({...formData, hrManager: e.target.value})}
                  className="form-select"
                  required
                  disabled={loading}
                >
                  <option value="">Select HR Manager</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">T1 Member</label>
                <select
                  value={formData.t1Member}
                  onChange={(e) => setFormData({...formData, t1Member: e.target.value})}
                  className="form-select"
                  required
                  disabled={loading}
                >
                  <option value="">Select T1 Member</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Operational Manager</label>
                <select
                  value={formData.operationalManager}
                  onChange={(e) => setFormData({...formData, operationalManager: e.target.value})}
                  className="form-select"
                  required
                  disabled={loading}
                >
                  <option value="">Select Operational Manager</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingBranch(null);
                  setFormData({
                    name: '',
                    hrManager: '',
                    t1Member: '',
                    operationalManager: ''
                  });
                }}
                className="button button-secondary"
                disabled={loading}
              >
                <X size={20} />
                Cancel
              </button>
              <button type="submit" className="button button-primary" disabled={loading}>
                <Save size={20} />
                {loading ? 'Saving...' : (editingBranch ? 'Update' : 'Create')} Branch
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && branches.length === 0 && (
        <div className="empty-state">
          <Building size={48} />
          <h3>No Branches Found</h3>
          <p>Get started by adding your first branch</p>
          <button onClick={() => setShowForm(true)} className="button button-primary">
            <Plus size={20} />
            Add First Branch
          </button>
        </div>
      )}

      <div className="branch-grid">
        {branches.map(branch => (
          <div key={branch._id} className="branch-card">
            <div className="branch-header">
              <div className="branch-name">
                <Building size={20} />
                {branch.name}
              </div>
              <div className="branch-actions">
                <button
                  onClick={() => handleEdit(branch)}
                  className="branch-action-button edit"
                  title="Edit branch"
                  disabled={loading}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(branch._id)}
                  className="branch-action-button delete"
                  title="Delete branch"
                  disabled={loading}
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setExpandedBranch(expandedBranch === branch._id ? null : branch._id)}
                  className="branch-action-button toggle"
                  title="Toggle details"
                  disabled={loading}
                >
                  {expandedBranch === branch._id ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="branch-content">
              <div className="role-section">
                <div className="role-info">
                  <span className="role-label">
                    <Users size={16} /> HR Manager
                  </span>
                  <span className="role-value">
                    {renderEmployeeName(branch.hrManager)}
                  </span>
                </div>
                {expandedBranch === branch._id && (
                  <select
                    onChange={(e) => handleRoleChange(branch._id, 'hrManager', e.target.value)}
                    className="role-select"
                    value={branch.hrManager || ''}
                    disabled={loading}
                  >
                    <option value="">Change HR Manager</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.personalDetails.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="role-section">
                <div className="role-info">
                  <span className="role-label">
                    <User size={16} /> T1 Member
                  </span>
                  <span className="role-value">
                    {renderEmployeeName(branch.t1Member)}
                  </span>
                </div>
                {expandedBranch === branch._id && (
                  <select
                    onChange={(e) => handleRoleChange(branch._id, 't1Member', e.target.value)}
                    className="role-select"
                    value={branch.t1Member || ''}
                    disabled={loading}
                  >
                    <option value="">Change T1 Member</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.personalDetails.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="role-section">
                <div className="role-info">
                  <span className="role-label">
                    <Briefcase size={16} /> Operational Manager
                  </span>
                  <span className="role-value">
                    {renderEmployeeName(branch.operationalManager)}
                  </span>
                </div>
                {expandedBranch === branch._id && (
                  <select
                    onChange={(e) => handleRoleChange(branch._id, 'operationalManager', e.target.value)}
                    className="role-select"
                    value={branch.operationalManager || ''}
                    disabled={loading}
                  >
                    <option value="">Change Operational Manager</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.personalDetails.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {expandedBranch === branch._id && (
                <div className="branch-info">
                  <div className="info-note">
                    <Info size={14} />
                    <span>Changing a role will update the employee's permissions</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchManagement;