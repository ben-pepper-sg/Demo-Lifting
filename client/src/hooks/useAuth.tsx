import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  maxBench: number | null;
  maxOHP: number | null;
  maxSquat: number | null;
  maxDeadlift: number | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateMaxLifts: (lifts: MaxLifts) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{resetToken?: string, resetUrl?: string}>;
  resetPassword: (token: string, password: string) => Promise<void>;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type MaxLifts = {
  maxBench?: number;
  maxOHP?: number;
  maxSquat?: number;
  maxDeadlift?: number;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configure axios with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
          setUser(response.data.user);
        } catch (err) {
          console.error('Auth check failed:', err);
          logout(); // Clear invalid token
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email,
        password,
      });
      
      setUser(response.data.user);
      setToken(response.data.token);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed due to unknown error';
      setError(errorMessage);
      
      // Create a more descriptive error for debugging
      const enhancedError = new Error(errorMessage);
      enhancedError.name = 'LoginError';
      (enhancedError as any).originalError = err;
      (enhancedError as any).statusCode = err.response?.status;
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, userData);
      
      setUser(response.data.user);
      setToken(response.data.token);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed due to unknown error';
      setError(errorMessage);
      
      // Create a more descriptive error for debugging
      const enhancedError = new Error(errorMessage);
      enhancedError.name = 'RegistrationError';
      (enhancedError as any).originalError = err;
      (enhancedError as any).statusCode = err.response?.status;
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updateMaxLifts = async (lifts: MaxLifts) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/workouts/max-lifts`, lifts);
      
      setUser(response.data.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update max lifts due to unknown error';
      setError(errorMessage);
      
      // Create a more descriptive error for debugging
      const enhancedError = new Error(errorMessage);
      enhancedError.name = 'UpdateMaxLiftsError';
      (enhancedError as any).originalError = err;
      (enhancedError as any).statusCode = err.response?.status;
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { email });
      
      return {
        resetToken: response.data.resetToken,
        resetUrl: response.data.resetUrl
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to request password reset due to unknown error';
      setError(errorMessage);
      
      // Create a more descriptive error for debugging
      const enhancedError = new Error(errorMessage);
      enhancedError.name = 'PasswordResetRequestError';
      (enhancedError as any).originalError = err;
      (enhancedError as any).statusCode = err.response?.status;
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, { token, password });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to reset password due to unknown error';
      setError(errorMessage);
      
      // Create a more descriptive error for debugging
      const enhancedError = new Error(errorMessage);
      enhancedError.name = 'PasswordResetError';
      (enhancedError as any).originalError = err;
      (enhancedError as any).statusCode = err.response?.status;
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateMaxLifts,
    requestPasswordReset,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};