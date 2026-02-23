import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (email) => {
    try {
      setError(null);
      const response = await authAPI.sendOTP(email);
      return response.data;
    } catch (err) {
      let message = 'Failed to send OTP';
      if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
        message = 'Request timed out. Check your internet and try again.';
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || err.message === 'Network request failed') {
        message = 'Cannot reach server. Ensure phone and backend are on same Wi-Fi.';
      } else if ((err.message && err.message.toLowerCase().includes('abort')) || err.message === 'Request aborted') {
        message = 'Request was cancelled. Please try again.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message && err.message.trim()) {
        message = err.message;
      }
      console.warn('Send OTP error:', { message, code: err.code, err: String(err) });
      setError(message);
      throw new Error(message);
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      setError(null);
      const response = await authAPI.verifyOTP(email, otp);
      const { token: newToken, user: newUser } = response.data;
      
      // Store auth data
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to verify OTP';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await userAPI.getProfile();
      const updatedUser = response.data;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    sendOTP,
    verifyOTP,
    logout,
    refreshUser,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
