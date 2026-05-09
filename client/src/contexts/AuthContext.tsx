import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as loginUserService } from '@/lib/storage';
import { UserData } from '@/lib/types';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: UserData | null;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUsername = localStorage.getItem('current_user');
    if (storedUsername) {
      login(storedUsername);
    }
  }, []);

  const login = (name: string) => {
    const userData = loginUserService(name);
    setUser(userData);
    setUsername(name);
    localStorage.setItem('current_user', name);
  };

  const logout = () => {
    setUser(null);
    setUsername(null);
    localStorage.removeItem('current_user');
    setLocation('/login');
  };

  const refreshUser = () => {
    if (username) {
      const userData = loginUserService(username);
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, username, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
