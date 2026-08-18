/**
 * Authentication Context
 * Manages user authentication state across the entire application.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiRequestError, authApi, getAuthToken, clearAuthToken, clearClientWorkspaceContext } from './api-client';

const AUTH_EVENT = 'matrix-qa-auth-changed';

interface AuthContextType {
  user: Awaited<ReturnType<typeof authApi.getCurrentUser>> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Awaited<ReturnType<typeof authApi.getCurrentUser>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshInFlight = useRef(false);

  const refreshUser = async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    const blockAppWhileLoading = !user;
    if (blockAppWhileLoading) setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        clearClientWorkspaceContext();
        setUser(null);
        return;
      }
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      const invalidSession = error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
      if (invalidSession) {
        clearAuthToken();
        setUser(null);
      }
      // Keep the existing user/session during transient network, timeout, 5xx, and parser failures.
    } finally {
      refreshInFlight.current = false;
      if (blockAppWhileLoading) setIsLoading(false);
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
  const logoutAll = async () => {
    try {
      await authApi.logoutAll();
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      clearAuthToken();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout, logoutAll, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
