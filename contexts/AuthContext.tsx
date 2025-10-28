import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import apiClient from '../services/apiClient';
import { User, AuthState, LoginCredentials } from '../types/api';

// Authentication Context Interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkBiometricAuth: () => Promise<boolean>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: boolean;
  refreshAuth: () => Promise<void>;
  showIntro: boolean;
  completeIntro: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Authentication Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Complete intro and proceed to auth
  const completeIntro = () => {
    console.log('🎬 WillwareTech intro completed, transitioning to app...');
    setShowIntro(false);
  };

  // Initialize authentication state on app start
  useEffect(() => {
    console.log('🔄 Starting AuthContext initialization...');
    initializeAuthFast();
  }, []);

  const initializeAuthFast = async () => {
    try {
      // Import authOptimizer dynamically to avoid circular dependencies
      const { AuthOptimizer } = await import('../utils/authOptimizer');
      const authOptimizer = AuthOptimizer.getInstance();
      
      // Get fast auth state (from cache if available) in background
      const fastAuth = await authOptimizer.getFastAuthState();
      
      // Set initial auth state (intro will handle timing)
      setAuthState({
        isAuthenticated: fastAuth.isAuthenticated,
        user: fastAuth.user,
        token: fastAuth.token,
        isLoading: false, // Stop loading immediately for better UX
        error: null,
      });

      // If we should verify in background, do it without blocking UI
      if (fastAuth.shouldVerify && fastAuth.token) {
        verifyAuthInBackground(fastAuth.token, authOptimizer);
      }

      // Check biometric availability (non-blocking)
      checkBiometricSupport();
    } catch (error) {
      console.error('Fast auth initialization failed:', error);
      // Fallback to slow method
      setShowIntro(false);
      await initializeAuthSlow();
    }
  };

  const verifyAuthInBackground = async (token: string, authOptimizer: any) => {
    try {
      const isValid = await authOptimizer.backgroundAuthVerification(token);
      
      if (!isValid) {
        // Token is invalid, logout user
        console.log('Token verification failed, logging out user');
        await logout();
      } else {
        // Update cache with fresh timestamp
        if (authState.user) {
          await authOptimizer.cacheAuthData(authState.user, token);
        }
      }
    } catch (error) {
      console.error('Background auth verification failed:', error);
      // Don't logout on network errors, keep user logged in
    }
  };

  const initializeAuthSlow = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const isAuth = await apiClient.isAuthenticated();
      if (isAuth) {
        const userData = await apiClient.getStoredUser();
        const token = await apiClient.getStoredToken();
        
        if (userData && token) {
          // Convert to User interface format
          const user: User = {
            id: userData._id,
            name: userData.employeeName,
            email: userData.employeeEmail,
            role: 'employee',
            department: userData.department,
            designation: userData.designation,
            workLocation: userData.workLocation,
          };

          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error('Invalid stored data');
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  };

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricEnabled = hasHardware && isEnrolled;
      
      setIsBiometricEnabled(biometricEnabled);
    } catch (error) {
      console.error('Biometric check failed:', error);
      setIsBiometricEnabled(false);
    }
  };

  const login = async (credentials: LoginCredentials, rememberMe: boolean = false) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('AuthContext: Starting login process');
      const response = await apiClient.login(credentials);
      console.log('AuthContext: Login response received');
      
      // Convert to User interface format
      const user: User = {
        id: response.data._id,
        name: response.data.employeeName,
        email: response.data.employeeEmail,
        role: 'employee',
        department: response.data.department,
        designation: response.data.designation,
        workLocation: response.data.workLocation,
      };

      console.log('AuthContext: Setting authenticated state');
      setAuthState({
        isAuthenticated: true,
        user,
        token: response.token.tokens,
        isLoading: false,
        error: null,
      });

      // Cache auth data for fast loading next time
      try {
        const { AuthOptimizer } = await import('../utils/authOptimizer');
        const authOptimizer = AuthOptimizer.getInstance();
        await authOptimizer.cacheAuthData(user, response.token.tokens);
        console.log('Auth data cached successfully');
      } catch (cacheError) {
        console.error('Failed to cache auth data:', cacheError);
        // Don't fail login if caching fails
      }

      // Store remember me preference
      if (rememberMe) {
        // Additional logic for remember me can be added here
        console.log('Remember me enabled');
      }
      
      console.log('AuthContext: Login completed successfully');
    } catch (error) {
      console.error('AuthContext: Login failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await apiClient.logout();
      
      // Clear auth cache
      try {
        const { AuthOptimizer } = await import('../utils/authOptimizer');
        const authOptimizer = AuthOptimizer.getInstance();
        await authOptimizer.clearAuthCache();
        console.log('Auth cache cleared');
      } catch (cacheError) {
        console.error('Failed to clear auth cache:', cacheError);
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state and cache
      try {
        const { AuthOptimizer } = await import('../utils/authOptimizer');
        const authOptimizer = AuthOptimizer.getInstance();
        await authOptimizer.clearAuthCache();
      } catch (cacheError) {
        console.error('Failed to clear auth cache:', cacheError);
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const checkBiometricAuth = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access WillwareTech',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  };

  const enableBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        setIsBiometricEnabled(true);
        // Store preference in secure storage
        console.log('Biometric authentication enabled');
      } else {
        throw new Error('Biometric authentication not available');
      }
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      throw error;
    }
  };

  const disableBiometric = async () => {
    try {
      setIsBiometricEnabled(false);
      // Remove preference from secure storage
      console.log('Biometric authentication disabled');
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      throw error;
    }
  };

  const refreshAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (authState.user) {
        // Refresh user data from API
        const userData = await apiClient.getStoredUser();
        const token = await apiClient.getStoredToken();
        
        if (userData && token) {
          const user: User = {
            id: userData._id,
            name: userData.employeeName,
            email: userData.employeeEmail,
            role: 'employee',
            department: userData.department,
            designation: userData.designation,
            workLocation: userData.workLocation,
          };

          setAuthState(prev => ({
            ...prev,
            user,
            token,
            isLoading: false,
          }));
        }
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh authentication',
      }));
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkBiometricAuth,
    enableBiometric,
    disableBiometric,
    isBiometricEnabled,
    refreshAuth,
    showIntro,
    completeIntro,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;