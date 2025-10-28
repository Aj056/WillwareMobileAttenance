import { Alert } from 'react-native';

export interface ErrorDetails {
  message: string;
  code?: string | number;
  details?: any;
  timestamp?: number;
}

export class AppError extends Error {
  public code?: string | number;
  public details?: any;
  public timestamp: number;

  constructor(message: string, code?: string | number, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }

  toJSON(): ErrorDetails {
    return {
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed', details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Server error occurred', details?: any) {
    super(message, 'SERVER_ERROR', details);
    this.name = 'ServerError';
  }
}

// Error handling utilities
export const handleApiError = (error: any): AppError => {
  console.error('API Error:', error);

  // Handle network errors
  if (!error.response && error.request) {
    return new NetworkError('Unable to connect to server. Please check your internet connection.');
  }

  // Handle HTTP errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return new ValidationError(data?.message || 'Invalid request data');
      case 401:
        return new AuthenticationError(data?.message || 'Please log in again');
      case 403:
        return new AuthenticationError(data?.message || 'Access denied');
      case 404:
        return new AppError(data?.message || 'Resource not found', 'NOT_FOUND');
      case 422:
        return new ValidationError(data?.message || 'Invalid data provided');
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(data?.message || 'Server is temporarily unavailable');
      default:
        return new AppError(data?.message || `Request failed with status ${status}`, status);
    }
  }

  // Handle other errors
  if (error instanceof AppError) {
    return error;
  }

  // Generic error fallback
  return new AppError(
    error?.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    error
  );
};

export const getErrorMessage = (error: any): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const showErrorAlert = (error: any, title: string = 'Error') => {
  const message = getErrorMessage(error);
  Alert.alert(title, message);
};

export const logError = (error: any, context?: string) => {
  const errorInfo = {
    context,
    message: getErrorMessage(error),
    timestamp: new Date().toISOString(),
    stack: error?.stack,
    details: error instanceof AppError ? error.details : undefined
  };
  
  console.error('Error logged:', errorInfo);
  
  // Here you could send to crash reporting service like Sentry, Crashlytics, etc.
  // crashlytics().recordError(error);
};

// Retry mechanism for failed operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw handleApiError(error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw handleApiError(lastError);
};

export default {
  AppError,
  NetworkError,
  AuthenticationError,
  ValidationError,
  ServerError,
  handleApiError,
  getErrorMessage,
  showErrorAlert,
  logError,
  withRetry
};