# 📱 Adriano To The Star - Android App

**Status:** Development  
**Platform:** Android (API Level 26+)  
**Language:** Kotlin

---

## 🚀 Quick Start

### Prerequisites
- Android Studio (Arctic Fox or later)
- JDK 11 or higher
- Android SDK (API 26+)

### Setup
1. Open Android Studio
2. Open this `android-app` folder as a project
3. Sync Gradle files
4. Run on emulator or device

---

## 📁 Project Structure

```
android-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/adrianotothestar/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── WebViewActivity.kt
│   │   │   │   └── utils/
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   ├── values/
│   │   │   │   └── drawable/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

---

## ✨ Features

- ✅ WebView wrapper for PWA
- ✅ Offline support
- ✅ Push notifications
- ✅ Deep linking
- ✅ Native Android features
- ✅ Material Design 3

---

## 🔧 Configuration

Update `app/src/main/java/com/adrianotothestar/MainActivity.kt` with your website URL:
```kotlin
private const val WEBSITE_URL = "https://starisdons-d53656.gitlab.io"
```

---

## 📦 Build

```bash
./gradlew assembleDebug
```

---

## 🚀 Deploy

1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Submit for review

---

**Made with 🌌 by Adriano To The Star**

