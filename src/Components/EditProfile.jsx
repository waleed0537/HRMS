import React, { useState, useEffect } from 'react';
import { 
  Upload, X, Save, Building, Calendar, User, 
  Briefcase, FileText, Check, AlertCircle, ChevronDown
} from 'lucide-react';
import '../assets/css/EditProfile.css';
import API_BASE_URL from '../config/api.js';

const EditProfiles = () => {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [milestone, setMilestone] = useState({
    date: '',
    title: '',
    description: '',
    impact: ''
  });
  const [activeSection, setActiveSection] = useState('professional');

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      setError('Failed to fetch branches');
    }
  };

  const fetchEmployees = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const endpoint = user.role === 'hr_manager' ? '/api/hr/edit-profiles' : '/api/employees';
  
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
  
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmployeeSelect = async (employeeId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employee details');
      }
      
      const data = await response.json();
      setSelectedEmployee(data);
      setLoading(false);
      setActiveSection('professional');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    
    const updateData = {
      professionalDetails: selectedEmployee.professionalDetails
    };
    
    if (milestone.date && milestone.title) {
      updateData.milestones = [milestone];
    }

    formData.append('employeeData', JSON.stringify(updateData));
    
    documents.forEach(doc => {
      formData.append('documents', doc);
    });

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const endpoint = user.role === 'hr_manager' 
        ? `/api/hr/edit-profiles/${selectedEmployee._id}`
        : `/api/employees/${selectedEmployee._id}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update employee');
      }

      setMilestone({
        date: '',
        title: '',
        description: '',
        impact: ''
      });
      setDocuments([]);
      setSuccess('Employee profile updated successfully');
      fetchEmployees();
      
      // Automatically hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Update error:', err);
      setError(`Failed to update: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (loading && !selectedEmployee) return (
    <div className="edit-profiles-container">
      <div className="loading-indicator">
        <div className="spinner"></div>
        <p>Loading employee data...</p>
      </div>
    </div>
  );

  if (error && !selectedEmployee) return (
    <div className="edit-profiles-container">
      <div className="error-message">
        <AlertCircle size={24} />
        <p>{error}</p>
        <button onClick={fetchEmployees} className="retry-button">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="edit-profiles-container">
      <div className="edit-profiles-header">
        <div className="header-content">
          <h2 className="page-title">Edit Employee Profiles</h2>
          <p className="page-description">Update employee information, add milestones, and manage documents</p>
        </div>
        
        <div className="employee-selector">
          <label htmlFor="employee-select">Select Employee</label>
          <select 
            id="employee-select"
            className="employee-select"
            onChange={(e) => handleEmployeeSelect(e.target.value)}
            value={selectedEmployee?._id || ''}
          >
            <option value="">Choose an employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.personalDetails.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {success && (
        <div className="success-message">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      {error && selectedEmployee && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {selectedEmployee && (
        <div className="edit-profile-content">
          <div className="profile-sidebar">
            <div className="profile-info">
              <div className="profile-avatar">
                {getInitials(selectedEmployee.personalDetails.name)}
              </div>
              <h3 className="profile-name">{selectedEmployee.personalDetails.name}</h3>
              <p className="profile-role">{selectedEmployee.professionalDetails.role.replace(/_/g, ' ').toUpperCase()}</p>
              <span className={`profile-status status-${selectedEmployee.professionalDetails.status}`}>
                {selectedEmployee.professionalDetails.status}
              </span>
            </div>
            
            <div className="profile-nav">
              <button 
                className={`nav-item ${activeSection === 'professional' ? 'active' : ''}`}
                onClick={() => setActiveSection('professional')}
              >
                <Briefcase size={18} />
                <span>Professional Details</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveSection('documents')}
              >
                <FileText size={18} />
                <span>Documents</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'milestones' ? 'active' : ''}`}
                onClick={() => setActiveSection('milestones')}
              >
                <Calendar size={18} />
                <span>Milestones</span>
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="edit-form">
            {loading && (
              <div className="form-loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            
            {activeSection === 'professional' && (
              <div className="form-section">
                <div className="section-header">
                  <h3>
                    <Briefcase size={20} />
                    Professional Details
                  </h3>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Role</label>
                    <select
                      value={selectedEmployee.professionalDetails.role}
                      onChange={(e) => setSelectedEmployee({
                        ...selectedEmployee,
                        professionalDetails: {
                          ...selectedEmployee.professionalDetails,
                          role: e.target.value
                        }
                      })}
                      className="form-select"
                    >
                      <option value="agent">Agent</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="t1_member">T1 Member</option>
                      <option value="operational_manager">Operational Manager</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Branch</label>
                    <select
                      value={selectedEmployee.professionalDetails.branch}
                      onChange={(e) => setSelectedEmployee({
                        ...selectedEmployee,
                        professionalDetails: {
                          ...selectedEmployee.professionalDetails,
                          branch: e.target.value
                        }
                      })}
                      className="form-select"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label>Department</label>
                    <input
                      type="text"
                      value={selectedEmployee.professionalDetails.department || ''}
                      onChange={(e) => setSelectedEmployee({
                        ...selectedEmployee,
                        professionalDetails: {
                          ...selectedEmployee.professionalDetails,
                          department: e.target.value
                        }
                      })}
                      className="form-input"
                      placeholder="Department"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label>Status</label>
                    <select
                      value={selectedEmployee.professionalDetails.status}
                      onChange={(e) => setSelectedEmployee({
                        ...selectedEmployee,
                        professionalDetails: {
                          ...selectedEmployee.professionalDetails,
                          status: e.target.value
                        }
                      })}
                      className="form-select"
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="resigned">Resigned</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'documents' && (
              <div className="form-section">
                <div className="section-header">
                  <h3>
                    <FileText size={20} />
                    Documents
                  </h3>
                </div>
                
                <div className="document-upload">
                  <input
                    type="file"
                    multiple
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="upload-label">
                    <div className="upload-icon">
                      <Upload size={32} />
                    </div>
                    <div className="upload-text">
                      <span className="upload-title">Upload Documents</span>
                      <span className="upload-hint">ID Copies, Contracts, Certifications</span>
                    </div>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="document-list">
                    <div className="document-list-header">
                      <h4>New Documents to Upload</h4>
                    </div>
                    {documents.map((doc, index) => (
                      <div key={index} className="document-item">
                        <div className="document-icon">
                          <FileText size={20} />
                        </div>
                        <div className="document-info">
                          <span className="document-name">{doc.name}</span>
                          <span className="document-size">{(doc.size / 1024).toFixed(2)} KB</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="remove-document"
                          title="Remove document"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedEmployee.documents && selectedEmployee.documents.length > 0 && (
                  <div className="existing-documents">
                    <div className="document-list-header">
                      <h4>Existing Documents</h4>
                    </div>
                    {selectedEmployee.documents.map((doc, index) => (
                      <div key={index} className="document-item">
                        <div className="document-icon">
                          <FileText size={20} />
                        </div>
                        <div className="document-info">
                          <span className="document-name">{doc.name}</span>
                          <span className="document-date">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'milestones' && (
              <div className="form-section">
                <div className="section-header">
                  <h3>
                    <Calendar size={20} />
                    Add Employment Milestone
                  </h3>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label>Date</label>
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) => setMilestone({
                        ...milestone,
                        date: e.target.value
                      })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>Title</label>
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => setMilestone({
                        ...milestone,
                        title: e.target.value
                      })}
                      placeholder="e.g., Promotion, Transfer, Award"
                      className="form-input"
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Description</label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => setMilestone({
                        ...milestone,
                        description: e.target.value
                      })}
                      placeholder="Describe the milestone..."
                      className="form-textarea"
                      rows={3}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Impact</label>
                    <textarea
                      value={milestone.impact}
                      onChange={(e) => setMilestone({
                        ...milestone,
                        impact: e.target.value
                      })}
                      placeholder="Describe the impact on the employee's career or the organization..."
                      className="form-textarea"
                      rows={3}
                    />
                  </div>
                </div>
                
                {selectedEmployee.milestones && selectedEmployee.milestones.length > 0 && (
                  <div className="existing-milestones">
                    <div className="milestones-header">
                      <h4>Existing Milestones</h4>
                    </div>
                    <div className="milestones-list">
                      {selectedEmployee.milestones.map((ms, index) => (
                        <div key={index} className="milestone-item">
                          <div className="milestone-date">
                            <Calendar size={16} />
                            <span>{new Date(ms.date).toLocaleDateString()}</span>
                          </div>
                          <div className="milestone-content">
                            <h5>{ms.title}</h5>
                            <p>{ms.description}</p>
                            {ms.impact && (
                              <div className="milestone-impact">
                                <strong>Impact:</strong> {ms.impact}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loading}>
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditProfiles;