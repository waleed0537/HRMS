import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import '../assets/css/ApplicantForm.css';
import API_BASE_URL from '../config/api.js';

const ApplicantForm = () => {
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [resume, setResume] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFormFields();
  }, []);

  const fetchFormFields = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/form-fields`);
      if (!response.ok) throw new Error('Failed to fetch form fields');
      const fields = await response.json();
      setFormFields(fields);
    } catch (err) {
      setError('Failed to load form fields. Please try again later.');
    }
  };

  const handleInputChange = (label, value) => {
    setFormData(prev => ({
      ...prev,
      [label.toLowerCase()]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }

      setResume(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate required fields
      const requiredFields = formFields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => {
        const value = formData[field.label.toLowerCase()];
        return !value || value.trim() === '';
      });

      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      }

      if (!resume) {
        throw new Error('Please upload your resume');
      }

      // Prepare form data
      const submitData = new FormData();
      
      // Split data into personal and job details
      const personalDetails = {};
      const jobDetails = {};

      Object.entries(formData).forEach(([key, value]) => {
        if (['email', 'name', 'phone', 'gender'].includes(key.toLowerCase())) {
          personalDetails[key] = value;
        } else {
          jobDetails[key] = value;
        }
      });

      submitData.append('personalDetails', JSON.stringify(personalDetails));
      submitData.append('jobDetails', JSON.stringify(jobDetails));
      submitData.append('resume', resume);

      const response = await fetch(`${API_BASE_URL}/api/applicants`, {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit application');
      }

      setSubmitted(true);
      setFormData({});
      setResume(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="applicant-form-container">
      <div className="form-header">
        <h2>Job Application Form</h2>
        <p>Join our team! Please fill out the form below.</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="application-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            {formFields.filter(field => field.section === 'personal').map((field) => (
              <div key={field._id} className="form-field">
                <label>{field.label} {field.required && '*'}</label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.label.toLowerCase()] || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    required={field.required}
                    className="form-input"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.label.toLowerCase()] || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    required={field.required}
                    className="form-input"
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Professional Information</h3>
          <div className="form-grid">
            {formFields.filter(field => field.section === 'professional').map((field) => (
              <div key={field._id} className="form-field">
                <label>{field.label} {field.required && '*'}</label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.label.toLowerCase()] || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    required={field.required}
                    className="form-input"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.label.toLowerCase()] || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    required={field.required}
                    className="form-input"
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Resume Upload</h3>
          <div className="upload-container">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              required
            />
            <label htmlFor="resume-upload" className="upload-label">
              <Upload className="upload-icon" />
              <span className="upload-text">
                {resume ? resume.name : 'Click to upload your resume'}
              </span>
              <span className="upload-hint">
                PDF or Word documents only (max 5MB)
              </span>
            </label>
          </div>
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