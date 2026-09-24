import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('insurmanage_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app startup using saved token & /api/auth/me
  const initAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('insurmanage_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setToken(savedToken);
    } catch (error) {
      console.error("Auth initialization failed:", error);
      localStorage.removeItem('insurmanage_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Functional Login
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem('insurmanage_token', access_token);
      setToken(access_token);
      setUser(userData);
      setIsLoading(false);
      return userData;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Functional Logout
  const logout = () => {
    localStorage.removeItem('insurmanage_token');
    setToken(null);
    setUser(null);
  };

  // Refresh User State
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("User refresh failed:", error);
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
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
