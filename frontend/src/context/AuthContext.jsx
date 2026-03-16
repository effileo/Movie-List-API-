import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRoutes } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiRoutes.auth.me();
      setUser(data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const res = await apiRoutes.auth.login({ email, password });
    if (res.token) localStorage.setItem('token', res.token);
    setUser(res.data);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await apiRoutes.auth.register({ name, email, password });
    if (res.token) localStorage.setItem('token', res.token);
    setUser(res.data);
    return res;
  };

  const logout = async () => {
    try {
      await apiRoutes.auth.logout();
    } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
