import * as SecureStore from 'expo-secure-store';
import {
  LoginCredentials,
  AuthResponse,
  EmployeeDetailsResponse,
  CheckInRequest,
  CheckinResponse,
  CheckOutRequest,
  CheckoutResponse,
  AllCheckinResponse,
  PayslipResponse,
  AllEmployeesResponse,
  Quote,
  MonthName
} from '../types/api';
import CacheManager, { CACHE_KEYS } from './cacheManager';

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://attendance-three-lemon.vercel.app',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  
  // Token management
  TOKEN_STORAGE_KEY: 'willware_auth_token',
  USER_STORAGE_KEY: 'willware_user_data',
  TOKEN_EXPIRY_HOURS: 24,
};

// Fallback quotes as specified in the documentation
const FALLBACK_QUOTES: Quote[] = [
  {
    Quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    Author: "Winston Churchill",
    Tags: "success, courage",
    ID: 1
  },
  {
    Quote: "The only way to do great work is to love what you do.",
    Author: "Steve Jobs",
    Tags: "work, passion",
    ID: 2
  },
  {
    Quote: "Innovation distinguishes between a leader and a follower.",
    Author: "Steve Jobs",
    Tags: "innovation, leadership",
    ID: 3
  },
  {
    Quote: "The future belongs to those who believe in the beauty of their dreams.",
    Author: "Eleanor Roosevelt",
    Tags: "dreams, future",
    ID: 4
  },
  {
    Quote: "It is during our darkest moments that we must focus to see the light.",
    Author: "Aristotle",
    Tags: "perseverance, hope",
    ID: 5
  },
  {
    Quote: "Believe you can and you're halfway there.",
    Author: "Theodore Roosevelt",
    Tags: "belief, confidence",
    ID: 6
  },
  {
    Quote: "The only impossible journey is the one you never begin.",
    Author: "Tony Robbins",
    Tags: "journey, beginning",
    ID: 7
  },
  {
    Quote: "Success is walking from failure to failure with no loss of enthusiasm.",
    Author: "Winston Churchill",
    Tags: "success, persistence",
    ID: 8
  },
  {
    Quote: "Your limitation—it's only your imagination.",
    Author: "Unknown",
    Tags: "limitation, imagination",
    ID: 9
  },
  {
    Quote: "Great things never come from comfort zones.",
    Author: "Unknown",
    Tags: "comfort zone, growth",
    ID: 10
  }
];

class ApiClient {
  private baseURL = API_CONFIG.BASE_URL;
  private timeout = API_CONFIG.TIMEOUT;
  private cache = CacheManager.getInstance();

  constructor() {
    // Setup is complete
  }

  // Generic HTTP methods with error handling and retries
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    // Add authentication header if needed
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (useAuth) {
      const token = await this.getStoredToken();
      if (token) {
        headers = {
          ...headers,
          'Authorization': `Bearer ${token}`,
        };
      }
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;
        
        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          await this.clearAuthData();
          throw new ApiError('Authentication failed. Please login again.');
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw new ApiError(`Network error after ${API_CONFIG.RETRY_ATTEMPTS} attempts: ${lastError!.message}`);
  }

