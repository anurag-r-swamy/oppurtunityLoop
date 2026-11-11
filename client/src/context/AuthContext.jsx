import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publicMeta, setPublicMeta] = useState({
    categories: [],
    settings: { teamMatchingEnabled: true, maintenanceBanner: '' }
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data?.data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get('/meta/public');
      if (res.data?.data) {
        setPublicMeta(res.data.data);
      }
    } catch {
      // Fall back silently to static defaults
    }
  }, []);

  useEffect(() => {
    Promise.resolve(api.get('/auth/csrf-token')).catch(() => {});
    loadMeta();
    refreshUser();
  }, [loadMeta, refreshUser]);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const loggedInUser = res.data?.data?.user || null;
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const createdUser = res.data?.data?.user || null;
    setUser(createdUser);
    return createdUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        publicMeta,
        refreshUser,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
