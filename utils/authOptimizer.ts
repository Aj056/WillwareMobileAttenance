import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types/api';

interface AuthCache {
  user: User;
  token: string;
  timestamp: number;
  isValid: boolean;
}

export class AuthOptimizer {
  private static instance: AuthOptimizer;
  private readonly AUTH_CACHE_KEY = 'willware_auth_cache';
  private readonly CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): AuthOptimizer {
    if (!AuthOptimizer.instance) {
      AuthOptimizer.instance = new AuthOptimizer();
    }
    return AuthOptimizer.instance;
  }

  /**
   * Fast authentication check using cached data
   * Returns immediately with cached auth state without API calls
   */
  async getFastAuthState(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    shouldVerify: boolean;
  }> {
    try {
      // Try to get cached auth data
      const cached = await this.getCachedAuth();
      
      if (cached && this.isCacheValid(cached)) {
        return {
          isAuthenticated: true,
          user: cached.user,
          token: cached.token,
          shouldVerify: false // Cache is fresh, no need to verify
        };
      }

      // Check if we have stored credentials (even if cache is stale)
      const token = await this.getStoredToken();
      const userData = await this.getStoredUser();

      if (token && userData) {
        const user: User = {
          id: userData._id,
          name: userData.employeeName,
          email: userData.employeeEmail,
          role: 'employee',
          department: userData.department,
          designation: userData.designation,
          workLocation: userData.workLocation,
        };

        return {
          isAuthenticated: true,
          user,
          token,
          shouldVerify: true // Need to verify in background
        };
      }

      return {
        isAuthenticated: false,
        user: null,
        token: null,
        shouldVerify: false
      };
    } catch (error) {
      console.error('Fast auth check failed:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        shouldVerify: false
      };
    }
  }

  /**
   * Cache auth data for fast retrieval
   */
  async cacheAuthData(user: User, token: string): Promise<void> {
    try {
      const authCache: AuthCache = {
        user,
        token,
        timestamp: Date.now(),
        isValid: true
      };

      await AsyncStorage.setItem(this.AUTH_CACHE_KEY, JSON.stringify(authCache));
    } catch (error) {
      console.error('Failed to cache auth data:', error);
    }
  }

  /**
   * Invalidate auth cache
   */
  async clearAuthCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.AUTH_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear auth cache:', error);
    }
  }

  /**
   * Background auth verification
   * Verifies token validity without blocking UI
   */
  async backgroundAuthVerification(token: string): Promise<boolean> {
    try {
      // Try to make a simple authenticated request to verify token
      // Using the correct /view endpoint
      const userData = await this.getStoredUser();
      if (!userData) return false;

      const response = await fetch(`https://attendance-three-lemon.vercel.app/view/${userData._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return response.ok;
    } catch (error) {
      console.error('Background auth verification failed:', error);
      // On network errors, assume token is still valid to avoid unnecessary logouts
      return true;
    }
  }

  private async getCachedAuth(): Promise<AuthCache | null> {
    try {
      const cached = await AsyncStorage.getItem(this.AUTH_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached auth:', error);
      return null;
    }
  }

  private isCacheValid(cache: AuthCache): boolean {
    const age = Date.now() - cache.timestamp;
    return cache.isValid && age < this.CACHE_VALIDITY_MS;
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      // Try SecureStore first
      if (SecureStore.isAvailableAsync) {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          return await SecureStore.getItemAsync('willware_auth_token');
        }
      }
      
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem('willware_auth_token');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private async getStoredUser(): Promise<AuthResponse['data'] | null> {
    try {
      let userData: string | null = null;
      
      // Try SecureStore first
      if (SecureStore.isAvailableAsync) {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          userData = await SecureStore.getItemAsync('willware_user_data');
        }
      }
      
      // Fallback to AsyncStorage if SecureStore didn't work
      if (!userData) {
        userData = await AsyncStorage.getItem('willware_user_data');
      }
      
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }
}

export default AuthOptimizer.getInstance();