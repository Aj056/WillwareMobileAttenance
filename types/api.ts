// API Types for WillwareTech Employee Mobile App
// Based on the comprehensive specification document

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  data: {
    _id: string;
    employeeName: string;
    employeeEmail: string;
    role: 'employee' | 'admin';
    department: string;
    designation: string;
    workLocation: string;
    username: string;
    status: boolean;
    joinDate: string;
    bankAccount: string;
    uanNumber: string;
    esiNumber: string;
    panNumber: string;
    address: string;
    phone: string;
  };
  token: {
    tokens: string;
  };
}

// Mobile App User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee';
  department?: string;
  designation?: string;
  workLocation?: string;
}

// Employee Details & Status
export interface TimeLog {
  date: string;       // YYYY-MM-DD format
  checkin?: string;   // ISO timestamp
  checkout?: string;  // ISO timestamp
  totalhours?: string; // calculated hours
  autocheckout?: boolean;
}

export interface EmployeeDetailsResponse {
  data: {
    _id: string;
    employeeName: string;
    employeeEmail: string;
    status: boolean; // true = checked in, false = checked out
    timelog: TimeLog[];
    department: string;
    designation: string;
    workLocation: string;
    role: string;
    joinDate: string;
    bankAccount: string;
    uanNumber: string;
    esiNumber: string;
    panNumber: string;
    address: string;
    phone: string;
    username?: string;
    password?: string;
    resourceType?: string;
    __v?: number;
  };
}

// Check-In/Out Types
export interface CheckInRequest {
  id: string; // Employee ID from auth token
}

export interface CheckinResponse {
  message: string;
  timelog?: TimeLog[];
}

export interface CheckOutRequest {
  id: string; // Employee ID from auth token
}

export interface CheckoutResponse {
  message: string;
  timelog?: TimeLog[];
}

export interface AllCheckinResponse {
  data: TimeLog[];
}

// Payslip Types
export interface PayslipResponse {
  success: boolean;
  message: string;
  data: {
    employeeName: string;
    employeeId: string;
    month: string;
    year: number;
    designation: string;
    department: string;
    workLocation: string;
    joiningDate: string;
    lopDays: number;
    workedDays: number;
    bankAccount: string;
    uan: string;
    esiNumber: string;
    pan: string;
    
    // Earnings
    basicPay: number;
    hra: number;
    others: number;
    incentive: number;
    totalEarnings: number;
    
    // Deductions
    pf: number;
    esi: number;
    tds: number;
    staffAdvance: number;
    totalDeductions: number;
    
    // Net Pay
    netPay: number;
    paymentMode: string;
    amountWords: string;
  };
}

// All Employees Response
export interface AllEmployeesResponse {
  data: Array<{
    _id: string;
    employeeName: string;
    employeeEmail: string;
    department: string;
    designation: string;
    workLocation: string;
    role: 'employee' | 'admin';
    status: boolean;
    joinDate: string;
    bankAccount: string;
    uanNumber: string;
    esiNumber: string;
    panNumber: string;
    address: string;
    phone: string;
  }>;
}

// Motivational Quotes Types
export interface Quote {
  Quote: string;
  Author: string;
  Tags: string;
  ID: number;
}

// UI Component Types
export interface ButtonProps {
  text: string;
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  style?: any;
}

export interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export interface MonthYearValue {
  month: number;    // 1-12
  year: number;     // 2024, 2025, etc.
  displayValue: string; // "January 2025"
}

export interface MonthYearPickerProps {
  value?: MonthYearValue;
  onSelect: (value: MonthYearValue) => void;
  maxDate?: Date;
  minDate?: Date;
}

// State Management Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface EmployeeState {
  profile: EmployeeDetailsResponse['data'] | null;
  checkInStatus: {
    isCheckedIn: boolean;
    lastAction?: {
      type: 'Check-in' | 'Check-out';
      timestamp: string;
    };
    workingHours: {
      today: number;
      week: number;
      month: number;
    };
  };
  payslipData: PayslipResponse['data'] | null;
  timelogHistory: TimeLog[];
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  currentQuote: Quote | null;
  theme: 'light' | 'dark';
  connectivity: 'online' | 'offline';
  notifications: any[];
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Month names for API calls (lowercase as specified)
export const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
] as const;

export type MonthName = typeof MONTH_NAMES[number];