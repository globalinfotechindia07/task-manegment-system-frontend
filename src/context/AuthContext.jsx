import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Centralized role-to-dashboard path resolver
export const getRoleDashboard = (user) => {
  if (!user) return '/login';
  if (user.requiresPasswordChange) return '/force-password-change';

  const role = (user.role || '').toLowerCase();
  if (role === 'super admin') {
    return '/super-admin/dashboard';
  } else if (role === 'hr manager' || role === 'hr' || role.includes('human resource')) {
    return '/hr/dashboard';
  } else if (
    role === 'team head' ||
    role === 'team lead' ||
    role.includes('project lead') ||
    role.includes('lead')
  ) {
    return '/team-lead/dashboard';
  } else if (role === 'user' || role === 'employee' || role.includes('staff')) {
    return '/user/dashboard';
  } else {
    // Admin, CTO, or default office management
    return '/admin/dashboard';
  }
};

export const AuthProvider = ({ children }) => {
  // Synchronous initialization from localStorage for instantaneous authentication without flicker
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const token = parsed?.token || localStorage.getItem('token');
        if (parsed && token) {
          return { ...parsed, token };
        }
      }
    } catch (e) {
      console.error('Failed to parse stored user from localStorage:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      setupPushNotifications(user._id);

      // Background silent revalidation to keep user profile and permissions up to date
      api.get('/auth/profile')
        .then(({ data }) => {
          if (data && data._id) {
            setUser((prev) => {
              if (!prev) return null;
              const merged = { ...prev, ...data };
              localStorage.setItem('user', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch((err) => {
          // If network is offline or transient error, keep cached session
          console.debug('Background profile sync note:', err.message);
        });
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const setupPushNotifications = async (userId) => {
    if (!userId) return;
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return; // Push not supported
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const { data } = await api.get('/push/vapidPublicKey');
      const publicVapidKey = data.publicKey;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      if (subscription) {
        await api.post('/push/subscribe', {
          userId,
          subscription
        });
      }
    } catch (error) {
      console.warn('Push notifications setup skipped or failed:', error.message || error);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data);
      // Persist session robustly
      localStorage.setItem('user', JSON.stringify(data));
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      toast.success('Logged in successfully');
      setupPushNotifications(data._id);
      return { success: true, user: data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out');
  };

  const updateUser = (userData) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      if (updated.token) {
        localStorage.setItem('token', updated.token);
      }
      return updated;
    });
  };

  const setAuthSession = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData?.token) {
      localStorage.setItem('token', userData.token);
    }
    if (userData?._id) {
      setupPushNotifications(userData._id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, setAuthSession, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
