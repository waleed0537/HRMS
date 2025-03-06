import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Building, Briefcase, 
  Save, Upload, X, FileText, Clock, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useToast } from './common/ToastContent.jsx';
import '../assets/css/EditProfile.css';
import API_BASE_URL from '../config/api.js';

const EditProfile = () => {
  const { success, error, info } = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  // Removed expandedSections state as we're using activeSection to control visibility
  const [formData, setFormData] = useState({
    personalDetails: {
      name: '',
      contact: '',
      email: '',
      address: ''
    },
    professionalDetails: {
      role: '',
      branch: '',
      department: '',
      status: 'active'
    }
  });

  // Fetch employees on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        await fetchEmployees();
        console.log("Employees loaded in useEffect");
      } catch (err) {
        console.error("Error in useEffect loading employees:", err);
      }
    };
    
    loadEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      console.log("Fetched employees:", data);
      
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error("Employees data is not an array:", data);
        error('Received invalid employee data format');
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employees:", err);
      error('Failed to load employees: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleEmployeeSelect = async (employeeId) => {
    if (!employeeId) {
      setSelectedEmployee(null);
      setDocuments([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log("Selected employee ID:", employeeId);
      console.log("Available employees:", employees);
      
      const employee = employees.find(emp => emp._id === employeeId);
      console.log("Found employee:", employee);
      
      if (employee) {
        setSelectedEmployee(employee);
        
        try {
          // Fetch employee documents
          const docsResponse = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/documents`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!docsResponse.ok) {
            throw new Error('Failed to fetch employee documents');
          }
          
          const docsData = await docsResponse.json();
          console.log("Fetched documents:", docsData);
          setDocuments(Array.isArray(docsData) ? docsData : []);
        } catch (docError) {
          console.error("Error fetching documents:", docError);
          // Continue with empty documents array if there's an error
          setDocuments([]);
        }
        
        // Update form data with employee details, ensuring we have valid objects
        setFormData({
          personalDetails: { 
            name: employee?.personalDetails?.name || '',
            contact: employee?.personalDetails?.contact || '',
            email: employee?.personalDetails?.email || '',
            address: employee?.personalDetails?.address || ''
          },
          professionalDetails: { 
            role: employee?.professionalDetails?.role || '',
            branch: employee?.professionalDetails?.branch || '',
            department: employee?.professionalDetails?.department || '',
            status: employee?.professionalDetails?.status || 'active'
          }
        });
        
        info(`Loaded profile for ${employee?.personalDetails?.name || 'employee'}`);
      } else {
        error("Employee not found in the list");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error in handleEmployeeSelect:", err);
      error('Error loading employee details: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check file size (5MB limit)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      error(`Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setUploadedDocuments(prev => [...prev, ...files]);
    info(`Added ${files.length} document${files.length !== 1 ? 's' : ''} for upload`);
  };

  const removeUploadedDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    info('Document removed from upload queue');
  };

  const removeExistingDocument = async (documentId) => {
    if (!selectedEmployee) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${selectedEmployee._id}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      success('Document deleted successfully');
    } catch (err) {
      error('Error deleting document: ' + err.message);
    }
  };

  // Removed handleSectionToggle as we're directly controlling visibility with activeSection tabs

  const handleNavClick = (section) => {
    setActiveSection(section);
    // No need to use expandedSections anymore as we're directly controlling visibility with activeSection
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee || !selectedEmployee._id) {
      error('No employee selected');
      return;
    }
    
    try {
      setLoading(true);
      console.log("Submitting update for employee:", selectedEmployee._id);
      
      const formPayload = new FormData();
      
      // Make sure formData is properly structured before stringifying
      const sanitizedFormData = {
        personalDetails: {
          name: formData.personalDetails?.name || '',
          contact: formData.personalDetails?.contact || '',
          email: formData.personalDetails?.email || '',
          address: formData.personalDetails?.address || ''
        },
        professionalDetails: {
          role: formData.professionalDetails?.role || '',
          branch: formData.professionalDetails?.branch || '',
          department: formData.professionalDetails?.department || '',
          status: formData.professionalDetails?.status || 'active'
        }
      };
      
      console.log("Submitting data:", sanitizedFormData);
      formPayload.append('employeeData', JSON.stringify(sanitizedFormData));
      
      // Add uploaded documents if any
      if (uploadedDocuments && uploadedDocuments.length > 0) {
        uploadedDocuments.forEach(doc => {
          if (doc) {
            formPayload.append('documents', doc);
          }
        });
        console.log("Added", uploadedDocuments.length, "documents to form data");
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/employees/${selectedEmployee._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formPayload
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`Failed to update employee details: ${response.status} ${response.statusText}`);
        }

        // Reset uploaded documents
        setUploadedDocuments([]);
        
        // Get response data for debug
        let responseData;
        try {
          responseData = await response.json();
          console.log("Update response:", responseData);
        } catch (jsonError) {
          console.log("Response was not JSON:", jsonError);
        }
        
        // Refresh employee data
        await fetchEmployees(); // Refresh the whole list
        await handleEmployeeSelect(selectedEmployee._id);
        
        success('Employee profile updated successfully');
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (err) {
      console.error("Submit error:", err);
      error('Error updating profile: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get the initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part && part[0] || '')
      .join('')
      .toUpperCase() || 'U';
  };

  if (loading && !selectedEmployee) {
    return (
      <div className="edit-profiles-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  const renderStatusBadge = () => {
    if (!selectedEmployee || !selectedEmployee.professionalDetails) return null;
    
    const status = selectedEmployee.professionalDetails?.status || 'active';
    return (
      <span className={`profile-status status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="edit-profiles-container">
      <div className="edit-profiles-header">
        <div className="header-content">
          <h1 className="page-title">Edit Employee Profiles</h1>
          <p className="page-description">Update employee information, status, and documents</p>
        </div>
        
        <div className="employee-selector">
          <label>Select Employee</label>
          <select 
            className="employee-select"
            value={selectedEmployee?._id || ''}
            onChange={(e) => handleEmployeeSelect(e.target.value)}
          >
            <option value="">Select an employee</option>
            {employees && employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.personalDetails?.name || 'Unknown'} - {emp.professionalDetails?.role || 'Employee'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedEmployee && (
        <div className="edit-profile-content">
          <div className="profile-sidebar">
            <div className="profile-info">
              <div className="profile-avatar">
                {getInitials(selectedEmployee?.personalDetails?.name || '')}
              </div>
              <h3 className="profile-name">{selectedEmployee?.personalDetails?.name || 'Unknown'}</h3>
              <p className="profile-role">{selectedEmployee?.professionalDetails?.role || 'Employee'}</p>
              {renderStatusBadge()}
            </div>
            
            <div className="profile-nav">
              <button 
                className={`nav-item ${activeSection === 'personal' ? 'active' : ''}`}
                onClick={() => handleNavClick('personal')}
              >
                <User size={18} />
                Personal Details
              </button>
              <button 
                className={`nav-item ${activeSection === 'professional' ? 'active' : ''}`}
                onClick={() => handleNavClick('professional')}
              >
                <Briefcase size={18} />
                Professional Details
              </button>
              <button 
                className={`nav-item ${activeSection === 'documents' ? 'active' : ''}`}
                onClick={() => handleNavClick('documents')}
              >
                <FileText size={18} />
                Documents
              </button>
            </div>
          </div>
          
          <div className="edit-form">
            {loading && (
              <div className="form-loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Only show the section that matches the active tab */}
              {activeSection === 'personal' && (
                <div className="form-section">
                  <div className="section-header">
                    <h3>
                      <User size={18} />
                      Personal Details
                    </h3>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Full Name</label>
                      <div className="input-icon-wrapper">
                        <User size={18} className="field-icon" />
                        <input
                          type="text"
                          className="form-input"
                          value={formData.personalDetails.name}
                          onChange={(e) => handleInputChange('personalDetails', 'name', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Email</label>
                      <div className="input-icon-wrapper">
                        <Mail size={18} className="field-icon" />
                        <input
                          type="email"
                          className="form-input"
                          value={formData.personalDetails.email}
                          onChange={(e) => handleInputChange('personalDetails', 'email', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Contact Number</label>
                      <div className="input-icon-wrapper">
                        <Phone size={18} className="field-icon" />
                        <input
                          type="tel"
                          className="form-input"
                          value={formData.personalDetails.contact}
                          onChange={(e) => handleInputChange('personalDetails', 'contact', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field full-width">
                      <label>Address</label>
                      <div className="input-icon-wrapper">
                        <MapPin size={18} className="field-icon" />
                        <textarea
                          className="form-textarea"
                          value={formData.personalDetails.address}
                          onChange={(e) => handleInputChange('personalDetails', 'address', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Professional Details Section */}
              {activeSection === 'professional' && (
                <div className="form-section">
                  <div className="section-header">
                    <h3>
                      <Briefcase size={18} />
                      Professional Details
                    </h3>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Role</label>
                      <div className="input-icon-wrapper">
                        <Briefcase size={18} className="field-icon" />
                        <select
                          className="form-select"
                          value={formData.professionalDetails.role}
                          onChange={(e) => handleInputChange('professionalDetails', 'role', e.target.value)}
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="employee">Employee</option>
                          <option value="agent">Agent</option>
                          <option value="hr_manager">HR Manager</option>
                          <option value="t1_member">T1 Member</option>
                          <option value="operational_manager">Operational Manager</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Branch</label>
                      <div className="input-icon-wrapper">
                        <Building size={18} className="field-icon" />
                        <input
                          type="text"
                          className="form-input"
                          value={formData.professionalDetails.branch}
                          onChange={(e) => handleInputChange('professionalDetails', 'branch', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Department</label>
                      <div className="input-icon-wrapper">
                        <MapPin size={18} className="field-icon" />
                        <input
                          type="text"
                          className="form-input"
                          value={formData.professionalDetails.department}
                          onChange={(e) => handleInputChange('professionalDetails', 'department', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label>Status</label>
                      <div className="input-icon-wrapper">
                        <Clock size={18} className="field-icon" />
                        <select
                          className="form-select"
                          value={formData.professionalDetails.status}
                          onChange={(e) => handleInputChange('professionalDetails', 'status', e.target.value)}
                          required
                        >
                          <option value="active">Active</option>
                          <option value="on_leave">On Leave</option>
                          <option value="resigned">Resigned</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Documents Section */}
              {activeSection === 'documents' && (
                <div className="form-section">
                  <div className="section-header">
                    <h3>
                      <FileText size={18} />
                      Documents
                    </h3>
                  </div>
                  
                  <div className="document-upload">
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="document-upload" className="upload-label">
                      <div className="upload-icon">
                        <Upload size={24} />
                      </div>
                      <div className="upload-text">
                        <span className="upload-title">Upload Documents</span>
                        <span className="upload-hint">Click to browse or drag and drop files here (Max: 5MB)</span>
                      </div>
                    </label>
                  </div>
                  
                  {uploadedDocuments.length > 0 && (
                    <div className="document-list">
                      <div className="document-list-header">
                        <h4>New Documents</h4>
                      </div>
                      {uploadedDocuments.map((doc, index) => (
                        <div className="document-item" key={index}>
                          <div className="document-icon">
                            <FileText size={20} />
                          </div>
                          <div className="document-info">
                            <div className="document-name">{doc.name}</div>
                            <div className="document-size">{(doc.size / 1024).toFixed(2)} KB</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedDocument(index)}
                            className="remove-document"
                            title="Remove document"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {documents.length > 0 && (
                    <div className="existing-documents">
                      <div className="document-list-header">
                        <h4>Existing Documents</h4>
                      </div>
                      {documents.map(doc => (
                        <div className="document-item" key={doc._id}>
                          <div className="document-icon">
                            <FileText size={20} />
                          </div>
                          <div className="document-info">
                            <div className="document-name">{doc.name}</div>
                            <div className="document-date">Uploaded: {formatDate(doc.uploadedAt)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingDocument(doc._id)}
                            className="remove-document"
                            title="Delete document"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  <Save size={18} />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;