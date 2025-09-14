import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Verify token with backend
      axios.post(`${process.env.REACT_APP_API_URL || 'https://dream-interpretation-production.up.railway.app'}/api/auth/verify`, { token: storedToken })
        .then(response => {
          if (!isDestroyed) {
            if (response.data.valid) {
              setToken(storedToken);
              setUser(response.data.user);
              axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } else {
              localStorage.removeItem('token');
            }
          }
        })
        .catch(() => {
          if (!isDestroyed) {
            localStorage.removeItem('token');
          }
        })
        .finally(() => {
          if (!isDestroyed) {
            setLoading(false);
          }
        });
    } else {
      if (!isDestroyed) {
        setLoading(false);
      }
    }

    // Cleanup function
    return () => {
      setIsDestroyed(true);
    };
  }, [isDestroyed]);

  const login = async (email, password) => {
    if (isDestroyed) return { success: false, error: 'Component destroyed' };
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'https://dream-interpretation-production.up.railway.app'}/api/auth/login`, {
        email,
        password
      });

      if (isDestroyed) return { success: false, error: 'Component destroyed' };

      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      if (!isDestroyed) {
        setToken(newToken);
        setUser(newUser);
        setLoading(false);
      }

      return { success: true };
    } catch (err) {
      if (isDestroyed) return { success: false, error: 'Component destroyed' };
      
      const errorMessage = err.response?.data?.error || '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      setLoading(false);
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, username) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'https://dream-interpretation-production.up.railway.app'}/api/auth/register`, {
        email,
        password,
        username
      }, {
        headers: {
          'X-Session-ID': localStorage.getItem('sessionId')
        }
      });

      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(newUser);
      setLoading(false);

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Clear localStorage first
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear state safely only if component is not destroyed
      if (!isDestroyed) {
        setToken(null);
        setUser(null);
        setError(null);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Logout error:', error);
      return Promise.reject(error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
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