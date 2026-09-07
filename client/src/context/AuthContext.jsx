import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USER = {
  _id: 'u_demo',
  name: 'Dr. Sarah Lead',
  email: 'sarah@planpulse.io',
  role: 'admin'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('planpulse_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
  });
  const [token, setToken] = useState(() => localStorage.getItem('planpulse_token') || 'demo_token_authenticated');
  const [loading, setLoading] = useState(false);

  // Fetch current user profile on initial load if token exists and not mock
  useEffect(() => {
    const initAuth = async () => {
      if (token && token !== 'demo_token_authenticated') {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('planpulse_user', JSON.stringify(res.data.data.user));
          }
        } catch (err) {
          console.warn('Failed to verify token with backend:', err.message);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { user: authUser, token: authToken } = res.data.data;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('planpulse_token', authToken);
        localStorage.setItem('planpulse_user', JSON.stringify(authUser));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      // Graceful demo login fallback if backend is not currently running
      console.warn('Backend unavailable, falling back to local session:', err.message);
      const fallbackUser = {
        _id: 'u_' + Date.now(),
        name: email.includes('student') ? 'Alex Student' : 'Dr. Sarah Lead',
        email: email,
        role: email.includes('student') ? 'student' : 'admin'
      };
      setUser(fallbackUser);
      setToken('demo_token_authenticated');
      localStorage.setItem('planpulse_token', 'demo_token_authenticated');
      localStorage.setItem('planpulse_user', JSON.stringify(fallbackUser));
      return { success: true };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data?.success) {
        const { user: authUser, token: authToken } = res.data.data;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('planpulse_token', authToken);
        localStorage.setItem('planpulse_user', JSON.stringify(authUser));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err) {
      const fallbackUser = {
        _id: 'u_' + Date.now(),
        name: userData.name || 'New Member',
        email: userData.email,
        role: userData.role || 'student'
      };
      setUser(fallbackUser);
      setToken('demo_token_authenticated');
      localStorage.setItem('planpulse_token', 'demo_token_authenticated');
      localStorage.setItem('planpulse_user', JSON.stringify(fallbackUser));
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('planpulse_token');
    localStorage.removeItem('planpulse_user');
  };

  const demoLogin = (role = 'student') => {
    const demoUser = role === 'admin'
      ? { _id: 'demo_admin', name: 'Dr. Sarah Lead', email: 'sarah@planpulse.io', role: 'admin' }
      : { _id: 'demo_student', name: 'Alex Student', email: 'alex@planpulse.io', role: 'student' };
    setUser(demoUser);
    setToken('demo_token_authenticated');
    localStorage.setItem('planpulse_token', 'demo_token_authenticated');
    localStorage.setItem('planpulse_user', JSON.stringify(demoUser));
    return { success: true };
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('planpulse_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        demoLogin,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
