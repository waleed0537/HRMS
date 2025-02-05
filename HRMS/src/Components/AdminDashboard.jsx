import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const [leaveStats, setLeaveStats] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    departments: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch employees data
      const employeesResponse = await fetch('http://localhost:5000/api/employees', { headers });
      const employeesData = await employeesResponse.json();

      // Fetch leaves data
      const leavesResponse = await fetch('http://localhost:5000/api/leaves', { headers });
      const leavesData = await leavesResponse.json();

      processEmployeeStats(employeesData);
      processLeaveStats(leavesData);
      processTeamPerformance(employeesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const processEmployeeStats = (employees) => {
    const active = employees.filter(emp => emp.professionalDetails.status === 'active').length;
    const onLeave = employees.filter(emp => emp.professionalDetails.status === 'on_leave').length;
    
    // Group by department
    const departments = employees.reduce((acc, emp) => {
      const dept = emp.professionalDetails.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const departmentData = Object.entries(departments).map(([name, count]) => ({
      name,
      value: count
    }));

    setEmployeeStats({
      total: employees.length,
      active,
      onLeave,
      departments: departmentData
    });
  };

  const processLeaveStats = (leaves) => {
    const monthlyStats = leaves.reduce((acc, leave) => {
      const month = new Date(leave.startDate).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const leaveData = Object.entries(monthlyStats).map(([month, count]) => ({
      month,
      leaves: count
    }));

    setLeaveStats(leaveData);
  };

  const processTeamPerformance = (employees) => {
    const branchPerformance = employees.reduce((acc, emp) => {
      const branch = emp.professionalDetails.branch;
      if (!acc[branch]) {
        acc[branch] = {
          name: branch,
          performance: emp.rating || 0,
          count: 1
        };
      } else {
        acc[branch].performance += emp.rating || 0;
        acc[branch].count += 1;
      }
      return acc;
    }, {});

    const performanceData = Object.values(branchPerformance).map(({ name, performance, count }) => ({
      name,
      rating: (performance / count).toFixed(1)
    }));

    setTeamPerformance(performanceData);
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      marginTop: '64px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    },
    statCard: {
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    chartContainer: {
      width: '100%',
      height: '300px',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#333'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>
      
      <div style={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{employeeStats.total}</div>
            <div style={{ color: '#666' }}>
              Active: {employeeStats.active} | On Leave: {employeeStats.onLeave}
            </div>
          </CardContent>
        </Card>
      </div>

      <div style={styles.chartContainer}>
        <Card>
          <CardHeader>
            <CardTitle>Leave Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={leaveStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leaves" stroke="#474787" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div style={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rating" stroke="#474787" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={employeeStats.departments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {employeeStats.departments.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;