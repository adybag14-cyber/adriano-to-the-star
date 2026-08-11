# 📱 Mobile App Framework Setup Guide

## Overview

This document outlines the framework structure for building native iOS and Android mobile apps for Adriano To The Star.

## Recommended Approach: Capacitor

**Capacitor** is recommended because:
- ✅ Works with existing web codebase
- ✅ Easy to add native features
- ✅ Supports iOS and Android from one codebase
- ✅ Can use existing PWA as base

## Project Structure

```
mobile-app/
├── ios/                    # iOS native project
├── android/                # Android native project
├── src/                    # Shared web code
│   ├── assets/
│   ├── components/
│   └── pages/
├── capacitor.config.json   # Capacitor configuration
├── package.json
└── README.md
```

## Setup Steps

### 1. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

### 2. Initialize Capacitor

```bash
npx cap init "Adriano To The Star" "com.adrianotothestar.app"
```

### 3. Add Platforms

```bash
npx cap add ios
npx cap add android
```

### 4. Sync Web Code

```bash
npx cap sync
```

### 5. Open in Native IDEs

```bash
# iOS
npx cap open ios

# Android
npx cap open android
```

## Native Features to Add

### iOS Features
- Push notifications (APNs)
- In-app purchases
- Camera integration
- Location services
- Biometric authentication

### Android Features
- Push notifications (FCM)
- In-app purchases
- Camera integration
- Location services
- Biometric authentication

## Configuration Files

### capacitor.config.json

```json
{
  "appId": "com.adrianotothestar.app",
  "appName": "Adriano To The Star",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    },
    "Camera": {
      "permissions": ["camera", "photos"]
    }
  }
}
```

## Integration Points

### 1. Use Existing PWA
- The current PWA can be used as the base
- Add native plugins for enhanced features
- Keep web code compatible

### 2. API Integration
- Use existing Supabase integration
- Add native HTTP clients if needed
- Maintain API compatibility

### 3. Authentication
- Use existing Supabase Auth
- Add biometric login (native)
- Maintain session sync

## Build Commands

```bash
# Build web assets
npm run build

# Sync to native projects
npx cap sync

# Build iOS
npx cap build ios

# Build Android
npx cap build android
```

## Next Steps

1. Set up Capacitor project structure
2. Configure native plugins
3. Test on iOS simulator
4. Test on Android emulator
5. Set up CI/CD for mobile builds

