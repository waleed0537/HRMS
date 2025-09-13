// components/AnnouncementModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, Bell, Flag, Clock, Building, Users } from 'lucide-react';
import API_BASE_URL from '../config/api.js';
const AnnouncementModal = ({ isOpen, onClose, onSubmit, userBranch = null }) => {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    branchId: '',
    department: '', // New field for department
    targetType: 'branch', // 'branch' or 'department'
    priority: 'medium',
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      // Set default expiry date to 7 days from now
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      const formattedDate = defaultExpiry.toISOString().slice(0, 16);
      
      // If userBranch is provided (HR manager), automatically set it
      if (userBranch) {
        setFormData(prev => ({
          ...prev,
          branchId: userBranch.id,
          expiresAt: formattedDate
        }));
        // Load departments for the HR's branch
        fetchDepartments(userBranch.id);
      } else {
        setFormData(prev => ({
          ...prev,
          expiresAt: formattedDate
        }));
      }
    }
  }, [isOpen, userBranch]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/branches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.status}`);
      }
      
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (branchId) => {
    if (!branchId) {
      setDepartments([]);
      return;
    }

    try {
      setLoadingDepartments(true);
      const response = await fetch(`${API_BASE_URL}/api/branches/${branchId}/departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }
      
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments(['General', 'HR', 'IT', 'Sales', 'Marketing', 'Operations']); // Fallback departments
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleBranchChange = (branchId) => {
    setFormData(prev => ({
      ...prev,
      branchId,
      department: '', // Reset department when branch changes
      targetType: 'branch' // Reset to branch when changing branch
    }));
    
    if (branchId && !userBranch) {
      fetchDepartments(branchId);
    }
    
    if (fieldErrors.branchId) {
      setFieldErrors({...fieldErrors, branchId: ''});
    }
  };

  const handleTargetTypeChange = (targetType) => {
    setFormData(prev => ({
      ...prev,
      targetType,
      department: targetType === 'branch' ? '' : prev.department
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.content.trim()) errors.content = 'Content is required';
    if (!formData.branchId) errors.branchId = 'Branch is required';
    if (formData.targetType === 'department' && !formData.department) {
      errors.department = 'Department is required when targeting department';
    }
    if (!formData.expiresAt) errors.expiresAt = 'Expiration date is required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Call the onSubmit prop with formData
      await onSubmit(formData);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        branchId: userBranch ? userBranch.id : '',
        department: '',
        targetType: 'branch',
        priority: 'medium',
        expiresAt: ''
      });
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error creating announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={22} color="#4f46e5" />
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Create {formData.targetType === 'department' ? 'Department' : 'Branch'} Announcement
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={22} />
          </button>
        </div>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Title {fieldErrors.title && <span style={{ color: '#dc2626', fontSize: '12px' }}>({fieldErrors.title})</span>}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (fieldErrors.title) {
                  setFieldErrors({...fieldErrors, title: ''});
                }
              }}
              placeholder="Announcement Title"
              style={{
                width: '100%',
                padding: '12px',
                border: fieldErrors.title ? '2px solid #dc2626' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {/* Target Type Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Target Audience
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleTargetTypeChange('branch')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: '2px solid ' + (formData.targetType === 'branch' ? '#4f46e5' : '#d1d5db'),
                  backgroundColor: formData.targetType === 'branch' ? '#eff6ff' : 'white',
                  color: formData.targetType === 'branch' ? '#4f46e5' : '#6b7280',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                <Building size={16} />
                <span>Entire Branch</span>
              </button>
              <button
                type="button"
                onClick={() => handleTargetTypeChange('department')}
                disabled={departments.length === 0 && !loadingDepartments}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: '2px solid ' + (formData.targetType === 'department' ? '#4f46e5' : '#d1d5db'),
                  backgroundColor: formData.targetType === 'department' ? '#eff6ff' : 'white',
                  color: formData.targetType === 'department' ? '#4f46e5' : '#6b7280',
                  borderRadius: '8px',
                  cursor: departments.length === 0 && !loadingDepartments ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: departments.length === 0 && !loadingDepartments ? 0.5 : 1
                }}
              >
                <Users size={16} />
                <span>Specific Department</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: formData.targetType === 'department' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px' }}>
            {/* Branch Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Branch {fieldErrors.branchId && <span style={{ color: '#dc2626', fontSize: '12px' }}>({fieldErrors.branchId})</span>}
              </label>
              {userBranch ? (
                <input
                  type="text"
                  value={userBranch.name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    cursor: 'not-allowed',
                    color: '#6b7280'
                  }}
                />
              ) : (
                <select
                  value={formData.branchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: fieldErrors.branchId ? '2px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Department Selection - Only show when targetType is 'department' */}
            {formData.targetType === 'department' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Department {fieldErrors.department && <span style={{ color: '#dc2626', fontSize: '12px' }}>({fieldErrors.department})</span>}
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({ ...formData, department: e.target.value });
                    if (fieldErrors.department) {
                      setFieldErrors({...fieldErrors, department: ''});
                    }
                  }}
                  disabled={loadingDepartments}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: fieldErrors.department ? '2px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">
                    {loadingDepartments ? 'Loading departments...' : 'Select Department'}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Priority
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['low', 'medium', 'high'].map(priority => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({...formData, priority})}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      border: '2px solid ' + (formData.priority === priority ? getPriorityColor(priority) : '#d1d5db'),
                      backgroundColor: formData.priority === priority ? getPriorityColor(priority) + '20' : 'white',
                      color: formData.priority === priority ? getPriorityColor(priority) : '#6b7280',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Flag size={14} />
                    <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Expires At {fieldErrors.expiresAt && <span style={{ color: '#dc2626', fontSize: '12px' }}>({fieldErrors.expiresAt})</span>}
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => {
                setFormData({ ...formData, expiresAt: e.target.value });
                if (fieldErrors.expiresAt) {
                  setFieldErrors({...fieldErrors, expiresAt: ''});
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: fieldErrors.expiresAt ? '2px solid #dc2626' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Content */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Content {fieldErrors.content && <span style={{ color: '#dc2626', fontSize: '12px' }}>({fieldErrors.content})</span>}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value });
                if (fieldErrors.content) {
                  setFieldErrors({...fieldErrors, content: ''});
                }
              }}
              placeholder="Announcement content..."
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                border: fieldErrors.content ? '2px solid #dc2626' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button 
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#374151',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              <X size={18} />
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                backgroundColor: loading ? '#9ca3af' : '#4f46e5',
                color: 'white',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) e.target.style.backgroundColor = '#4338ca';
              }}
              onMouseOut={(e) => {
                if (!loading) e.target.style.backgroundColor = '#4f46e5';
              }}
            >
              <Check size={18} />
              {loading ? 'Creating...' : `Create ${formData.targetType === 'department' ? 'Department' : 'Branch'} Announcement`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;