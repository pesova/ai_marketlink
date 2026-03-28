// src/components/RoleBasedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Restricts access to users with a specific role (e.g., 'vendor', 'admin').
 */
export const RoleBasedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null; // could be a spinner

  const hasAccess = user && allowedRoles.includes(user.role);

  return hasAccess ? <Outlet /> : <Navigate to="/" replace state={{ from: location }} />;
};
