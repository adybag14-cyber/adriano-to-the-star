# 📱 Android App Setup Guide

**Last Updated:** November 27, 2025  
**Status:** Ready for Development

---

## 🚀 Quick Start

### Prerequisites

1. **Android Studio:**
   - Download: https://developer.android.com/studio
   - Version: Arctic Fox (2020.3.1) or later
   - Install Android SDK (API 26+)

2. **JDK:**
   - JDK 11 or higher
   - Android Studio includes JDK, or install separately

3. **System Requirements:**
   - Windows 10/11, macOS, or Linux
   - 8GB RAM minimum (16GB recommended)
   - 10GB free disk space

---

## 📦 Setup Steps

### 1. Open Project in Android Studio

1. Launch Android Studio
2. Click **"Open"** or **"File → Open"**
3. Navigate to `android-app` folder
4. Click **"OK"**
5. Wait for Gradle sync to complete

### 2. Configure SDK

1. Go to **File → Project Structure**
2. Set **Compile SDK Version:** 34
3. Set **Min SDK Version:** 26 (Android 8.0)
4. Set **Target SDK Version:** 34
5. Click **"OK"**

### 3. Sync Gradle

1. Click **"Sync Now"** if prompted
2. Or go to **File → Sync Project with Gradle Files**
3. Wait for dependencies to download

### 4. Update Website URL (Optional)

Edit `app/src/main/java/com/adrianotothestar/MainActivity.kt`:
```kotlin
private const val WEBSITE_URL = "https://starisdons-d53656.gitlab.io"
```

Change to your production URL if different.

---

## 🏃 Run the App

### On Emulator:

1. **Create AVD (Android Virtual Device):**
   - Click **Tools → Device Manager**
   - Click **"Create Device"**
   - Select a device (e.g., Pixel 5)
   - Select system image (API 34 recommended)
   - Click **"Finish"**

2. **Run App:**
   - Click **Run → Run 'app'** or press `Shift+F10`
   - Select your emulator
   - Wait for app to install and launch

### On Physical Device:

1. **Enable Developer Options:**
   - Go to **Settings → About Phone**
   - Tap **"Build Number"** 7 times
   - Go back to **Settings → Developer Options**
   - Enable **"USB Debugging"**

2. **Connect Device:**
   - Connect via USB
   - Accept USB debugging prompt on device
   - Device should appear in Android Studio

3. **Run App:**
   - Click **Run → Run 'app'**
   - Select your device
   - App will install and launch

---

## 🔧 Build APK/AAB

### Debug APK:

```bash
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release APK:

1. **Generate Keystore:**
   ```bash
   keytool -genkey -v -keystore adriano-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias adriano
   ```

2. **Create `keystore.properties`:**
   ```properties
   storePassword=your_store_password
   keyPassword=your_key_password
   keyAlias=adriano
   storeFile=../adriano-keystore.jks
   ```

3. **Update `app/build.gradle.kts`:**
   ```kotlin
   signingConfigs {
       create("release") {
           val keystorePropertiesFile = rootProject.file("keystore.properties")
           val keystoreProperties = java.util.Properties()
           keystoreProperties.load(java.io.FileInputStream(keystorePropertiesFile))
           
           storeFile = file(keystoreProperties["storeFile"] as String)
           storePassword = keystoreProperties["storePassword"] as String
           keyAlias = keystoreProperties["keyAlias"] as String
           keyPassword = keystoreProperties["keyPassword"] as String
       }
   }
   
   buildTypes {
       release {
           signingConfig = signingConfigs.getByName("release")
           isMinifyEnabled = true
           proguardFiles(...)
       }
   }
   ```

4. **Build:**
   ```bash
   ./gradlew assembleRelease
   ```

Output: `app/build/outputs/apk/release/app-release.apk`

### Android App Bundle (AAB) for Play Store:

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

---

## 📱 App Features

### Current Implementation:

- ✅ **WebView Wrapper** - Loads PWA in native app
- ✅ **Offline Support** - Caches website content
- ✅ **Deep Linking** - Handles URLs like `https://starisdons-d53656.gitlab.io/database.html`
- ✅ **Back Button** - Navigates back in WebView
- ✅ **Material Design 3** - Modern Android UI
- ✅ **Dark Theme** - Cosmic theme matching website

