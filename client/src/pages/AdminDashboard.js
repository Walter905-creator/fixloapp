import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfessionals: 0,
    totalBookings: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/admin-login';
    }
  }, []);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com';
      const token = localStorage.getItem('admin_token');
      
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      localStorage.removeItem('admin_token');
      window.location.href = '/admin-login';
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '6rem 2rem 4rem', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '6rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333' }}>
          🛠️ Fixlo Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          style={{
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3>Total Users</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalUsers}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👷‍♂️</div>
          <h3>Professionals</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalProfessionals}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h3>Total Bookings</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalBookings}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
          <h3>Revenue</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${stats.revenue}</div>
        </div>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '15px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '2rem' }}>🎛️ Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            👥 Manage Users
          </button>
          <button style={{
            background: '#4ecdc4',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            👷‍♂️ Approve Professionals
          </button>
          <button style={{
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            📊 View Analytics
          </button>
          <button style={{
            background: '#ffd700',
            color: '#333',
            border: 'none',
            padding: '15px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            ⚙️ System Settings
          </button>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '15px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginBottom: '2rem' }}>📋 Recent Activity</h3>
        <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
          Recent activity logs will appear here...
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
