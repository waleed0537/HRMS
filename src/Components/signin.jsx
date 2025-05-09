import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building, Phone, MapPin, Briefcase, UserPlus, LogIn, IdCard } from 'lucide-react';
import '../assets/css/signin.css';
import API_BASE_URL from '../config/api.js';
import { useToast } from './common/ToastContent.jsx';

const SignIn = ({ onLogin }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState(''); // New field for user ID
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('employee');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animation, setAnimation] = useState(false);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // Animation effect when switching between sign-in and sign-up
  useEffect(() => {
    setAnimation(true);
    const timer = setTimeout(() => setAnimation(false), 600);
    return () => clearTimeout(timer);
  }, [isSignIn]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in');
      }

      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success animation 
      setAnimation(true);
      
      // Notify user using toast
      success('Signed in successfully!');
      
      // Call onLogin callback with the user data
      onLogin(data.user);
    } catch (err) {
      // Show error using toast
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user data object with required structure
      const userData = {
        personalDetails: {
          name: name,
          id: userId, // Include the user ID field
          email,
          contact,
          address
        },
        professionalDetails: {
          role,
          branch,
          department: department || 'General',
          status: 'active'
        },
        password
      };

      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      // Show success animation
      setAnimation(true);
      
      // Show success message using toast and switch to sign in
      success('Account created! Please wait for admin approval before signing in.');
      
      // Reset form fields
      setName('');
      setUserId('');
      setEmail('');
      setPassword('');
      setContact('');
      setAddress('');
      setRole('employee');
      setBranch('');
      setDepartment('');
      
      // Switch to sign in form
      setTimeout(() => {
        setIsSignIn(true);
      }, 1000);
      
    } catch (err) {
      // Show error using toast
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setAnimation(true);
    setTimeout(() => {
      setIsSignIn(!isSignIn);
    }, 300);
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${animation ? 'animate' : ''} ${isSignIn ? 'signin-mode' : 'signup-mode'}`}>
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-circle">
              {isSignIn ? <LogIn size={24} /> : <UserPlus size={24} />}
            </div>
          </div>
          <h1 className="auth-title">{isSignIn ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="auth-subtitle">
            {isSignIn ? 'Sign in to access your account' : 'Register to join our platform'}
          </p>
        </div>

        <form className="auth-form" onSubmit={isSignIn ? handleSignIn : handleSignUp}>
          {isSignIn ? (
            // Sign In Form
            <div className="auth-fields">
              <div className="form-field">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="field-icon" />
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <Lock className="field-icon" />
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            // Sign Up Form
            <div className="auth-fields">
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-with-icon">
                    <User className="field-icon" />
                    <input
                      id="name"
                      type="text"
                      className="form-input"
                      placeholder="e.g Ali Hassan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="userId">User ID</label>
                  <div className="input-with-icon">
                    <IdCard className="field-icon" />
                    <input
                      id="userId"
                      type="text"
                      className="form-input"
                      placeholder="e.g 12"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="signup-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="field-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="signup-password">Password</label>
                <div className="input-with-icon">
                  <Lock className="field-icon" />
                  <input
                    id="signup-password"
                    type="password"
                    className="form-input"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="contact">Contact Number</label>
                  <div className="input-with-icon">
                    <Phone className="field-icon" />
                    <input
                      id="contact"
                      type="tel"
                      className="form-input"
                      placeholder="Your phone number"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="role">Role</label>
                  <div className="input-with-icon">
                    <Briefcase className="field-icon" />
                    <select
                      id="role"
                      className="form-input"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="employee">Employee</option>
                      <option value="agent">Agent</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="t1_member">T1 Member</option>
                      <option value="operational_manager">Operational Manager</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="branch">Branch</label>
                  <div className="input-with-icon">
                    <Building className="field-icon" />
                    <input
                      id="branch"
                      type="text"
                      className="form-input"
                      placeholder="Your branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="department">Department</label>
                  <div className="input-with-icon">
                    <MapPin className="field-icon" />
                    <input
                      id="department"
                      type="text"
                      className="form-input"
                      placeholder="Your department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="address">Address</label>
                <div className="input-with-icon textarea-icon">
                  <MapPin className="field-icon" />
                  <textarea
                    id="address"
                    className="form-textarea"
                    placeholder="Your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={3}
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="button-loader"></span>
            ) : (
              isSignIn ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="toggle-text">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            type="button" 
            className="toggle-button"
            onClick={toggleMode}
          >
            {isSignIn ? 'Create Account' : 'Sign In'}
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            className="apply-button"
            onClick={() => navigate('/apply')}
          >
            Apply For a Position
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;