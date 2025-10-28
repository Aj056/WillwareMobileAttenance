# WillwareTech Mobile App - Deployment Guide

## 📱 Complete Guide for App Distribution & Updates

This guide will walk you through deploying the WillwareTech Attendance app for your employees, from APK distribution to Play Store publishing and automatic updates.

---

## 🚀 Phase 1: Initial Setup & Prerequisites

### 1.1 Install Required Tools

```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to your Expo account (create one at expo.dev if you don't have)
eas login

# Initialize EAS in your project
cd willwaremobile
eas build:configure
```

### 1.2 Create Expo Account & Project
1. Go to [expo.dev](https://expo.dev) and create an account
2. Create a new project: "willware-attendance"
3. Note your username - update `owner` in app.json if needed

---

## 📦 Phase 2: Building APK Files for Employee Distribution

### 2.1 Build Development APK (for testing)
```bash
npm run build:development
```

### 2.2 Build Production APK (for employees)
```bash
npm run build:android:apk
```

### 2.3 Build Preview APK (for beta testing)
```bash
npm run build:preview
```

**Download Location**: After build completes, you'll get a download link. The APK will be available in your Expo dashboard.

---

## 🔄 Phase 3: Over-The-Air (OTA) Updates System

### 3.1 How OTA Updates Work
- Employees install the APK once
- Future updates are delivered automatically without new APK installation
- Updates include JavaScript code, images, and configuration changes
- Native code changes still require new APK

### 3.2 Publishing Updates

**For Production Users:**
```bash
npm run update:production
```

**For Beta Users:**
```bash
npm run update:preview
```

### 3.3 Version Management
```bash
# Patch version (1.0.0 → 1.0.1) - for bug fixes
npm run version:patch

# Minor version (1.0.0 → 1.1.0) - for new features
npm run version:minor

# Major version (1.0.0 → 2.0.0) - for breaking changes
npm run version:major
```

---

## 📲 Phase 4: Employee Distribution Methods

### 4.1 Method 1: Direct APK Distribution

**Create a simple distribution page:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>WillwareTech Attendance App</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        .download-btn { 
            background: #2196F3; color: white; padding: 15px 30px; 
            text-decoration: none; border-radius: 8px; display: inline-block;
            margin: 10px;
        }
        .instructions { max-width: 600px; margin: 20px auto; text-align: left; }
    </style>
</head>
<body>
    <h1>WillwareTech Attendance App</h1>
    <p>Download the latest version of our attendance tracking app</p>
    
    <a href="[YOUR_APK_DOWNLOAD_LINK]" class="download-btn">
        📱 Download APK (v1.0.0)
    </a>
    
    <div class="instructions">
        <h3>Installation Instructions:</h3>
        <ol>
            <li>Download the APK file above</li>
            <li>On your Android device, go to Settings → Security</li>
            <li>Enable "Unknown Sources" or "Install from Unknown Sources"</li>
            <li>Open the downloaded APK file and install</li>
            <li>Once installed, you'll receive automatic updates</li>
        </ol>
        
        <h3>System Requirements:</h3>
        <ul>
            <li>Android 6.0 (API level 23) or higher</li>
            <li>Internet connection for data sync</li>
            <li>At least 50MB free storage</li>
        </ul>
    </div>
</body>
</html>
```

### 4.2 Method 2: Email Distribution
Send APK with instructions via email to all employees.

### 4.3 Method 3: Internal Company Portal
Upload APK to your company's internal software distribution system.

---

## 🏪 Phase 5: Google Play Store Deployment

### 5.1 Google Play Console Setup
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Create new app: "WillwareTech Attendance"

### 5.2 Build Play Store Version (AAB format)
```bash
npm run build:android:aab
```

### 5.3 App Store Listing Requirements

**App Details:**
- **Title**: WillwareTech Attendance
- **Short Description**: Employee attendance tracking and payslip management
- **Full Description**: 
```
WillwareTech Attendance is a comprehensive employee management solution designed for modern workplaces.

Features:
• Real-time check-in/check-out tracking
• Monthly attendance logs and statistics
• Payslip viewing and download
• Employee profile management
• Automatic time calculations
• Secure data synchronization

Perfect for companies looking to streamline their attendance tracking and employee management processes.
```

**Screenshots Required:**
- At least 2 phone screenshots (1080x1920 or higher)
- Tablet screenshots (optional but recommended)

### 5.4 Submit to Play Store
```bash
npm run submit:android
```

---

## 🔧 Phase 6: Update Management Workflow

### 6.1 Development Workflow
```bash
# 1. Make changes to your app
# 2. Test locally
npm start

# 3. Build and test preview version
npm run build:preview

# 4. If satisfied, publish OTA update
npm run update:production

# 5. For major changes requiring new APK
npm run version:minor
npm run build:android:apk
```

### 6.2 Update Communication Strategy

**For OTA Updates (Automatic):**
- Users get notification in-app
- Update downloads in background
- Applied on next app restart

**For APK Updates (Manual):**
- Send email notification to employees
- Update download page with new version
- Include changelog and installation instructions

---

## 📊 Phase 7: Monitoring & Analytics

### 7.1 Track App Usage
- Monitor through Expo dashboard
- Track update installation rates
- Monitor crash reports

### 7.2 User Feedback System
Add feedback mechanism in the app:
```typescript
// Add to profile screen or settings
const sendFeedback = () => {
  Linking.openURL('mailto:support@willware.com?subject=App Feedback');
};
```

---

## 🛠️ Phase 8: Maintenance & Support

### 8.1 Regular Update Schedule
- **Weekly**: Bug fixes and minor improvements (OTA)
- **Monthly**: Feature updates (OTA or APK)
- **Quarterly**: Major releases (APK + Play Store)

### 8.2 Emergency Updates
For critical bugs:
```bash
# Quick patch
npm run version:patch
npm run update:production
```

### 8.3 Support Documentation
Create user manual covering:
- App installation
- Basic usage
- Troubleshooting
- Contact information

---

## 📋 Quick Reference Commands

```bash
# Development
npm start                    # Start development server
npm run lint                # Check code quality

# Building
npm run build:development   # Development APK
npm run build:preview      # Beta APK
npm run build:android:apk  # Production APK
npm run build:android:aab  # Play Store AAB

# Updates
npm run update:production  # Push update to users
npm run update:preview     # Push update to beta users

# Versioning
npm run version:patch      # Bug fixes (1.0.0 → 1.0.1)
npm run version:minor      # New features (1.0.0 → 1.1.0)
npm run version:major      # Breaking changes (1.0.0 → 2.0.0)

# Deployment
npm run submit:android     # Submit to Play Store
```

---

## 🎯 Recommended Deployment Strategy

### Phase 1: Internal Testing (Week 1)
1. Build development APK
2. Distribute to 2-3 test employees
3. Gather feedback and fix issues

### Phase 2: Beta Release (Week 2)
1. Build preview APK
2. Distribute to 10-15 employees
3. Test OTA update system

### Phase 3: Full Rollout (Week 3)
1. Build production APK
2. Create distribution page
3. Train employees on installation
4. Distribute to all employees

### Phase 4: Play Store (Week 4)
1. Submit to Google Play Store
2. While waiting for approval, continue APK distribution
3. Once approved, guide employees to Play Store

### Phase 5: Ongoing Updates
1. Weekly OTA updates for improvements
2. Monthly feature updates
3. Quarterly major releases

---

## ⚠️ Important Notes

1. **Testing First**: Always test builds before distributing to employees
2. **Backup Strategy**: Keep previous APK versions for rollback if needed
3. **Communication**: Always inform employees about updates and new features
4. **Support**: Provide clear contact information for technical support
5. **Security**: Ensure APK files are distributed through secure channels

---

This comprehensive deployment strategy ensures smooth distribution, automatic updates, and professional app management for your WillwareTech Attendance application!