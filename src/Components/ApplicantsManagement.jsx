import React, { useState, useEffect } from 'react';
import {
    Search, Download, Eye, User, Mail, Phone,
    Building, Briefcase, Calendar, CheckCircle, XCircle,
    AlertCircle, FileText, Settings, X, FileDown, 
    FileSpreadsheet, File // Changed FilePdf to File
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

    const exportToExcel = () => {
        const exportData = filteredApplicants.map(app => ({
            // Personal Information
            'Full Name': app.personalDetails?.name || 'N/A',
            'Email': app.personalDetails?.email || 'N/A',
            'Phone': app.personalDetails?.phone || 'N/A',
            'Gender': app.personalDetails?.gender || 'N/A',
            
            // Professional Information
            'Position': app.jobDetails?.position || 'N/A',
            'Branch': app.jobDetails?.branch || app.jobDetails?.branchName || 'N/A',
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


    const exportToPDF = () => {
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
            'Gender',
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
            app.personalDetails?.gender || 'N/A',
            app.jobDetails?.position || 'N/A',
            app.jobDetails?.branch || app.jobDetails?.branchName || 'N/A',
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
                2: { cellWidth: 25 }, // Phone
                3: { cellWidth: 15 }, // Gender
                4: { cellWidth: 25 }, // Position
                5: { cellWidth: 25 }, // Branch
                6: { cellWidth: 20 }, // Status
                7: { cellWidth: 20 }  // Applied Date
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
    
            // Add a separator line
            yPos += 7;
            doc.line(14, yPos, 196, yPos);
            yPos += 10;
        });
    
        doc.save(`applicants_${new Date().toISOString().split('T')[0]}.pdf`);
    };

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

                    <div className="export-actions">
                        <button
                            onClick={exportToExcel}
                            className="export-button"
                            title="Export to Excel"
                        >
                            <FileSpreadsheet size={18} />
                            Excel
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="export-button"
                            title="Export to PDF"
                        >
                            <File size={18} />
                            PDF
                        </button>
                    </div>

                    <button
                        onClick={() => (true)}
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