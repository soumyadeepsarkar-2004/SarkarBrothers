
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContextType, AuthUser, UserRole } from '../types';
import { api } from '../services/api';
import {
  isFirebaseEnabled,
  signInWithGoogle,
  firebaseSignOut,
  onFirebaseAuthChanged,
  FirebaseUser,
} from '../services/firebase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to build AuthUser from Firebase user
const buildAuthUserFromFirebase = (firebaseUser: FirebaseUser): AuthUser => {
  const isAdmin = firebaseUser.email?.toLowerCase().includes('admin') || false;
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    phone: firebaseUser.phoneNumber || '',
    avatar: firebaseUser.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || 'U')}&backgroundColor=f4c025,8a8060&backgroundType=solid,gradientLinear&radius=50`,
    bio: '',
    preferences: { newsletter: false, smsNotifications: false },
    role: isAdmin ? 'admin' : 'user',
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseEnabled = isFirebaseEnabled();

  // Load auth state on mount
  useEffect(() => {
    if (firebaseEnabled) {
      const unsubscribe = onFirebaseAuthChanged((firebaseUser) => {
        if (firebaseUser) {
          const authUser = buildAuthUserFromFirebase(firebaseUser);
          setIsAuthenticated(true);
          setUser(authUser);
          setRole(authUser.role);
          sessionStorage.setItem('currentUser', JSON.stringify(authUser));
          sessionStorage.setItem('authToken', `firebase-${firebaseUser.uid}`);
        } else {
          // Fallback to session storage (demo login)
          const stored = sessionStorage.getItem('currentUser');
          if (stored) {
            try {
              const parsedUser: AuthUser = JSON.parse(stored);
              setIsAuthenticated(true);
              setUser(parsedUser);
              setRole(parsedUser.role);
            } catch {
              sessionStorage.clear();
            }
          } else {
            setIsAuthenticated(false);
            setUser(null);
            setRole(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // No Firebase - session storage only
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
        sessionStorage.clear();
      } finally {
        setLoading(false);
      }
    }
  }, [firebaseEnabled]);

  // Demo email+password login (always available)
  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      const authResult = await api.user.login(email, pass);
      if (authResult && authResult.user) {
        const loggedInUser = authResult.user;
        setIsAuthenticated(true);
        setUser(loggedInUser);
        setRole(loggedInUser.role);
        sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        sessionStorage.setItem('authToken', authResult.token);
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

  // Google Sign-In
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!firebaseEnabled) {
      console.warn('Firebase is not configured. Google Sign-In is unavailable.');
      return false;
    }
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        // onAuthStateChanged will handle setting user state
        return true;
      }
      return false;
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [firebaseEnabled]);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    sessionStorage.clear();
    if (firebaseEnabled) {
      try {
        await firebaseSignOut();
      } catch (error) {
        console.error('Firebase sign-out error:', error);
      }
    }
  }, [firebaseEnabled]);

  const contextValue = React.useMemo(() => ({
    isAuthenticated,
    user,
    role,
    login,
    loginWithGoogle,
    logout,
    loading,
    firebaseEnabled,
  }), [isAuthenticated, user, role, login, loginWithGoogle, logout, loading, firebaseEnabled]);

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
