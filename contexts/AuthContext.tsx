
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContextType, AuthUser, UserProfile, UserRole } from '../types';
import { api } from '../services/api'; // Assuming api service has a mock login

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from session storage on initial render
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
        setRole(parsedUser.role);
      }
    } catch (error) {
      console.error("Failed to load user from session storage:", error);
      sessionStorage.clear(); // Clear potentially corrupted storage
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      const authResult = await api.user.login(email, pass); // Call mock API login
      if (authResult && authResult.user) {
        const loggedInUser = authResult.user;
        setIsAuthenticated(true);
        setUser(loggedInUser);
        setRole(loggedInUser.role);
        sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        sessionStorage.setItem('authToken', authResult.token); // Store mock token
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    sessionStorage.clear(); // Clear all session data
  }, []);

  const contextValue = React.useMemo(() => ({
    isAuthenticated,
    user,
    role,
    login,
    logout,
    loading,
  }), [isAuthenticated, user, role, login, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
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
