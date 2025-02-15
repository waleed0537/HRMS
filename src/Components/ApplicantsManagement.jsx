import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Download, Eye, User, Mail, Phone,
    Building, Briefcase, Calendar, CheckCircle, XCircle,
    AlertCircle, FileText
} from 'lucide-react';
import API_BASE_URL from '../config/api.js';
import '../assets/css/ApplicantsManagement.css';

const ApplicantsManagement = () => {
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

    // Get unique positions and branches for filters
    const positions = [...new Set(applicants.map(app => app.jobDetails.position))];
    const branches = [...new Set(applicants.map(app => app.jobDetails.branch))];

    useEffect(() => {
        fetchApplicants();
    }, []);

    const fetchApplicants = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/applicants`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch applicants');

            const data = await response.json();
            setApplicants(data);
            setFilteredApplicants(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...applicants];

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(app =>
                app.personalDetails.name.toLowerCase().includes(searchLower) ||
                app.personalDetails.email.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.status) {
            result = result.filter(app => app.status === filters.status);
        }

        // Position filter
        if (filters.position) {
            result = result.filter(app => app.jobDetails.position === filters.position);
        }

        // Branch filter
        if (filters.branch) {
            result = result.filter(app => app.jobDetails.branch === filters.branch);
        }

        setFilteredApplicants(result);
    };

    useEffect(() => {
        applyFilters();
    }, [searchTerm, filters, applicants]);

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
            applyFilters();
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'shortlisted':
                return <CheckCircle className="status-icon shortlisted" />;
            case 'rejected':
                return <XCircle className="status-icon rejected" />;
            case 'pending':
                return <AlertCircle className="status-icon pending" />;
            case 'reviewed':
                return <Eye className="status-icon reviewed" />;
            default:
                return null;
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

                        <select
                            value={filters.position}
                            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">All Positions</option>
                            {positions.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>

                        <select
                            value={filters.branch}
                            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="applicants-grid">
                {filteredApplicants.map(applicant => (
                    <div key={applicant._id} className="applicant-card">
                        <div className="card-header">
                            <div className="applicant-avatar">
                                {applicant.personalDetails.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="applicant-info">
                                <h3>{applicant.personalDetails.name}</h3>
                                <p className="position">{applicant.jobDetails.position}</p>
                                <span className={`status-badge ${applicant.status}`}>
                                    {getStatusIcon(applicant.status)}
                                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                </span>
                            </div>
                        </div>

                        <div className="contact-details">
                            <div className="detail-item">
                                <Mail className="detail-icon" />
                                <span>{applicant.personalDetails.email}</span>
                            </div>
                            <div className="detail-item">
                                <Phone className="detail-icon" />
                                <span>{applicant.personalDetails.phone}</span>
                            </div>
                            <div className="detail-item">
                                <Building className="detail-icon" />
                                <span>{applicant.jobDetails.branch}</span>
                            </div>
                        </div>

                        <div className="application-meta">
                            <div className="meta-item">
                                <Calendar className="meta-icon" />
                                <span>Applied: {new Date(applicant.createdAt).toLocaleDateString()}</span>
                            </div>
                            {applicant.resume && (
                                <div className="meta-item">
                                    <FileText className="meta-icon" />
                                    <button
                                        onClick={() => downloadResume(applicant._id, applicant.resume.filename)}
                                        className="download-resume"
                                    >
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

            {selectedApplicant && (
                <div className="modal-overlay" onClick={() => setSelectedApplicant(null)}>
                    <div className="applicant-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedApplicant(null)}>
                            &times;
                        </button>

                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="modal-avatar">
                                    {selectedApplicant.personalDetails.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="modal-title">
                                    <h2>{selectedApplicant.personalDetails.name}</h2>
                                    <p className="modal-subtitle">{selectedApplicant.jobDetails.position}</p>
                                    <span className={`modal-status ${selectedApplicant.status}`}>
                                        {getStatusIcon(selectedApplicant.status)}
                                        {selectedApplicant.status.charAt(0).toUpperCase() + selectedApplicant.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="modal-sections">
                                {/* Personal Information Section */}
                                <div className="modal-section">
                                    <h3 className="section-title">
                                        <User className="section-icon" />
                                        Personal Information
                                    </h3>
                                    <div className="section-content">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>Full Name</label>
                                                <p>{selectedApplicant.personalDetails.name}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Email Address</label>
                                                <p>{selectedApplicant.personalDetails.email}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Phone Number</label>
                                                <p>{selectedApplicant.personalDetails.phone}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Address</label>
                                                <p>{selectedApplicant.personalDetails.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Application Details Section */}
                                <div className="modal-section">
                                    <h3 className="section-title">
                                        <Briefcase className="section-icon" />
                                        Application Details
                                    </h3>
                                    <div className="section-content">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>Position Applied For</label>
                                                <p>{selectedApplicant.jobDetails.position}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Preferred Branch</label>
                                                <p>{selectedApplicant.jobDetails.branch}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Application Date</label>
                                                <p>{new Date(selectedApplicant.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Last Updated</label>
                                                <p>{new Date(selectedApplicant.updatedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resume Section */}
                                {selectedApplicant.resume && (
                                    <div className="modal-section">
                                        <h3 className="section-title">
                                            <FileText className="section-icon" />
                                            Resume
                                        </h3>
                                        <div className="section-content">
                                            <div className="resume-container">
                                                <p className="resume-filename">{selectedApplicant.resume.filename}</p>
                                                <button
                                                    onClick={() => downloadResume(selectedApplicant._id, selectedApplicant.resume.filename)}
                                                    className="download-button"
                                                >
                                                    <Download size={18} />
                                                    Download Resume
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Application Status Section */}
                                <div className="modal-section">
                                    <h3 className="section-title">
                                        <AlertCircle className="section-icon" />
                                        Application Status
                                    </h3>
                                    <div className="section-content">
                                        <div className="status-update-container">
                                            <select
                                                value={selectedApplicant.status}
                                                onChange={(e) => handleStatusUpdate(selectedApplicant._id, e.target.value)}
                                                className={`status-select-large ${selectedApplicant.status}`}
                                            >
                                                <option value="pending">Pending Review</option>
                                                <option value="reviewed">Application Reviewed</option>
                                                <option value="shortlisted">Shortlisted for Interview</option>
                                                <option value="rejected">Application Rejected</option>
                                            </select>
                                            <p className="status-help-text">
                                                Update the application status to track the candidate's progress
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="close-button"
                                    onClick={() => setSelectedApplicant(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicantsManagement;