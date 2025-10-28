# 🚀 Quick Start Deployment Guide

## Step-by-Step Setup for WillwareTech Mobile App

### 📋 **Step 1: Create Expo Account**
1. Go to [expo.dev](https://expo.dev)
2. Click "Sign up" and create a free account
3. **Important**: Use a username that matches `owner: "willwaretech"` in app.json, or update the owner field to match your username

### 🔑 **Step 2: Login to EAS CLI**
```bash
# In your project directory
cd "c:\Users\mailt\local\Willware\willwaremobile"

# Login to your Expo account
eas login
```
**Note**: Use the same credentials you created at expo.dev

### ⚙️ **Step 3: Configure EAS Build**
```bash
# Configure build settings
eas build:configure
```
This will:
- Create/update `eas.json` configuration
- Set up build profiles for Android
- Configure signing credentials

### 📱 **Step 4: Build Your First APK**
```bash
# Build production APK for employee distribution
npm run build:android:apk
```
This will:
- Start a cloud build process
- Take 10-15 minutes to complete
- Provide download link when finished

### 📊 **Step 5: Monitor Build Progress**
1. Check build status at [expo.dev/accounts/[your-username]/projects](https://expo.dev)
2. You'll receive an email when build completes
3. Download the APK from the provided link

---

## 🔧 **Alternative: Manual EAS Configuration**

If the automated setup doesn't work, you can manually configure:

### Update app.json owner field:
```json
{
  "expo": {
    "owner": "your-expo-username",
    // ... rest of config
  }
}
```

### Create eas.json manually:
The file is already created in your project with proper configuration.

---

## 🎯 **Quick Commands Reference**

```bash
# Check if logged in
eas whoami

# Login
eas login

# Configure builds
eas build:configure

# Build APK
npm run build:android:apk

# Check build status
eas build:list
```

---

## 🚨 **Troubleshooting**

### **"Not logged in" error:**
- Run `eas login` with correct credentials
- Make sure you created account at expo.dev

### **"Project not found" error:**
- Update `owner` field in app.json to match your Expo username
- Or create project at expo.dev first

### **Build fails:**
- Check your Expo dashboard for detailed error logs
- Ensure all dependencies are properly installed

---

## 📱 **Testing Your APK**

Once you have the APK:

1. **Download** the APK file
2. **Transfer** to Android device (USB, email, cloud storage)
3. **Enable** "Unknown Sources" in Android Settings → Security
4. **Install** by tapping the APK file
5. **Test** all app functionality

---

## 🔄 **Pushing Updates**

After employees have the APK installed:

```bash
# Make changes to your app
# Then push over-the-air update
npm run update:production
```

Employees will automatically receive the update!

---

## 🎉 **Success Indicators**

You'll know everything is working when:
- ✅ `eas login` shows your username
- ✅ `npm run build:android:apk` starts successfully
- ✅ You receive APK download link
- ✅ APK installs and runs on Android device
- ✅ Employees can use the app

---

**Need help?** Check the comprehensive guides in your repository:
- `DEPLOYMENT_GUIDE.md` - Detailed instructions
- `DEPLOYMENT_READY.md` - Quick reference
- `README.md` - Complete project documentation