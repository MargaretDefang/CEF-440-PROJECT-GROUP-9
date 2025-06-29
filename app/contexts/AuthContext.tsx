import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { ApiService } from '../services/ApiService';

// User interface
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'user' | 'admin' | 'moderator';
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

// Authentication context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  error: string | null;
  updateProfile: (profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  }) => Promise<User>;
  updatePassword: (old_password: string, new_password: string) => Promise<User>;
  updateAvatar: (imageUri: string) => Promise<User>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API service instance
const apiService = new ApiService();

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fallback to ensure isLoading is set to false
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        console.log('AuthContext - Fallback: Setting isLoading to false');
        setIsLoading(false);
      }
    }, 10000); // 10 second fallback

    return () => clearTimeout(fallbackTimer);
  }, [isLoading]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const authCheckPromise = (async () => {
        if (apiService.isAuthenticated()) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      })();
      
      await Promise.race([authCheckPromise, timeoutPromise]);
      
    } catch (error) {
      console.log('No valid authentication found:', error);
      // Clear any invalid tokens
      try {
        await apiService.logout();
      } catch (logoutError) {
        console.log('Logout error during auth check:', logoutError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.login({ email, password });
      
      console.log('AuthContext - Login response:', response);
      console.log('AuthContext - User object:', response.user);
      console.log('AuthContext - User type:', response.user?.user_type);
      
      if (response.user && response.token) {
        setUser(response.user);
        console.log('Login successful:', response.user.email);
        console.log('User type set to:', response.user.user_type);
        return true;
      } else {
        setError('Invalid response from server');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid credentials')) {
        setError('Invalid email or password');
      } else if (error.message.includes('User already exists')) {
        setError('User already exists. Please login instead.');
      } else if (error.message.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.register(userData);
      
      if (response.user && response.token) {
        setUser(response.user);
        console.log('Registration successful:', response.user.email);
        return true;
      } else {
        setError('Invalid response from server');
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message.includes('User already exists')) {
        setError('An account with this email already exists');
      } else if (error.message.includes('Invalid email')) {
        setError('Please enter a valid email address');
      } else if (error.message.includes('Password')) {
        setError('Password must be at least 6 characters long');
      } else if (error.message.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
      setError(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      await logout();
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const updateProfile = async (profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await apiService.updateProfile(profileData);
      if (response.user) {
        setUser(response.user);
        return response.user;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (old_password: string, new_password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.updatePassword(old_password, new_password);
      if (response.user) {
        setUser(response.user);
        return response.user;
      } else {
        throw new Error(response.message || 'Password update failed');
      }
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (imageUri: string) => {
    try {
      setIsLoading(true);
      console.log('AuthContext - Starting avatar upload for:', imageUri);
      
      const response = await apiService.uploadAvatar(imageUri);
      console.log('AuthContext - Avatar upload response:', response);
      console.log('AuthContext - New avatar_url:', response.user?.avatar_url);
      
      if (response.user) {
        setUser(response.user);
        console.log('AuthContext - User updated with new avatar:', response.user.avatar_url);
        return response.user;
      } else {
        throw new Error('Failed to update avatar');
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    clearError,
    error,
    updateProfile,
    updatePassword,
    updateAvatar,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 