  private async get<T>(endpoint: string, useAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, useAuth);
  }

  private async post<T>(endpoint: string, data?: any, useAuth: boolean = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      useAuth
    );
  }

  // Token Management
  async storeAuthData(authResponse: AuthResponse): Promise<void> {
    try {
      // Check if SecureStore is available
      if (!SecureStore.isAvailableAsync) {
        // Fallback to AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(API_CONFIG.TOKEN_STORAGE_KEY, authResponse.token.tokens);
        await AsyncStorage.setItem(API_CONFIG.USER_STORAGE_KEY, JSON.stringify(authResponse.data));
        return;
      }

      const isAvailable = await SecureStore.isAvailableAsync();
      if (!isAvailable) {
        // Fallback to AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(API_CONFIG.TOKEN_STORAGE_KEY, authResponse.token.tokens);
        await AsyncStorage.setItem(API_CONFIG.USER_STORAGE_KEY, JSON.stringify(authResponse.data));
        return;
      }

      await SecureStore.setItemAsync(API_CONFIG.TOKEN_STORAGE_KEY, authResponse.token.tokens);
      await SecureStore.setItemAsync(API_CONFIG.USER_STORAGE_KEY, JSON.stringify(authResponse.data));
    } catch (error) {
      // Fallback to AsyncStorage if SecureStore fails
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(API_CONFIG.TOKEN_STORAGE_KEY, authResponse.token.tokens);
        await AsyncStorage.setItem(API_CONFIG.USER_STORAGE_KEY, JSON.stringify(authResponse.data));
      } catch (fallbackError) {
        throw new ApiError('Failed to store authentication data');
      }
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      // Try SecureStore first
      if (SecureStore.isAvailableAsync) {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          return await SecureStore.getItemAsync(API_CONFIG.TOKEN_STORAGE_KEY);
        }
      }
      
      // Fallback to AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(API_CONFIG.TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<AuthResponse['data'] | null> {
    try {
      let userData: string | null = null;
      
      // Try SecureStore first
      if (SecureStore.isAvailableAsync) {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          userData = await SecureStore.getItemAsync(API_CONFIG.USER_STORAGE_KEY);
        }
      }
      
      // Fallback to AsyncStorage if SecureStore didn't work
      if (!userData) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        userData = await AsyncStorage.getItem(API_CONFIG.USER_STORAGE_KEY);
      }
      
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async clearAuthData(): Promise<void> {
    try {
      // Try SecureStore first
      if (SecureStore.isAvailableAsync) {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.deleteItemAsync(API_CONFIG.TOKEN_STORAGE_KEY);
          await SecureStore.deleteItemAsync(API_CONFIG.USER_STORAGE_KEY);
        }
      }
      
      // Also clear AsyncStorage fallback
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(API_CONFIG.TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(API_CONFIG.USER_STORAGE_KEY);
      
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Ignore errors when clearing
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    const user = await this.getStoredUser();
    return !!(token && user);
  }

  // Authentication Endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.post<AuthResponse>('/login', credentials, false);
      
      // Validate response structure
      if (!response.data || !response.token?.tokens) {
        throw new ApiError('Invalid response format from server');
      }

      // Store authentication data securely
      await this.storeAuthData(response);
      
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Login failed. Please check your credentials.');
    }
  }

  async logout(): Promise<void> {
    await this.clearAuthData();
  }

  // Employee Endpoints
  async getEmployeeDetails(employeeId: string): Promise<EmployeeDetailsResponse> {
    try {
      return await this.cache.getOrSet(
        `${CACHE_KEYS.USER_PROFILE}_${employeeId}`,
        () => this.get<EmployeeDetailsResponse>(`/view/${employeeId}`),
        5 * 60 * 1000 // 5 minutes cache
      );
    } catch (error) {
      throw new ApiError('Failed to fetch employee details');
    }
  }

  // Get all employees (for dashboard statistics)
  async getAllEmployeesData(): Promise<any> {
    try {
      return await this.cache.getOrSet(
        'all_employees_dashboard',
        () => this.get<any>('/allemp'),
        2 * 60 * 1000 // 2 minutes cache for dashboard stats
      );
    } catch (error) {
      throw new ApiError('Failed to fetch employees data');
    }
  }

  // Get individual employee view with timelog
  async getEmployeeView(employeeId: string): Promise<any> {
    try {
      return await this.cache.getOrSet(
        `employee_view_${employeeId}`,
        () => this.get<any>(`/view/${employeeId}`),
        1 * 60 * 1000 // 1 minute cache for real-time data
      );
    } catch (error) {
      throw new ApiError('Failed to fetch employee view');
    }
  }

  // Get random motivational quote from external API
  async getRandomQuote(): Promise<any> {
    try {
      const response = await fetch('https://thequoteshub.com/api/random-quote', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Fallback to local quotes if external API fails
      const fallbackQuotes = [
        {
          text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          author: "Winston Churchill"
        },
        {
          text: "The way to get started is to quit talking and begin doing.",
          author: "Walt Disney"
        },
        {
          text: "Don't be afraid to give up the good to go for the great.",
          author: "John D. Rockefeller"
        }
      ];
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      return fallbackQuotes[randomIndex];
    }
  }

  // Get filtered attendance logs by month and year
  async getAttendanceLogs(employeeId: string, month: number, year: number): Promise<any> {
    try {
      return await this.post<any>('/filterby', {
        id: employeeId,
        month: month,
        year: year
      });
    } catch (error) {
      throw new ApiError('Failed to fetch attendance logs');
    }
  }

  async checkIn(employeeId: string): Promise<CheckinResponse> {
    try {
      return await this.post<CheckinResponse>('/checkin', { id: employeeId });
    } catch (error) {
      throw new ApiError('Check-in failed. Please try again.');
    }
  }

  async checkOut(employeeId: string): Promise<CheckoutResponse> {
    try {
      return await this.post<CheckoutResponse>('/checkout', { id: employeeId });
    } catch (error) {
      throw new ApiError('Check-out failed. Please try again.');
    }
  }

  async getAllCheckins(employeeId: string): Promise<AllCheckinResponse> {
    try {
      return await this.get<AllCheckinResponse>(`/allcheckin/${employeeId}`);
    } catch (error) {
      throw new ApiError('Failed to fetch check-in history');
    }
  }

  // Payslip Endpoints
  async getPayslip(employeeId: string, month: MonthName, year: string): Promise<PayslipResponse> {
    try {
      return await this.cache.getOrSet(
        CACHE_KEYS.PAYSLIP(employeeId, month, year),
        () => this.get<PayslipResponse>(`/getPaySlip/${employeeId}?month=${month}&year=${year}`),
        15 * 60 * 1000 // 15 minutes cache
      );
    } catch (error) {
      throw new ApiError('Failed to fetch payslip data');
    }
  }

  // Employee Profile Lookup
  async getAllEmployees(): Promise<AllEmployeesResponse> {
    try {
      const response = await this.get<AllEmployeesResponse>('/allemp');
      
      // Filter to only show employees (not admins) for mobile app
      const filteredData = response.data.filter(emp => emp.role === 'employee');
      
      return {
        data: filteredData
      };
    } catch (error) {
      throw new ApiError('Failed to fetch employee data');
    }
  }

  // Motivational Quotes
  async getMotivationalQuote(): Promise<any> {
    try {
      // Try external API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch('https://thequoteshub.com/api/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        if (data.text && data.author) {
          // Format: { text, author, tags, id, author_id }
          return {
            text: data.text,
            author: data.author,
            Quote: data.text,  // Fallback for old format
            Author: data.author // Fallback for old format
          };
        } else if (data.Quote && data.Author) {
          // Format: { Quote, Author, Tags, ID }
          return {
            Quote: data.Quote,
            Author: data.Author,
            text: data.Quote,   // Fallback for new format
            author: data.Author // Fallback for new format
          };
        }
      }
      
      throw new Error('External API failed');
    } catch (error) {
      // Fallback to local quotes
      const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
      const fallback = FALLBACK_QUOTES[randomIndex];
      return {
        Quote: fallback.Quote,
        Author: fallback.Author,
        text: fallback.Quote,
        author: fallback.Author
      };
    }
  }

  // Utility method to check network connectivity
  async checkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseURL}/`, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Custom API Error class
class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;

// Export individual functions for convenience
export const {
  login,
  logout,
  getEmployeeDetails,
  checkIn,
  checkOut,
  getAllCheckins,
  getPayslip,
  getAllEmployees,
  getMotivationalQuote,
  isAuthenticated,
  getStoredUser,
  clearAuthData,
  checkConnectivity
} = apiClient;