/**
 * Authentication Context
 * Manages user authentication state across the entire application
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, getAuthToken, clearAuthToken, CurrentUserResponse } from './api-client';

interface AuthContextType {
  user: CurrentUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // 1. Send a "Ping" to the server (requested by dev)
      try {
        await authApi.ping();
        console.log('Server is reachable');
      } catch (error) {
        console.warn('Initial server ping failed:', error);
      }

      // 2. Check authentication
      const token = getAuthToken();
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          clearAuthToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initApp();
  }, []);

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
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
