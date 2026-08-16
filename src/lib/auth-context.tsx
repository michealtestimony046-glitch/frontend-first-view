/**
 * Authentication Context
 * Manages user authentication state across the entire application.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, getAuthToken, clearAuthToken } from './api-client';

const AUTH_EVENT = 'matrix-qa-auth-changed';

interface AuthContextType {
  user: Awaited<ReturnType<typeof authApi.getCurrentUser>> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Awaited<ReturnType<typeof authApi.getCurrentUser>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        return;
      }
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      clearAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        await authApi.ping();
      } catch (error) {
        console.warn('Initial server ping failed:', error);
      }
      await refreshUser();
    };

    void initApp();

    const handleAuthChanged = () => {
      void refreshUser();
    };
    window.addEventListener(AUTH_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_EVENT, handleAuthChanged);
  }, []);

  const logout = () => clearAuthToken();

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
