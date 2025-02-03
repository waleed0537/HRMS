import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import '../assets/css/signin.css';

const SignIn = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'agent',
    branchName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const endpoint = isLogin ? '/api/signin' : '/api/signup';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          branchName: formData.branchName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      if (isLogin) {
        // Store the token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Call the onLogin callback with the user data
        onLogin(data.user);
        
        // Explicit navigation to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError('Signup successful! Please wait for admin approval.');
        setIsLogin(true);
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          role: 'agent',
          branchName: ''
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2 className="auth-title">
          {isLogin ? 'Sign in to your account' : 'Create an account'}
        </h2>
        
        {error && (
          <div className="error-message" style={{ 
            color: error.includes('successful') ? 'green' : 'red', 
            textAlign: 'center', 
            marginTop: '1rem' 
          }}>
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <Mail className="field-icon" />
            <input
              id="email"
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
              id="password"
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
            <>
              <div className="form-field">
                <Lock className="field-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm Password"
                />
              </div>

              <div className="form-field">
                <User className="field-icon" />
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input form-select"
                >
                  <option value="agent">Agent</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="t1_member">T1 Member</option>
                  <option value="operational_manager">Operational Manager</option>
                </select>
              </div>

              <div className="form-field">
                <User className="field-icon" />
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  required
                  value={formData.branchName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Branch Name"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 
              (isLogin ? 'Signing in...' : 'Signing up...') : 
              (isLogin ? 'Sign in' : 'Sign up')}
          </button>

          <div className="toggle-auth">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  role: 'agent',
                  branchName: ''
                });
              }}
              className="toggle-button"
            >
              {isLogin 
                ? 'Need an account? Sign up' 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;