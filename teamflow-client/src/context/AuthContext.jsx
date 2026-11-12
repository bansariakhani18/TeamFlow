import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('teamflow_token') || localStorage.getItem('token') || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken =
        localStorage.getItem('teamflow_token') || localStorage.getItem('token');

      if (!storedToken) {
        if (isMounted) {
          setLoading(false);
          setUser(null);
        }
        return;
      }

      try {
        const response = await axiosClient.get('/auth/me');
        if (isMounted) {
          // Response shape: { success: true, data: { user: ... } }
          const userData = response.data?.data?.user || response.data?.user || response.data?.data;
          setUser(userData);
          setToken(storedToken);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          localStorage.removeItem('teamflow_token');
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
          setError(err.response?.data?.message || 'Session expired');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data?.data || {};

      localStorage.setItem('teamflow_token', authToken);
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data?.error || 'Login failed. Please check your credentials.';
      const fieldErrors = err.response?.data?.errors || [];
      setError(message);
      return { success: false, message, errors: fieldErrors };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.post('/auth/register', { name, email, password });
      const { user: userData, token: authToken } = response.data?.data || {};

      if (authToken) {
        localStorage.setItem('teamflow_token', authToken);
        localStorage.setItem('token', authToken);
        setToken(authToken);
        setUser(userData);
      }
      return { success: true, user: userData, token: authToken };
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      const fieldErrors = err.response?.data?.errors || [];
      setError(message);
      return { success: false, message, errors: fieldErrors };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('teamflow_token');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
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

export default AuthContext;
