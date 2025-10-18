'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import apiClient from '@/lib/api/client';

interface User {
  id: string;
  email?: string;
  displayName?: string;
  walletAddress?: string;
  bio?: string;
  avatar?: string;
  twitterHandle?: string;
  discordHandle?: string;
  telegramHandle?: string;
  totalTrades?: number;
  totalVolume?: number;
  winRate?: number;
  reputation?: number;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  walletAddress?: string;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  walletConnect: (walletAddress: string, signature: string, message: string) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for local auth state (without context)
export const useAuthState = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      if (apiClient.isAuthenticated()) {
        try {
          const response = await apiClient.getProfile();
          if (response.success && response.data) {
            setState(prev => ({
              ...prev,
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            }));
          } else {
            // Token might be invalid, clear it
            apiClient.clearToken();
            setState(prev => ({
              ...prev,
              isLoading: false,
            }));
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          apiClient.clearToken();
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Authentication failed',
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiClient.register({ email, password, displayName });
      
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  };

  const walletConnect = async (walletAddress: string, signature: string, message: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiClient.walletAuth({
        walletAddress,
        signature,
        message,
      });
      
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || 'Wallet authentication failed');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Wallet authentication failed',
      }));
      throw error;
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const updateProfile = async (profileData: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiClient.updateProfile(profileData);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data.user,
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Profile update failed',
      }));
      throw error;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Helper method for wallet login with mock implementation
  const loginWithWallet = async () => {
    // Mock wallet connection - in real implementation, this would:
    // 1. Check if wallet is installed
    // 2. Request account access
    // 3. Get wallet address
    // 4. Sign a message
    // 5. Call walletConnect with signature
    
    const mockWalletAddress = '0x742d35Cc6638C0532C7af3e8a8D0b39B8b1d3e30';
    const mockSignature = 'mock_signature';
    const mockMessage = 'Login to AsterFun';
    
    await walletConnect(mockWalletAddress, mockSignature, mockMessage);
  };

  return {
    ...state,
    walletAddress: state.user?.walletAddress,
    login,
    register,
    walletConnect,
    loginWithWallet,
    logout,
    updateProfile,
    clearError,
  };
};

// AuthProvider component (to be used in app layout)
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthState();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuthState;
export type { User, AuthState, AuthActions };