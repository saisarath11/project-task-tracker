import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('taskpulse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('taskpulse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem('taskpulse_user', JSON.stringify(freshUser));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('taskpulse_token');
          localStorage.removeItem('taskpulse_user');
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (data: { email: string; password: string }) => {
    const res = await authApi.login(data);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('taskpulse_token', res.token);
    localStorage.setItem('taskpulse_user', JSON.stringify(res.user));
  };

  const register = async (data: { name: string; email: string; password: string; confirmPassword: string }) => {
    const res = await authApi.register(data);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('taskpulse_token', res.token);
    localStorage.setItem('taskpulse_user', JSON.stringify(res.user));
  };

  const logout = () => {
    try {
      authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('taskpulse_token');
    localStorage.removeItem('taskpulse_user');
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const updated = await usersApi.updateProfile(data);
    setUser(updated);
    localStorage.setItem('taskpulse_user', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    if (token) {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      localStorage.setItem('taskpulse_user', JSON.stringify(freshUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
