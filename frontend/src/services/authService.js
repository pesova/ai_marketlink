// src/services/authService.js
import apiClient from '../utils/apiClient';

const extractTokenAndUser = (payload) => {
  // Backend commonly responds with: { success, message, data: { token, user } }
  const token = payload?.data?.access_token ?? payload?.data?.token ?? payload?.token ?? null;
  const user = payload?.data?.user ?? payload?.user ?? null;
  return { token, user };
};

/** Merge top-level profile fields (e.g. vendorId) into the user object */
const mergeUserPayload = (payload, user) => {
  if (!user || typeof user !== 'object') return user;
  const data = payload?.data ?? payload;
  const vendorId = data?.vendorId;
  if (vendorId) return { ...user, vendorId };
  return user;
};

const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return user;
  const apiRole =
    user.role ??
    user.roleName ??
    user.roleId?.name ??
    user.role?.name ??
    'user';

  if (apiRole === 'admin') {
    return { ...user, role: 'admin' };
  }
  // Vendors are still roleId "user" in DB; backend exposes vendorId on profile/login
  if (user.vendorId) {
    return { ...user, role: 'vendor' };
  }
  return { ...user, role: apiRole };
};

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const { token, user: rawUser } = extractTokenAndUser(response.data);
  const user = mergeUserPayload(response.data, rawUser);
  if (token) localStorage.setItem('accessToken', token);
  return normalizeUser(user);
};

export const register = async (registerData) => {
  const response = await apiClient.post('/auth/register', registerData);
  const { token, user } = extractTokenAndUser(response.data);
  // Sign-up requires email verification + login for access token; do not open a session here
  if (token) localStorage.removeItem('accessToken');
  return normalizeUser(user);
};

export const onboardVendor = async (vendorData) => {
  const response = await apiClient.post('/vendors/onboard', vendorData);
  const { token, user } = extractTokenAndUser(response.data);
  // Same flow as buyer registration: verify email, then log in for token
  if (token) localStorage.removeItem('accessToken');
  return normalizeUser(user);
};

export const verifyEmail = async (email, token) => {
  const response = await apiClient.post('/auth/verify-email', { email, token });
  const { token: accessToken, user } = extractTokenAndUser(response.data);
  // Session is issued on login only; ignore any token returned by verify-email
  if (accessToken) localStorage.removeItem('accessToken');
  return normalizeUser(user);
};

export const resendVerification = async (email) => {
  const response = await apiClient.post('/auth/resend-verification', { email });
  return response.data;
};

export const logout = async () => {
  // If backend supports token revocation, call endpoint
  await apiClient.post('/auth/logout');
  localStorage.removeItem('accessToken');
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/profile');  
  const rawUser =
    response.data?.data?.user ??
    response.data?.user
  const user = mergeUserPayload(response.data, rawUser);
  return normalizeUser(user);
};
