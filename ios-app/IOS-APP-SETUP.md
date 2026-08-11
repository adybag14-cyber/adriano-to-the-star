# 📱 iOS App Setup Guide

**Last Updated:** November 27, 2025  
**Status:** Ready for Development

---

## 🚀 Quick Start

### Prerequisites

1. **Xcode:**
   - Download from Mac App Store
   - Version: 14.0 or later
   - Requires macOS 12.0 or later

2. **Apple Developer Account:**
   - Free account for development
   - Paid ($99/year) for App Store distribution

3. **System Requirements:**
   - macOS 12.0 or later
   - 8GB RAM minimum (16GB recommended)
   - 20GB free disk space

---

## 📦 Setup Steps

### 1. Open Project in Xcode

1. Launch Xcode
2. Click **"Open"** or **"File → Open"**
3. Navigate to `ios-app` folder
4. Select `AdrianoToTheStar.xcodeproj`
5. Click **"Open"**

### 2. Configure Project

1. Select project in navigator
2. Select **"AdrianoToTheStar"** target
3. Go to **"Signing & Capabilities"**
4. Select your **Team** (or create one)
5. Xcode will automatically manage provisioning

### 3. Update Website URL (Optional)

Edit `Views/WebViewContainer.swift`:
```swift
private let websiteURL = "https://starisdons-d53656.gitlab.io"
```

Change to your production URL if different.

### 4. Configure Bundle Identifier

1. Select project in navigator
2. Select **"AdrianoToTheStar"** target
3. Go to **"General"** tab
4. Update **"Bundle Identifier"** to your unique identifier:
   ```
   com.yourname.adrianotothestar
   ```

---

## 🏃 Run the App

### On Simulator:

1. **Select Simulator:**
   - Click device selector at top
   - Choose iPhone 14 or later
   - iOS 13.0 or later

2. **Run App:**
   - Click **Run** button or press `Cmd + R`
   - Wait for build to complete
   - Simulator will launch automatically

### On Physical Device:

1. **Connect Device:**
   - Connect iPhone/iPad via USB
   - Unlock device
   - Trust computer if prompted

2. **Configure Device:**
   - Go to **Settings → General → Device Management**
   - Trust your developer certificate

3. **Run App:**
   - Select your device in Xcode
   - Click **Run** button
   - App will install and launch

---

## 🔧 Build for Distribution

### Archive:

1. **Select Generic iOS Device:**
   - In device selector, choose "Any iOS Device"

2. **Archive:**
   - Go to **Product → Archive**
   - Wait for archive to complete

3. **Distribute:**
   - Click **"Distribute App"**
   - Choose distribution method:
     - **App Store Connect** (for App Store)
     - **Ad Hoc** (for testing)
     - **Enterprise** (for enterprise distribution)

---

## 📱 App Features

### Current Implementation:

- ✅ **WKWebView Wrapper** - Loads PWA in native app
- ✅ **Offline Support** - Caches website content
- ✅ **Deep Linking** - Handles URLs
- ✅ **SwiftUI Interface** - Modern iOS UI
- ✅ **Dark Mode Support** - Automatic theme switching

### Future Enhancements:

- [ ] Push notifications (Firebase FCM)
- [ ] Face ID / Touch ID authentication
- [ ] Native sharing
- [ ] Camera integration
- [ ] File picker
- [ ] Location services
- [ ] Widget support
- [ ] Siri Shortcuts

---

## 🎨 Customization

### App Icon:

1. Open `Assets.xcassets`
2. Select **"AppIcon"**
3. Drag and drop icons:
   - 20x20 (iPhone)
   - 29x29 (Settings)
   - 40x40 (Spotlight)
   - 60x60 (App)
   - 76x76 (iPad)
   - 1024x1024 (App Store)

### App Name:

Edit `Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>Adriano To The Star</string>
```

### Colors:

Edit `Assets.xcassets` → **"Colors"**:
- Add cosmic theme colors
- Use in SwiftUI views

---

## 🚀 Deploy to App Store

### 1. Create App Store Connect Record

1. Go to: https://appstoreconnect.apple.com
2. Click **"My Apps"**
3. Click **"+"** → **"New App"**
4. Fill in:
   - **Name:** Adriano To The Star
   - **Primary Language:** English
   - **Bundle ID:** (select from dropdown)
   - **SKU:** (unique identifier)

### 2. Prepare Assets

- **App Icon:** 1024x1024 PNG
- **Screenshots:** Required for each device size
- **App Preview:** Optional video
- **Description:** App description
- **Keywords:** Search keywords
- **Privacy Policy URL:** Required

### 3. Upload Build

1. Archive app in Xcode
2. Upload to App Store Connect
3. Wait for processing (10-30 minutes)
4. Select build in App Store Connect
5. Submit for review

### 4. App Store Listing

- **App Name:** Adriano To The Star
- **Subtitle:** Explore exoplanets and claim your star
- **Description:** [Your app description]
- **Category:** Education / Entertainment
- **Age Rating:** Complete questionnaire

---

## 🔍 Testing

### Test Checklist:

- [ ] App launches successfully
- [ ] Website loads in WebView
- [ ] Navigation works (swipe back)
- [ ] Deep links work
- [ ] Offline mode works
- [ ] PWA features work (service worker)
- [ ] Dark mode works
- [ ] Performance is smooth

### Test on Multiple Devices:

- Different iPhone models
- Different iPad models
- Different iOS versions (13.0+)

---

## 🐛 Troubleshooting

### Build Fails:

1. **Check Xcode Version:**
   - Update to latest version

2. **Clean Build:**
   - **Product → Clean Build Folder** (`Cmd + Shift + K`)

3. **Check Signing:**
   - Verify team is selected
   - Check bundle identifier is unique

### App Crashes:

1. **Check Console:**
   - **View → Debug Area → Activate Console**
   - Look for error messages

2. **Check Permissions:**
   - Verify `Info.plist` has required permissions

3. **Check Website URL:**
   - Ensure URL is accessible
   - Check for HTTPS/HTTP issues

### WebView Not Loading:

1. **Check Network:**
   - Verify device has internet connection

2. **Check URL:**
   - Ensure URL is correct and accessible

3. **Check App Transport Security:**
   - Already configured in `Info.plist`

---

## 📚 Resources

- **Apple Developer Docs:** https://developer.apple.com/documentation/
- **SwiftUI Docs:** https://developer.apple.com/documentation/swiftui/
- **WKWebView Guide:** https://developer.apple.com/documentation/webkit/wkwebview

---

## ✅ Next Steps

1. ✅ **Test App** - Run on simulator/device
2. ⚠️ **Add App Icon** - Create and add app icons
3. ⚠️ **Test Features** - Verify all website features work
4. ⚠️ **Archive Build** - Create archive for distribution
5. ⚠️ **Submit to App Store** - Upload and publish

---

**Made with 🌌 by Adriano To The Star**

