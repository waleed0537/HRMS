import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import '../assets/css/ApplicantForm.css';
import API_BASE_URL from '../config/api.js';
import { useToast } from './common/ToastContent.jsx';

const ApplicantForm = () => {
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [resume, setResume] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const toast = useToast();

  useEffect(() => {
    fetchFormFields();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      // Use a public endpoint for branches that doesn't require authentication
      // Option 1: Add a new endpoint on your server (recommended)
      const response = await fetch(`${API_BASE_URL}/api/public/branches`);
      
      // Option 2: If you can't add a new endpoint, handle the error gracefully
      // and use hardcoded branches or fetch from another source
      
      if (!response.ok) {
        // If the API returns an error, log it but don't show a toast
        console.warn('Could not load branches from API, using defaults');
        // Set some default branches
        setBranches([
          { name: 'Headquarters', id: 'hq' },
          { name: 'Lahore', id: 'lahore' },
          { name: 'Karachi', id: 'karachi' }
        ]);
        return;
      }

      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Failed to load branches:', err);
      // Don't show a toast for this error, just use default branches
      setBranches([
        { name: 'Headquarters', id: 'hq' },
        { name: 'Lahore', id: 'lahore' },
        { name: 'Karachi', id: 'karachi' }
      ]);
    }
  };

  const fetchFormFields = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/form-fields`);
      if (!response.ok) throw new Error('Failed to fetch form fields');
      const fields = await response.json();
      setFormFields(fields);
      
      // Initialize form data with empty values
      const initialData = {};
      fields.forEach(field => {
        const fieldKey = getFieldKey(field.label);
        initialData[fieldKey] = '';
      });
      setFormData(initialData);
      
    } catch (err) {
      toast.error('Failed to load form fields. Please try again later.');
    }
  };

  // Helper to get consistent field keys
  const getFieldKey = (label) => {
    return label.toLowerCase().replace(/\s+/g, '');
  };

  const validateField = (field, value) => {
    const fieldKey = getFieldKey(field.label);
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.required && (!value || value.trim() === '')) {
      isValid = false;
      errorMessage = `${field.label} is required`;
    }
    // Type-specific validation
    else if (value) {
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
          break;
          
        case 'tel':
          // Use the pattern from the field if available, otherwise use default
          const phonePattern = field.pattern || "^[0-9\\+\\-\\(\\)\\s]+$";
          const phoneRegex = new RegExp(phonePattern);
          if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
          }
          break;
          
        case 'number':
          // Strict number validation - check for numeric values only
          const numberPattern = field.pattern || "^[0-9]+(\\.[0-9]+)?$";
          const numberRegex = new RegExp(numberPattern);
          if (!numberRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid number';
          }
          break;
      }
    }

    // Update form errors
    setFormErrors(prev => ({
      ...prev,
      [fieldKey]: isValid ? '' : errorMessage
    }));

    return isValid;
  };

  const handleInputChange = (field, value) => {
    const fieldKey = getFieldKey(field.label);
    
    // Special handling for number type
    if (field.type === 'number') {
      // Only allow numeric input
      if (value !== '' && !/^[0-9]*\.?[0-9]*$/.test(value)) {
        // If non-numeric input, don't update the form data
        // and show an error
        setFormErrors(prev => ({
          ...prev,
          [fieldKey]: 'Please enter numbers only'
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    // Validate the field as user types
    validateField(field, value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }

      setResume(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate all fields
      let isFormValid = true;
      
      formFields.forEach(field => {
        const fieldKey = getFieldKey(field.label);
        const fieldValue = formData[fieldKey];
        const isFieldValid = validateField(field, fieldValue);
        
        if (!isFieldValid) {
          isFormValid = false;
        }
      });
      
      if (!isFormValid) {
        throw new Error('Please correct the errors in the form');
      }

      if (!resume) {
        throw new Error('Please upload your resume');
      }

      // Prepare form data
      const submitData = new FormData();

      // Organize form data into sections
      const personalDetails = {};
      const jobDetails = {};
      const additionalDetails = {};

      // Group fields by their section
      formFields.forEach(field => {
        const fieldKey = getFieldKey(field.label);
        const value = formData[fieldKey] || '';

        switch (field.section) {
          case 'personal':
            personalDetails[fieldKey] = value;
            // Map common personal fields to standard names
            if (fieldKey === 'fullname' || fieldKey === 'name') {
              personalDetails.name = value;
            } else if (fieldKey === 'email') {
              personalDetails.email = value;
            } else if (fieldKey === 'phone' || fieldKey === 'contact') {
              personalDetails.phone = value;
            }
            break;
            
          case 'professional':
            jobDetails[fieldKey] = value;
            // CRITICAL FIX: Always store branch name consistently as both 'branch' and 'branchName'
            if (fieldKey === 'branchname' || fieldKey === 'branch') {
              jobDetails.branch = value;
              jobDetails.branchName = value;
            } else if (fieldKey === 'position' || fieldKey === 'jobtitle') {
              jobDetails.position = value;
            } else if (fieldKey === 'department') {
              jobDetails.department = value;
            } else if (fieldKey === 'experience') {
              jobDetails.experience = value;
            }
            break;
            
          case 'additional':
            additionalDetails[fieldKey] = value;
            break;
            
          default:
            // If section is not specified, add to additional details
            additionalDetails[fieldKey] = value;
        }
      });

      // Ensure essential fields are set
      if (!personalDetails.name && (personalDetails.fullname || personalDetails.firstname)) {
        personalDetails.name = personalDetails.fullname || 
                             `${personalDetails.firstname} ${personalDetails.lastname || ''}`.trim();
      }

      // CRITICAL FIX: Ensure both branch fields are set consistently
      if (!jobDetails.branch && personalDetails.branchname) {
        jobDetails.branch = personalDetails.branchname;
        jobDetails.branchName = personalDetails.branchname;
      }

      console.log('Submitting application with data:', {
        personalDetails,
        jobDetails,
        additionalDetails
      });

      submitData.append('personalDetails', JSON.stringify(personalDetails));
      submitData.append('jobDetails', JSON.stringify(jobDetails));
      // IMPORTANT: Standardize branchName for consistency
      submitData.append('branchName', jobDetails.branch || jobDetails.branchName || '');
      submitData.append('resume', resume);

      // Optional additional details if any exist
      if (Object.keys(additionalDetails).length > 0) {
        submitData.append('additionalDetails', JSON.stringify(additionalDetails));
      }

      const response = await fetch(`${API_BASE_URL}/api/applicants`, {
        method: 'POST',
        body: submitData
      });

      const responseData = await response.json();
      console.log('Server Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit application');
      }

      toast.success('Application submitted successfully!');
      setSubmitted(true);
      setFormData({});
      setResume(null);

    } catch (err) {
      console.error('Form submission error:', err);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render appropriate input based on field type
  const renderFieldInput = (field) => {
    const fieldKey = getFieldKey(field.label);
    const value = formData[fieldKey] || '';
    const error = formErrors[fieldKey];
    
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
            className={`form-input ${error ? 'input-error' : ''}`}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
        
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
            className={`form-textarea ${error ? 'input-error' : ''}`}
            placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
            rows={4}
          />
        );
        
      case 'number':
        return (
          <input
            type="number" // Use native number input
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
            className={`form-input ${error ? 'input-error' : ''}`}
            placeholder={field.placeholder || `Enter a number`}
            min={field.min} // Support min attribute if provided
            max={field.max} // Support max attribute if provided
            step={field.step || "1"} // Support step attribute or default to 1
          />
        );
        
      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
            className={`form-input ${error ? 'input-error' : ''}`}
            placeholder={field.placeholder || `Enter your phone number`}
            pattern={field.pattern || "[0-9\\+\\-\\(\\)\\s]+"}
          />
        );
        
      case 'file':
        // Handle file uploads separate from resume
        return (
          <div className="file-upload-container">
            <input
              type="file"
              id={`file-${fieldKey}`}
              onChange={(e) => handleInputChange(field, e.target.files[0])}
              required={field.required}
              className="hidden"
              accept={field.accept || ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
            />
            <label htmlFor={`file-${fieldKey}`} className="file-upload-label">
              <Upload className="upload-icon" size={18} />
              <span className="upload-text">
                {formData[fieldKey] ? formData[fieldKey].name : `Upload ${field.label}`}
              </span>
            </label>
          </div>
        );
        
      default:
        // Default to regular text input with appropriate type
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
            className={`form-input ${error ? 'input-error' : ''}`}
            placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
            pattern={field.pattern}
          />
        );
    }
  };

  // Special case for branch field - uses fetched branches
  const renderBranchField = (field) => {
    const fieldKey = getFieldKey(field.label);
    const value = formData[fieldKey] || '';
    const error = formErrors[fieldKey];
    
    // Check if this field appears to be a branch field
    const isBranchField = 
      fieldKey === 'branch' || 
      fieldKey === 'branchname' || 
      field.label.toLowerCase().includes('branch');
    
    // If it's a branch field and we have branches, render a select with our fetched branches
    if (isBranchField && branches.length > 0 && field.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          required={field.required}
          className={`form-input ${error ? 'input-error' : ''}`}
        >
          <option value="">Select Branch</option>
          {branches.map((branch) => (
            <option key={branch.id || branch._id || branch.name} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
      );
    }
    
    // Otherwise render the normal field input
    return renderFieldInput(field);
  };

  if (submitted) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Application Submitted!</h2>
          <p className="success-message">
            Thank you for your application. We will review your information and contact you soon.
          </p>
        </div>
      </div>
    );
  }

  // Helper function to render a form section
  const renderFormSection = (title, sectionName) => {
    const sectionFields = formFields.filter(field => field.section === sectionName);
    
    if (sectionFields.length === 0) return null;
    
    return (
      <div className="form-section">
        <h3>{title}</h3>
        <div className="form-grid">
          {sectionFields.map((field) => (
            <div key={field._id} className={`form-field ${field.type === 'textarea' ? 'full-width' : ''}`}>
              <label>
                {field.label} {field.required && <span className="required">*</span>}
              </label>
              {renderBranchField(field)}
              {formErrors[getFieldKey(field.label)] && (
                <div className="field-error">{formErrors[getFieldKey(field.label)]}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="applicant-form-container">
      <div className="form-header">
        <h2>Job Application Form</h2>
        <p>Join our team! Please fill out the form below.</p>
      </div>

      <form onSubmit={handleSubmit} className="application-form">
        {/* Personal Information Section */}
        {renderFormSection('Personal Information', 'personal')}
        
        {/* Professional Information Section */}
        {renderFormSection('Professional Information', 'professional')}
        
        {/* Additional Information Section (if any fields exist) */}
        {renderFormSection('Additional Information', 'additional')}

        {/* Resume Upload Section (always present) */}
        <div className="form-section">
          <h3>Resume Upload</h3>
          <div className="upload-container">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-upload" className="upload-label">
              <Upload className="upload-icon" />
              <div className="upload-text">
                <span className="upload-title">{resume ? resume.name : 'Click to upload your resume'}</span>
                <span className="upload-hint">PDF or Word documents only (max 5MB)</span>
              </div>
            </label>
          </div>
          {!resume && formErrors.resume && (
            <div className="field-error resume-error">Please upload your resume</div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default ApplicantForm;