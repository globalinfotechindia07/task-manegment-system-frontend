import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config) => {
    try {
      let token = null;
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.token) {
          token = user.token;
        }
      }
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to attach auth token in axios:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses: only clear session if a protected route explicitly rejected the active token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    const isLoginEndpoint = originalRequest?.url?.includes('/auth/login');
    const isPublicEndpoint = originalRequest?.url?.includes('/site-content/public') || originalRequest?.url?.includes('/plans');

    if (error.response && error.response.status === 401 && !isLoginEndpoint && !isPublicEndpoint) {
      const hadAuthHeader = Boolean(originalRequest?.headers?.Authorization);
      if (hadAuthHeader) {
        console.warn('Session expired or unauthorized token detected on protected route.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
