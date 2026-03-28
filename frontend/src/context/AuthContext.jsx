// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount (if token exists)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
          const fetchedUser = await authService.fetchCurrentUser();
          setUser(fetchedUser);
        }
      } catch (err) {
        console.error('Auth init failed', err);
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    await authService.login(email, password);
    // Profile includes vendorId for vendors; login payload may omit it
    const loggedInUser = await authService.fetchCurrentUser();
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (data) => {
    const newUser = await authService.register(data);
    // No auth session until email verified + login (see AuthModal flow)
    return newUser;
  }, []);

  const onboardVendor = useCallback(async (data) => {
    const vendorUser = await authService.onboardVendor(data);
    // Same as buyer: verify email from modal, then login
    return vendorUser;
  }, []);

  const verifyEmail = useCallback(async (email, token) => {
    const verifiedUser = await authService.verifyEmail(email, token);
    // No session until explicit login (AuthModal proceeds to login tab)
    return verifiedUser;
  }, []);

  const resendVerification = useCallback(async (email) => {
    return authService.resendVerification(email);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, onboardVendor, verifyEmail, resendVerification, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
