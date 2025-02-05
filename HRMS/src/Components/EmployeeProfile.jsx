import React, { useState, useEffect } from 'react';
import { Calendar, FileText } from 'lucide-react';

const LeaveHistory = ({ employeeId }) => {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (employeeId) {
      fetchLeaveHistory();
    }
  }, [employeeId]);

  const fetchLeaveHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/leaves/filter/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave history');
      }

      const data = await response.json();
      setLeaveHistory(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="p-4 text-center">Loading leave history...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (leaveHistory.length === 0) {
    return <div className="p-4 text-center">No leave history found.</div>;
  }

  return (
    <div className="space-y-4">
      {leaveHistory.map((leave, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              leave.status === 'approved' ? 'bg-green-100 text-green-800' :
              leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
            </span>
            <span className="flex items-center text-gray-600 text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
            </span>
          </div>
          
          <h4 className="font-semibold mb-2">
            {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
          </h4>
          
          <p className="text-gray-600 text-sm mb-2">{leave.reason}</p>
          
          {leave.documents?.length > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <FileText className="w-4 h-4 mr-1" />
              <span>{leave.documents.length} document(s) attached</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LeaveHistory;