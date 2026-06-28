import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * RecruiterAuthContext — Authentication state for /recruiter routes.
 *
 * Separate from ProAuthContext and ReferralAuthContext.
 * Stores JWT in localStorage as 'fixlo_recruiter_token'.
 */

const RecruiterAuthContext = createContext(null);

export const useRecruiterAuth = () => {
  const ctx = useContext(RecruiterAuthContext);
  if (!ctx) throw new Error('useRecruiterAuth must be used within RecruiterAuthProvider');
  return ctx;
};

export function RecruiterAuthProvider({ children }) {
  const [recruiter, setRecruiter] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('fixlo_recruiter_token');
      const storedRecruiter = localStorage.getItem('fixlo_recruiter_user');
      if (storedToken && storedRecruiter) {
        setToken(storedToken);
        setRecruiter(JSON.parse(storedRecruiter));
      }
    } catch {
      localStorage.removeItem('fixlo_recruiter_token');
      localStorage.removeItem('fixlo_recruiter_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (tokenValue, recruiterData) => {
    localStorage.setItem('fixlo_recruiter_token', tokenValue);
    localStorage.setItem('fixlo_recruiter_user', JSON.stringify(recruiterData));
    setToken(tokenValue);
    setRecruiter(recruiterData);
  };

  const logout = () => {
    localStorage.removeItem('fixlo_recruiter_token');
    localStorage.removeItem('fixlo_recruiter_user');
    setToken(null);
    setRecruiter(null);
  };

  const isAuthenticated = !loading && !!token && !!recruiter;

  /** Authenticated fetch helper */
  const authFetch = (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <RecruiterAuthContext.Provider value={{ recruiter, token, loading, isAuthenticated, login, logout, authFetch }}>
      {children}
    </RecruiterAuthContext.Provider>
  );
}
