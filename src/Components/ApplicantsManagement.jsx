import React, { useState, useEffect } from 'react';
import {
    Search, Download, Eye, User, Mail, Phone,
    Building, Briefcase, Calendar, CheckCircle, XCircle,
    AlertCircle, FileText, Settings, X, FileDown,
    FileSpreadsheet, File, Grid, List, LayoutGrid,
    Filter, RefreshCw, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API_BASE_URL from '../config/api';
import FormFieldManager from './FormFieldManager';
import '../assets/css/ApplicantsManagement.css';

const ApplicantsManagement = () => {
    // Core state
    const [showFieldManager, setShowFieldManager] = useState(false);
    const [applicants, setApplicants] = useState([]);
    const [filteredApplicants, setFilteredApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '', visible: false });
    
    // Search & filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        position: '',
        branch: ''
    });
    const [uniquePositions, setUniquePositions] = useState([]);
    const [uniqueBranches, setUniqueBranches] = useState([]);
    
    // View state
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'compact'
    const [sortConfig, setSortConfig] = useState({
        key: 'createdAt',
        direction: 'desc'
    });

    // Show temporary notification
    const setTempNotification = (message, type = 'info') => {
        setNotification({ message, type, visible: true });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    // Refresh data with visual indicator
    const refreshData = async () => {
        setIsRefreshing(true);
        await fetchApplicants();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    // Status icon helper
    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'shortlisted': return <CheckCircle className="applicants-managements-status-icon shortlisted" />;
            case 'rejected': return <XCircle className="applicants-managements-status-icon rejected" />;
            case 'reviewed': return <Eye className="applicants-managements-status-icon reviewed" />;
            case 'pending': default: return <AlertCircle className="applicants-managements-status-icon pending" />;
        }
    };

    // Download resume
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
            setTempNotification('Resume downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading resume:', error);
            setTempNotification('Failed to download resume', 'error');
        }
    };
    
    // Fetch applicants on component mount
    useEffect(() => {
        fetchApplicants();
    }, []);

    // Fetch applicants from API
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
            const branches = [...new Set(data.map(app => app.jobDetails?.branch || app.branchName).filter(Boolean))];

            setUniquePositions(positions);
            setUniqueBranches(branches);
        } catch (err) {
            console.error('Error fetching applicants:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // View applicant details
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

            // Process the data
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

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        
        setSortConfig({ key, direction });
    };

    // Apply filters, search and sorting
    useEffect(() => {
        let result = [...applicants];

        // Apply sorting first
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = getValueByPath(a, sortConfig.key);
                const bValue = getValueByPath(b, sortConfig.key);
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        // Apply filters
        if (filters.status) {
            result = result.filter(app => app.status === filters.status);
        }
        if (filters.position) {
            result = result.filter(app => app.jobDetails?.position === filters.position);
        }
        if (filters.branch) {
            result = result.filter(app => 
                app.jobDetails?.branch === filters.branch || 
                app.branchName === filters.branch
            );
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
    }, [searchTerm, filters, applicants, sortConfig]);

    // Helper to get nested property values
    const getValueByPath = (obj, path) => {
        // Handle nested paths like 'personalDetails.name'
        if (path.includes('.')) {
            const [parent, child] = path.split('.');
            return obj[parent]?.[child] || '';
        }
        return obj[path] || '';
    };

    // Update applicant status
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!(user.isAdmin || user.role === 'hr_manager')) {
                setTempNotification('Only administrators and HR managers can update application status', 'error');
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

            // Show success message
            setTempNotification(`Application status updated to ${newStatus}`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            setTempNotification('Failed to update status. Please try again.', 'error');
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            const exportData = filteredApplicants.map(app => ({
                'Full Name': app.personalDetails?.name || 'N/A',
                'Email': app.personalDetails?.email || 'N/A',
                'Phone': app.personalDetails?.phone || 'N/A',
                'Position': app.jobDetails?.position || 'N/A',
                'Branch': app.jobDetails?.branch || app.branchName || 'N/A',
                'Status': app.status || 'N/A',
                'Applied Date': new Date(app.createdAt).toLocaleDateString(),
                'Resume': app.resume?.filename || 'No Resume'
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
            setTempNotification('Excel export completed successfully', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            setTempNotification('Failed to export to Excel', 'error');
        }
    };

    // Export to PDF
    const exportToPDF = () => {
        try {
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
                'Position',
                'Branch',
                'Status',
                'Applied Date'
            ];

            // Prepare rows data
            const tableRows = filteredApplicants.map(app => [
                app.personalDetails?.name || 'N/A',
                app.personalDetails?.email || 'N/A',
                app.jobDetails?.position || 'N/A',
                app.jobDetails?.branch || app.branchName || 'N/A',
                app.status || 'pending',
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
                }
            });

            doc.save(`applicants_${new Date().toISOString().split('T')[0]}.pdf`);
            setTempNotification('PDF export completed successfully', 'success');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            setTempNotification('Failed to export to PDF', 'error');
        }
    };

    // Render Grid View
    const renderGridView = () => (
        <div className="applicants-managements-grid-container">
            {filteredApplicants.map(applicant => (
                <div className="applicants-managements-card" key={applicant._id}>
                    <div className="applicants-managements-card-header">
                        <div className="applicants-managements-avatar">
                            {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="applicants-managements-details">
                            <h3>{applicant.personalDetails?.name || 'Not provided'}</h3>
                            <p className="applicants-managements-position">
                                {applicant.jobDetails?.position || 'Position not specified'}
                            </p>
                            <div className="applicants-managements-status">
                                {getStatusIcon(applicant.status)}
                                <span className={`applicants-managements-status-badge ${applicant.status || 'pending'}`}>
                                    {applicant.status ? applicant.status.toUpperCase() : 'PENDING'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="applicants-managements-card-body">
                        <div className="applicants-managements-contact">
                            <div className="applicants-managements-contact-item">
                                <Mail className="applicants-managements-contact-icon" size={16} />
                                <span>{applicant.personalDetails?.email || 'Email not provided'}</span>
                            </div>
                            {applicant.personalDetails?.phone && (
                                <div className="applicants-managements-contact-item">
                                    <Phone className="applicants-managements-contact-icon" size={16} />
                                    <span>{applicant.personalDetails.phone}</span>
                                </div>
                            )}
                            {(applicant.jobDetails?.branch || applicant.branchName) && (
                                <div className="applicants-managements-contact-item">
                                    <Building className="applicants-managements-contact-icon" size={16} />
                                    <span>{applicant.jobDetails?.branch || applicant.branchName}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="applicants-managements-meta">
                            <div className="applicants-managements-meta-item">
                                <Calendar className="applicants-managements-meta-icon" size={16} />
                                <span>Applied: {new Date(applicant.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="applicants-managements-actions">
                        <div className="applicants-managements-status-select-wrapper">
                            <select
                                value={applicant.status || 'pending'}
                                onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
                                className={`applicants-managements-status-select ${applicant.status || 'pending'}`}
                            >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        
                        <div className="applicants-managements-action-buttons">
                            <button
                                onClick={() => handleViewDetails(applicant)}
                                className="applicants-managements-view-btn"
                                title="View details"
                            >
                                <Eye size={16} />
                                View
                            </button>
                            
                            {applicant.resume && (
                                <button 
                                    onClick={() => downloadResume(applicant._id, applicant.resume.filename)}
                                    className="applicants-managements-download-btn"
                                    title="Download resume"
                                >
                                    <FileDown size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Render List View
    const renderListView = () => (
        <div className="applicants-managements-list-container">
            {filteredApplicants.map(applicant => (
                <div className="applicants-managements-list-item" key={applicant._id}>
                    <div className="applicants-managements-list-left">
                        <div className="applicants-managements-list-avatar">
                            {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="applicants-managements-list-details">
                            <h3>{applicant.personalDetails?.name || 'Not provided'}</h3>
                            <div className="applicants-managements-list-meta">
                                <span className="applicants-managements-list-position">{applicant.jobDetails?.position || 'Position not specified'}</span>
                                <span className="applicants-managements-meta-divider">•</span>
                                <span className="applicants-managements-list-branch">{applicant.jobDetails?.branch || applicant.branchName || 'Branch not specified'}</span>
                                <span className="applicants-managements-meta-divider">•</span>
                                <span className="applicants-managements-list-date">Applied: {new Date(applicant.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="applicants-managements-list-contact">
                                <Mail className="applicants-managements-contact-icon" size={14} />
                                <span>{applicant.personalDetails?.email || 'Email not provided'}</span>
                                {applicant.personalDetails?.phone && (
                                    <>
                                        <span className="applicants-managements-meta-divider">•</span>
                                        <Phone className="applicants-managements-contact-icon" size={14} />
                                        <span>{applicant.personalDetails.phone}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="applicants-managements-list-right">
                        <div className={`applicants-managements-list-status-badge ${applicant.status || 'pending'}`}>
                            {getStatusIcon(applicant.status)}
                            <span>{applicant.status ? applicant.status.toUpperCase() : 'PENDING'}</span>
                        </div>
                        
                        <div className="applicants-managements-list-actions">
                            <select
                                value={applicant.status || 'pending'}
                                onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
                                className={`applicants-managements-list-status-select ${applicant.status || 'pending'}`}
                            >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            
                            <button
                                onClick={() => handleViewDetails(applicant)}
                                className="applicants-managements-list-view-btn" style={{width:'fit-content',height:'fit-conten'}}
                            >
                                <Eye size={16} />
                                
                            </button>
                            
                            {applicant.resume && (
                                <button 
                                    onClick={() => downloadResume(applicant._id, applicant.resume.filename)}
                                    className="applicants-managements-list-download-btn"
                                >
                                    <FileDown size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Render Compact View
    const renderCompactView = () => (
        <div className="applicants-managements-compact-container">
            {filteredApplicants.map(applicant => (
                <div className="applicants-managements-compact-item" key={applicant._id}>
                    <div className="applicants-managements-compact-header">
                        <div className="applicants-managements-compact-avatar">
                            {applicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className={`applicants-managements-compact-status ${applicant.status || 'pending'}`}>
                            {getStatusIcon(applicant.status)}
                        </div>
                    </div>
                    
                    <div className="applicants-managements-compact-body">
                        <h3 className="applicants-managements-compact-name">{applicant.personalDetails?.name || 'Not provided'}</h3>
                        <p className="applicants-managements-compact-position">{applicant.jobDetails?.position || 'Position not specified'}</p>
                    </div>
                    
                    <div className="applicants-managements-compact-actions">
                        <select
                            value={applicant.status || 'pending'}
                            onChange={(e) => handleStatusUpdate(applicant._id, e.target.value)}
                            className="applicants-managements-compact-select"
                        >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        
                        <button
                            onClick={() => handleViewDetails(applicant)}
                            className="applicants-managements-compact-view-btn"
                        >
                            View
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="applicants-managements-container">
            <div className="applicants-managements-header">
                <h1>Application Management</h1>
                
                <div className="applicants-managements-toolbar">
                    <button 
                        className={`applicants-managements-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                        onClick={refreshData}
                        title="Refresh data"
                    >
                        <RefreshCw size={18} />
                    </button>
                    
                    <div className="applicants-managements-view-toggle">
                        <button 
                            className={`applicants-managements-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            <Grid size={18} />
                        </button>
                        <button 
                            className={`applicants-managements-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <List size={18} />
                        </button>
                        <button 
                            className={`applicants-managements-view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                            onClick={() => setViewMode('compact')}
                            title="Compact view"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    
                    <div className="applicants-managements-search-container">
                        <Search className="applicants-managements-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="applicants-managements-search-input"
                        />
                    </div>
                    
                    <button 
                        className={`applicants-managements-filter-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        title="Toggle filters"
                    >
                        <Filter size={18} />
                        <span>Filters</span>
                        <ChevronDown size={16} className={`applicants-managements-chevron ${showFilters ? 'open' : ''}`} />
                    </button>
                    
                    <div className="applicants-managements-export-options">
                        <button 
                            onClick={exportToExcel}
                            className="applicants-managements-export-btn excel"
                            title="Export to Excel"
                        >
                            <FileSpreadsheet size={18} />
                            <span>Excel</span>
                        </button>
                        <button 
                            onClick={exportToPDF}
                            className="applicants-managements-export-btn pdf"
                            title="Export to PDF"
                        >
                            <File size={18} />
                            <span>PDF</span>
                        </button>
                    </div>
                    
                    <button
                        onClick={() => setShowFieldManager(true)}
                        className="applicants-managements-customize-btn"
                        title="Customize application form"
                    >
                        <Settings size={18} />
                        <span>Customize Form</span>
                    </button>
                </div>
            </div>
            
            {showFilters && (
                <div className="applicants-managements-filters-panel">
                    <div className="applicants-managements-filter-group">
                        <label>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="applicants-managements-filter-select"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    
                    <div className="applicants-managements-filter-group">
                        <label>Position</label>
                        <select
                            value={filters.position}
                            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                            className="applicants-managements-filter-select"
                        >
                            <option value="">All Positions</option>
                            {uniquePositions.map(position => (
                                <option key={position} value={position}>{position}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="applicants-managements-filter-group">
                        <label>Branch</label>
                        <select
                            value={filters.branch}
                            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                            className="applicants-managements-filter-select"
                        >
                            <option value="">All Branches</option>
                            {uniqueBranches.map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="applicants-managements-filter-actions">
                        <button 
                            onClick={() => setFilters({ status: '', position: '', branch: '' })}
                            className="applicants-managements-clear-filters-btn"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            )}
            
            {notification.visible && (
                <div className={`applicants-managements-notification-toast ${notification.type}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="applicants-managements-content">
                {loading ? (
                    <div className="applicants-managements-loading-state">
                        <div className="applicants-managements-loading-spinner"></div>
                        <p>Loading applications...</p>
                    </div>
                ) : error ? (
                    <div className="applicants-managements-error-state">
                        <AlertCircle size={48} />
                        <h3>Error Loading Applications</h3>
                        <p>{error}</p>
                        <button onClick={refreshData} className="applicants-managements-retry-btn">
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    </div>
                ) : filteredApplicants.length === 0 ? (
                    <div className="applicants-managements-empty-state">
                        <FileText size={48} />
                        <h3>No Applications Found</h3>
                        <p>Try adjusting your filters or search terms</p>
                        {(filters.status || filters.position || filters.branch || searchTerm) && (
                            <button 
                                onClick={() => {
                                    setFilters({ status: '', position: '', branch: '' });
                                    setSearchTerm('');
                                }} 
                                className="applicants-managements-clear-btn"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' && renderGridView()}
                        {viewMode === 'list' && renderListView()}
                        {viewMode === 'compact' && renderCompactView()}
                    </>
                )}
            </div>
            
            {showFieldManager && (
                <FormFieldManager
                    isOpen={showFieldManager}
                    onClose={() => setShowFieldManager(false)}
                />
            )}
            
            {selectedApplicant && (
                <div className="applicants-managements-detail-modal">
                    <div className="applicants-managements-modal-overlay" onClick={() => setSelectedApplicant(null)}></div>
                    <div className="applicants-managements-modal-content">
                        <button className="applicants-managements-modal-close" onClick={() => setSelectedApplicant(null)}>
                            <X size={24} />
                        </button>
                        
                        <div className="applicants-managements-modal-header">
                            <div className="applicants-managements-modal-avatar">
                                {selectedApplicant.personalDetails?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="applicants-managements-modal-title">
                                <h2>{selectedApplicant.personalDetails?.name || 'Applicant Details'}</h2>
                                <p className="applicants-managements-modal-subtitle">
                                    {selectedApplicant.jobDetails?.position || 'Position not specified'}
                                </p>
                                <div className={`applicants-managements-modal-status ${selectedApplicant.status || 'pending'}`}>
                                    {getStatusIcon(selectedApplicant.status)}
                                    <span>{selectedApplicant.status ? selectedApplicant.status.toUpperCase() : 'PENDING'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="applicants-managements-modal-body">
                            <div className="applicants-managements-detail-section">
                                <div className="applicants-managements-section-header">
                                    <User className="applicants-managements-section-icon" />
                                    <h3>Personal Information</h3>
                                </div>
                                <div className="applicants-managements-section-content">
                                    <div className="applicants-managements-detail-grid">
                                        {Object.entries(selectedApplicant.personalDetails || {})
                                            .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                                            .map(([key, value]) => (
                                                <div key={key} className="applicants-managements-detail-item">
                                                    <label>
                                                        {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
                                                            key.split(/(?=[A-Z])/).join(' ').slice(1)}
                                                    </label>
                                                    <p>{value}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="applicants-managements-detail-section">
                                <div className="applicants-managements-section-header">
                                    <Briefcase className="applicants-managements-section-icon" />
                                    <h3>Job Information</h3>
                                </div>
                                <div className="applicants-managements-section-content">
                                    <div className="applicants-managements-detail-grid">
                                        {Object.entries(selectedApplicant.jobDetails || {})
                                            .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                                            .map(([key, value]) => (
                                                <div key={key} className="applicants-managements-detail-item">
                                                    <label>
                                                        {key.split(/(?=[A-Z])/).join(' ').charAt(0).toUpperCase() +
                                                            key.split(/(?=[A-Z])/).join(' ').slice(1)}
                                                    </label>
                                                    <p>{value}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                            
                            {selectedApplicant.resume && (
                                <div className="applicants-managements-detail-section">
                                    <div className="applicants-managements-section-header">
                                        <FileText className="applicants-managements-section-icon" />
                                        <h3>Resume</h3>
                                    </div>
                                    <div className="applicants-managements-section-content">
                                        <div className="applicants-managements-resume-container">
                                            <p className="applicants-managements-resume-filename">{selectedApplicant.resume.filename}</p>
                                            <button
                                                className="applicants-managements-download-resume-btn"
                                                onClick={() => downloadResume(selectedApplicant._id, selectedApplicant.resume.filename)}
                                            >
                                                <Download size={18} />
                                                Download Resume
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="applicants-managements-detail-section">
                                <div className="applicants-managements-section-header">
                                    <h3>Application Status</h3>
                                </div>
                                <div className="applicants-managements-section-content">
                                    <div className="applicants-managements-status-update-container">
                                        <label>Update Status</label>
                                        <select
                                            value={selectedApplicant.status || 'pending'}
                                            onChange={(e) => handleStatusUpdate(selectedApplicant._id, e.target.value)}
                                            className={`applicants-managements-status-select-large ${selectedApplicant.status || 'pending'}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="shortlisted">Shortlisted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <p className="applicants-managements-status-help-text">
                                            Changing status will notify the applicant via email automatically.
                                        </p>
                                    </div>
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