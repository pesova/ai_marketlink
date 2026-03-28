// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Route guard for authenticated users.
 * Used as a wrapper route element (renders <Outlet />).
 */
export const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);  
  const location = useLocation();

  if (loading) {
    // You could show a spinner here
    return null;
  }

  return user ? <Outlet /> : <Navigate to="/" state={{ from: location }} replace />;
};
