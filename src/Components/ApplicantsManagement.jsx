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
import { useToast } from './common/ToastContent';

const ApplicantsManagement = () => {
    // Get toast functionality
    const toast = useToast();

    // Core state
    const [showFieldManager, setShowFieldManager] = useState(false);
    const [applicants, setApplicants] = useState([]);
    const [filteredApplicants, setFilteredApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [user, setUser] = useState(null);
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

    // Get current user on component mount
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setCurrentUser(JSON.parse(userData));
        }
    }, []);

    // Check if user has form customization permissions
    const canCustomizeForm = () => {
        if (!currentUser) return false;
        return currentUser.isAdmin || currentUser.role === 'hr_manager';
    };
    const getBranchName = (applicant) => {
        // Check all possible locations for branch name
        return applicant.branchName || 
               applicant.jobDetails?.branch || 
               applicant.jobDetails?.branchName || 
               (applicant.jobDetails instanceof Map ? 
                  applicant.jobDetails.get('branch') || 
                  applicant.jobDetails.get('branchName') : null) ||
               'N/A';
      };
    // Get a consistent profile pic number based on email
    const getProfilePicNumber = (email) => {
        if (!email) return Math.floor(Math.random() * 11) + 1;

        // Generate a number based on the email's first character code
        const charCode = email.charCodeAt(0);
        return (charCode % 11) + 1; // Returns a number between 1-11
    };
    const getPersonalDetails = (applicant) => {
        let details = {};

        // Check if personalDetails is a Map and convert it
        if (applicant.personalDetails instanceof Map) {
            details = Object.fromEntries(applicant.personalDetails);
        } else if (typeof applicant.personalDetails === 'object' && applicant.personalDetails !== null) {
            details = { ...applicant.personalDetails };
        }

        return details;
    };

    // Helper function to extract all job details fields
    const getJobDetails = (applicant) => {
        let details = {};

        // Check if jobDetails is a Map and convert it
        if (applicant.jobDetails instanceof Map) {
            details = Object.fromEntries(applicant.jobDetails);
        } else if (typeof applicant.jobDetails === 'object' && applicant.jobDetails !== null) {
            details = { ...applicant.jobDetails };
        }

        return details;
    };
    // Render avatar with image and fallback to initials
    const renderAvatar = (applicant, size = 'medium') => {
        // Get applicant name and initial for fallback
        const name = applicant.personalDetails?.name || 'Unknown';
        const initial = name.charAt(0).toUpperCase();

        // Get profile pic number based on email
        const email = applicant.personalDetails?.email || '';
        const profilePicNum = getProfilePicNumber(email);

        // Determine appropriate CSS class based on size
        const sizeClass = {
            small: 'applicants-managements-avatar-sm',
            medium: 'applicants-managements-avatar',
            large: 'applicants-managements-modal-avatar'
        }[size] || 'applicants-managements-avatar';

        // Determine border radius based on the existing component style
        const borderRadius = size === 'large' ? '12px' : '50%';

        return (
            <div className={sizeClass}>
              <img
  src={new URL(`../assets/avatars/avatar-${profilePicNum}.jpg`, import.meta.url).href}
  alt={name}
  style={{
    width: '100%',
    height: '100%',
    borderRadius,
    objectFit: 'cover'
  }}
  onError={(e) => {
    // If image fails to load, replace with initial
    e.target.style.display = 'none';
    e.target.parentNode.style.display = 'flex';
    e.target.parentNode.style.alignItems = 'center';
    e.target.parentNode.style.justifyContent = 'center';
    e.target.parentNode.style.backgroundColor = '#474787';
    e.target.parentNode.style.color = 'white';
    e.target.parentNode.style.fontWeight = 'bold';
    e.target.parentNode.innerText = initial;
  }}
/>
            </div>
        );
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
            toast.success('Resume downloaded successfully');
        } catch (error) {
            console.error('Error downloading resume:', error);
            toast.error('Failed to download resume');
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
                toast.error('Only administrators and HR managers can update application status');
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
            toast.success(`Application status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status. Please try again.');
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            // Create a more comprehensive export data structure
            const exportData = filteredApplicants.map(app => {
                const personalDetails = getPersonalDetails(app);
                const jobDetails = getJobDetails(app);
                const branchName = getBranchName(app);

                // Create base export object with standard fields
                const exportObj = {
                    'Full Name': personalDetails.name || personalDetails.fullName || 'N/A',
                    'Email': personalDetails.email || 'N/A',
                    'Phone': personalDetails.phone || personalDetails.phoneNumber || personalDetails.contact || 'N/A',
                    'Position': jobDetails.position || jobDetails.jobTitle || 'N/A',
                    'Branch': branchName,
                    'Status': app.status || 'pending',
                    'Applied Date': new Date(app.createdAt).toLocaleDateString(),
                    'Resume': app.resume?.filename || 'No Resume'
                };

                // Add any additional personal details fields that aren't already included
                Object.entries(personalDetails).forEach(([key, value]) => {
                    if (!['name', 'fullName', 'email', 'phone', 'phoneNumber', 'contact'].includes(key) && value) {
                        // Format the key for readability
                        const formattedKey = key.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();

                        if (!exportObj[formattedKey]) {
                            exportObj[formattedKey] = value;
                        }
                    }
                });

                // Add any additional job details fields that aren't already included
                Object.entries(jobDetails).forEach(([key, value]) => {
                    if (!['position', 'jobTitle', 'branch', 'branchName'].includes(key) && value) {
                        // Format the key for readability
                        const formattedKey = key.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();

                        if (!exportObj[formattedKey]) {
                            exportObj[`Job ${formattedKey}`] = value;
                        }
                    }
                });

                return exportObj;
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Applicants');

            // Auto-size columns
            const colWidths = [];
            // Get headers first
            const headers = Object.keys(exportData[0] || {});
            headers.forEach((header, i) => {
                colWidths[i] = Math.max(header.length, colWidths[i] || 0);
            });

            // Then check all data rows
            exportData.forEach(row => {
                Object.values(row).forEach((value, i) => {
                    const length = (value || '').toString().length;
                    colWidths[i] = Math.max(colWidths[i] || 0, length);
                });
            });

            ws['!cols'] = colWidths.map(width => ({ wch: Math.min(width + 2, 50) })); // Add padding but cap at 50

            XLSX.writeFile(wb, `applicants_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel export completed successfully');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export to Excel');
        }
    };

    // Updated PDF export function
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            // Add title
            doc.setFontSize(16);
            doc.text('Applicants Report', 14, 15);

            // Add timestamp
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

            // Prepare rows data with all fields properly extracted
            const tableRows = filteredApplicants.map(app => {
                const personalDetails = getPersonalDetails(app);
                const jobDetails = getJobDetails(app);
                const branchName = getBranchName(app);

                return [
                    personalDetails.name || personalDetails.fullName || 'N/A',
                    personalDetails.email || 'N/A',
                    personalDetails.phone || personalDetails.phoneNumber || personalDetails.contact || 'N/A',
                    jobDetails.position || jobDetails.jobTitle || 'N/A',
                    branchName, // Using our helper function to get branch from all possible locations
                    app.status || 'pending',
                    new Date(app.createdAt).toLocaleDateString()
                ];
            });

            // Define columns for the table with fixed set for PDF layout
            const tableColumn = [
                'Full Name',
                'Email',
                'Phone',
                'Position',
                'Branch',
                'Status',
                'Applied Date'
            ];

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
                    0: { cellWidth: 30 }, // Name
                    1: { cellWidth: 40 }, // Email
                    2: { cellWidth: 25 }, // Phone
                    3: { cellWidth: 30 }, // Position
                    4: { cellWidth: 25 }, // Branch
                    5: { cellWidth: 20 }, // Status
                    6: { cellWidth: 25 }  // Date
                }
            });

            // Add a second page with detailed information for each applicant
            doc.addPage();
            doc.setFontSize(14);
            doc.text('Detailed Applicant Information', 14, 15);

            let yPosition = 25;

            // Loop through each applicant and add detailed information
            filteredApplicants.forEach((app, index) => {
                const personalDetails = getPersonalDetails(app);
                const jobDetails = getJobDetails(app);
                const branchName = getBranchName(app);

                // Check if we need a new page
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 15;
                }

                // Add applicant header
                doc.setFontSize(12);
                doc.setTextColor(71, 71, 135);
                doc.text(`Applicant ${index + 1}: ${personalDetails.name || 'N/A'}`, 14, yPosition);
                yPosition += 6;

                // Add applicant basic info
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                doc.text(`Email: ${personalDetails.email || 'N/A'}`, 14, yPosition);
                yPosition += 5;
                doc.text(`Phone: ${personalDetails.phone || personalDetails.phoneNumber || personalDetails.contact || 'N/A'}`, 14, yPosition);
                yPosition += 5;
                doc.text(`Position: ${jobDetails.position || jobDetails.jobTitle || 'N/A'}`, 14, yPosition);
                yPosition += 5;
                doc.text(`Branch: ${branchName}`, 14, yPosition);
                yPosition += 5;
                doc.text(`Status: ${app.status || 'pending'}`, 14, yPosition);
                yPosition += 5;
                doc.text(`Applied Date: ${new Date(app.createdAt).toLocaleDateString()}`, 14, yPosition);
                yPosition += 5;

                // Add resume information if available
                if (app.resume) {
                    doc.text(`Resume: ${app.resume.filename}`, 14, yPosition);
                    yPosition += 5;
                }

                // Add additional personal details
                doc.setFontSize(10);
                doc.setTextColor(71, 71, 135);
                doc.text('Additional Personal Details:', 14, yPosition);
                yPosition += 6;

                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);

                // Add all personal details not already included
                Object.entries(personalDetails).forEach(([key, value]) => {
                    if (!['name', 'fullName', 'email', 'phone', 'phoneNumber', 'contact'].includes(key) && value) {
                        const formattedKey = key.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();

                        // Check if we need a new page
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 15;
                        }

                        doc.text(`${formattedKey}: ${value}`, 14, yPosition);
                        yPosition += 5;
                    }
                });

                // Add additional job details
                doc.setFontSize(10);
                doc.setTextColor(71, 71, 135);
                doc.text('Additional Job Details:', 14, yPosition);
                yPosition += 6;

                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);

                // Add all job details not already included
                Object.entries(jobDetails).forEach(([key, value]) => {
                    if (!['position', 'jobTitle', 'branch', 'branchName'].includes(key) && value) {
                        const formattedKey = key.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();

                        // Check if we need a new page
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 15;
                        }

                        doc.text(`${formattedKey}: ${value}`, 14, yPosition);
                        yPosition += 5;
                    }
                });

                // Add space between applicants
                yPosition += 10;
            });

            doc.save(`applicants_detailed_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF export completed successfully');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Failed to export to PDF');
        }
    };

    // Updated Detail View Handler
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
                // Ensure branchName is set from all possible sources
                branchName: detailedData.branchName ||
                    detailedData.jobDetails?.branch ||
                    (detailedData.jobDetails instanceof Map ?
                        detailedData.jobDetails.get('branch') ||
                        detailedData.jobDetails.get('branchName') : null)
            };

            setSelectedApplicant(processedData);
        } catch (error) {
            console.error('Error fetching applicant details:', error);
            toast.error('Could not load complete applicant details');

            // Still show the modal with available data as fallback
            // Ensure we still extract branch name properly
            const processedApplicant = {
                ...applicant,
                personalDetails: applicant.personalDetails instanceof Map ?
                    Object.fromEntries(applicant.personalDetails) :
                    applicant.personalDetails || {},
                jobDetails: applicant.jobDetails instanceof Map ?
                    Object.fromEntries(applicant.jobDetails) :
                    applicant.jobDetails || {},
                // Ensure branchName is set from all possible sources
                branchName: getBranchName(applicant)
            };

            setSelectedApplicant(processedApplicant);
        }
    };

    // Render Grid View
    const renderGridView = () => (
        <div className="applicants-managements-grid-container">
            {filteredApplicants.map(applicant => (
                <div className="applicants-managements-card" key={applicant._id}>
                    <div className="applicants-managements-card-header">
                        {renderAvatar(applicant, 'medium')}
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
                        {renderAvatar(applicant, 'small')}
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
                                className="applicants-managements-list-view-btn" style={{ width: 'fit-content', height: 'fit-conten' }}
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
                        {renderAvatar(applicant, 'small')}
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

                    {canCustomizeForm() && (
                        <button
                            onClick={() => setShowFieldManager(true)}
                            className="applicants-managements-customize-btn"
                            title="Customize application form"
                        >
                            <Settings size={18} />
                            <span>Customize Form</span>
                        </button>
                    )}
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
                            onClick={() => {
                                setFilters({ status: '', position: '', branch: '' });
                                toast.info('Filters have been reset');
                            }}
                            className="applicants-managements-clear-filters-btn"
                        >
                            Reset Filters
                        </button>
                    </div>
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
                                    toast.info('Search and filters have been cleared');
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
                    onClose={() => {
                        setShowFieldManager(false);
                        toast.info('Form field manager closed');
                    }}
                />
            )}

            {/* Updated Applicant Detail Modal JSX */}
            {selectedApplicant && (
                <div className="applicants-managements-detail-modal">
                    <div className="applicants-managements-modal-overlay" onClick={() => setSelectedApplicant(null)}></div>
                    <div className="applicants-managements-modal-content">
                        <button className="applicants-managements-modal-close" onClick={() => setSelectedApplicant(null)}>
                            <X size={24} />
                        </button>

                        <div className="applicants-managements-modal-header">
                            {renderAvatar(selectedApplicant, 'large')}
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
                                                        {key.replace(/([A-Z])/g, ' $1')
                                                            .replace(/^./, str => str.toUpperCase())
                                                            .trim()}
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
                                        {/* Add explicit branch name field first */}
                                        <div className="applicants-managements-detail-item">
                                            <label>Branch</label>
                                            <p>{selectedApplicant.branchName ||
                                                selectedApplicant.jobDetails?.branch ||
                                                selectedApplicant.jobDetails?.branchName ||
                                                'Not specified'}</p>
                                        </div>

                                        {/* Then add the rest of the job details */}
                                        {Object.entries(selectedApplicant.jobDetails || {})
                                            .filter(([key, value]) =>
                                                value !== null &&
                                                value !== undefined &&
                                                value !== '' &&
                                                key !== 'branch' &&
                                                key !== 'branchName')
                                            .map(([key, value]) => (
                                                <div key={key} className="applicants-managements-detail-item">
                                                    <label>
                                                        {key.replace(/([A-Z])/g, ' $1')
                                                            .replace(/^./, str => str.toUpperCase())
                                                            .trim()}
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

                            {/* Add application date section */}
                            <div className="applicants-managements-detail-section">
                                <div className="applicants-managements-section-header">
                                    <Calendar className="applicants-managements-section-icon" />
                                    <h3>Application Information</h3>
                                </div>
                                <div className="applicants-managements-section-content">
                                    <div className="applicants-managements-detail-grid">
                                        <div className="applicants-managements-detail-item">
                                            <label>Applied On</label>
                                            <p>{new Date(selectedApplicant.createdAt).toLocaleString()}</p>
                                        </div>
                                        {selectedApplicant.updatedAt && (
                                            <div className="applicants-managements-detail-item">
                                                <label>Last Updated</label>
                                                <p>{new Date(selectedApplicant.updatedAt).toLocaleString()}</p>
                                            </div>
                                        )}
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