### Future Enhancements:

- [ ] Push notifications (Firebase FCM)
- [ ] Biometric authentication
- [ ] Native sharing
- [ ] Camera integration
- [ ] File picker
- [ ] Location services
- [ ] Native widgets

---

## 🎨 Customization

### App Icon:

Replace icons in:
- `app/src/main/res/mipmap-*/ic_launcher.png`
- `app/src/main/res/mipmap-*/ic_launcher_round.png`

Sizes needed:
- 48x48 (mdpi)
- 72x72 (hdpi)
- 96x96 (xhdpi)
- 144x144 (xxhdpi)
- 192x192 (xxxhdpi)

### App Name:

Edit `app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Adriano To The Star</string>
```

### Colors:

Edit `app/src/main/res/values/colors.xml`:
```xml
<color name="cosmic_gold">#ba944f</color>
<color name="cosmic_dark">#0a0a14</color>
```

---

## 🚀 Deploy to Google Play

### 1. Create Play Console Account

1. Go to: https://play.google.com/console
2. Pay one-time $25 registration fee
3. Create new app

### 2. Prepare Assets

- **App Icon:** 512x512 PNG
- **Feature Graphic:** 1024x500 PNG
- **Screenshots:** At least 2 (phone, tablet)
- **Privacy Policy URL:** Required

### 3. Upload AAB

1. Go to **Release → Production**
2. Click **"Create new release"**
3. Upload `app-release.aab`
4. Fill in release notes
5. Submit for review

### 4. App Store Listing

- **App Name:** Adriano To The Star
- **Short Description:** Explore exoplanets and claim your star
- **Full Description:** [Your app description]
- **Category:** Education / Entertainment
- **Content Rating:** Complete questionnaire

---

## 🔍 Testing

### Test Checklist:

- [ ] App launches successfully
- [ ] Website loads in WebView
- [ ] Navigation works (back button)
- [ ] Deep links work
- [ ] Offline mode works
- [ ] PWA features work (service worker)
- [ ] Push notifications (if implemented)
- [ ] Performance is smooth

### Test on Multiple Devices:

- Different screen sizes
- Different Android versions (8.0+)
- Different manufacturers

---

## 🐛 Troubleshooting

### Gradle Sync Fails:

1. **Check Internet Connection:**
   - Gradle needs to download dependencies

2. **Invalidate Caches:**
   - **File → Invalidate Caches → Invalidate and Restart**

3. **Update Gradle:**
   - Check `gradle/wrapper/gradle-wrapper.properties`
   - Update to latest version if needed

### App Crashes:

1. **Check Logcat:**
   - **View → Tool Windows → Logcat**
   - Look for error messages

2. **Check Permissions:**
   - Verify `AndroidManifest.xml` has required permissions

3. **Check Website URL:**
   - Ensure URL is accessible
   - Check for HTTPS/HTTP issues

### WebView Not Loading:

1. **Check Internet Permission:**
   - Verify `INTERNET` permission in manifest

2. **Check URL:**
   - Ensure URL is correct and accessible

3. **Enable Cleartext Traffic:**
   - Already enabled in manifest for development

---

## 📚 Resources

- **Android Developer Docs:** https://developer.android.com/
- **Kotlin Docs:** https://kotlinlang.org/docs/home.html
- **Material Design:** https://material.io/design
- **WebView Guide:** https://developer.android.com/develop/ui/views/layout/webview

---

## ✅ Next Steps

1. ✅ **Test App** - Run on emulator/device
2. ⚠️ **Add App Icon** - Create and add app icons
3. ⚠️ **Test Features** - Verify all website features work
4. ⚠️ **Build Release** - Create signed APK/AAB
5. ⚠️ **Submit to Play Store** - Upload and publish

---

**Made with 🌌 by Adriano To The Star**

