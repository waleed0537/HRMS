import '../assets/css/ApplicantForm.css';
import React, { useState } from 'react';
import { Upload, Mail, User, Phone, MapPin, Building, Briefcase, Check } from 'lucide-react';
import API_BASE_URL from '../config/api.js';

const ApplicantForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    branch: ''
  });
  const [resume, setResume] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const positions = [
    'Software Developer',
    'HR Manager',
    'Sales Representative',
    'Project Manager'
  ];

  const branches = [
    'Main Branch',
    'East Branch',
    'West Branch',
    'North Branch'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
      // Validate all required fields
      const requiredFields = ['name', 'email', 'phone', 'address', 'position', 'branch'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      if (!resume) {
        throw new Error('Please upload your resume');
      }

      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Append resume file
      formDataToSend.append('resume', resume);

      const response = await fetch(`${API_BASE_URL}/api/applicants`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSubmitted(true);
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
          <div className="success-icon">
            <Check size={48} className="text-green-500" />
          </div>
          <h2 className="success-title">Application Submitted!</h2>
          <p className="success-message">
            Thank you for your application. We will review your information and contact you soon.
          </p>
          <p className="success-email">
            A confirmation email has been sent to {formData.email}
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
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="application-form">
        <div className="form-section">
          <h3 className="section-title">
            <User className="section-icon" />
            Personal Information
          </h3>
          
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User className="field-icon" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your full name"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail className="field-icon" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <div className="input-with-icon">
                <Phone className="field-icon" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter your phone number"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Address</label>
              <div className="input-with-icon">
                <MapPin className="field-icon" />
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter your address"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <Briefcase className="section-icon" />
            Job Details
          </h3>
          
          <div className="form-grid">
            <div className="form-field">
              <label>Position Applied For</label>
              <div className="input-with-icon">
                <Briefcase className="field-icon" />
                <select
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="form-input"
                >
                  <option value="">Select Position</option>
                  {positions.map(position => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>Preferred Branch</label>
              <div className="input-with-icon">
                <Building className="field-icon" />
                <select
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  className="form-input"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <Upload className="section-icon" />
            Resume Upload
          </h3>
          
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

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default ApplicantForm;