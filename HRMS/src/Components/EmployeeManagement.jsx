import React, { useState, useEffect } from 'react';
import { Plus, Save, Building, Users, Edit, Trash, X } from 'lucide-react';
import '../assets/css/EmployeeManagement.css';

const EmployeeManagement = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [editingBranch, setEditingBranch] = useState(null);
  
  const [employeeData, setEmployeeData] = useState({
    personalDetails: {
      name: '',
      id: '',
      contact: '',
      email: '',
      address: ''
    },
    professionalDetails: {
      role: 'agent',
      branch: '',
      department: '',
      status: 'active'
    },
    documents: []
  });
  
  const [branchData, setBranchData] = useState({
    name: '',
    hrManager: '',
    t1Member: '',
    operationalManager: ''
  });

  // Simulated branch data fetch
  useEffect(() => {
    // In a real app, this would be an API call
    setBranches([
      {
        id: 1,
        name: 'Main Branch',
        hrManager: 'John Doe',
        t1Member: 'Jane Smith',
        operationalManager: 'Mike Johnson'
      },
      {
        id: 2,
        name: 'East Branch',
        hrManager: 'Sarah Wilson',
        t1Member: 'Tom Brown',
        operationalManager: 'Lisa Davis'
      }
    ]);
  }, []);

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      // Add personal and professional details
      formData.append('personalDetails', JSON.stringify(employeeData.personalDetails));
      formData.append('professionalDetails', JSON.stringify(employeeData.professionalDetails));
      
      // Add documents
      employeeData.documents.forEach(doc => {
        formData.append('documents', doc);
      });
  
      const response = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Failed to create employee');
      }
  
      const result = await response.json();
      console.log('Employee created:', result);
  
      // Reset form
      setEmployeeData({
        personalDetails: {
          name: '',
          id: '',
          contact: '',
          email: '',
          address: ''
        },
        professionalDetails: {
          role: 'agent',
          branch: '',
          department: '',
          status: 'active'
        },
        documents: []
      });
  
      // Show success message
      alert('Employee added successfully!');
  
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Failed to create employee. Please try again.');
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setBranchData({
      name: branch.name,
      hrManager: branch.hrManager,
      t1Member: branch.t1Member,
      operationalManager: branch.operationalManager
    });
    setShowBranchForm(true);
  };

  const handleDeleteBranch = (branchId) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      setBranches(branches.filter(branch => branch.id !== branchId));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setEmployeeData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  return (
    <div className="employee-management-container">
      <div className="tab-buttons">
        <button
          onClick={() => setActiveTab('employees')}
          className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`}
        >
          <Users size={20} />
          Manage Employees
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`tab-button ${activeTab === 'branches' ? 'active' : ''}`}
        >
          <Building size={20} />
          Manage Branches
        </button>
      </div>

      {activeTab === 'employees' ? (
        <div className="content-card">
          <h2 className="section-title">Add New Employee</h2>
          <form onSubmit={handleEmployeeSubmit}>
            <div className="form-section">
              <h3>Personal Details</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="form-input"
                  value={employeeData.personalDetails.name}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    personalDetails: {
                      ...prev.personalDetails,
                      name: e.target.value
                    }
                  }))}
                />
                <input
                  type="text"
                  placeholder="Employee ID"
                  className="form-input"
                  value={employeeData.personalDetails.id}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    personalDetails: {
                      ...prev.personalDetails,
                      id: e.target.value
                    }
                  }))}
                />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  className="form-input"
                  value={employeeData.personalDetails.contact}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    personalDetails: {
                      ...prev.personalDetails,
                      contact: e.target.value
                    }
                  }))}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="form-input"
                  value={employeeData.personalDetails.email}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    personalDetails: {
                      ...prev.personalDetails,
                      email: e.target.value
                    }
                  }))}
                />
                <textarea
                  placeholder="Address"
                  className="form-input"
                  value={employeeData.personalDetails.address}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    personalDetails: {
                      ...prev.personalDetails,
                      address: e.target.value
                    }
                  }))}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Professional Details</h3>
              <div className="form-grid">
                <select
                  className="form-select"
                  value={employeeData.professionalDetails.role}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    professionalDetails: {
                      ...prev.professionalDetails,
                      role: e.target.value
                    }
                  }))}
                >
                  <option value="agent">Agent</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="t1_member">T1 Member</option>
                  <option value="operational_manager">Operational Manager</option>
                </select>
                <select
                  className="form-select"
                  value={employeeData.professionalDetails.branch}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    professionalDetails: {
                      ...prev.professionalDetails,
                      branch: e.target.value
                    }
                  }))}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Department"
                  className="form-input"
                  value={employeeData.professionalDetails.department}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    professionalDetails: {
                      ...prev.professionalDetails,
                      department: e.target.value
                    }
                  }))}
                />
                <select
                  className="form-select"
                  value={employeeData.professionalDetails.status}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    professionalDetails: {
                      ...prev.professionalDetails,
                      status: e.target.value
                    }
                  }))}
                >
                  <option value="active">Active</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Documents</h3>
              <div className="document-upload">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="upload-label">
                  <Plus size={24} />
                  <span>Upload Documents</span>
                  <span className="upload-hint">(ID copies, contracts, etc.)</span>
                </label>
              </div>
              {employeeData.documents.length > 0 && (
                <div className="document-list">
                  {employeeData.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <span>{doc.name}</span>
                      <button
                        type="button"
                                                  onClick={() => {
                            setEmployeeData(prev => ({
                              ...prev,
                              documents: prev.documents.filter((_, i) => i !== index)
                            }));
                          }}
                          className="delete-button"
                        >
                          <X size={16} />
                        </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="submit-button">
              <Save size={20} />
              Save Employee
            </button>
          </form>
        </div>
      ) : (
        <div className="content-card">
          <div className="branch-header">
            <h2 className="section-title">Manage Branches</h2>
            {!showBranchForm && (
              <button
                onClick={() => setShowBranchForm(true)}
                className="add-branch-button"
              >
                <Plus size={20} />
                Add Branch
              </button>
            )}
          </div>

          {showBranchForm && (
            <form onSubmit={handleBranchSubmit} className="form-section">
              <h3>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Branch Name"
                  className="form-input"
                  value={branchData.name}
                  onChange={(e) => setBranchData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
                <input
                  type="text"
                  placeholder="HR Manager"
                  className="form-input"
                  value={branchData.hrManager}
                  onChange={(e) => setBranchData(prev => ({
                    ...prev,
                    hrManager: e.target.value
                  }))}
                />
                <input
                  type="text"
                  placeholder="T1 Member"
                  className="form-input"
                  value={branchData.t1Member}
                  onChange={(e) => setBranchData(prev => ({
                    ...prev,
                    t1Member: e.target.value
                  }))}
                />
                <input
                  type="text"
                  placeholder="Operational Manager"
                  className="form-input"
                  value={branchData.operationalManager}
                  onChange={(e) => setBranchData(prev => ({
                    ...prev,
                    operationalManager: e.target.value
                  }))}
                />
              </div>
              <div className="branch-actions">
                <button type="submit" className="submit-button">
                  <Save size={20} />
                  {editingBranch ? 'Update Branch' : 'Save Branch'}
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => {
                    setShowBranchForm(false);
                    setEditingBranch(null);
                    setBranchData({
                      name: '',
                      hrManager: '',
                      t1Member: '',
                      operationalManager: ''
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="branch-list">
            {branches.map(branch => (
              <div key={branch.id} className="branch-item">
                <div className="branch-item-header">
                  <h3>{branch.name}</h3>
                  <div className="branch-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEditBranch(branch)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteBranch(branch.id)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <div>
                    <strong>HR Manager:</strong> {branch.hrManager}
                  </div>
                  <div>
                    <strong>T1 Member:</strong> {branch.t1Member}
                  </div>
                  <div>
                    <strong>Operational Manager:</strong> {branch.operationalManager}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;