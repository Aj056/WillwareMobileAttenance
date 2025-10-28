// WillwareTech Mobile App Theme Configuration
// Professional, modern design system with consistent colors, typography, and spacing

import { Platform } from 'react-native';

export const Colors = {
  // Primary Brand Colors
  primary: '#2196F3',      // Professional Blue
  primaryDark: '#1976D2',  // Darker Blue for pressed states
  primaryLight: '#E3F2FD', // Light Blue for backgrounds
  
  // Secondary Colors
  secondary: '#4CAF50',    // Success Green
  secondaryDark: '#388E3C',
  secondaryLight: '#E8F5E8',
  
  // Status Colors
  success: '#4CAF50',      // Green
  warning: '#FF9800',      // Orange
  error: '#F44336',        // Red
  info: '#2196F3',         // Blue
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Text Colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  // Background Colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  
  // Border Colors
  border: '#E0E0E0',
  borderFocus: '#2196F3',
  borderError: '#F44336',
  
  // Shadow Colors
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.2)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
} as const;

export const Typography = {
  // Font Families
  fontFamily: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      semiBold: 'Roboto-Medium',
      bold: 'Roboto-Bold',
    },
    default: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
  }),
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
} as const;

export const Spacing = {
  // Base spacing unit (4px)
  unit: 4,
  
  // Predefined spacing values
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 16,   // 16px
  lg: 24,   // 24px
  xl: 32,   // 32px
  '2xl': 48, // 48px
  '3xl': 64, // 64px
  
  // Component specific spacing
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2.0,
    elevation: 2,
  },
  
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 4.0,
    elevation: 4,
  },
  
  xl: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 6.0,
    elevation: 6,
  },
} as const;

// Screen Layout Constants
export const Layout = {
  screenPadding: Spacing.md,
  containerMaxWidth: 400,
  headerHeight: 60,
  tabBarHeight: 60,
  
  // Safe area insets (will be overridden by actual safe area)
  safeArea: {
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  },
} as const;

// Animation Constants
export const Animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

// Theme object combining all constants
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  layout: Layout,
  animation: Animation,
} as const;

export default Theme;
