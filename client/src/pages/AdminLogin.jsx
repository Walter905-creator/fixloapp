import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Simple styled components since @/components/ui/* don't exist
const Input = ({ placeholder, value, onChange, type = "text" }) => (
  <input
    style={{
      width: '100%',
      padding: '12px 15px',
      border: '2px solid #ddd',
      borderRadius: '8px',
      fontSize: '1rem',
      outline: 'none',
      transition: 'border-color 0.3s ease'
    }}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    type={type}
  />
);

const Button = ({ onClick, children }) => (
  <button
    style={{
      width: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '15px 20px',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    }}
    onClick={onClick}
  >
    {children}
  </button>
);

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com'}/api/admin/login`, {
        email,
        password
      });
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin-dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 border rounded shadow space-y-4" style={{
      maxWidth: '28rem',
      margin: '5rem auto',
      padding: '2rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '1rem'
      }}>Admin Login</h1>
      <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
      <Button onClick={handleLogin}>Login</Button>
    </div>
  );
}