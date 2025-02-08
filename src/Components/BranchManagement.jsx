import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit2, Save, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      console.log('Fetched employees:', data);
      setEmployees(data.filter(emp => emp.professionalDetails.status === 'active'));
    } catch (error) {
      setError('Failed to fetch employees');
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      console.log('Fetched branches:', data);
      setBranches(data);
    } catch (error) {
      setError('Failed to fetch branches');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
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
      setSuccess(editingBranch ? 'Branch updated successfully' : 'Branch created successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRoleChange = async (branchId, role, employeeId) => {
    try {
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
      setSuccess('Role updated successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete branch');
      await fetchBranches();
      setSuccess('Branch deleted successfully');
    } catch (error) {
      setError(error.message);
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

  return (
    <div className="branch-management">
      <div className="branch-header-section">
        <h2 className="title">Branch Management</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="add-button">
            <Plus size={20} />
            Add Branch
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="branch-form">
          <h3 className="form-title">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
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
                />
              </div>

              <div className="form-field">
                <label className="form-label">HR Manager</label>
                <select
                  value={formData.hrManager}
                  onChange={(e) => setFormData({...formData, hrManager: e.target.value})}
                  className="form-select"
                  required
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
              >
                <X size={20} />
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                <Save size={20} />
                {editingBranch ? 'Update' : 'Create'} Branch
              </button>
            </div>
          </form>
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
                  className="toggle-button"
                  title="Edit branch"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(branch._id)}
                  className="delete-button"
                  title="Delete branch"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={() => setExpandedBranch(expandedBranch === branch._id ? null : branch._id)}
                  className="toggle-button"
                  title="Toggle details"
                >
                  {expandedBranch === branch._id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="branch-content">
              <div className="role-section">
                <div className="role-info">
                  <span className="role-label">HR Manager</span>
                  <span className="role-value">
                    {employees.find(emp => emp._id === branch.hrManager)?.personalDetails.name || 'Not Assigned'}
                  </span>
                </div>
                {expandedBranch === branch._id && (
                  <select
                    onChange={(e) => handleRoleChange(branch._id, 'hrManager', e.target.value)}
                    className="role-select"
                    value={branch.hrManager || ''}
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
                  <span className="role-label">T1 Member</span>
                  <span className="role-value">
                    {employees.find(emp => emp._id === branch.t1Member)?.personalDetails.name || 'Not Assigned'}
                  </span>
                </div>
                {expandedBranch === branch._id && (
                  <select
                    onChange={(e) => handleRoleChange(branch._id, 't1Member', e.target.value)}
                    className="role-select"
                    value={branch.t1Member || ''}
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
                  <span className="role-label">Operational Manager</span>
                  <span className="role-value">
                    {employees.find(emp => emp._id === branch.operationalManager)?.personalDetails.name || 'Not Assigned'}
                  </span>
                </div>
                {expandedBranch === branch._id && (
                  <select
                    onChange={(e) => handleRoleChange(branch._id, 'operationalManager', e.target.value)}
                    className="role-select"
                    value={branch.operationalManager || ''}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchManagement;