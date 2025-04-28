import React, { useState, useEffect } from 'react';
import { 
  X, ChevronUp, ChevronDown, Award, Users, Building, 
  BarChart2, TrendingUp, TrendingDown, Zap, Clock, 
  Filter, Download, Share2, HelpCircle, Settings, Search
} from 'lucide-react';
import '../assets/css/LeaderboardModal.css';

// Enhanced sample data with more metrics
const SAMPLE_EMPLOYEE_DATA = [
  { 
    id: 1, 
    name: 'John Smith', 
    points: 4770,
    department: 'Sales',
    role: 'Sales Manager',
    rank: 1, 
    previousRank: 1,
    trend: 'stable',
    performance: 98,
    attendance: 100,
    satisfaction: 96,
    activeDays: 22,
    completedTasks: 87,
    growth: 15.2
  },
  { 
    id: 2, 
    name: 'Emily Johnson', 
    points: 4650,
    department: 'Marketing',
    role: 'Marketing Lead',
    rank: 2, 
    previousRank: 3,
    trend: 'up',
    performance: 95,
    attendance: 98,
    satisfaction: 94,
    activeDays: 21,
    completedTasks: 82,
    growth: 18.7
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    points: 4550,
    department: 'Development',
    role: 'Senior Developer',
    rank: 3, 
    previousRank: 2,
    trend: 'down',
    performance: 92,
    attendance: 97,
    satisfaction: 90,
    activeDays: 22,
    completedTasks: 79,
    growth: 12.5
  },
  { 
    id: 4, 
    name: 'Jessica Wilson', 
    points: 4520,
    department: 'Customer Support',
    role: 'Support Specialist',
    rank: 4, 
    previousRank: 4,
    trend: 'stable',
    performance: 90,
    attendance: 95,
    satisfaction: 93,
    activeDays: 20,
    completedTasks: 75,
    growth: 11.8
  },
  { 
    id: 5, 
    name: 'David Lee', 
    points: 4250,
    department: 'Sales',
    role: 'Sales Representative',
    rank: 5, 
    previousRank: 6,
    trend: 'up',
    performance: 89,
    attendance: 94,
    satisfaction: 91,
    activeDays: 21,
    completedTasks: 72,
    growth: 14.3
  },
  { 
    id: 6, 
    name: 'Sarah Miller', 
    points: 4050,
    department: 'Human Resources',
    role: 'HR Specialist',
    rank: 6, 
    previousRank: 5,
    trend: 'down',
    performance: 86,
    attendance: 92,
    satisfaction: 89,
    activeDays: 20,
    completedTasks: 68,
    growth: 9.5
  },
  { 
    id: 7, 
    name: 'James Anderson', 
    points: 3920,
    department: 'Finance',
    role: 'Financial Analyst',
    rank: 7, 
    previousRank: 9,
    trend: 'up',
    performance: 85,
    attendance: 93,
    satisfaction: 87,
    activeDays: 21,
    completedTasks: 65,
    growth: 16.2
  },
  { 
    id: 8, 
    name: 'Emma Davis', 
    points: 3840,
    department: 'Design',
    role: 'UI/UX Designer',
    rank: 8, 
    previousRank: 7,
    trend: 'down',
    performance: 84,
    attendance: 90,
    satisfaction: 92,
    activeDays: 19,
    completedTasks: 62,
    growth: 10.7
  },
  { 
    id: 9, 
    name: 'Daniel Martinez', 
    points: 3750,
    department: 'Development',
    role: 'Backend Developer',
    rank: 9, 
    previousRank: 8,
    trend: 'down',
    performance: 82,
    attendance: 89,
    satisfaction: 88,
    activeDays: 20,
    completedTasks: 58,
    growth: 8.9
  },
  { 
    id: 10, 
    name: 'Olivia Taylor', 
    points: 3620,
    department: 'Marketing',
    role: 'Content Specialist',
    rank: 10, 
    previousRank: 11,
    trend: 'up',
    performance: 80,
    attendance: 91,
    satisfaction: 86,
    activeDays: 19,
    completedTasks: 56,
    growth: 12.1
  },
  { 
    id: 11, 
    name: 'Robert Johnson', 
    points: 3580,
    department: 'Sales',
    role: 'Sales Representative',
    rank: 11, 
    previousRank: 10,
    trend: 'down',
    performance: 79,
    attendance: 88,
    satisfaction: 85,
    activeDays: 18,
    completedTasks: 53,
    growth: 7.6
  },
  { 
    id: 12, 
    name: 'Sophia Rodriguez', 
    points: 3490,
    department: 'Customer Support',
    role: 'Customer Success Manager',
    rank: 12, 
    previousRank: 12,
    trend: 'stable',
    performance: 77,
    attendance: 87,
    satisfaction: 84,
    activeDays: 19,
    completedTasks: 51,
    growth: 9.3
  }
];

const SAMPLE_TEAM_DATA = [
  { 
    id: 1, 
    name: 'Sales Team', 
    points: 12650, 
    rank: 1,
    previousRank: 2,
    trend: 'up',
    memberCount: 15,
    avgPerformance: 94.3,
    leadName: 'John Smith',
    projectsCompleted: 32,
    clientSatisfaction: 92,
    growth: 18.7,
    revenueGenerated: '$245,800'
  },
  { 
    id: 2, 
    name: 'Marketing', 
    points: 11820, 
    rank: 2,
    previousRank: 1,
    trend: 'down',
    memberCount: 12,
    avgPerformance: 92.1,
    leadName: 'Emily Johnson',
    projectsCompleted: 28,
    clientSatisfaction: 90,
    growth: 15.2,
    revenueGenerated: '$198,500'
  },
  { 
    id: 3, 
    name: 'Development', 
    points: 10950, 
    rank: 3,
    previousRank: 3,
    trend: 'stable',
    memberCount: 18,
    avgPerformance: 91.7,
    leadName: 'Michael Brown',
    projectsCompleted: 35,
    clientSatisfaction: 89,
    growth: 14.8,
    revenueGenerated: '$287,300'
  },
  { 
    id: 4, 
    name: 'Customer Support', 
    points: 9750, 
    rank: 4,
    previousRank: 4,
    trend: 'stable',
    memberCount: 10,
    avgPerformance: 88.5,
    leadName: 'Jessica Wilson',
    projectsCompleted: 0,
    clientSatisfaction: 93,
    growth: 12.3,
    revenueGenerated: '$0'
  },
  { 
    id: 5, 
    name: 'Human Resources', 
    points: 8950, 
    rank: 5,
    previousRank: 6,
    trend: 'up',
    memberCount: 8,
    avgPerformance: 86.9,
    leadName: 'Sarah Miller',
    projectsCompleted: 12,
    clientSatisfaction: 87,
    growth: 10.5,
    revenueGenerated: '$0'
  }
];

const SAMPLE_BRANCH_DATA = [
  { 
    id: 1, 
    name: 'Lahore Branch', 
    points: 22450, 
    rank: 1,
    previousRank: 1,
    trend: 'stable',
    employeeCount: 42,
    manager: 'Richard Wilson',
    revenue: '$845,200',
    growth: 19.5,
    clientSatisfaction: 94,
    employeePerformance: 92.7,
    projectsCompleted: 48
  },
  { 
    id: 2, 
    name: 'Karachi Branch', 
    points: 21350, 
    rank: 2,
    previousRank: 3,
    trend: 'up',
    employeeCount: 38,
    manager: 'Amanda Foster',
    revenue: '$789,600',
    growth: 17.8,
    clientSatisfaction: 92,
    employeePerformance: 91.2,
    projectsCompleted: 43
  },
  { 
    id: 3, 
    name: 'Islamabad Branch', 
    points: 20150, 
    rank: 3,
    previousRank: 2,
    trend: 'down',
    employeeCount: 35,
    manager: 'Thomas Harris',
    revenue: '$722,900',
    growth: 16.3,
    clientSatisfaction: 90,
    employeePerformance: 89.8,
    projectsCompleted: 39
  },
  { 
    id: 4, 
    name: 'Multan Branch', 
    points: 18750, 
    rank: 4,
    previousRank: 4,
    trend: 'stable',
    employeeCount: 30,
    manager: 'Catherine Lee',
    revenue: '$654,200',
    growth: 14.7,
    clientSatisfaction: 89,
    employeePerformance: 87.5,
    projectsCompleted: 35
  },
  { 
    id: 5, 
    name: 'Peshawar Branch', 
    points: 17500, 
    rank: 5,
    previousRank: 5,
    trend: 'stable',
    employeeCount: 28,
    manager: 'Robert Martinez',
    revenue: '$598,400',
    growth: 13.2,
    clientSatisfaction: 87,
    employeePerformance: 86.3,
    projectsCompleted: 32
  }
];

// Performance Categories
const PERFORMANCE_CATEGORIES = [
  { id: 'overall', name: 'Overall Performance' },
  { id: 'sales', name: 'Sales Performance' },
  { id: 'customer', name: 'Customer Satisfaction' },
  { id: 'attendance', name: 'Attendance' },
  { id: 'tasks', name: 'Tasks Completion' },
  { id: 'growth', name: 'Growth' }
];

const EnhancedLeaderboardModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Employees');
  const [activePeriod, setActivePeriod] = useState('Monthly');
  const [activeCategory, setActiveCategory] = useState('overall');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  useEffect(() => {
    // Reset expanded item when tab changes
    setExpandedItem(null);
  }, [activeTab]);

  if (!isOpen) return null;

  // Get data based on active tab
  const getLeaderboardData = () => {
    let filteredData;
    
    switch (activeTab) {
      case 'Teams':
        filteredData = SAMPLE_TEAM_DATA;
        break;
      case 'Branches':
        filteredData = SAMPLE_BRANCH_DATA;
        break;
      case 'Employees':
      default:
        filteredData = SAMPLE_EMPLOYEE_DATA;
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        (item.department && item.department.toLowerCase().includes(searchLower)) ||
        (item.role && item.role.toLowerCase().includes(searchLower))
      );
    }
    
    return filteredData;
  };

  const leaderboardData = getLeaderboardData();

  // Toggle expanded item details
  const toggleExpandItem = (id) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };

  // Generate the appropriate rank badge
  const getRankBadge = (rank, trend) => {
    let badgeClass = '';
    
    if (rank === 1) {
      badgeClass = 'gold';
    } else if (rank === 2) {
      badgeClass = 'silver';
    } else if (rank === 3) {
      badgeClass = 'bronze';
    }
    
    return (
      <div className={`rank-badge ${badgeClass}`}>
        {rank}
        {trend !== 'stable' && (
          <div className={`trend-indicator ${trend}`}>
            {trend === 'up' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        )}
      </div>
    );
  };

  // Generate initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Generate performance bar for given value
  const getPerformanceBar = (value, label = null) => {
    return (
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill" 
            style={{width: `${value}%`}}
          ></div>
        </div>
        <div className="progress-value">
          {label ? `${label}: ${value}%` : `${value}%`}
        </div>
      </div>
    );
  };

  // Format growth value
  const formatGrowth = (value) => {
    return (
      <div className={`growth-badge ${value >= 0 ? 'positive' : 'negative'}`}>
        {value >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  // Get expanded details based on item type
  const getExpandedDetails = (item) => {
    switch (activeTab) {
      case 'Employees':
        return (
          <div className="expanded-details">
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Department</div>
                <div className="detail-value">{item.department}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Role</div>
                <div className="detail-value">{item.role}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Performance</div>
                <div className="detail-value">{getPerformanceBar(item.performance)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Attendance</div>
                <div className="detail-value">{getPerformanceBar(item.attendance)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Active Days</div>
                <div className="detail-value">{item.activeDays} days</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Tasks Completed</div>
                <div className="detail-value">{item.completedTasks}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Satisfaction</div>
                <div className="detail-value">{getPerformanceBar(item.satisfaction)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Growth</div>
                <div className="detail-value">{formatGrowth(item.growth)}</div>
              </div>
            </div>
          </div>
        );
      
      case 'Teams':
        return (
          <div className="expanded-details">
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Team Lead</div>
                <div className="detail-value">{item.leadName}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Members</div>
                <div className="detail-value">{item.memberCount}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Average Performance</div>
                <div className="detail-value">{getPerformanceBar(item.avgPerformance)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Client Satisfaction</div>
                <div className="detail-value">{getPerformanceBar(item.clientSatisfaction)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Projects Completed</div>
                <div className="detail-value">{item.projectsCompleted}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Growth</div>
                <div className="detail-value">{formatGrowth(item.growth)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Revenue Generated</div>
                <div className="detail-value">{item.revenueGenerated}</div>
              </div>
            </div>
          </div>
        );
      
      case 'Branches':
        return (
          <div className="expanded-details">
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Branch Manager</div>
                <div className="detail-value">{item.manager}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Employees</div>
                <div className="detail-value">{item.employeeCount}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Employee Performance</div>
                <div className="detail-value">{getPerformanceBar(item.employeePerformance)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Client Satisfaction</div>
                <div className="detail-value">{getPerformanceBar(item.clientSatisfaction)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Revenue</div>
                <div className="detail-value">{item.revenue}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Projects Completed</div>
                <div className="detail-value">{item.projectsCompleted}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Growth</div>
                <div className="detail-value">{formatGrowth(item.growth)}</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="consistent-leaderboard-overlay">
      <div className="consistent-leaderboard-modal">
        <div className="leaderboard-header">
          <div className="header-left">
            <h2>Performance Leaderboard</h2>
            <div className="header-subtitle">{activePeriod} rankings for {activeTab.toLowerCase()}</div>
          </div>
          <div className="header-actions">
           
            <button className="close-button" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="leaderboard-controls">
          <div className="tabs-section">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'Employees' ? 'active' : ''}`}
                onClick={() => setActiveTab('Employees')}
              >
                Employees
              </button>
              <button 
                className={`tab-button ${activeTab === 'Teams' ? 'active' : ''}`}
                onClick={() => setActiveTab('Teams')}
              >
                Teams
              </button>
              <button 
                className={`tab-button ${activeTab === 'Branches' ? 'active' : ''}`}
                onClick={() => setActiveTab('Branches')}
              >
                Branches
              </button>
            </div>

            {/* Period Selection */}
            <div className="period-selection">
              <button 
                className={`period-button ${activePeriod === 'Weekly' ? 'active' : ''}`}
                onClick={() => setActivePeriod('Weekly')}
              >
                Weekly
              </button>
              <button 
                className={`period-button ${activePeriod === 'Monthly' ? 'active' : ''}`}
                onClick={() => setActivePeriod('Monthly')}
              >
                Monthly
              </button>
              <button 
                className={`period-button ${activePeriod === 'Yearly' ? 'active' : ''}`}
                onClick={() => setActivePeriod('Yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="filter-section">
            <div className="performance-category">
              <span className="category-label">Performance Category:</span>
              <select 
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="category-select"
              >
                {PERFORMANCE_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon top-performer">
              <Award size={18} />
            </div>
            <div className="summary-content">
              <div className="summary-title">Top Performer</div>
              <div className="summary-value">{leaderboardData[0]?.name || 'N/A'}</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon avg-score">
              <BarChart2 size={18} />
            </div>
            <div className="summary-content">
              <div className="summary-title">Average Score</div>
              <div className="summary-value">
                {leaderboardData.length > 0 
                  ? Math.round(leaderboardData.reduce((sum, item) => sum + item.points, 0) / leaderboardData.length) 
                  : 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon highest-growth">
              <TrendingUp size={18} />
            </div>
            <div className="summary-content">
              <div className="summary-title">Highest Growth</div>
              <div className="summary-value">
                {leaderboardData.length > 0 
                  ? `${Math.max(...leaderboardData.map(item => item.growth)).toFixed(1)}%` 
                  : 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon most-improved">
              <Zap size={18} />
            </div>
            <div className="summary-content">
              <div className="summary-title">Most Improved</div>
              <div className="summary-value">
                {leaderboardData
                  .filter(item => item.trend === 'up')
                  .sort((a, b) => b.growth - a.growth)[0]?.name || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-table-container">
          <div className="leaderboard-table-header">
            <div className="header-rank">#</div>
            <div className="header-name">Name</div>
            <div className="header-details">Department / Role</div>
            <div className="header-score">Score</div>
            <div className="header-growth">Growth</div>
            <div className="header-actions"></div>
          </div>

          <div className="leaderboard-table-body">
            {leaderboardData.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">
                  <Search size={48} strokeWidth={1} />
                </div>
                <div className="no-results-message">No results found</div>
                <div className="no-results-suggestion">Try adjusting your search or filters</div>
              </div>
            ) : (
              leaderboardData.map((item) => (
                <div key={item.id} className={`table-row ${expandedItem === item.id ? 'expanded' : ''}`}>
                  <div className="row-content" onClick={() => toggleExpandItem(item.id)}>
                    <div className="cell-rank">
                      {getRankBadge(item.rank, item.trend)}
                    </div>
                    <div className="cell-name">
                      <div className="initials-badge">
                        {getInitials(item.name)}
                      </div>
                      <div className="name-container">
                        <div className="primary-name">{item.name}</div>
                        <div className="secondary-label">
                          {activeTab === 'Employees' && item.role}
                          {activeTab === 'Teams' && `${item.memberCount} members`}
                          {activeTab === 'Branches' && `${item.employeeCount} employees`}
                        </div>
                      </div>
                    </div>
                    <div className="cell-details">
                      <div className="details-primary">
                        {activeTab === 'Employees' && item.department}
                        {activeTab === 'Teams' && item.leadName}
                        {activeTab === 'Branches' && item.manager}
                      </div>
                      <div className="details-progress">
                        {activeTab === 'Employees' && getPerformanceBar(item.performance)}
                        {activeTab === 'Teams' && getPerformanceBar(item.avgPerformance)}
                        {activeTab === 'Branches' && getPerformanceBar(item.employeePerformance)}
                      </div>
                    </div>
                    <div className="cell-score">
                      <div className="score-value">{item.points.toLocaleString()}</div>
                      {item.previousRank !== item.rank && (
                        <div className={`rank-change ${item.trend}`}>
                          {item.trend === 'up' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          <span>{Math.abs(item.previousRank - item.rank)}</span>
                        </div>
                      )}
                    </div>
                    <div className="cell-growth">
                      {formatGrowth(item.growth)}
                    </div>
                    <div className="cell-actions">
                      <button className={`expand-button ${expandedItem === item.id ? 'active' : ''}`}>
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {expandedItem === item.id && getExpandedDetails(item)}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="leaderboard-footer">
          <div className="footer-info">
            Showing {leaderboardData.length} {activeTab.toLowerCase()} from {activePeriod.toLowerCase()} period
          </div>
          <div className="footer-actions">
            <button className="export-button">
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLeaderboardModal;