import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in on page load
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Set the default header for all requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch current user data
          const response = await api.get('/api/users/me/');
          setCurrentUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Auth verification failed:", err);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await api.post('/api/token', { username, password });
      const { access_token } = response.data;
      
      // Store token and set default header
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Fetch user data
      const userResponse = await api.get('/api/users/me/');
      setCurrentUser(userResponse.data);
      setIsAuthenticated(true);
      
      return userResponse.data;
    } catch (err) {
      setError('Invalid username or password');
      throw new Error('Login failed');
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      // Register user
      const response = await api.post('/api/users/', userData);
      
      // Automatically log in after registration
      return await login(userData.username, userData.password);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Registration failed');
      } else {
        setError('Registration failed');
      }
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};