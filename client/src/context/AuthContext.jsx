import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check and restore session on application load or refresh
  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await authAPI.getMe();
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 Unauthorized or no active session - normal for visitors
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Register handler
  const register = async (formData) => {
    setError(null);
    try {
      const res = await authAPI.register(formData);
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student'
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
