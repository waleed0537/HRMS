import React, { useState, useEffect } from 'react';
import { 
    Plus, Settings, Save, X, GripVertical, 
    Edit2, Trash2, AlertCircle
} from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/FormFieldManager.css';

const FormFieldManager = ({ isOpen, onClose }) => {
    const [formFields, setFormFields] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchFormFields();
        }
    }, [isOpen]);

    const fetchFormFields = async () => {
        try {
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
            setFormFields(data);
        } catch (err) {
            setError('Failed to load form fields');
        }
    };

    const handleSaveField = async () => {
        try {
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
            } else {
                setFormFields([...formFields, savedField]);
            }

            setEditingField(null);
            setSuccess('Field saved successfully');
        } catch (err) {
            setError('Failed to save field');
        }
    };

    const handleDeleteField = async (fieldId) => {
        if (!window.confirm('Are you sure you want to delete this field?')) return;

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
        } catch (err) {
            setError('Failed to delete field');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Customize Application Form</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                <div className="form-fields">
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
                            <Plus size={18} />
                            Add Field
                        </button>
                    </div>

                    <div className="fields-list">
                        {formFields.map((field, index) => (
                            <div key={field._id} className="field-item">
                                <div className="field-drag-handle">
                                    <GripVertical size={16} />
                                </div>
                                <div className="field-info">
                                    <span className="field-label">{field.label}</span>
                                    <span className="field-type">{field.type}</span>
                                    {field.required && (
                                        <span className="required-badge">Required</span>
                                    )}
                                </div>
                                <div className="field-actions">
                                    <button 
                                        onClick={() => setEditingField(field)}
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
                </div>

                {editingField && (
                    <div className="field-editor">
                        <h3>{editingField._id ? 'Edit Field' : 'Add New Field'}</h3>
                        <div className="editor-grid">
                            <div className="editor-field">
                                <label>Field Label</label>
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
                                <label>Field Type</label>
                                <select
                                    value={editingField.type}
                                    onChange={(e) => setEditingField({
                                        ...editingField,
                                        type: e.target.value
                                    })}
                                >
                                    <option value="text">Text</option>
                                    <option value="email">Email</option>
                                    <option value="tel">Phone</option>
                                    <option value="select">Dropdown</option>
                                    <option value="textarea">Text Area</option>
                                </select>
                            </div>

                            <div className="editor-field">
                                <label>Section</label>
                                <select
                                    value={editingField.section}
                                    onChange={(e) => setEditingField({
                                        ...editingField,
                                        section: e.target.value
                                    })}
                                >
                                    <option value="personal">Personal Information</option>
                                    <option value="professional">Professional Information</option>
                                </select>
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
                                    <label>Options (one per line)</label>
                                    <textarea
                                        value={editingField.options.join('\n')}
                                        onChange={(e) => setEditingField({
                                            ...editingField,
                                            options: e.target.value.split('\n').filter(Boolean)
                                        })}
                                        placeholder="Enter options..."
                                        rows={4}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="editor-actions">
                            <button 
                                onClick={() => setEditingField(null)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveField}
                                className="save-btn"
                            >
                                <Save size={18} />
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