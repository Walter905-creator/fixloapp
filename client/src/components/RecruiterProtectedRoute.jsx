import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';

export default function RecruiterProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useRecruiterAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-xl py-8 text-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/recruiter/login" state={{ from: location }} replace />;
  }

  return children;
}
