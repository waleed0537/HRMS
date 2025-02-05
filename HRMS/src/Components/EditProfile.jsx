import React, { useState, useEffect } from 'react';
import { Upload, X, Save, Building, Calendar } from 'lucide-react';
import '../assets/css/EditProfile.css';

const EditProfiles = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [milestone, setMilestone] = useState({
    date: '',
    title: '',
    description: '',
    impact: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
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
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmployeeSelect = async (employeeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employee details');
      }
      
      const data = await response.json();
      setSelectedEmployee(data);
    } catch (err) {
      setError(err.message);
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
  
    const formData = new FormData();
    
    // Format data for server
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
      const response = await fetch(`http://localhost:5000/api/employees/${selectedEmployee._id}`, {
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
  
      const data = await response.json();
      console.log('Update successful:', data);
      
      setMilestone({
        date: '',
        title: '',
        description: '',
        impact: ''
      });
      setDocuments([]);
      fetchEmployees();
      alert('Employee profile updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      alert(`Failed to update: ${err.message}`);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-profiles-container">
      <div className="profiles-header">
        <h2>Edit Employee Profiles</h2>
        <select 
          className="employee-select"
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          value={selectedEmployee?._id || ''}
        >
          <option value="">Select Employee</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>
              {emp.personalDetails.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-section">
            <h3>Professional Details</h3>
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
                >
                  <option value="Main Branch">Main Branch</option>
                  <option value="East Branch">East Branch</option>
                  <option value="West Branch">West Branch</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Documents</h3>
            <div className="document-upload">
              <input
                type="file"
                multiple
                onChange={handleDocumentUpload}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="upload-label">
                <Upload size={24} />
                <span>Upload ID Copies & Contracts</span>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="document-list">
                {documents.map((doc, index) => (
                  <div key={index} className="document-item">
                    <span>{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="remove-document"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Add Employment Milestone</h3>
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
                  placeholder="Describe the impact..."
                />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-button">
            <Save size={20} />
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
};

export default EditProfiles;