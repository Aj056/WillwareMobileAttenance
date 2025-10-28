# WillwareTech Employee Mobile App

A professional React Native mobile application built with Expo for WillwareTech employees to manage their attendance, view payslips, and access employee services.

## 🚀 Features

### ✅ Completed Features

- **🔐 Secure Authentication**
  - Username/password login
  - JWT token management with secure storage
  - Employee role validation (admin users blocked)
  - Biometric authentication support
  - Remember me functionality
  - Auto-logout on token expiration

- **📊 Dashboard**
  - Real-time clock display
  - Current check-in status with immediate UI updates
  - Motivational quotes with refresh
  - Working hours summary (today, week, month)
  - Optimistic check-in/out with instant feedback
  - Professional UI with company branding
  - Toast notifications for all user actions

- **📅 Attendance Logs**
  - Monthly attendance records with month/year filtering
  - Detailed time logs with comprehensive statistics
  - Total hours and present days tracking
  - Visual attendance history with search capabilities
  - Professional data display with error handling

- **💰 Payslip Management**
  - Month/year selector
  - Comprehensive payslip display
  - Earnings and deductions breakdown
  - Net pay calculation
  - Bank and statutory details
  - Professional PDF-ready formatting
  - Download functionality (coming soon)

- **👤 Profile Management**
  - Complete employee information display
  - Department and role details with comprehensive data
  - Contact information management
  - Bank account information (secure display)
  - Document numbers (UAN, ESI, PAN)
  - Web-based profile editing with browser redirect
  - Enhanced data loading with retry mechanisms

- **🔄 Smart Update System**
  - Over-the-Air (OTA) automatic updates
  - In-app update notifications with progress tracking
  - Background update checking every 30 minutes
  - Seamless update experience without app reinstall
  - Professional update management UI

- **🎨 Professional UI/UX**
  - Modern Material Design principles
  - Consistent color scheme and typography
  - Toast notification system replacing intrusive alerts
  - Professional shadows and animations
  - Responsive design for all screen sizes
  - Comprehensive error handling with user-friendly messages
  - Pull-to-refresh functionality
  - Real-time UI updates and optimistic rendering

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Context API
- **Navigation**: Expo Router
- **Storage**: Expo SecureStore for sensitive data
- **Authentication**: Expo LocalAuthentication (biometric)
- **UI Components**: Custom components with consistent theming
- **Icons**: Expo Vector Icons (Ionicons)
- **Date/Time**: Moment.js
- **HTTP Client**: Fetch API with custom wrapper

## 📱 App Structure

```
willwaremobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx         # Dashboard with real-time updates
│   │   ├── logs.tsx          # Attendance logs with filtering
│   │   ├── payslip.tsx       # Payslip viewer with web integration
│   │   ├── profile.tsx       # Profile with web editing
│   │   └── _layout.tsx       # Tab navigation
│   ├── login.tsx             # Login screen
│   └── _layout.tsx           # App root layout with providers
├── components/
│   ├── ui/
│   │   ├── Button.tsx        # Reusable button component
│   │   ├── Card.tsx          # Card component
│   │   ├── Loading.tsx       # Loading component
│   │   └── Toast.tsx         # Toast notification component
│   ├── ToastProvider.tsx     # Toast context provider
│   └── UpdateManager.tsx     # OTA update management
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── services/
│   ├── apiClient.ts          # API client with endpoints
│   └── cacheManager.ts       # Data caching system
├── utils/
│   └── errorHandling.ts      # Comprehensive error management
├── types/
│   └── api.ts               # TypeScript interfaces
└── constants/
    └── theme.ts             # App theme and styling
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

3. **Run on Device/Simulator**
   - **Android**: `npm run android`
   - **iOS**: `npm run ios`
   - **Web**: `npm run web`

## 🔐 Security Features

- **Secure Token Storage**: JWT tokens stored in device keychain/keystore
- **Role-based Access**: Only employees can access the mobile app
- **Data Encryption**: Sensitive data encrypted at rest
- **Biometric Authentication**: Fingerprint/Face ID support
- **Auto-logout**: Automatic logout on token expiration
- **Input Validation**: All user inputs validated
- **Error Handling**: No sensitive data exposed in errors

## 📊 API Integration

- **Base URL**: `https://attendance-three-lemon.vercel.app`
- **Authentication**: Bearer token (JWT)
- **Endpoints**: Login, Employee Details, Check-in/out, Payslip, History
- **Error Handling**: Comprehensive error management
- **Retry Logic**: Automatic retry with exponential backoff

## 🎨 Design System

### Colors
- **Primary**: #2196F3 (Professional Blue)
- **Secondary**: #4CAF50 (Success Green)
- **Error**: #F44336 (Red)
- **Warning**: #FF9800 (Orange)
- **Background**: #FAFAFA (Light Gray)
- **Surface**: #FFFFFF (White)

### Typography
- **Headings**: Bold, appropriate sizing
- **Body Text**: Regular, readable
- **Captions**: Secondary color, smaller size
- **System Fonts**: Platform-appropriate fonts

## 📱 Screen Flow

1. **App Launch** → Loading → Authentication Check
2. **Not Authenticated** → Login Screen → Dashboard
3. **Authenticated** → Dashboard (with tabs)
4. **Dashboard** → Check-in Status, Clock, Quote, Stats
5. **Check-in Tab** → Current Status, History, One-tap Action
6. **Payslip Tab** → Month Selector, Payslip Details, Download
7. **Profile Tab** → Employee Info, Settings, Logout

## 🚧 Coming Soon Features

- **PDF Generation**: Full PDF payslip generation and download
- **Push Notifications**: Attendance reminders and updates
- **Offline Mode**: Full offline functionality with sync
- **Profile Editing**: Employee profile editing capabilities
- **Reports**: Detailed attendance reports and analytics
- **Settings**: App settings and preferences

## 🔧 Development Commands

```bash
# Development
npm start                     # Start development server
npm run android              # Run on Android
npm run ios                  # Run on iOS
npm run web                  # Run on web
npm run lint                 # Lint code

# Deployment Setup
npm run setup:deployment     # Interactive deployment setup
eas login                    # Login to Expo account
eas build:configure          # Configure EAS builds

# Building APKs
npm run build:android:apk    # Production APK for employees
npm run build:preview        # Preview APK for testing
npm run build:development    # Development APK
npm run build:android:aab    # Play Store AAB format

# Over-the-Air Updates
npm run update:production    # Push update to all users
npm run update:preview       # Push update to beta users

# Version Management
npm run version:patch        # Bug fixes (1.0.0 → 1.0.1)
npm run version:minor        # New features (1.0.0 → 1.1.0)
npm run version:major        # Breaking changes (1.0.0 → 2.0.0)

# Play Store Submission
npm run submit:android       # Submit to Google Play Store
```

## 📞 Support & Contact

For technical support or issues:
- Contact your HR department
- Reach out to IT support
- Report bugs through the app feedback system

---

## 🎯 Development Notes

This app was built following the comprehensive specification document with:

- **TypeScript** for type safety
- **Modular Architecture** for maintainability
- **Consistent Styling** with design system
- **Error Handling** throughout the app
- **Security First** approach
- **Performance Optimized** code
- **User Experience** focused design

The app is production-ready for employee use with modern UI/UX and professional features.
