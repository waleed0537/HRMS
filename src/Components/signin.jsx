import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, Phone, MapPin, Building, Briefcase, UserSquare } from 'lucide-react';
import '../assets/css/signin.css';
import API_BASE_URL from '../config/api.js';

const SignIn = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if navigation is coming from a specific route
  const [isLogin, setIsLogin] = useState(true);
  const [showApplyInfo, setShowApplyInfo] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Details
    name: '',
    contact: '',
    email: '',
    address: '',
    
    // Professional Details
    role: 'employee',
    branch: '',
    department: '',
    status: 'active',
    
    // Authentication
    password: '',
    confirmPassword: '',
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check route to determine initial form state
  useEffect(() => {
    // If the route explicitly shows signup, switch to signup form
    if (location.pathname === '/signup') {
      setIsLogin(false);
    }
  }, [location]);

  // Rest of the component remains the same as in the original code...
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLogin) {
        const requiredFields = ['name', 'contact', 'email', 'address', 'branch', 'department', 'password', 'confirmPassword'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
      }

      const endpoint = isLogin ? '/api/signin' : '/api/signup';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isLogin ? {
          email: formData.email,
          password: formData.password
        } : {
          personalDetails: {
            name: formData.name,
            contact: formData.contact,
            email: formData.email,
            address: formData.address
          },
          professionalDetails: {
            role: formData.role,
            branch: formData.branch,
            department: formData.department,
            status: formData.status
          },
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setError('Signup successful! Please wait for admin approval.');
        setIsLogin(true);
        setFormData({
          name: '', contact: '', email: '', address: '',
          role: 'employee', branch: '', department: '', status: 'active',
          password: '', confirmPassword: ''
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyClick = () => {
    navigate('/apply');
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2 className="auth-title">
          {isLogin ? 'Sign in to your account' : 'Create an account'}
        </h2>
        
        {error && (
          <div className="error-message" style={{ 
            color: error.includes('successful') ? 'green' : 'red'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-section">
                <h3>Personal Details</h3>
                <div className="form-field">
                  <User className="field-icon" />
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Full Name"
                  />
                </div>
                <div className="form-field">
                  <Phone className="field-icon" />
                  <input
                    name="contact"
                    type="tel"
                    required
                    value={formData.contact}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Contact Number"
                  />
                </div>

                <div className="form-field">
                  <MapPin className="field-icon" />
                  <input
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Address"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Professional Details</h3>
                <div className="form-field">
                  <Building className="field-icon" />
                  <input
                    name="branch"
                    type="text"
                    required
                    value={formData.branch}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Branch"
                  />
                </div>

                <div className="form-field">
                  <Building className="field-icon" />
                  <input
                    name="department"
                    type="text"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Department"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-section">
            <h3>{isLogin ? 'Login Details' : 'Account Details'}</h3>
            <div className="form-field">
              <Mail className="field-icon" />
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Email address"
              />
            </div>

            <div className="form-field">
              <Lock className="field-icon" />
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Password"
              />
            </div>

            {!isLogin && (
              <div className="form-field">
                <Lock className="field-icon" />
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm Password"
                />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 
              (isLogin ? 'Signing in...' : 'Signing up...') : 
              (isLogin ? 'Sign in' : 'Sign up')}
          </button>

          <div className="auth-links">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({
                  name: '', contact: '', email: '', address: '',
                  role: 'employee', branch: '', department: '', status: 'active',
                  password: '', confirmPassword: ''
                });
              }}
              className="toggle-button"
            >
              {isLogin 
                ? 'Need an account? Sign up' 
                : 'Already have an account? Sign in'}
            </button>

            <div className="apply-section">
              <p>Looking for a job?</p>
              <button
                type="button"
                onClick={handleApplyClick}
                className="apply-button"
              >
                Apply Now
              </button>
            </div>
          </div>
        </form>

        {showApplyInfo && (
          <div className="info-modal">
            <div className="info-content">
              <h3>Join Our Team!</h3>
              <p>Submit your application and take the first step towards your new career.</p>
              <button onClick={handleApplyClick} className="apply-now-button">
                Go to Application Form
              </button>
              <button onClick={() => setShowApplyInfo(false)} className="close-button">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignIn;