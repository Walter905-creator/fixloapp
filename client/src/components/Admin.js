// src/components/Admin.js
import React, { useState, useEffect } from 'react';

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('adminToken'));
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState({ totalPros: '-', activePros: '-', pendingPros: '-' });
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // API configuration - use environment variable or fallback to local development server
  const API_BASE = process.env.REACT_APP_API_URL || 
                  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://fixloapp.onrender.com');

  useEffect(() => {
    if (authToken) {
      setIsLoggedIn(true);
      loadDashboard();
    }
  }, [authToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    setLoginError('');

    console.log('Login attempt with API_BASE:', API_BASE);

    try {
      const url = `${API_BASE}/api/auth/login`;
      console.log('Calling URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.token) {
        setAuthToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setAdminEmail(email);
        setIsLoggedIn(true);
        loadDashboard(data.token);  // Pass token directly
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAuthToken(null);
    setIsLoggedIn(false);
    setLoginError('');
    setAdminEmail('');
  };

  const loadDashboard = async (token) => {
    const tokenToUse = token || authToken;
    try {
      // Load stats
      const statsResponse = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalPros: statsData.stats.totalPros,
          activePros: statsData.stats.activePros,
          pendingPros: statsData.stats.pendingPros
        });
      }

      // Load professionals
      loadProfessionals(tokenToUse);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadProfessionals = async (token) => {
    const tokenToUse = token || authToken;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/pros`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const pros = await response.json();
      setProfessionals(Array.isArray(pros) ? pros : []);
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePro = async (proId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/pros/${proId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        loadProfessionals();
        loadDashboard();
      } else {
        alert('Error toggling professional status');
      }
    } catch (error) {
      console.error('Error toggling professional:', error);
      alert('Error toggling professional status');
    }
  };

  const deletePro = async (proId) => {
    if (!window.confirm('Are you sure you want to delete this professional?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/pros/${proId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        loadProfessionals();
        loadDashboard();
      } else {
        alert('Error deleting professional');
      }
    } catch (error) {
      console.error('Error deleting professional:', error);
      alert('Error deleting professional');
    }
  };

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      default: return 'status-inactive';
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
      }}>
        <form onSubmit={handleLogin} style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#2c3e50' }}>
            Fixlo Admin Login
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>
              Email:
            </label>
            <input 
              type="email" 
              name="email" 
              required 
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '500' }}>
              Password:
            </label>
            <input 
              type="password" 
              name="password" 
              required 
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
            />
          </div>
          <button type="submit" style={{
            width: '100%',
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '5px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background 0.3s'
          }}>
            Login
          </button>
          {loginError && (
            <div style={{ color: '#e74c3c', textAlign: 'center', marginTop: '1rem' }}>
              {loginError}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      background: '#f5f5f5',
      color: '#333',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '1rem 0',
        marginBottom: '2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/assets/fixlo-logo.png" alt="Fixlo" style={{ width: '40px', height: '40px' }} />
              <h1 style={{ color: '#2c3e50', fontSize: '1.5rem', margin: 0 }}>Admin Dashboard</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>{adminEmail}</span>
              <button onClick={logout} style={{
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Total Professionals
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {stats.totalPros}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Active Professionals
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
              {stats.activePros}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Pending Payment
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
              {stats.pendingPros}
            </div>
          </div>
        </div>

        {/* Professionals Table */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderBottom: '1px solid #eee'
          }}>
            <h2 style={{ color: '#2c3e50', fontSize: '1.2rem', margin: 0 }}>Professionals</h2>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
              Loading professionals...
            </div>
          ) : professionals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
              No professionals found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', background: '#f8f9fa', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', background: '#f8f9fa', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', background: '#f8f9fa', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' }}>Phone</th>
                    <th style={{ padding: '1rem', textAlign: 'left', background: '#f8f9fa', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' }}>Trade</th>
                    <th style={{ padding: '1rem', textAlign: 'left', background: '#f8f9fa', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', background: '#f8f9fa', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' }}>Payment</th>
                    <th style={{ padding: '1rem', textAlign: 'left', background: '#f8f9fa', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {professionals.map(pro => (
                    <tr key={pro._id}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{pro.name}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{pro.email}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{pro.phone}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{pro.trade}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                        <span style={{
                          padding: '0.3rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          background: pro.isActive ? '#d4edda' : '#f8d7da',
                          color: pro.isActive ? '#155724' : '#721c24'
                        }}>
                          {pro.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                        <span style={{
                          padding: '0.3rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          background: getPaymentStatusClass(pro.paymentStatus) === 'status-active' ? '#d4edda' : 
                                     getPaymentStatusClass(pro.paymentStatus) === 'status-pending' ? '#fff3cd' : '#f8d7da',
                          color: getPaymentStatusClass(pro.paymentStatus) === 'status-active' ? '#155724' : 
                                getPaymentStatusClass(pro.paymentStatus) === 'status-pending' ? '#856404' : '#721c24'
                        }}>
                          {pro.paymentStatus || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                        <button 
                          onClick={() => togglePro(pro._id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            marginRight: '0.5rem',
                            background: '#17a2b8',
                            color: 'white'
                          }}
                        >
                          {pro.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => deletePro(pro._id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            background: '#dc3545',
                            color: 'white'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;