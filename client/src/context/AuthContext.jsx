import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const token = localStorage.getItem('fixlo_token');
        const userDataStr = localStorage.getItem('fixlo_user');
        
        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid data
        localStorage.removeItem('fixlo_token');
        localStorage.removeItem('fixlo_user');
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = (token, userData) => {
    try {
      localStorage.setItem('fixlo_token', token);
      localStorage.setItem('fixlo_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth state:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('fixlo_token');
    localStorage.removeItem('fixlo_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
