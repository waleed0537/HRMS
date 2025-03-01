import React, { useState, useEffect } from 'react';
import {
    Search, Download, Eye, User, Mail, Phone,
    Building, Briefcase, Calendar, CheckCircle, XCircle,
    AlertCircle, FileText, Settings, X, FileDown,
    FileSpreadsheet, File,Grid,List,LayoutGrid // Changed FilePdf to File
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API_BASE_URL from '../config/api';
import FormFieldManager from './FormFieldManager';
import '../assets/css/ApplicantsManagement.css';
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
    const [uniquePositions, setUniquePositions] = useState([]);
    const [uniqueBranches, setUniqueBranches] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // New state for view mode
    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'shortlisted': return <CheckCircle className="status-icon shortlisted" />;
            case 'rejected': return <XCircle className="status-icon rejected" />;
            case 'reviewed': return <Eye className="status-icon reviewed" />;
            case 'pending': return <AlertCircle className="status-icon pending" />;
            default: return <AlertCircle className="status-icon unknown" />;
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
        } catch (error) {
            console.error('Error downloading resume:', error);
        }
    };
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

            // Extract unique positions and branches
            const positions = [...new Set(data.map(app => app.jobDetails?.position).filter(Boolean))];
            const branches = [...new Set(data.map(app => app.jobDetails?.branch).filter(Boolean))];

            setUniquePositions(positions);
            setUniqueBranches(branches);
        } catch (err) {
            console.error('Error fetching applicants:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleViewDetails = async (applicant) => {
        try {
            // Fetch complete details for the applicant
            const response = await fetch(`${API_BASE_URL}/api/applicants/${applicant._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch applicant details');
            }

            const detailedData = await response.json();

            // Transform the data to ensure all fields are properly structured
            const processedData = {
                ...detailedData,
                personalDetails: detailedData.personalDetails instanceof Map ?
                    Object.fromEntries(detailedData.personalDetails) :
                    detailedData.personalDetails || {},
                jobDetails: detailedData.jobDetails instanceof Map ?
                    Object.fromEntries(detailedData.jobDetails) :
                    detailedData.jobDetails || {},
            };

            setSelectedApplicant(processedData);
        } catch (error) {
            console.error('Error fetching applicant details:', error);
            // Still show the modal with available data as fallback
            setSelectedApplicant(applicant);
        }
    };

    useEffect(() => {
        let result = [...applicants];

        // Apply filters
        if (filters.status) {
            result = result.filter(app => app.status === filters.status);
        }
        if (filters.position) {
            result = result.filter(app => app.jobDetails?.position === filters.position);
        }
        if (filters.branch) {
            result = result.filter(app => app.jobDetails?.branch === filters.branch);
        }

        // Apply search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(app =>
                app.personalDetails?.name?.toLowerCase().includes(searchLower) ||
                app.personalDetails?.email?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredApplicants(result);
    }, [searchTerm, filters, applicants]);
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!(user.isAdmin || user.role === 'hr_manager')) {
                alert('Only administrators and HR managers can update application status');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/applicants/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update status');
            }

            const result = await response.json();

            // Update local state
            setApplicants(prevApplicants =>
                prevApplicants.map(app =>
                    app._id === id ? { ...app, status: newStatus } : app
                )
            );

            // If modal is open with this applicant, update it
            if (selectedApplicant && selectedApplicant._id === id) {
                setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
            }

            // Update filtered applicants as well
            setFilteredApplicants(prev =>
                prev.map(app =>
                    app._id === id ? { ...app, status: newStatus } : app
                )
            );

            // Show success message
            alert(`Application status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert(error.message || 'Failed to update status. Please try again.');
        }
    };

    const exportToExcel = (filteredApplicants) => {
        const exportData = filteredApplicants.map(app => ({
            // Personal Information
            'Full Name': app.personalDetails?.name || 'N/A',
            'Email': app.personalDetails?.email || 'N/A',
            'Phone': app.personalDetails?.phone || 'N/A',
            'Gender': app.personalDetails?.gender || 'N/A',

            // Professional Information
            'Position': app.jobDetails?.position || 'N/A',
            'Branch': app.jobDetails?.branchName || app.jobDetails?.branch || app.branchName || 'N/A',
            'Department': app.jobDetails?.department || 'N/A',

            // Application Status
            'Status': app.status || 'N/A',
            'Applied Date': new Date(app.createdAt).toLocaleDateString(),

            // Resume Information
            'Resume Filename': app.resume?.filename || 'No Resume',

            // Additional Information
            'Application ID': app._id || 'N/A',
            'Last Updated': app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Applicants');

        // Auto-size columns
        const colWidths = [];
        exportData.forEach(row => {
            Object.values(row).forEach((value, i) => {
                const length = value.toString().length;
                colWidths[i] = Math.max(colWidths[i] || 0, length);
            });
        });
        ws['!cols'] = colWidths.map(width => ({ wch: width }));

        XLSX.writeFile(wb, `applicants_${new Date().toISOString().split('T')[0]}.xlsx`);
    };


    const exportToPDF = (filteredApplicants) => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text('Applicants Report', 14, 15);

        // Add timestamp
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

        // Define columns for the table
        const tableColumn = [
            'Full Name',
            'Email',
            'Phone',
            'Position',
            'Branch',
            'Status',
            'Applied Date'
        ];

        // Prepare rows data
        const tableRows = filteredApplicants.map(app => [
            app.personalDetails?.name || 'N/A',
            app.personalDetails?.email || 'N/A',
            app.personalDetails?.phone || 'N/A',
            app.jobDetails?.position || 'N/A',
            app.jobDetails?.branchName || app.jobDetails?.branch || app.branchName || 'N/A',
            app.status || 'N/A',
            new Date(app.createdAt).toLocaleDateString()
        ]);

        // Add the table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: {
                fillColor: [71, 71, 135],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Name
                1: { cellWidth: 35 }, // Email
                2: { cellWidth: 20 }, // Phone
                3: { cellWidth: 25 }, // Position
                4: { cellWidth: 25 }, // Branch
                5: { cellWidth: 20 }, // Status
                6: { cellWidth: 20 }  // Applied Date
            }
        });

        // Add details section for each applicant
        let yPos = doc.lastAutoTable.finalY + 10;

        filteredApplicants.forEach((app, index) => {
            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Detailed Information - ${app.personalDetails?.name || 'Applicant'} (${index + 1}/${filteredApplicants.length})`, 14, yPos);

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');

            // Add resume information if available
            if (app.resume?.filename) {
                yPos += 5;
                doc.text(`Resume: ${app.resume.filename}`, 14, yPos);
            }

            // Add branch information
            yPos += 5;
            doc.text(`Branch: ${app.jobDetails?.branchName || app.jobDetails?.branch || app.branchName || 'N/A'}`, 14, yPos);

            // Add a separator line
            yPos += 7;
            doc.line(14, yPos, 196, yPos);
            yPos += 10;
        });

        doc.save(`applicants_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    const renderApplicantGrid = (applicant) => (
        <div className="applicant-card">
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
    );

    const renderApplicantList = (applicant) => (
        <div className="applicant-list-item">
            <div className="applicant-list-header">
                <div className="applicant-list-avatar">
                    {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="applicant-list-info">
                    <h3>{applicant.personalDetails?.name || 'Not provided'}</h3>
                    <div className="applicant-list-meta">
                        <span>{applicant.jobDetails?.position || 'Position not specified'}</span>
                        <span>•</span>
                        <span>{applicant.jobDetails?.branch || 'Branch not specified'}</span>
                    </div>
                </div>
            </div>
            <div className="applicant-list-status">
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
            </div>
            <button
                onClick={() => setSelectedApplicant(applicant)}
                className="view-details-btn"
            >
                <Eye size={18} />
                View
            </button>
        </div>
    );

    const renderApplicantCompact = (applicant) => (
        <div className="applicant-compact-item">
            <div className="applicant-compact-avatar">
                {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="applicant-compact-info">
                <h3>{applicant.personalDetails?.name || 'Not provided'}</h3>
                <p className="position-compact">
                    {applicant.jobDetails?.position || 'Position not specified'}
                </p>
                <span className={`status-badge-compact ${applicant.status || 'pending'}`}>
                    {(applicant.status || 'pending').toUpperCase()}
                </span>
            </div>
            <div className="applicant-compact-actions">
                <select
                    value={applicant.status}
                    onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
                    className={`status-select-compact ${applicant.status}`}
                >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                </select>
                <button
                    onClick={() => setSelectedApplicant(applicant)}
                    className="view-details-btn-compact"
                >
                    View
                </button>
            </div>
        </div>
    );

    return (
        <div className="applicants-management">
            <div className="page-header">
                <h1>Manage Applications</h1>
                <div className="header-actions">
                <div className="view-controls">
                        <button 
                            className={`view-control-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={20} />
                            Grid
                        </button>
                        <button 
                            className={`view-control-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={20} />
                            List
                        </button>
                        <button 
                            className={`view-control-btn ${viewMode === 'compact' ? 'active' : ''}`}
                            onClick={() => setViewMode('compact')}
                        >
                            <LayoutGrid size={20} />
                            Compact
                        </button>
                    </div>
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div class="filters-container">
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
                            {uniquePositions.map(position => (
                                <option key={position} value={position}>{position}</option>
                            ))}
                        </select>

                        <select
                            value={filters.branch}
                            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">All Branches</option>
                            {uniqueBranches.map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                    </div>
                        </div>
                    <button
                        onClick={() => exportToExcel(filteredApplicants)}
                        className="export-button"
                        title="Export to Excel"
                    >
                        <FileSpreadsheet size={18} />
                        Excel
                    </button>
                    <button
                        onClick={() => exportToPDF(filteredApplicants)}
                        className="export-button"
                        title="Export to PDF"
                    >
                        <File size={18} />
                        PDF
                    </button>

                    <button
                        onClick={() => setShowFieldManager(true)}
                        className="customize-form-btn"
                    >
                        <Settings size={18} />
                        Customize Form
                    </button>
                </div>
            </div>
            <div className={`applicants-${viewMode}-container`}>
                {filteredApplicants.map((applicant) => (
                    <React.Fragment key={applicant._id}>
                        {viewMode === 'grid' && renderApplicantGrid(applicant)}
                        {viewMode === 'list' && renderApplicantList(applicant)}
                        {viewMode === 'compact' && renderApplicantCompact(applicant)}
                    </React.Fragment>
                ))}
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
                                onClick={() => handleViewDetails(applicant)}
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
                            {/* Personal Information Section */}
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <User className="section-icon" />
                                    Personal Information
                                </h3>
                                <div className="info-grid">
                                    {Object.entries(selectedApplicant.personalDetails || {})
                                        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                                        .map(([key, value]) => (
                                            <div key={key} className="info-item">
                                                <label>
                                                    {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
                                                        key.split(/(?=[A-Z])/).join(' ').slice(1)}
                                                </label>
                                                <p>{value}</p>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Job Information Section */}
                            <div className="modal-section">
                                <h3 className="section-title">
                                    <Briefcase className="section-icon" />
                                    Job Information
                                </h3>
                                <div className="info-grid">
                                    {Object.entries(selectedApplicant.jobDetails || {})
                                        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                                        .map(([key, value]) => (
                                            <div key={key} className="info-item">
                                                <label>
                                                    {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
                                                        key.split(/(?=[A-Z])/).join(' ').slice(1)}
                                                </label>
                                                <p>{value}</p>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Additional Fields Section */}
                            {selectedApplicant.additionalFields && (
                                <div className="modal-section">
                                    <h3 className="section-title">
                                        <FileText className="section-icon" />
                                        Additional Information
                                    </h3>
                                    <div className="info-grid">
                                        {Object.entries(selectedApplicant.additionalFields)
                                            .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                                            .map(([key, value]) => (
                                                <div key={key} className="info-item">
                                                    <label>
                                                        {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
                                                            key.split(/(?=[A-Z])/).join(' ').slice(1)}
                                                    </label>
                                                    <p>{value}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Resume Section */}
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

                            {/* Status Update Section */}
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


















// import React, { useState, useEffect } from 'react';
// import {
//   Search, Download, Eye, User, Mail, Phone,
//   Building, Briefcase, Calendar, CheckCircle, XCircle,
//   AlertCircle, FileText, Settings, X, FileDown,
//   FileSpreadsheet, File, Grid, List, LayoutGrid,
//   Filter, ArrowUpDown, ChevronDown, RefreshCw, ArrowRight
// } from 'lucide-react';
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import API_BASE_URL from '../config/api';
// import FormFieldManager from './FormFieldManager';
// import '../assets/css/ImprovedApplicantsManagement.css';

// const ApplicantsManagement = () => {
//   // Core state
//   const [showFieldManager, setShowFieldManager] = useState(false);
//   const [applicants, setApplicants] = useState([]);
//   const [filteredApplicants, setFilteredApplicants] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedApplicant, setSelectedApplicant] = useState(null);
  
//   // Search & filter state
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filters, setFilters] = useState({
//     status: '',
//     position: '',
//     branch: ''
//   });
//   const [uniquePositions, setUniquePositions] = useState([]);
//   const [uniqueBranches, setUniqueBranches] = useState([]);
  
//   // View state
//   const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'compact', 'kanban', or 'table'
//   const [showFilters, setShowFilters] = useState(false);
//   const [sortConfig, setSortConfig] = useState({
//     key: 'createdAt',
//     direction: 'desc'
//   });
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Status distribution for Kanban view
//   const [statusGroups, setStatusGroups] = useState({
//     pending: [],
//     reviewed: [],
//     shortlisted: [],
//     rejected: []
//   });

//   const refreshData = async () => {
//     setIsRefreshing(true);
//     await fetchApplicants();
//     setTimeout(() => setIsRefreshing(false), 600); // Visual feedback
//   };

//   const getStatusIcon = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'shortlisted': return <CheckCircle className="status-icon shortlisted" />;
//       case 'rejected': return <XCircle className="status-icon rejected" />;
//       case 'reviewed': return <Eye className="status-icon reviewed" />;
//       case 'pending': return <AlertCircle className="status-icon pending" />;
//       default: return <AlertCircle className="status-icon unknown" />;
//     }
//   };

//   const downloadResume = async (id, filename) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/applicants/${id}/resume`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       if (!response.ok) throw new Error('Failed to download resume');

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     } catch (error) {
//       console.error('Error downloading resume:', error);
//     }
//   };
  
//   useEffect(() => {
//     fetchApplicants();
//   }, []);

//   const fetchApplicants = async () => {
//     try {
//       const user = JSON.parse(localStorage.getItem('user'));
//       const endpoint = user.role === 'hr_manager' ? '/api/hr/applicants' : '/api/applicants';

//       const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch applicants');
//       }

//       const data = await response.json();
//       setApplicants(data);
//       setFilteredApplicants(data);

//       // Extract unique positions and branches
//       const positions = [...new Set(data.map(app => app.jobDetails?.position).filter(Boolean))];
//       const branches = [...new Set(data.map(app => app.jobDetails?.branch).filter(Boolean))];

//       setUniquePositions(positions);
//       setUniqueBranches(branches);
      
//       // Organize by status for Kanban view
//       const grouped = data.reduce((acc, applicant) => {
//         const status = applicant.status || 'pending';
//         if (!acc[status]) acc[status] = [];
//         acc[status].push(applicant);
//         return acc;
//       }, {
//         pending: [],
//         reviewed: [],
//         shortlisted: [],
//         rejected: []
//       });
      
//       setStatusGroups(grouped);
//     } catch (err) {
//       console.error('Error fetching applicants:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const handleViewDetails = async (applicant) => {
//     try {
//       // Fetch complete details for the applicant
//       const response = await fetch(`${API_BASE_URL}/api/applicants/${applicant._id}`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch applicant details');
//       }

//       const detailedData = await response.json();

//       // Transform the data to ensure all fields are properly structured
//       const processedData = {
//         ...detailedData,
//         personalDetails: detailedData.personalDetails instanceof Map ?
//           Object.fromEntries(detailedData.personalDetails) :
//           detailedData.personalDetails || {},
//         jobDetails: detailedData.jobDetails instanceof Map ?
//           Object.fromEntries(detailedData.jobDetails) :
//           detailedData.jobDetails || {},
//       };

//       setSelectedApplicant(processedData);
//     } catch (error) {
//       console.error('Error fetching applicant details:', error);
//       // Still show the modal with available data as fallback
//       setSelectedApplicant(applicant);
//     }
//   };

//   const handleSort = (key) => {
//     let direction = 'asc';
    
//     if (sortConfig.key === key && sortConfig.direction === 'asc') {
//       direction = 'desc';
//     }
    
//     setSortConfig({ key, direction });
//   };

//   useEffect(() => {
//     let result = [...applicants];

//     // Apply sorting first
//     if (sortConfig.key) {
//       result.sort((a, b) => {
//         const aValue = getValueByPath(a, sortConfig.key);
//         const bValue = getValueByPath(b, sortConfig.key);
        
//         if (aValue < bValue) {
//           return sortConfig.direction === 'asc' ? -1 : 1;
//         }
//         if (aValue > bValue) {
//           return sortConfig.direction === 'asc' ? 1 : -1;
//         }
//         return 0;
//       });
//     }

//     // Apply filters
//     if (filters.status) {
//       result = result.filter(app => app.status === filters.status);
//     }
//     if (filters.position) {
//       result = result.filter(app => app.jobDetails?.position === filters.position);
//     }
//     if (filters.branch) {
//       result = result.filter(app => app.jobDetails?.branch === filters.branch);
//     }

//     // Apply search
//     if (searchTerm) {
//       const searchLower = searchTerm.toLowerCase();
//       result = result.filter(app =>
//         app.personalDetails?.name?.toLowerCase().includes(searchLower) ||
//         app.personalDetails?.email?.toLowerCase().includes(searchLower)
//       );
//     }

//     setFilteredApplicants(result);
    
//     // Update Kanban groups if we're in Kanban view
//     if (viewMode === 'kanban') {
//       const grouped = result.reduce((acc, applicant) => {
//         const status = applicant.status || 'pending';
//         if (!acc[status]) acc[status] = [];
//         acc[status].push(applicant);
//         return acc;
//       }, {
//         pending: [],
//         reviewed: [],
//         shortlisted: [],
//         rejected: []
//       });
      
//       setStatusGroups(grouped);
//     }
//   }, [searchTerm, filters, applicants, sortConfig, viewMode]);

//   const getValueByPath = (obj, path) => {
//     // Handle nested paths like 'personalDetails.name'
//     if (path.includes('.')) {
//       const [parent, child] = path.split('.');
//       return obj[parent]?.[child] || '';
//     }
//     return obj[path] || '';
//   };

//   const handleStatusUpdate = async (id, newStatus) => {
//     try {
//       const user = JSON.parse(localStorage.getItem('user'));
//       if (!(user.isAdmin || user.role === 'hr_manager')) {
//         alert('Only administrators and HR managers can update application status');
//         return;
//       }

//       const response = await fetch(`${API_BASE_URL}/api/applicants/${id}/status`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ status: newStatus })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to update status');
//       }

//       const result = await response.json();

//       // Update local state
//       setApplicants(prevApplicants =>
//         prevApplicants.map(app =>
//           app._id === id ? { ...app, status: newStatus } : app
//         )
//       );

//       // If modal is open with this applicant, update it
//       if (selectedApplicant && selectedApplicant._id === id) {
//         setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
//       }

//       // Update filtered applicants as well
//       setFilteredApplicants(prev =>
//         prev.map(app =>
//           app._id === id ? { ...app, status: newStatus } : app
//         )
//       );
      
//       // Update Kanban groups
//       const updatedStatusGroups = { ...statusGroups };
      
//       // Remove from old status group
//       Object.keys(updatedStatusGroups).forEach(status => {
//         updatedStatusGroups[status] = updatedStatusGroups[status].filter(app => app._id !== id);
//       });
      
//       // Add to new status group with the updated status
//       const updatedApplicant = applicants.find(app => app._id === id);
//       if (updatedApplicant) {
//         updatedApplicant.status = newStatus;
//         if (!updatedStatusGroups[newStatus]) updatedStatusGroups[newStatus] = [];
//         updatedStatusGroups[newStatus].push(updatedApplicant);
//       }
      
//       setStatusGroups(updatedStatusGroups);

//       // Show success message
//       setTempNotification(`Application status updated to ${newStatus}`, 'success');
//     } catch (error) {
//       console.error('Error updating status:', error);
//       setTempNotification('Failed to update status. Please try again.', 'error');
//     }
//   };

//   const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  
//   const setTempNotification = (message, type = 'info') => {
//     setNotification({ message, type, visible: true });
//     setTimeout(() => {
//       setNotification(prev => ({ ...prev, visible: false }));
//     }, 3000);
//   };

//   const exportToExcel = (filteredApplicants) => {
//     const exportData = filteredApplicants.map(app => ({
//       // Personal Information
//       'Full Name': app.personalDetails?.name || 'N/A',
//       'Email': app.personalDetails?.email || 'N/A',
//       'Phone': app.personalDetails?.phone || 'N/A',
//       'Gender': app.personalDetails?.gender || 'N/A',

//       // Professional Information
//       'Position': app.jobDetails?.position || 'N/A',
//       'Branch': app.jobDetails?.branchName || app.jobDetails?.branch || app.branchName || 'N/A',
//       'Department': app.jobDetails?.department || 'N/A',

//       // Application Status
//       'Status': app.status || 'N/A',
//       'Applied Date': new Date(app.createdAt).toLocaleDateString(),

//       // Resume Information
//       'Resume Filename': app.resume?.filename || 'No Resume',

//       // Additional Information
//       'Application ID': app._id || 'N/A',
//       'Last Updated': app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Applicants');

//     // Auto-size columns
//     const colWidths = [];
//     exportData.forEach(row => {
//       Object.values(row).forEach((value, i) => {
//         const length = value.toString().length;
//         colWidths[i] = Math.max(colWidths[i] || 0, length);
//       });
//     });
//     ws['!cols'] = colWidths.map(width => ({ wch: width }));

//     XLSX.writeFile(wb, `applicants_${new Date().toISOString().split('T')[0]}.xlsx`);
//     setTempNotification('Excel export completed successfully', 'success');
//   };

//   const exportToPDF = (filteredApplicants) => {
//     const doc = new jsPDF();

//     // Add title
//     doc.setFontSize(16);
//     doc.text('Applicants Report', 14, 15);

//     // Add timestamp
//     doc.setFontSize(10);
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

//     // Define columns for the table
//     const tableColumn = [
//       'Full Name',
//       'Email',
//       'Phone',
//       'Position',
//       'Branch',
//       'Status',
//       'Applied Date'
//     ];

//     // Prepare rows data
//     const tableRows = filteredApplicants.map(app => [
//       app.personalDetails?.name || 'N/A',
//       app.personalDetails?.email || 'N/A',
//       app.personalDetails?.phone || 'N/A',
//       app.jobDetails?.position || 'N/A',
//       app.jobDetails?.branchName || app.jobDetails?.branch || app.branchName || 'N/A',
//       app.status || 'N/A',
//       new Date(app.createdAt).toLocaleDateString()
//     ]);

//     // Add the table
//     doc.autoTable({
//       head: [tableColumn],
//       body: tableRows,
//       startY: 25,
//       theme: 'grid',
//       styles: { fontSize: 8, cellPadding: 1 },
//       headStyles: {
//         fillColor: [71, 71, 135],
//         fontSize: 8,
//         fontStyle: 'bold',
//         halign: 'center'
//       },
//       columnStyles: {
//         0: { cellWidth: 25 }, // Name
//         1: { cellWidth: 35 }, // Email
//         2: { cellWidth: 20 }, // Phone
//         3: { cellWidth: 25 }, // Position
//         4: { cellWidth: 25 }, // Branch
//         5: { cellWidth: 20 }, // Status
//         6: { cellWidth: 20 }  // Applied Date
//       }
//     });

//     // Add details section for each applicant
//     let yPos = doc.lastAutoTable.finalY + 10;

//     filteredApplicants.forEach((app, index) => {
//       // Check if we need a new page
//       if (yPos > 250) {
//         doc.addPage();
//         yPos = 20;
//       }

//       doc.setFontSize(10);
//       doc.setFont(undefined, 'bold');
//       doc.text(`Detailed Information - ${app.personalDetails?.name || 'Applicant'} (${index + 1}/${filteredApplicants.length})`, 14, yPos);

//       doc.setFontSize(8);
//       doc.setFont(undefined, 'normal');

//       // Add resume information if available
//       if (app.resume?.filename) {
//         yPos += 5;
//         doc.text(`Resume: ${app.resume.filename}`, 14, yPos);
//       }

//       // Add branch information
//       yPos += 5;
//       doc.text(`Branch: ${app.jobDetails?.branchName || app.jobDetails?.branch || app.branchName || 'N/A'}`, 14, yPos);

//       // Add a separator line
//       yPos += 7;
//       doc.line(14, yPos, 196, yPos);
//       yPos += 10;
//     });

//     doc.save(`applicants_${new Date().toISOString().split('T')[0]}.pdf`);
//     setTempNotification('PDF export completed successfully', 'success');
//   };

//   // Render the Grid View
//   const renderGridView = () => (
//     <div className="applicants-grid-container">
//       {filteredApplicants.map(applicant => (
//         <div className="applicant-card" key={applicant._id}>
//           <div className="applicant-card-header">
//             <div className="applicant-avatar">
//               {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
//             </div>
//             <div className="applicant-details">
//               <h3>{applicant.personalDetails?.name || 'Not provided'}</h3>
//               <p className="applicant-position">
//                 {applicant.jobDetails?.position || 'Position not specified'}
//               </p>
//               <div className="applicant-status">
//                 {getStatusIcon(applicant.status)}
//                 <span className={`status-badge ${applicant.status || 'pending'}`}>
//                   {applicant.status ? applicant.status.toUpperCase() : 'PENDING'}
//                 </span>
//               </div>
//             </div>
//           </div>
          
//           <div className="applicant-body">
//             <div className="applicant-contact">
//               <div className="contact-item">
//                 <Mail className="contact-icon" size={16} />
//                 <span>{applicant.personalDetails?.email || 'Email not provided'}</span>
//               </div>
//               {applicant.personalDetails?.phone && (
//                 <div className="contact-item">
//                   <Phone className="contact-icon" size={16} />
//                   <span>{applicant.personalDetails.phone}</span>
//                 </div>
//               )}
//               {(applicant.jobDetails?.branch || applicant.jobDetails?.branchName) && (
//                 <div className="contact-item">
//                   <Building className="contact-icon" size={16} />
//                   <span>{applicant.jobDetails?.branchName || applicant.jobDetails?.branch}</span>
//                 </div>
//               )}
//             </div>
            
//             <div className="applicant-meta">
//               <div className="meta-item">
//                 <Calendar className="meta-icon" size={16} />
//                 <span>Applied: {new Date(applicant.createdAt).toLocaleDateString()}</span>
//               </div>
//             </div>
//           </div>
          
//           <div className="applicant-actions">
//             <div className="status-select-wrapper">
//               <select
//                 value={applicant.status || 'pending'}
//                 onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//                 className={`status-select ${applicant.status || 'pending'}`}
//               >
//                 <option value="pending">Pending</option>
//                 <option value="reviewed">Reviewed</option>
//                 <option value="shortlisted">Shortlisted</option>
//                 <option value="rejected">Rejected</option>
//               </select>
//             </div>
            
//             <div className="action-buttons">
//               <button
//                 onClick={() => handleViewDetails(applicant)}
//                 className="view-details-btn"
//                 title="View details"
//               >
//                 <Eye size={16} />
//                 View
//               </button>
              
//               {applicant.resume && (
//                 <button 
//                   onClick={() => downloadResume(applicant._id, applicant.resume.filename)}
//                   className="download-btn"
//                   title="Download resume"
//                 >
//                   <FileDown size={16} />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   // Render the List View
//   const renderListView = () => (
//     <div className="applicants-list-container">
//       {filteredApplicants.map(applicant => (
//         <div className="applicant-list-item" key={applicant._id}>
//           <div className="applicant-list-left">
//             <div className="applicant-list-avatar">
//               {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
//             </div>
//             <div className="applicant-list-details">
//               <h3>{applicant.personalDetails?.name || 'Not provided'}</h3>
//               <div className="applicant-list-meta">
//                 <span className="list-position">{applicant.jobDetails?.position || 'Position not specified'}</span>
//                 <span className="meta-divider">•</span>
//                 <span className="list-branch">{applicant.jobDetails?.branch || 'Branch not specified'}</span>
//                 <span className="meta-divider">•</span>
//                 <span className="list-date">Applied: {new Date(applicant.createdAt).toLocaleDateString()}</span>
//               </div>
//               <div className="list-contact">
//                 <Mail className="contact-icon" size={14} />
//                 <span>{applicant.personalDetails?.email || 'Email not provided'}</span>
//                 {applicant.personalDetails?.phone && (
//                   <>
//                     <span className="meta-divider">•</span>
//                     <Phone className="contact-icon" size={14} />
//                     <span>{applicant.personalDetails.phone}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
          
//           <div className="applicant-list-right">
//             <div className={`list-status-badge ${applicant.status || 'pending'}`}>
//               {getStatusIcon(applicant.status)}
//               <span>{applicant.status ? applicant.status.toUpperCase() : 'PENDING'}</span>
//             </div>
            
//             <div className="list-actions">
//               <select
//                 value={applicant.status || 'pending'}
//                 onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//                 className={`list-status-select ${applicant.status || 'pending'}`}
//               >
//                 <option value="pending">Pending</option>
//                 <option value="reviewed">Reviewed</option>
//                 <option value="shortlisted">Shortlisted</option>
//                 <option value="rejected">Rejected</option>
//               </select>
              
//               <button
//                 onClick={() => handleViewDetails(applicant)}
//                 className="list-view-btn"
//               >
//                 <Eye size={16} />
//                 View
//               </button>
              
//               {applicant.resume && (
//                 <button 
//                   onClick={() => downloadResume(applicant._id, applicant.resume.filename)}
//                   className="list-download-btn"
//                 >
//                   <FileDown size={16} />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   // Render the Compact View
//   const renderCompactView = () => (
//     <div className="applicants-compact-container">
//       {filteredApplicants.map(applicant => (
//         <div className="applicant-compact-item" key={applicant._id}>
//           <div className="compact-header">
//             <div className="compact-avatar">
//               {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
//             </div>
//             <div className={`compact-status ${applicant.status || 'pending'}`}>
//               {getStatusIcon(applicant.status)}
//             </div>
//           </div>
          
//           <div className="compact-body">
//             <h3 className="compact-name">{applicant.personalDetails?.name || 'Not provided'}</h3>
//             <p className="compact-position">{applicant.jobDetails?.position || 'Position not specified'}</p>
//           </div>
          
//           <div className="compact-actions">
//             <select
//               value={applicant.status || 'pending'}
//               onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//               className="compact-select"
//             >
//               <option value="pending">Pending</option>
//               <option value="reviewed">Reviewed</option>
//               <option value="shortlisted">Shortlisted</option>
//               <option value="rejected">Rejected</option>
//             </select>
            
//             <button
//               onClick={() => handleViewDetails(applicant)}
//               className="compact-view-btn"
//             >
//               View
//             </button>
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   // Render the Kanban View
//   const renderKanbanView = () => (
//     <div className="applicants-kanban-container">
//       <div className="kanban-board">
//         <div className="kanban-column pending-column">
//           <div className="kanban-column-header">
//             <h3>Pending</h3>
//             <span className="kanban-count">{statusGroups.pending.length}</span>
//           </div>
//           <div className="kanban-cards">
//             {statusGroups.pending.map(applicant => (
//               <div className="kanban-card" key={applicant._id} onClick={() => handleViewDetails(applicant)}>
//                 <div className="kanban-card-content">
//                   <h4>{applicant.personalDetails?.name || 'Not provided'}</h4>
//                   <p>{applicant.jobDetails?.position || 'Position not specified'}</p>
//                   <div className="kanban-card-meta">
//                     <Calendar size={14} />
//                     <span>{new Date(applicant.createdAt).toLocaleDateString()}</span>
//                   </div>
//                 </div>
//                 <div className="kanban-card-actions">
//                   <select
//                     value={applicant.status}
//                     onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//                     onClick={(e) => e.stopPropagation()}
//                     className="kanban-status-select"
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="reviewed">Reviewed</option>
//                     <option value="shortlisted">Shortlisted</option>
//                     <option value="rejected">Rejected</option>
//                   </select>
//                 </div>
//               </div>
//             ))}
//             {statusGroups.pending.length === 0 && (
//               <div className="kanban-empty">No applications</div>
//             )}
//           </div>
//         </div>
        
//         <div className="kanban-column reviewed-column">
//           <div className="kanban-column-header">
//             <h3>Reviewed</h3>
//             <span className="kanban-count">{statusGroups.reviewed.length}</span>
//           </div>
//           <div className="kanban-cards">
//             {statusGroups.reviewed.map(applicant => (
//               <div className="kanban-card" key={applicant._id} onClick={() => handleViewDetails(applicant)}>
//                 <div className="kanban-card-content">
//                   <h4>{applicant.personalDetails?.name || 'Not provided'}</h4>
//                   <p>{applicant.jobDetails?.position || 'Position not specified'}</p>
//                   <div className="kanban-card-meta">
//                     <Calendar size={14} />
//                     <span>{new Date(applicant.createdAt).toLocaleDateString()}</span>
//                   </div>
//                 </div>
//                 <div className="kanban-card-actions">
//                   <select
//                     value={applicant.status}
//                     onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//                     onClick={(e) => e.stopPropagation()}
//                     className="kanban-status-select"
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="reviewed">Reviewed</option>
//                     <option value="shortlisted">Shortlisted</option>
//                     <option value="rejected">Rejected</option>
//                   </select>
//                 </div>
//               </div>
//             ))}
//             {statusGroups.reviewed.length === 0 && (
//               <div className="kanban-empty">No applications</div>
//             )}
//           </div>
//         </div>
        
//         <div className="kanban-column shortlisted-column">
//           <div className="kanban-column-header">
//             <h3>Shortlisted</h3>
//             <span className="kanban-count">{statusGroups.shortlisted.length}</span>
//           </div>
//           <div className="kanban-cards">
//             {statusGroups.shortlisted.map(applicant => (
//               <div className="kanban-card" key={applicant._id} onClick={() => handleViewDetails(applicant)}>
//                 <div className="kanban-card-content">
//                   <h4>{applicant.personalDetails?.name || 'Not provided'}</h4>
//                   <p>{applicant.jobDetails?.position || 'Position not specified'}</p>
//                   <div className="kanban-card-meta">
//                     <Calendar size={14} />
//                     <span>{new Date(applicant.createdAt).toLocaleDateString()}</span>
//                   </div>
//                 </div>
//                 <div className="kanban-card-actions">
//                   <select
//                     value={applicant.status}
//                     onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//                     onClick={(e) => e.stopPropagation()}
//                     className="kanban-status-select"
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="reviewed">Reviewed</option>
//                     <option value="shortlisted">Shortlisted</option>
//                     <option value="rejected">Rejected</option>
//                   </select>
//                 </div>
//               </div>
//             ))}
//             {statusGroups.shortlisted.length === 0 && (
//               <div className="kanban-empty">No applications</div>
//             )}
//           </div>
//         </div>
        
//         <div className="kanban-column rejected-column">
//           <div className="kanban-column-header">
//             <h3>Rejected</h3>
//             <span className="kanban-count">{statusGroups.rejected.length}</span>
//           </div>
//           <div className="kanban-cards">
//             {statusGroups.rejected.map(applicant => (
//               <div className="kanban-card" key={applicant._id} onClick={() => handleViewDetails(applicant)}>
//                 <div className="kanban-card-content">
//                   <h4>{applicant.personalDetails?.name || 'Not provided'}</h4>
//                   <p>{applicant.jobDetails?.position || 'Position not specified'}</p>
//                   <div className="kanban-card-meta">
//                     <Calendar size={14} />
//                     <span>{new Date(applicant.createdAt).toLocaleDateString()}</span>
//                   </div>
//                 </div>
//                 <div className="kanban-card-actions">
//                   <select
//                     value={applicant.status}
//                     onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//                     onClick={(e) => e.stopPropagation()}
//                     className="kanban-status-select"
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="reviewed">Reviewed</option>
//                     <option value="shortlisted">Shortlisted</option>
//                     <option value="rejected">Rejected</option>
//                   </select>
//                 </div>
//               </div>
//             ))}
//             {statusGroups.rejected.length === 0 && (
//               <div className="kanban-empty">No applications</div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
  
//   // Render the Table View
//   const renderTableView = () => (
//     <div className="applicants-table-container">
//       <table className="applicants-table">
//         <thead>
//           <tr>
//             <th className="sortable" onClick={() => handleSort('personalDetails.name')}>
//               Name
//               {sortConfig.key === 'personalDetails.name' && (
//                 <ArrowUpDown size={14} className={`sort-icon ${sortConfig.direction}`} />
//               )}
//             </th>
//             <th>Contact</th>
//             <th className="sortable" onClick={() => handleSort('jobDetails.position')}>
//               Position
//               {sortConfig.key === 'jobDetails.position' && (
//                 <ArrowUpDown size={14} className={`sort-icon ${sortConfig.direction}`} />
//               )}
//             </th>
//             <th>Branch</th>
//             <th className="sortable" onClick={() => handleSort('status')}>
//               Status
//               {sortConfig.key === 'status' && (
//                 <ArrowUpDown size={14} className={`sort-icon ${sortConfig.direction}`} />
//               )}
//             </th>
//             <th className="sortable" onClick={() => handleSort('createdAt')}>
//               Applied Date
//               {sortConfig.key === 'createdAt' && (
//                 <ArrowUpDown size={14} className={`sort-icon ${sortConfig.direction}`} />
//               )}
//             </th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredApplicants.map(applicant => (
//             <tr key={applicant._id}>
//               <td className="name-cell">
//                 <div className="table-avatar">
//                   {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
//                 </div>
//                 <span>{applicant.personalDetails?.name || 'Not provided'}</span>
//               </td>
//               <td className="contact-cell">
//                 <div>
//                   <Mail className="contact-icon" size={14} />
//                   <span>{applicant.personalDetails?.email || 'Not provided'}</span>
//                 </div>
//                 {applicant.personalDetails?.phone && (
//                   <div>
//                     <Phone className="contact-icon" size={14} />
//                     <span>{applicant.personalDetails.phone}</span>
//                   </div>
//                 )}
//               </td>
//               <td>{applicant.jobDetails?.position || 'Not specified'}</td>
//               <td>{applicant.jobDetails?.branch || applicant.jobDetails?.branchName || 'Not specified'}</td>
//               <td>
//                 <div className={`table-status-badge ${applicant.status || 'pending'}`}>
//                   {getStatusIcon(applicant.status)}
//                   <span>{applicant.status ? applicant.status.toUpperCase() : 'PENDING'}</span>
//                 </div>
//               </td>
//               <td>{new Date(applicant.createdAt).toLocaleDateString()}</td>
//               <td className="actions-cell">
//                 <select
//                   value={applicant.status || 'pending'}
//                   onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
//                   className="table-status-select"
//                 >
//                   <option value="pending">Pending</option>
//                   <option value="reviewed">Reviewed</option>
//                   <option value="shortlisted">Shortlisted</option>
//                   <option value="rejected">Rejected</option>
//                 </select>
                
//                 <button
//                   onClick={() => handleViewDetails(applicant)}
//                   className="table-view-btn"
//                   title="View details"
//                 >
//                   <Eye size={16} />
//                 </button>
                
//                 {applicant.resume && (
//                   <button 
//                     onClick={() => downloadResume(applicant._id, applicant.resume.filename)}
//                     className="table-download-btn"
//                     title="Download resume"
//                   >
//                     <FileDown size={16} />
//                   </button>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
  
//   // Main component render
//   return (
//     <div className="applicants-management">
//       <div className="app-header">
//         <h1>Application Management</h1>
        
//         <div className="app-toolbar">
//           <button 
//             className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
//             onClick={refreshData}
//             title="Refresh data"
//           >
//             <RefreshCw size={18} />
//           </button>
          
//           <div className="view-toggle">
//             <button 
//               className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
//               onClick={() => setViewMode('grid')}
//               title="Grid view"
//             >
//               <Grid size={18} />
//             </button>
//             <button 
//               className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
//               onClick={() => setViewMode('list')}
//               title="List view"
//             >
//               <List size={18} />
//             </button>
//             <button 
//               className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`}
//               onClick={() => setViewMode('compact')}
//               title="Compact view"
//             >
//               <LayoutGrid size={18} />
//             </button>
//             <button 
//               className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
//               onClick={() => setViewMode('kanban')}
//               title="Kanban view"
//             >
//               <Briefcase size={18} />
//             </button>
//             <button 
//               className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
//               onClick={() => setViewMode('table')}
//               title="Table view"
//             >
//               <FileText size={18} />
//             </button>
//           </div>
          
//           <div className="search-container">
//             <Search className="search-icon" size={18} />
//             <input
//               type="text"
//               placeholder="Search by name or email..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//           </div>
          
//           <button 
//             className={`filter-btn ${showFilters ? 'active' : ''}`}
//             onClick={() => setShowFilters(!showFilters)}
//             title="Toggle filters"
//           >
//             <Filter size={18} />
//             <span>Filters</span>
//             <ChevronDown size={16} className={`chevron ${showFilters ? 'open' : ''}`} />
//           </button>
          
//           <div className="export-options">
//             <button 
//               onClick={() => exportToExcel(filteredApplicants)}
//               className="export-btn excel"
//               title="Export to Excel"
//             >
//               <FileSpreadsheet size={18} />
//               <span>Excel</span>
//             </button>
//             <button 
//               onClick={() => exportToPDF(filteredApplicants)}
//               className="export-btn pdf"
//               title="Export to PDF"
//             >
//               <File size={18} />
//               <span>PDF</span>
//             </button>
//           </div>
          
//           <button
//             onClick={() => setShowFieldManager(true)}
//             className="customize-btn"
//             title="Customize application form"
//           >
//             <Settings size={18} />
//             <span>Customize Form</span>
//           </button>
//         </div>
//       </div>
      
//       {showFilters && (
//         <div className="filters-panel">
//           <div className="filter-group">
//             <label>Status</label>
//             <select
//               value={filters.status}
//               onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//               className="filter-select"
//             >
//               <option value="">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="reviewed">Reviewed</option>
//               <option value="shortlisted">Shortlisted</option>
//               <option value="rejected">Rejected</option>
//             </select>
//           </div>
          
//           <div className="filter-group">
//             <label>Position</label>
//             <select
//               value={filters.position}
//               onChange={(e) => setFilters({ ...filters, position: e.target.value })}
//               className="filter-select"
//             >
//               <option value="">All Positions</option>
//               {uniquePositions.map(position => (
//                 <option key={position} value={position}>{position}</option>
//               ))}
//             </select>
//           </div>
          
//           <div className="filter-group">
//             <label>Branch</label>
//             <select
//               value={filters.branch}
//               onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
//               className="filter-select"
//             >
//               <option value="">All Branches</option>
//               {uniqueBranches.map(branch => (
//                 <option key={branch} value={branch}>{branch}</option>
//               ))}
//             </select>
//           </div>
          
//           <div className="filter-actions">
//             <button 
//               onClick={() => setFilters({ status: '', position: '', branch: '' })}
//               className="clear-filters-btn"
//             >
//               Reset Filters
//             </button>
//           </div>
//         </div>
//       )}
      
//       {notification.visible && (
//         <div className={`notification-toast ${notification.type}`}>
//           {notification.message}
//         </div>
//       )}
      
//       <div className="applicants-content">
//         {loading ? (
//           <div className="loading-state">
//             <div className="loading-spinner"></div>
//             <p>Loading applications...</p>
//           </div>
//         ) : error ? (
//           <div className="error-state">
//             <AlertCircle size={48} />
//             <h3>Error Loading Applications</h3>
//             <p>{error}</p>
//             <button onClick={refreshData} className="retry-btn">
//               <RefreshCw size={16} />
//               Retry
//             </button>
//           </div>
//         ) : filteredApplicants.length === 0 ? (
//           <div className="empty-state">
//             <FileText size={48} />
//             <h3>No Applications Found</h3>
//             <p>Try adjusting your filters or search terms</p>
//             {(filters.status || filters.position || filters.branch || searchTerm) && (
//               <button 
//                 onClick={() => {
//                   setFilters({ status: '', position: '', branch: '' });
//                   setSearchTerm('');
//                 }} 
//                 className="clear-btn"
//               >
//                 Clear All Filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             {viewMode === 'grid' && renderGridView()}
//             {viewMode === 'list' && renderListView()}
//             {viewMode === 'compact' && renderCompactView()}
//             {viewMode === 'kanban' && renderKanbanView()}
//             {viewMode === 'table' && renderTableView()}
//           </>
//         )}
//       </div>
      
//       {showFieldManager && (
//         <FormFieldManager
//           isOpen={showFieldManager}
//           onClose={() => setShowFieldManager(false)}
//         />
//       )}
      
//       {selectedApplicant && (
//         <div className="applicant-detail-modal">
//           <div className="modal-overlay" onClick={() => setSelectedApplicant(null)}></div>
//           <div className="modal-content">
//             <button className="modal-close" onClick={() => setSelectedApplicant(null)}>
//               <X size={24} />
//             </button>
            
//             <div className="modal-header">
//               <div className="modal-avatar">
//                 {selectedApplicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
//               </div>
//               <div className="modal-title">
//                 <h2>{selectedApplicant.personalDetails?.name || 'Applicant Details'}</h2>
//                 <p className="modal-subtitle">
//                   {selectedApplicant.jobDetails?.position || 'Position not specified'}
//                 </p>
//                 <div className={`modal-status ${selectedApplicant.status || 'pending'}`}>
//                   {getStatusIcon(selectedApplicant.status)}
//                   <span>{selectedApplicant.status ? selectedApplicant.status.toUpperCase() : 'PENDING'}</span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="modal-body">
//               <div className="detail-section">
//                 <div className="section-header">
//                   <User className="section-icon" />
//                   <h3>Personal Information</h3>
//                 </div>
//                 <div className="section-content">
//                   <div className="detail-grid">
//                     {Object.entries(selectedApplicant.personalDetails || {})
//                       .filter(([key, value]) => value !== null && value !== undefined && value !== '')
//                       .map(([key, value]) => (
//                         <div key={key} className="detail-item">
//                           <label>
//                             {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
//                               key.split(/(?=[A-Z])/).join(' ').slice(1)}
//                           </label>
//                           <p>{value}</p>
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               </div>
              
//               <div className="detail-section">
//                 <div className="section-header">
//                   <Briefcase className="section-icon" />
//                   <h3>Job Information</h3>
//                 </div>
//                 <div className="section-content">
//                   <div className="detail-grid">
//                     {Object.entries(selectedApplicant.jobDetails || {})
//                       .filter(([key, value]) => value !== null && value !== undefined && value !== '')
//                       .map(([key, value]) => (
//                         <div key={key} className="detail-item">
//                           <label>
//                             {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
//                               key.split(/(?=[A-Z])/).join(' ').slice(1)}
//                           </label>
//                           <p>{value}</p>
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               </div>
              
//               {selectedApplicant.additionalFields && Object.keys(selectedApplicant.additionalFields).length > 0 && (
//                 <div className="detail-section">
//                   <div className="section-header">
//                     <FileText className="section-icon" />
//                     <h3>Additional Information</h3>
//                   </div>
//                   <div className="section-content">
//                     <div className="detail-grid">
//                       {Object.entries(selectedApplicant.additionalFields)
//                         .filter(([key, value]) => value !== null && value !== undefined && value !== '')
//                         .map(([key, value]) => (
//                           <div key={key} className="detail-item">
//                             <label>
//                               {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
//                                 key.split(/(?=[A-Z])/).join(' ').slice(1)}
//                             </label>
//                             <p>{value}</p>
//                           </div>
//                         ))}
//                     </div>
//                   </div>
//                 </div>
//               )}
              
//               {selectedApplicant.resume && (
//                 <div className="detail-section">
//                   <div className="section-header">
//                     <FileText className="section-icon" />
//                     <h3>Resume</h3>
//                   </div>
//                   <div className="section-content">
//                     <div className="resume-container">
//                       <p className="resume-filename">{selectedApplicant.resume.filename}</p>
//                       <button
//                         className="download-resume-btn"
//                         onClick={() => downloadResume(selectedApplicant._id, selectedApplicant.resume.filename)}
//                       >
//                         <Download size={18} />
//                         Download Resume
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
              
//               <div className="detail-section">
//                 <div className="section-header">
//                   <ArrowRight className="section-icon" />
//                   <h3>Application Status</h3>
//                 </div>
//                 <div className="section-content">
//                   <div className="status-update-container">
//                     <label>Update Status</label>
//                     <select
//                       value={selectedApplicant.status || 'pending'}
//                       onChange={(e) => handleStatusUpdate(selectedApplicant._id, e.target.value)}
//                       className={`status-select-large ${selectedApplicant.status || 'pending'}`}
//                     >
//                       <option value="pending">Pending</option>
//                       <option value="reviewed">Reviewed</option>
//                       <option value="shortlisted">Shortlisted</option>
//                       <option value="rejected">Rejected</option>
//                     </select>
//                     <p className="status-help-text">
//                       Changing status will notify the applicant via email automatically.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ApplicantsManagement;