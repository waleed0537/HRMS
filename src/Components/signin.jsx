import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building, Phone, MapPin } from 'lucide-react';
import '../assets/css/signin.css';
import API_BASE_URL from '../config/api.js';
import { useToast } from './common/ToastContent.jsx';

const SignIn = ({ onLogin }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('employee');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

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
      
      // Notify user using toast only
      success('Signed in successfully!');
      
      // Call onLogin callback with the user data
      onLogin(data.user);
    } catch (err) {
      // Show error using toast only
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use name from input or fallback to email username
      const userName = name || email.split('@')[0];
      
      // Create user data object with required structure
      const userData = {
        personalDetails: {
          name: userName,
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

      // Show success message using toast only and switch to sign in
      success('Account created! Please wait for admin approval before signing in.');
      setIsSignIn(true);
    } catch (err) {
      // Show error using toast only
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-title">
          <h2>{isSignIn ? 'Sign In' : 'Sign Up'}</h2>
        </div>

        <form className="auth-form" onSubmit={isSignIn ? handleSignIn : handleSignUp}>
          <div className="form-section">
            <h3>Account Details</h3>
            <div className="form-field">
              <div className="input-with-icon">
                <Mail className="field-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <div className="input-with-icon">
                <Lock className="field-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {!isSignIn && (
              <>
                <div className="form-field">
                  <div className="input-with-icon">
                    <User className="field-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <div className="input-with-icon">
                    <Phone className="field-icon" />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Contact Number"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <div className="input-with-icon">
                    <MapPin className="field-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <div className="input-with-icon">
                    <User className="field-icon" />
                    <select
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

                <div className="form-field">
                  <div className="input-with-icon">
                    <Building className="field-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Branch Name"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <div className="input-with-icon">
                    <Building className="field-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Department (Optional)"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Loading...' : isSignIn ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-links">
          <div className="toggle-auth">
            <span>
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="toggle-button"
                onClick={() => setIsSignIn(!isSignIn)}
              >
                {isSignIn ? 'Sign Up' : 'Sign In'}
              </button>
            </span>
          </div>
        </div>

        <div className="apply-section">
          <p>Looking for a job? Apply with your resume!</p>
          <button 
            className="apply-button"
            onClick={() => navigate('/apply')}
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;