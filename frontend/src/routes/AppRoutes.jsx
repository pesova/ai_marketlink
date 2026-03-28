// src/routes/AppRoutes.jsx
import React, { Suspense, lazy, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { RoleBasedRoute } from '../components/RoleBasedRoute';
import { LoadingSpinner } from '../components/LoadingSpinner';
import LandingPage from '../pages/LandingPage'
import { AuthContext } from '../context/AuthContext';


// Lazy load pages for code splitting
const Chat = lazy(() => import('../pages/ChatPage.jsx'));
const Checkout = lazy(() => import('../pages/CheckoutPage.jsx'));
const Orders = lazy(() => import('../pages/Orders.jsx'));
const VendorDashboard = lazy(() => import('../pages/VendorDashboard.jsx'));
const VendorProfile = lazy(() => import('../pages/VendorProfile.jsx'));
const AdminPanel = lazy(() => import('../pages/AdminPanel.jsx'));

const RootRoute = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingSpinner />;

  if (user) {
    if (user.role === "vendor") {
      return <Navigate to="/vendor/dashboard" replace />;
    }
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/chat" replace />;
  }

  return <LandingPage />;
};

export const AppRoutes = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RootRoute />}></Route>

        {/* Protected routes (any authenticated user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />}></Route>
          <Route path="/checkout" element={<Checkout />}></Route>
          <Route path="/orders" element={<Orders />}></Route>
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["vendor", "admin"]} />}>
          <Route path="/vendor/dashboard" element={<VendorDashboard />}></Route>
          <Route path="/vendor/profile" element={<VendorProfile />} />
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
