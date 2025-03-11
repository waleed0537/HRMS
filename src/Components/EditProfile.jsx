import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Building, Briefcase, 
  Save, Upload, X, FileText, Clock, Award, Calendar, AlertCircle,
  Menu, ChevronDown, ChevronUp, Info
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
  const [documentError, setDocumentError] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Add milestone tracking
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    impact: '',
    branch: '',
    type: 'milestone'
  });
  
  // Mobile specific states
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
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
    },
    milestones: []
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Close mobile nav when resizing to desktop
      if (window.innerWidth > 768) {
        setMobileNavOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current user data first
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoadingUser(true);
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch current user profile');
        }

        const userData = await response.json();
        setCurrentUser(userData);
        console.log("Current user loaded:", userData);
      } catch (err) {
        console.error("Error fetching current user:", err);
        error("Failed to load your profile information");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch employees after current user is loaded
  useEffect(() => {
    if (!loadingUser && currentUser) {
      fetchEmployees();
    }
  }, [currentUser, loadingUser]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let endpoint = `${API_BASE_URL}/api/employees`;
      
      // If user is an HR manager, use HR-specific endpoint or filter
      if (currentUser && currentUser.professionalDetails?.role === 'hr_manager') {
        // You could use a specific HR endpoint if available:
        // endpoint = `${API_BASE_URL}/api/hr/employees`;
        console.log(`HR Manager detected for branch: ${currentUser.professionalDetails.branch}`);
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      let data = await response.json();
      
      // For HR managers, filter employees by their branch on the client side
      if (currentUser && 
          currentUser.professionalDetails?.role === 'hr_manager' && 
          currentUser.professionalDetails?.branch) {
        
        const hrBranch = currentUser.professionalDetails.branch;
        console.log(`Filtering employees for branch: ${hrBranch}`);
        
        // Filter employees to only include those from HR's branch
        data = data.filter(employee => 
          employee.professionalDetails?.branch === hrBranch
        );
        
        console.log(`Filtered to ${data.length} employees in branch ${hrBranch}`);
      }
      
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error("Employees data is not an array:", data);
        setEmployees([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employees:", err);
      error(`Failed to fetch employees: ${err.message}`);
      setLoading(false);
    }
  };

  const handleEmployeeSelect = async (employeeId) => {
    if (!employeeId) {
      setSelectedEmployee(null);
      setDocuments([]);
      resetForm();
      return;
    }
    
    try {
      setLoading(true);
      
      const employee = employees.find(emp => emp._id === employeeId);
      
      // Check if employee exists and is from the HR's branch if user is HR
      if (employee) {
        if (currentUser && 
            currentUser.professionalDetails?.role === 'hr_manager' && 
            employee.professionalDetails?.branch !== currentUser.professionalDetails?.branch) {
          throw new Error(`You don't have permission to edit employees from other branches`);
        }
        
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
          setDocuments(Array.isArray(docsData) ? docsData : []);
        } catch (docError) {
          console.error("Error fetching documents:", docError);
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
          },
          milestones: []
        });
        
        // Reset the mobile nav menu when selecting a new employee
        setMobileNavOpen(false);
      } else {
        console.error("Employee not found in the list");
        error("Employee not found");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error in handleEmployeeSelect:", err);
      error(err.message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      },
      milestones: []
    });
    setMilestone({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      impact: '',
      branch: '',
      type: 'milestone'
    });
    setShowMilestoneForm(false);
    setUploadedDocuments([]);
    setDocumentError(null);
    setDebugInfo(null);
  };

  const handleInputChange = (section, field, value) => {
    // For HR managers, restrict branch changes to their own branch
    if (section === 'professionalDetails' && field === 'branch' && 
        currentUser?.professionalDetails?.role === 'hr_manager') {
      // Force branch to be HR's branch
      value = currentUser.professionalDetails.branch;
    }
    
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
    setDocumentError(null);
    
    // Check file size (5MB limit)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setDocumentError(`Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Check file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'image/jpeg', 
      'image/png',
      'image/gif'
    ];
    
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setDocumentError(`Invalid file format: ${invalidFiles.map(f => f.name).join(', ')}. Only PDF, Word, and images are allowed.`);
      return;
    }
    
    setUploadedDocuments(prev => [...prev, ...files]);
  };

  const removeUploadedDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
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
      console.error('Error deleting document:', err);
      error(`Failed to delete document: ${err.message}`);
    }
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    // Close mobile nav after selecting a section
    if (windowWidth <= 768) {
      setMobileNavOpen(false);
    }
  };

  // Helper function to format role names for display
  const formatRole = (role) => {
    if (!role) return 'Unknown';
    return role
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render role options with visual feedback about changes
  const renderRoleOptions = () => {
    const roles = [
      { value: 'employee', label: 'Employee' },
      { value: 'agent', label: 'Agent' },
      { value: 'hr_manager', label: 'HR Manager' },
      { value: 't1_member', label: 'T1 Member' },
      { value: 'operational_manager', label: 'Operational Manager' }
    ];
    
    return roles.map(role => {
      const isCurrentRole = selectedEmployee?.professionalDetails?.role === role.value;
      const isSelected = formData.professionalDetails.role === role.value;
      const changed = isCurrentRole && !isSelected;
      
      return (
        <option 
          key={role.value} 
          value={role.value}
          className={changed ? 'role-changed' : isCurrentRole ? 'current-role' : ''}
        >
          {role.label} {isCurrentRole ? '(Current)' : ''}
        </option>
      );
    });
  };

  // Handle milestone form changes
  const handleMilestoneChange = (field, value) => {
    // If user is HR manager and the field is branch, force it to HR's branch
    if (field === 'branch' && currentUser?.professionalDetails?.role === 'hr_manager') {
      value = currentUser.professionalDetails.branch;
    }
    
    setMilestone(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-set branch from professional details if not set
    if (field === 'branch' && !value) {
      setMilestone(prev => ({
        ...prev,
        branch: formData.professionalDetails.branch
      }));
    }
  };

  // Add milestone to pending list
  const handleAddMilestone = () => {
    if (!milestone.title || !milestone.description) {
      error('Please provide both title and description for the milestone');
      return;
    }
    
    // Add milestone to form data with current date if not specified
    const newMilestone = {
      ...milestone,
      branch: milestone.branch || formData.professionalDetails.branch,
      date: milestone.date || new Date().toISOString().split('T')[0]
    };
    
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
    
    // Reset milestone form
    setMilestone({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      impact: '',
      branch: '',
      type: 'milestone'
    });
    setShowMilestoneForm(false);
    
    // Show success message
    success('Milestone added and will be saved with profile updates');
  };

  // Remove a pending milestone
  const removePendingMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  // Verify history was created by fetching it directly
  const verifyHistory = async (employeeId) => {
    try {
      const historyResponse = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!historyResponse.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const historyData = await historyResponse.json();
      
      // Add this for debugging 
      setDebugInfo({
        historyCount: historyData.length,
        history: historyData
      });
      
      // Return whether history has items
      return historyData.length > 0;
    } catch (err) {
      console.error("Error verifying history:", err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const GENERATE_AUTO_MILESTONES_CLIENT_SIDE = false;
    const autoMilestones = [];
    if (!selectedEmployee || !selectedEmployee._id) {
      error('No employee selected');
      return;
    }
    
    // Check if there are document validation errors
    if (documentError) {
      error(documentError);
      return;
    }
    
    // For HR managers, ensure branch stays as their branch
    if (currentUser?.professionalDetails?.role === 'hr_manager') {
      formData.professionalDetails.branch = currentUser.professionalDetails.branch;
    }
    
    try {
      setLoading(true);
      
      const formPayload = new FormData();
      
      // Detect role changes and branch transfers and add as automatic milestones
      
      if (GENERATE_AUTO_MILESTONES_CLIENT_SIDE) {
        // Check for role change  
        if (selectedEmployee.professionalDetails?.role !== formData.professionalDetails.role) {
          const roleMilestone = {
            title: `Role changed to ${formatRole(formData.professionalDetails.role)}`,
            description: `Role updated from ${formatRole(selectedEmployee.professionalDetails?.role || 'None')} to ${formatRole(formData.professionalDetails.role)}`,
            date: new Date().toISOString().split('T')[0],
            branch: formData.professionalDetails.branch,
            impact: 'Employee role has been updated with new responsibilities and permissions',
            type: 'role_change'
          };
          autoMilestones.push(roleMilestone);
        }
      
        // Check for branch transfer
        if (selectedEmployee.professionalDetails?.branch !== formData.professionalDetails.branch) {
          const branchMilestone = {
            title: `Transferred to ${formData.professionalDetails.branch} branch`,
            description: `Branch transfer from ${selectedEmployee.professionalDetails?.branch || 'None'} to ${formData.professionalDetails.branch}`,
            date: new Date().toISOString().split('T')[0],
            branch: formData.professionalDetails.branch,
            impact: 'Employee moved to a new branch location',
            type: 'branch_transfer'
          };
          autoMilestones.push(branchMilestone);
        }
      
        // Check for status change
        if (selectedEmployee.professionalDetails?.status !== formData.professionalDetails.status) {
          const statusText = formData.professionalDetails.status.replace('_', ' ');
          const statusMilestone = {
            title: `Status changed to ${statusText}`,
            description: `Employee status updated from ${(selectedEmployee.professionalDetails?.status || 'active').replace('_', ' ')} to ${statusText}`,
            date: new Date().toISOString().split('T')[0],
            branch: formData.professionalDetails.branch,
            impact: `Employee is now ${statusText}`,
            type: 'status_change'
          };
          autoMilestones.push(statusMilestone);
        }
      }
      
      // Combine auto-generated milestones with manually added ones
      const allMilestones = [...autoMilestones, ...formData.milestones];
      
      // Prepare data structure with all updates
      const sanitizedFormData = {
        personalDetails: {
          name: formData.personalDetails?.name || '',
          contact: formData.personalDetails?.contact || '',
          email: formData.personalDetails?.email || '',
          address: formData.personalDetails?.address || '',
          // Preserve the original ID
          id: selectedEmployee.personalDetails?.id || ''
        },
        professionalDetails: {
          role: formData.professionalDetails?.role || '',
          branch: formData.professionalDetails?.branch || '',
          department: formData.professionalDetails?.department || '',
          status: formData.professionalDetails?.status || 'active'
        }
      };

      // Always include milestones array to ensure it's processed
      sanitizedFormData.milestones = allMilestones;
      
      console.log("Submitting employee update with milestones:", sanitizedFormData.milestones);
      
      formPayload.append('employeeData', JSON.stringify(sanitizedFormData));
      
      // Add uploaded documents if any
      if (uploadedDocuments && uploadedDocuments.length > 0) {
        uploadedDocuments.forEach(doc => {
          if (doc) {
            formPayload.append('documents', doc);
          }
        });
      }
      
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
  
      // Get response data
      const responseData = await response.json();
      console.log("Update response:", responseData);
      
      const milestonesCount = sanitizedFormData.milestones.length;
      const autoCount = autoMilestones.length;
      
      // Reset uploaded documents and milestones
      setUploadedDocuments([]);
      setDocumentError(null);
      setFormData(prev => ({
        ...prev,
        milestones: []
      }));
      
      // Refresh employee data
      await fetchEmployees();
      await handleEmployeeSelect(selectedEmployee._id);
      
      // Show toast with milestone count information
      let successMessage = 'Employee profile updated successfully.';
      if (milestonesCount > 0) {
        successMessage += ` Added ${milestonesCount} history entries`;
        if (autoCount > 0) {
          successMessage += ` (${autoCount} automatic, ${milestonesCount - autoCount} manual)`;
        }
        successMessage += '.';
      }
      
      success(successMessage);
      
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

  // Function to render either an avatar image or a text-based avatar with user's initial
  const renderAvatar = () => {
    if (!selectedEmployee) return null;
    
    // Get name for display and initials
    const name = selectedEmployee?.personalDetails?.name || 'User';
    const initial = getInitials(name);
    
    // Check if user has a profilePic (from user or employee object)
    const profilePic = selectedEmployee?.user?.profilePic || selectedEmployee?.profilePic;
    
    if (profilePic) {
      return (
        <div className="profile-avatar">
          <img 
            src={new URL(`../assets/avatars/avatar-${profilePic}.jpg`, import.meta.url).href}
            alt={name}
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              objectFit: 'cover' 
            }}
            onError={(e) => {
              // If image fails to load, replace with initial
              e.target.style.display = 'none';
              e.target.parentNode.classList.add('initial-avatar');
              e.target.parentNode.innerText = initial;
            }}
          />
        </div>
      );
    }
    
    // Fallback to initial-based avatar
    return (
      <div className="profile-avatar initial-avatar">
        {initial}
      </div>
    );
  };

  // Render HR branch restriction notice
  const renderBranchRestrictionNotice = () => {
    if (currentUser?.professionalDetails?.role !== 'hr_manager') {
      return null;
    }
    
    return (
      <div className="branch-restriction-notice">
        <Info size={18} />
        <p>
          As an HR manager, you can only view and edit profiles of employees in the
          <strong> {currentUser.professionalDetails.branch}</strong> branch.
        </p>
      </div>
    );
  };

  if (loadingUser) {
    return (
      <div className="edit-profiles-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

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
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  // Render mobile navigation toggle
  const renderMobileNavToggle = () => {
    if (windowWidth > 768 || !selectedEmployee) return null;
    
    return (
      <button 
        className="mobile-nav-toggle"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <div className="toggle-label">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        </div>
        {mobileNavOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    );
  };

  // Render mobile section navigation
  const renderMobileNav = () => {
    if (windowWidth > 768 || !selectedEmployee || !mobileNavOpen) return null;
    
    return (
      <div className="mobile-nav-menu">
        <button 
          className={`mobile-nav-item ${activeSection === 'personal' ? 'active' : ''}`}
          onClick={() => handleNavClick('personal')}
        >
          <User size={18} />
          Personal Details
        </button>
        <button 
          className={`mobile-nav-item ${activeSection === 'professional' ? 'active' : ''}`}
          onClick={() => handleNavClick('professional')}
        >
          <Briefcase size={18} />
          Professional Details
        </button>
        <button 
          className={`mobile-nav-item ${activeSection === 'milestones' ? 'active' : ''}`}
          onClick={() => handleNavClick('milestones')}
        >
          <Award size={18} />
          Employment Milestones
        </button>
        <button 
          className={`mobile-nav-item ${activeSection === 'documents' ? 'active' : ''}`}
          onClick={() => handleNavClick('documents')}
        >
          <FileText size={18} />
          Documents
        </button>
      </div>
    );
  };

  // Responsive document item component
  const DocumentItem = ({ document, isUploaded = false, index }) => (
    <div className="document-item">
      <div className="document-content">
        <div className="document-icon">
          <FileText size={20} />
        </div>
        <div className="document-info">
          <div className="document-name" title={isUploaded ? document.name : document.name}>
            {isUploaded ? document.name : document.name}
          </div>
          {isUploaded ? (
            <div className="document-size">{(document.size / 1024).toFixed(2)} KB</div>
          ) : (
            <div className="document-date">Uploaded: {formatDate(document.uploadedAt)}</div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => isUploaded ? removeUploadedDocument(index) : removeExistingDocument(document._id)}
        className="remove-document"
        title={`Remove ${isUploaded ? 'uploaded' : 'existing'} document`}
        aria-label={`Remove ${isUploaded ? 'uploaded' : 'existing'} document`}
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <div className="edit-profiles-container">
      <div className="edit-profiles-header">
        <div className="header-content">
          <h1 className="page-title">Edit Employee Profiles</h1>
          <p className="page-description">Update employee information, status, and documents</p>
        </div>
        
        {renderBranchRestrictionNotice()}
        
        <div className="employee-selector">
          <label htmlFor="employee-select">
            Select Employee 
            {currentUser?.professionalDetails?.role === 'hr_manager' && (
              <span className="branch-filter-label">
                (From {currentUser.professionalDetails.branch} branch)
              </span>
            )}
          </label>
          <select 
            id="employee-select"
            className="employee-select"
            value={selectedEmployee?._id || ''}
            onChange={(e) => handleEmployeeSelect(e.target.value)}
          >
            <option value="">Select an employee</option>
            {employees && employees.length > 0 ? (
              employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.personalDetails?.name || 'Unknown'} - {formatRole(emp.professionalDetails?.role) || 'Employee'}
                </option>
              ))
            ) : (
              <option value="" disabled>
                {employees.length === 0 ? 'No employees available in your branch' : 'Loading employees...'}
              </option>
            )}
          </select>
        </div>
      </div>

      {selectedEmployee && (
        <div className="edit-profile-content">
          {/* Mobile navigation toggle and dropdown */}
          {renderMobileNavToggle()}
          {renderMobileNav()}
          
          <div className="profile-sidebar">
            <div className="profile-info">
              {renderAvatar()}
              <h3 className="profile-name">{selectedEmployee?.personalDetails?.name || 'Unknown'}</h3>
              <p className="profile-role">{formatRole(selectedEmployee?.professionalDetails?.role) || 'Employee'}</p>
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
                className={`nav-item ${activeSection === 'milestones' ? 'active' : ''}`}
                onClick={() => handleNavClick('milestones')}
              >
                <Award size={18} />
                Employment Milestones
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
            
            {/* Debug info panel */}
            {showDebugInfo && debugInfo && (
              <div className="debug-panel">
                <h3>Debug Information</h3>
                <div className="debug-content">
                  <p>History Items: {debugInfo.historyCount}</p>
                  <pre>{JSON.stringify(debugInfo.history, null, 2)}</pre>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Personal Details Section */}
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
                      <label htmlFor="full-name">Full Name</label>
                      <div className="input-icon-wrapper">
                        <User size={18} className="field-icon" />
                        <input
                          id="full-name"
                          type="text"
                          className="form-input"
                          value={formData.personalDetails.name}
                          onChange={(e) => handleInputChange('personalDetails', 'name', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="email">Email</label>
                      <div className="input-icon-wrapper">
                        <Mail size={18} className="field-icon" />
                        <input
                          id="email"
                          type="email"
                          className="form-input"
                          value={formData.personalDetails.email}
                          onChange={(e) => handleInputChange('personalDetails', 'email', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="contact">Contact Number</label>
                      <div className="input-icon-wrapper">
                        <Phone size={18} className="field-icon" />
                        <input
                          id="contact"
                          type="tel"
                          className="form-input"
                          value={formData.personalDetails.contact}
                          onChange={(e) => handleInputChange('personalDetails', 'contact', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field full-width">
                      <label htmlFor="address">Address</label>
                      <div className="input-icon-wrapper">
                        <MapPin size={18} className="field-icon" />
                        <textarea
                          id="address"
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
                      <label htmlFor="role">Role</label>
                      <div className="input-icon-wrapper">
                        <Briefcase size={18} className="field-icon" />
                        <select
                          id="role"
                          className="form-select"
                          value={formData.professionalDetails.role}
                          onChange={(e) => handleInputChange('professionalDetails', 'role', e.target.value)}
                          required
                        >
                          <option value="">Select Role</option>
                          {renderRoleOptions()}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="branch">
                        Branch
                        {currentUser?.professionalDetails?.role === 'hr_manager' && (
                          <span className="field-restriction"> (Restricted to your branch)</span>
                        )}
                      </label>
                      <div className="input-icon-wrapper">
                        <Building size={18} className="field-icon" />
                        <input
                          id="branch"
                          type="text"
                          className="form-input"
                          value={formData.professionalDetails.branch}
                          onChange={(e) => handleInputChange('professionalDetails', 'branch', e.target.value)}
                          readOnly={currentUser?.professionalDetails?.role === 'hr_manager'}
                          disabled={currentUser?.professionalDetails?.role === 'hr_manager'}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="department">Department</label>
                      <div className="input-icon-wrapper">
                        <MapPin size={18} className="field-icon" />
                        <input
                          id="department"
                          type="text"
                          className="form-input"
                          value={formData.professionalDetails.department}
                          onChange={(e) => handleInputChange('professionalDetails', 'department', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="status">Status</label>
                      <div className="input-icon-wrapper">
                        <Clock size={18} className="field-icon" />
                        <select
                          id="status"
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
                  
                  {/* Feedback about automatic milestone tracking */}
                  <div className="form-feedback">
                    {formData.milestones.length > 0 && (
                      <div className="milestones-pending">
                        <Award size={16} />
                        <span>You have {formData.milestones.length} pending milestones to be saved</span>
                      </div>
                    )}
                    
                    {selectedEmployee?.professionalDetails?.role !== formData.professionalDetails.role && (
                      <div className="change-indicator role">
                        <Briefcase size={16} />
                        <span>Role change will be recorded in history</span>
                      </div>
                    )}
                    
                    {selectedEmployee?.professionalDetails?.branch !== formData.professionalDetails.branch && (
                      <div className="change-indicator branch">
                        <Building size={16} />
                        <span>Branch transfer will be recorded in history</span>
                      </div>
                    )}
                    
                    {selectedEmployee?.professionalDetails?.status !== formData.professionalDetails.status && (
                      <div className="change-indicator status">
                        <Clock size={16} />
                        <span>Status change will be recorded in history</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedEmployee.professionalDetails?.role !== formData.professionalDetails.role && (
                    <div className="role-change-alert">
                      <Award size={18} />
                      <p>
                        <strong>Role Change Detected:</strong> Changing from {formatRole(selectedEmployee.professionalDetails?.role)} to {formatRole(formData.professionalDetails.role)}. 
                        This change will be automatically recorded in the employee's history.
                      </p>
                    </div>
                  )}
                  
                  {currentUser?.professionalDetails?.role !== 'hr_manager' && 
                   selectedEmployee.professionalDetails?.branch !== formData.professionalDetails.branch && (
                    <div className="branch-change-alert">
                      <Building size={18} />
                      <p>
                        <strong>Branch Transfer Detected:</strong> Moving from {selectedEmployee.professionalDetails?.branch} to {formData.professionalDetails.branch}. 
                        This change will be automatically recorded in the employee's history.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Milestones Section */}
              {activeSection === 'milestones' && (
                <div className="form-section">
                  <div className="section-header milestone-header">
                    <h3>
                      <Award size={18} />
                      Employment Milestones
                    </h3>
                    {!showMilestoneForm && (
                      <button 
                        type="button" 
                        className="add-milestone-btn"
                        onClick={() => setShowMilestoneForm(true)}
                      >
                        Add Milestone
                      </button>
                    )}
                  </div>
                  
                  {showMilestoneForm ? (
                    <div className="milestone-form">
                      <div className="form-grid">
                        <div className="form-field">
                          <label htmlFor="milestone-title">Milestone Title <span className="required">*</span></label>
                          <input
                            id="milestone-title"
                            type="text"
                            className="form-input"
                            value={milestone.title}
                            onChange={(e) => handleMilestoneChange('title', e.target.value)}
                            placeholder="e.g., Promotion, Award, Certification"
                            required
                          />
                        </div>
                        
                        <div className="form-field">
                          <label htmlFor="milestone-date">Date <span className="required">*</span></label>
                          <input
                            id="milestone-date"
                            type="date"
                            className="form-input"
                            value={milestone.date}
                            onChange={(e) => handleMilestoneChange('date', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="form-field full-width">
                          <label htmlFor="milestone-description">Description <span className="required">*</span></label>
                          <textarea
                            id="milestone-description"
                            className="form-textarea"
                            value={milestone.description}
                            onChange={(e) => handleMilestoneChange('description', e.target.value)}
                            placeholder="Describe the milestone in detail"
                            rows={3}
                            required
                          />
                        </div>
                        
                        <div className="form-field">
                          <label htmlFor="milestone-branch">
                            Branch
                            {currentUser?.professionalDetails?.role === 'hr_manager' && (
                              <span className="field-restriction"> (Set to your branch)</span>
                            )}
                          </label>
                          <div className="input-icon-wrapper">
                            <Building size={18} className="field-icon" />
                            <input
                              id="milestone-branch"
                              type="text"
                              className="form-input"
                              value={currentUser?.professionalDetails?.role === 'hr_manager' 
                                ? currentUser.professionalDetails.branch 
                                : (milestone.branch || formData.professionalDetails.branch)}
                              onChange={(e) => handleMilestoneChange('branch', e.target.value)}
                              readOnly={currentUser?.professionalDetails?.role === 'hr_manager'}
                              disabled={currentUser?.professionalDetails?.role === 'hr_manager'}
                              placeholder="Default is current branch"
                            />
                          </div>
                        </div>
                        
                        <div className="form-field full-width">
                          <label htmlFor="milestone-impact">Impact (Optional)</label>
                          <textarea
                            id="milestone-impact"
                            className="form-textarea"
                            value={milestone.impact}
                            onChange={(e) => handleMilestoneChange('impact', e.target.value)}
                            placeholder="How does this milestone impact the employee's career or role?"
                            rows={2}
                          />
                        </div>
                      </div>
                      
                      <div className="milestone-actions">
                        <button 
                          type="button" 
                          className="cancel-milestone-btn"
                          onClick={() => setShowMilestoneForm(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="add-milestone-btn"
                          onClick={handleAddMilestone}
                        >
                          Add Milestone
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {formData.milestones.length > 0 ? (
                        <div className="pending-milestones">
                          <h4>Pending Milestones</h4>
                          <div className="milestone-list">
                            {formData.milestones.map((ms, index) => (
                              <div className="milestone-item" key={index}>
                                <div className="milestone-header">
                                  <h5>{ms.title}</h5>
                                  <span className="milestone-date">
                                    <Calendar size={14} />
                                    {formatDate(ms.date)}
                                  </span>
                                </div>
                                <p className="milestone-description">{ms.description}</p>
                                {ms.branch && (
                                  <div className="milestone-branch">
                                    <Building size={14} />
                                    <span>{ms.branch}</span>
                                  </div>
                                )}
                                {ms.impact && (
                                  <p className="milestone-impact">
                                    <strong>Impact:</strong> {ms.impact}
                                  </p>
                                )}
                                <button
                                  type="button"
                                  className="remove-milestone-btn"
                                  onClick={() => removePendingMilestone(index)}
                                  aria-label="Remove milestone"
                                >
                                  <X size={16} />
                                  <span className="remove-text">Remove</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="no-milestones">
                          <p>No pending milestones. Add a milestone to record important career events.</p>
                          <div className="milestone-hint">
                            <div className="hint-item">
                              <Award size={16} />
                              <span>Promotions</span>
                            </div>
                            <div className="hint-item">
                              <Calendar size={16} />
                              <span>Certifications</span>
                            </div>
                            <div className="hint-item">
                              <Building size={16} />
                              <span>Transfers</span>
                            </div>
                          </div>
                          <p className="auto-milestone-note">
                            <strong>Note:</strong> Role changes and branch transfers will automatically be recorded as milestones when you save changes.
                          </p>
                        </div>
                      )}
                    </>
                  )}
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
                        <span className="upload-hint">Click to browse or drag and drop files here</span>
                        <span className="upload-format">Allowed: PDF, Word, JPEG, PNG (Max: 5MB)</span>
                      </div>
                    </label>
                  </div>
                  
                  {documentError && (
                    <div className="document-error">
                      <AlertCircle size={18} />
                      <span>{documentError}</span>
                    </div>
                  )}
                  
                  {uploadedDocuments.length > 0 && (
                    <div className="document-list">
                      <div className="document-list-header">
                        <h4>New Documents</h4>
                      </div>
                      <div className="document-items-container">
                        {uploadedDocuments.map((doc, index) => (
                          <DocumentItem 
                            key={index} 
                            document={doc} 
                            isUploaded={true} 
                            index={index} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {documents.length > 0 && (
                    <div className="existing-documents">
                      <div className="document-list-header">
                        <h4>Existing Documents</h4>
                      </div>
                      <div className="document-items-container">
                        {documents.map(doc => (
                          <DocumentItem 
                            key={doc._id} 
                            document={doc} 
                            isUploaded={false} 
                          />
                        ))}
                      </div>
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