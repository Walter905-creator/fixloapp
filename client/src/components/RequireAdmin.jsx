import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RequireAdmin Component
 * 
 * Protects admin-only routes from public access:
 * - If not authenticated: redirect to /pro-sign-in
 * - If not admin: redirect to /
 * - If admin: render children
 * 
 * This ensures admin routes are NEVER visible to non-admins.
 */
export default function RequireAdmin({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="container-xl py-8 text-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // Redirect non-authenticated users to sign in
  if (!isAuthenticated || !user) {
    return <Navigate to="/pro-sign-in" replace />;
  }

  // Redirect non-admin users to home (no hints that admin exists)
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and is admin - render the protected content
  return children;
}
