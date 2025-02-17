import React, { useState, useEffect } from 'react';
import {
    Search, Download, Eye, User, Mail, Phone,
    Building, Briefcase, Calendar, CheckCircle, XCircle,
    AlertCircle, FileText, Settings, X
} from 'lucide-react';
import API_BASE_URL from '../config/api';
import '../assets/css/ApplicantsManagement.css';
import FormFieldManager from './FormFieldManager';

const ApplicantsManagement = () => {
    const [showFieldManager, setShowFieldManager] = useState(false);
    const [applicants, setApplicants] = useState([]);
    const [filteredApplicants, setFilteredApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        position: '',
        branch: ''
    });

    useEffect(() => {
        fetchApplicants();
    }, []);

    const fetchApplicants = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const endpoint = user.role === 'hr_manager' ? '/api/hr/applicants' : '/api/applicants';
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch applicants');
            }

            const data = await response.json();
            setApplicants(data);
            setFilteredApplicants(data);
        } catch (err) {
            console.error('Error fetching applicants:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/applicants/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');
            
            // Update local state
            const updatedApplicants = applicants.map(app =>
                app._id === id ? { ...app, status: newStatus } : app
            );
            setApplicants(updatedApplicants);
            setFilteredApplicants(prev => 
                prev.map(app => app._id === id ? { ...app, status: newStatus } : app)
            );
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const downloadResume = async (id, filename) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/applicants/${id}/resume`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to download resume');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Error downloading resume:', err);
        }
    };

    // Filtering and search functionality
    useEffect(() => {
        let result = [...applicants];

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(app =>
                app.personalDetails?.name?.toLowerCase().includes(searchLower) ||
                app.personalDetails?.email?.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.status) {
            result = result.filter(app => app.status === filters.status);
        }

        setFilteredApplicants(result);
    }, [searchTerm, filters, applicants]);

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'shortlisted': return <CheckCircle className="status-icon shortlisted" />;
            case 'rejected': return <XCircle className="status-icon rejected" />;
            case 'pending': return <AlertCircle className="status-icon pending" />;
            case 'reviewed': return <Eye className="status-icon reviewed" />;
            default: return <AlertCircle className="status-icon unknown" />;
        }
    };

    if (loading) return <div className="loading-state">Loading applicants...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;

    return (
        <div className="applicants-management">
            <div className="page-header">
                <h1>Manage Applications</h1>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filters">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowFieldManager(true)}
                        className="customize-form-btn"
                    >
                        <Settings size={18} />
                        Customize Form
                    </button>
                </div>
            </div>

            <div className="applicants-grid">
                {filteredApplicants.map(applicant => (
                    <div key={applicant._id} className="applicant-card">
                        <div className="card-header">
                            <div className="applicant-avatar">
                                {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="applicant-info">
                                <h3>{applicant.personalDetails?.name || 'Not provided'}</h3>
                                <p className="position">
                                    {applicant.jobDetails?.position || 'Position not specified'}
                                </p>
                                <span className={`status-badge ${applicant.status || 'pending'}`}>
                                    {getStatusIcon(applicant.status)}
                                    {(applicant.status || 'pending').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="contact-details">
                            <div className="detail-item">
                                <Mail className="detail-icon" />
                                <span>{applicant.personalDetails?.email || 'Email not provided'}</span>
                            </div>
                            {applicant.personalDetails?.phone && (
                                <div className="detail-item">
                                    <Phone className="detail-icon" />
                                    <span>{applicant.personalDetails.phone}</span>
                                </div>
                            )}
                            {applicant.jobDetails?.branch && (
                                <div className="detail-item">
                                    <Building className="detail-icon" />
                                    <span>{applicant.jobDetails.branch}</span>
                                </div>
                            )}
                        </div>

                        <div className="application-meta">
                            <div className="meta-item">
                                <Calendar className="meta-icon" />
                                <span>Applied: {new Date(applicant.createdAt).toLocaleDateString()}</span>
                            </div>
                            {applicant.resume && (
                                <div className="meta-item">
                                    <FileText className="meta-icon" />
                                    <button onClick={() => downloadResume(applicant._id, applicant.resume.filename)}>
                                        Download Resume
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card-actions">
                            <select
                                value={applicant.status}
                                onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
                                className={`status-select ${applicant.status}`}
                            >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                            </select>

                            <button
                                onClick={() => setSelectedApplicant(applicant)}
                                className="view-details-btn"
                            >
                                <Eye size={18} />
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredApplicants.length === 0 && (
                <div className="no-results">
                    <AlertCircle size={48} />
                    <h3>No Applications Found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            )}

            <FormFieldManager
                isOpen={showFieldManager}
                onClose={() => setShowFieldManager(false)}
            />

{selectedApplicant && (
                <div className="modal-overlay">
                    <div className="applicant-modal">
                        <div className="modal-header">
                            <button className="close-modal" onClick={() => setSelectedApplicant(null)}>
                                <X size={24} />
                            </button>
                            <div className="modal-title">
                                <h2>{selectedApplicant.personalDetails?.name || 'Applicant Details'}</h2>
                                <p className="modal-subtitle">
                                    {selectedApplicant.jobDetails?.position || 'Position not specified'}
                                </p>
                                <span className={`status-badge ${selectedApplicant.status}`}>
                                    {getStatusIcon(selectedApplicant.status)}
                                    {(selectedApplicant.status || 'pending').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="modal-sections">
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <User className="section-icon" />
                                    Personal Information
                                </h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Full Name</label>
                                        <p>{selectedApplicant.personalDetails?.name || 'Not provided'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Email</label>
                                        <p>{selectedApplicant.personalDetails?.email || 'Not provided'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Phone</label>
                                        <p>{selectedApplicant.personalDetails?.phone || 'Not provided'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Gender</label>
                                        <p>{selectedApplicant.personalDetails?.gender || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3 className="section-title">
                                    <Briefcase className="section-icon" />
                                    Professional Information
                                </h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Position</label>
                                        <p>{selectedApplicant.jobDetails?.position || 'Not provided'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Branch</label>
                                        <p>{selectedApplicant.jobDetails?.branchName || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedApplicant.resume && (
                                <div className="modal-section">
                                    <h3 className="section-title">
                                        <FileText className="section-icon" />
                                        Resume
                                    </h3>
                                    <div className="resume-container">
                                        <p className="resume-filename">{selectedApplicant.resume.filename}</p>
                                        <button 
                                            className="download-button"
                                            onClick={() => downloadResume(selectedApplicant._id, selectedApplicant.resume.filename)}
                                        >
                                            <Download size={18} />
                                            Download Resume
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="modal-section">
                                <h3 className="section-title">Status Update</h3>
                                <div className="status-update-container">
                                    <select
                                        value={selectedApplicant.status}
                                        onChange={(e) => handleStatusUpdate(selectedApplicant._id, e.target.value)}
                                        className={`status-select-large ${selectedApplicant.status}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="shortlisted">Shortlisted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicantsManagement;