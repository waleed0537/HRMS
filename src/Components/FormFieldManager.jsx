import React, { useState, useEffect } from 'react';
import { 
    Plus, Settings, Save, X, GripVertical, 
    Edit2, Trash2, AlertCircle, CheckCircle, Info
} from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/FormFieldManager.css';
import { useToast } from './common/ToastContent.jsx';

const FormFieldManager = ({ isOpen, onClose }) => {
    const { success: showSuccess, error: showError, info: showInfo } = useToast();
    
    const [formFields, setFormFields] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [draggingId, setDraggingId] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchFormFields();
            // Get current user role
            const userData = localStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        }
    }, [isOpen]);

    const fetchFormFields = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/admin/form-fields`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch form fields');
            }

            const data = await response.json();
            setFormFields(data.sort((a, b) => a.order - b.order));
            setLoading(false);
        } catch (err) {
            setError('Failed to load form fields. Please try again.');
            setLoading(false);
            showError('Failed to load form fields');
        }
    };

    const handleSaveField = async () => {
        try {
            if (!editingField.label.trim()) {
                setError('Field label is required');
                return;
            }

            const token = localStorage.getItem('token');
            const method = editingField._id ? 'PUT' : 'POST';
            const url = editingField._id 
                ? `${API_BASE_URL}/api/admin/form-fields/${editingField._id}`
                : `${API_BASE_URL}/api/admin/form-fields`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingField)
            });

            if (!response.ok) {
                throw new Error('Failed to save field');
            }

            const savedField = await response.json();
            
            if (editingField._id) {
                setFormFields(formFields.map(f => 
                    f._id === savedField._id ? savedField : f
                ));
                showSuccess('Field updated successfully');
            } else {
                setFormFields([...formFields, savedField]);
                showSuccess('New field added successfully');
            }

            setEditingField(null);
            setSuccess('Field saved successfully');
            setError('');
            
            // Refresh the list to get the latest order
            fetchFormFields();
        } catch (err) {
            setError('Failed to save field. Please try again.');
            showError('Failed to save field');
        }
    };

    const handleDeleteField = async (fieldId) => {
        if (!window.confirm('Are you sure you want to delete this field? This cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/admin/form-fields/${fieldId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete field');
            }

            setFormFields(formFields.filter(f => f._id !== fieldId));
            setSuccess('Field deleted successfully');
            showSuccess('Field deleted successfully');
            
            // Clear any editing field if it was the one deleted
            if (editingField && editingField._id === fieldId) {
                setEditingField(null);
            }
        } catch (err) {
            setError('Failed to delete field. Please try again.');
            showError('Failed to delete field');
        }
    };

    const handleDragStart = (fieldId) => {
        setDraggingId(fieldId);
    };

    const handleDragOver = (e, targetId) => {
        e.preventDefault();
        if (draggingId === targetId) return;

        // Find the index of both the dragged and target field
        const dragIndex = formFields.findIndex(f => f._id === draggingId);
        const targetIndex = formFields.findIndex(f => f._id === targetId);

        if (dragIndex === -1 || targetIndex === -1) return;

        // Create a copy of the fields array
        const updatedFields = [...formFields];
        
        // Remove the dragged field
        const [draggedField] = updatedFields.splice(dragIndex, 1);
        
        // Insert it at the target position
        updatedFields.splice(targetIndex, 0, draggedField);
        
        // Update the order property for each field
        const reorderedFields = updatedFields.map((field, index) => ({
            ...field,
            order: index
        }));
        
        setFormFields(reorderedFields);
    };

    const handleDragEnd = async () => {
        setDraggingId(null);
        
        // Save the new order to the server
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/admin/form-fields/reorder`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: formFields })
            });

            if (!response.ok) {
                throw new Error('Failed to update field order');
            }
            
            showInfo('Field order updated');
        } catch (err) {
            setError('Failed to update field order');
            showError('Failed to update field order');
            // Refresh the fields to get the original order
            fetchFormFields();
        }
    };

    const getFieldTypeLabel = (type) => {
        const typeMap = {
            'text': 'Text Input',
            'email': 'Email Input',
            'tel': 'Phone Input',
            'select': 'Dropdown',
            'textarea': 'Text Area',
            'date': 'Date Picker',
            'checkbox': 'Checkbox',
            'radio': 'Radio Buttons',
            'file': 'File Upload'
        };
        
        return typeMap[type] || type;
    };

    

    if (!isOpen) return null;

    return (
        <div className={`form-field-manager ${isOpen ? 'open' : ''}`}>
            <div className="manager-content">
                <div className="manager-header">
                    <h2>
                        <Settings className="header-icon" size={20} />
                        Customize Application Form
                    </h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        <CheckCircle size={20} />
                        <span>{success}</span>
                    </div>
                )}

                <div className="fields-container">
                    <div className="fields-header">
                        <h3>Form Fields</h3>
                        <button 
                            className="add-field-btn"
                            onClick={() => setEditingField({
                                label: '',
                                type: 'text',
                                required: true,
                                section: 'personal',
                                order: formFields.length,
                                options: []
                            })}
                        >
                            <Plus size={16} />
                            Add New Field
                        </button>
                    </div>

                    {loading ? (
                        <div className="fields-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading form fields...</p>
                        </div>
                    ) : formFields.length === 0 ? (
                        <div className="fields-empty">
                            <Info size={48} color="#94a3b8" />
                            <p>No form fields found</p>
                            <p className="fields-empty-hint">Click "Add New Field" to create your first form field</p>
                        </div>
                    ) : (
                        <div className="fields-list">
                            {formFields.map((field) => (
                                <div 
                                    key={field._id} 
                                    className={`field-item ${draggingId === field._id ? 'dragging' : ''}`}
                                    draggable
                                    onDragStart={() => handleDragStart(field._id)}
                                    onDragOver={(e) => handleDragOver(e, field._id)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="field-drag-handle">
                                        <GripVertical size={16} />
                                    </div>
                                    <div className="field-info">
                                        <span className="field-label">{field.label}</span>
                                        <div className="field-metadata">
                                            <span className="field-type">{getFieldTypeLabel(field.type)}</span>
                                          
                                            {field.required && (
                                                <span className="required-badge">Required</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="field-actions">
                                        <button 
                                            onClick={() => setEditingField({...field})}
                                            className="edit-btn"
                                            title="Edit field"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteField(field._id)}
                                            className="delete-btn"
                                            title="Delete field"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editingField && (
                    <div className="field-editor">
                        <h3>
                            {editingField._id ? (
                                <>
                                    <Edit2 size={18} />
                                    Edit Field
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Add New Field
                                </>
                            )}
                        </h3>
                        <div className="editor-grid">
                            <div className="editor-field">
                                <label>Field Label <span className="required-text">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={editingField.label}
                                    onChange={(e) => setEditingField({
                                        ...editingField,
                                        label: e.target.value
                                    })}
                                    placeholder="Enter field label"
                                />
                            </div>

                            <div className="editor-field">
                                <label>Field Type <span className="required-text">*</span></label>
                                <select
                                    value={editingField.type}
                                    onChange={(e) => setEditingField({
                                        ...editingField,
                                        type: e.target.value,
                                        // Reset options when changing to/from select
                                        options: e.target.value === 'select' ? 
                                            (editingField.options?.length ? editingField.options : ['']) : 
                                            []
                                    })}
                                >
                                    <option value="text">Text Input</option>
                                    <option value="email">Email Input</option>
                                    <option value="tel">Phone Input</option>
                                    <option value="select">Dropdown</option>
                                    <option value="textarea">Text Area</option>
                                    <option value="date">Date Picker</option>
                                    <option value="checkbox">Checkbox</option>
                                </select>
                            </div>

                            <div className="editor-field">
                                <label>Section <span className="required-text">*</span></label>
                                <select
                                    value={editingField.section}
                                    onChange={(e) => setEditingField({
                                        ...editingField,
                                        section: e.target.value
                                    })}
                                >
                                    <option value="personal">Personal Information</option>
                                    <option value="professional">Professional Information</option>
                                    <option value="education">Education</option>
                                    <option value="experience">Work Experience</option>
                                    <option value="additional">Additional Information</option>
                                </select>
                            </div>
                            
                            <div className="editor-field">
                                <label>Field Order</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editingField.order !== undefined ? editingField.order : formFields.length}
                                    onChange={(e) => setEditingField({
                                        ...editingField,
                                        order: parseInt(e.target.value)
                                    })}
                                />
                            </div>

                            <div className="editor-field checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={editingField.required}
                                        onChange={(e) => setEditingField({
                                            ...editingField,
                                            required: e.target.checked
                                        })}
                                    />
                                    Required Field
                                </label>
                            </div>

                            {editingField.type === 'select' && (
                                <div className="editor-field full-width">
                                    <label>Options (one per line) <span className="required-text">*</span></label>
                                    <textarea
                                        value={(editingField.options || []).join('\n')}
                                        onChange={(e) => setEditingField({
                                            ...editingField,
                                            options: e.target.value.split('\n').filter(Boolean)
                                        })}
                                        placeholder="Enter options (one per line)..."
                                        rows={4}
                                    />
                                </div>
                            )}
                            
                            <div className="editor-field full-width">
                                <label>Placeholder Text</label>
                                <input
                                    type="text"
                                    value={editingField.placeholder || ''}
                                    onChange={(e) => setEditingField({
                                        ...editingField,
                                        placeholder: e.target.value
                                    })}
                                    placeholder="Enter placeholder text (optional)"
                                />
                            </div>
                        </div>

                        <div className="editor-actions">
                            <button 
                                onClick={() => {
                                    setEditingField(null);
                                    setError('');
                                }}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="save-btn"
                            >
                                <Save size={16} />
                                Save Field
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormFieldManager;