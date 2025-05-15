import React, { useState, useEffect } from 'react';
import { Building, Plus, Save, X, Info, Trash2, AlertCircle, Users } from 'lucide-react';
import '../assets/css/BranchManagement.css';
import API_BASE_URL from '../config/api.js';
import { useToast } from './common/ToastContent.jsx';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [branchEmployees, setBranchEmployees] = useState({});
  const { success, error } = useToast();

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
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
      setEmployees(data.filter(emp => emp.professionalDetails.status === 'active'));
      
      // Group employees by branch and role
      const employeesByBranch = {};
      
      data.forEach(emp => {
        const branch = emp.professionalDetails?.branch;
        const role = emp.professionalDetails?.role;
        
        if (branch && role) {
          if (!employeesByBranch[branch]) {
            employeesByBranch[branch] = {
              hr_manager: [],
              t1_member: [],
              operational_manager: []
            };
          }
          
          if (role === 'hr_manager') {
            employeesByBranch[branch].hr_manager.push(emp);
          } else if (role === 't1_member') {
            employeesByBranch[branch].t1_member.push(emp);
          } else if (role === 'operational_manager') {
            employeesByBranch[branch].operational_manager.push(emp);
          }
        }
      });
      
      setBranchEmployees(employeesByBranch);
    } catch (err) {
      console.error('Error fetching employees:', err);
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
    } catch (err) {
      error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      error('Please enter a branch name');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use an invalid ObjectId instead of a real employee
      // This is a workaround because the API requires ObjectIds, but we want these to be unassigned
      // This should be fixed on the server side ideally
      const PLACEHOLDER_ID = "000000000000000000000000"; // 24 zeros (invalid ObjectId)
      
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          hrManager: PLACEHOLDER_ID,
          t1Member: PLACEHOLDER_ID,
          operationalManager: PLACEHOLDER_ID
        })
      });

      if (!response.ok) throw new Error('Failed to create branch');
      
      await fetchBranches();
      await fetchEmployees(); // Refresh employee data to update branch assignments
      setShowForm(false);
      setFormData({ name: '' });
      success('Branch created successfully. Please assign team members in Edit Profiles.');
    } catch (err) {
      error(err.message || 'Failed to create branch');
    } finally {
      setLoading(false);
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
      success('Branch deleted successfully');
    } catch (err) {
      error(err.message || 'Failed to delete branch');
    }
  };
  
  const getBranchEmployeesContent = (branchName, roleType) => {
    const branchData = branchEmployees[branchName];
    if (!branchData || !branchData[roleType] || branchData[roleType].length === 0) {
      return {
        hasEmployees: false,
        content: (
          <span className="role-value not-specified">Not Specified</span>
        )
      };
    }
    
    return {
      hasEmployees: true,
      content: (
        <div className="role-employees">
          {branchData[roleType].map((emp, index) => (
            <span key={emp._id} className="role-employee">
              {emp.personalDetails?.name}
              {index < branchData[roleType].length - 1 && ", "}
            </span>
          ))}
        </div>
      )
    };
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

      {/* Info message about position management */}
      <div className="branch-info-message">
        <Info size={20} />
        <div>
          <h3>Managing Branch Positions</h3>
          <p>
            Branch positions (HR Manager, T1 Member, Operational Manager) should be assigned 
            through the <strong>Edit Profiles</strong> page. Create branches here, then 
            assign team members separately.
          </p>
        </div>
      </div>

      {showForm && (
        <div className="branch-form">
          <h3 className="form-title">
            <Building size={20} />
            Add New Branch
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
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '' });
                }}
                className="button button-secondary"
                disabled={loading}
              >
                <X size={20} />
                Cancel
              </button>
              <button 
                type="submit" 
                className="button button-primary"
                disabled={loading}
              >
                <Save size={20} />
                {loading ? 'Creating...' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="branch-grid">
        {branches.map(branch => {
          // Get employees for this branch from our grouped employees
          const hrContent = getBranchEmployeesContent(branch.name, 'hr_manager');
          const t1Content = getBranchEmployeesContent(branch.name, 't1_member');
          const omContent = getBranchEmployeesContent(branch.name, 'operational_manager');
          
          return (
            <div key={branch._id} className="branch-card">
              <div className="branch-header">
                <div className="branch-name">
                  <Building size={20} />
                  {branch.name}
                </div>
                <div className="branch-actions">
                  <button
                    onClick={() => handleDelete(branch._id)}
                    className="delete-button"
                    title="Delete branch"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="branch-content">
                <div className="role-section">
                  <div className="role-info">
                    <span className="role-label">
                      <Users size={14} /> HR Manager
                      {hrContent.hasEmployees && hrContent.content.props.children.length > 1 && (
                        <span className="role-count">{hrContent.content.props.children.length}</span>
                      )}
                    </span>
                    {hrContent.content}
                  </div>
                </div>

                <div className="role-section">
                  <div className="role-info">
                    <span className="role-label">
                      <Users size={14} /> T1 Member
                      {t1Content.hasEmployees && t1Content.content.props.children.length > 1 && (
                        <span className="role-count">{t1Content.content.props.children.length}</span>
                      )}
                    </span>
                    {t1Content.content}
                  </div>
                </div>

                <div className="role-section">
                  <div className="role-info">
                    <span className="role-label">
                      <Users size={14} /> Operational Manager
                      {omContent.hasEmployees && omContent.content.props.children.length > 1 && (
                        <span className="role-count">{omContent.content.props.children.length}</span>
                      )}
                    </span>
                    {omContent.content}
                  </div>
                </div>

                <div className="branch-edit-info">
                  <AlertCircle size={16} />
                  <span>To assign or change positions, please use the Edit Profiles page.</span>
                </div>
              </div>
            </div>
          );
        })}

        {branches.length === 0 && !loading && (
          <div className="empty-state">
            <Building size={64} />
            <h3>No Branches Found</h3>
            <p>Create your first branch to start organizing your team.</p>
          </div>
        )}

        {loading && branches.length === 0 && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading branches...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManagement;