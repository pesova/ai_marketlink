import axios from 'axios';
// https://api-marketlink.pesovatech.xyz/api

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api-marketlink.pesovatech.xyz/api',
  withCredentials: true // allow httpOnly cookies if backend sets them
});

// Request interceptor: attach JWT from localStorage if present
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// Response interceptor: handle auth errors globally
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Unauthorized – clear auth state
      localStorage.removeItem('accessToken');
      // Optionally, broadcast logout event (handled by AuthContext)
    }
    return Promise.reject(error);
  }
);

export default apiClient;
