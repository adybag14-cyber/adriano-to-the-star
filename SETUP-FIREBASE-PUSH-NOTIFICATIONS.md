# 🔔 Setup Firebase Cloud Messaging (FCM) for Push Notifications

## Why Firebase Cloud Messaging?

Instead of VAPID keys, we're using **Firebase Cloud Messaging (FCM)** which:
- ✅ **Easier setup** - No need to generate VAPID keys
- ✅ **Google Cloud integration** - Works with your existing Google Cloud project
- ✅ **Better reliability** - Google's infrastructure handles delivery
- ✅ **Free tier** - Generous free limits
- ✅ **Cross-platform** - Works on web, iOS, and Android

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select existing project
3. If creating new:
   - Enter project name: `adriano-to-the-star` (or any name)
   - Enable Google Analytics (optional)
   - Click **"Create project"**

### Step 2: Add Web App to Firebase

1. In Firebase Console, click the **Web icon** (`</>`)
2. Register your app:
   - **App nickname:** `Adriano To The Star Web`
   - **Firebase Hosting:** (optional, skip if using GitLab Pages)
   - Click **"Register app"**

3. **Copy your Firebase config** - You'll see something like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

### Step 3: Enable Cloud Messaging

1. In Firebase Console, go to **Build** → **Cloud Messaging**
2. Click **"Get started"** (if first time)
3. Under **"Web configuration"**, click **"Generate key pair"**
4. **Copy the VAPID key** (starts with `B...` or `BK...`)
   - This is different from the config above
   - You'll need this for FCM

### Step 4: Configure Your Project

1. Open `firebase-config.js` in your project
2. Paste your Firebase config:
   ```javascript
   const FIREBASE_CONFIG = {
       apiKey: "AIzaSy...", // From Step 2
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123",
       vapidKey: "B...", // From Step 3
       enabled: true // ← Set to true
   };
   ```

3. Save the file

### Step 5: Add Firebase SDK to HTML

Add Firebase SDK to pages that need push notifications (e.g., `messaging.html`, `dashboard.html`):

```html
<!-- Add before other scripts -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getMessaging } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';
  
  // Firebase will be initialized by push-notifications.js
</script>
<script src="firebase-config.js"></script>
<script src="push-notifications.js" defer></script>
```

---

## 📤 Sending Push Notifications

### Option 1: From Google Cloud Function

Create a Cloud Function to send notifications:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.https.onCall(async (data, context) => {
    const { token, title, body } = data;
    
    const message = {
        notification: {
            title: title,
            body: body
        },
        token: token
    };
    
    await admin.messaging().send(message);
    return { success: true };
});
```

### Option 2: From Your Backend

Use Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

async function sendPushNotification(token, title, body) {
    const message = {
        notification: { title, body },
        token: token
    };
    
    await admin.messaging().send(message);
}
```

### Option 3: From Firebase Console (Testing)

1. Go to **Cloud Messaging** in Firebase Console
2. Click **"Send test message"**
3. Enter FCM token (from browser console: `pushNotificationManager.getToken()`)
4. Enter title and message
5. Click **"Test"**

---

## 🔧 Integration with Your Cloud Function

You can integrate FCM with your existing Google Cloud Function (`cloud-functions/price-scraper/main.py`):

```python
from firebase_admin import messaging, initialize_app

# Initialize Firebase Admin (one time)
initialize_app()

def send_notification(token, title, body):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        token=token
    )
    messaging.send(message)
```

---

## 📋 Testing

1. **Subscribe to notifications:**
   ```javascript
   await window.pushNotificationManager.subscribe();
   ```

2. **Get your FCM token:**
   ```javascript
   const token = window.pushNotificationManager.getToken();
   console.log('FCM Token:', token);
   ```

3. **Send test notification from Firebase Console:**
   - Use the token from step 2
   - Go to Firebase Console → Cloud Messaging → Send test message

---

## 🔒 Security Notes

- ✅ **API Key:** Safe for frontend (already in your config)
- ✅ **VAPID Key:** Safe for frontend (used for FCM)
- ⚠️ **Service Account Key:** Keep private (server-side only)
- ✅ **FCM Tokens:** Store securely, associate with user IDs

---

## 💡 Benefits Over VAPID Keys

| Feature | VAPID Keys | Firebase FCM |
|---------|-----------|--------------|
| Setup Complexity | Medium | Easy |
| Google Cloud Integration | Manual | Built-in |
| Delivery Reliability | Good | Excellent |
| Analytics | None | Built-in |
| Cross-platform | Web only | Web + Mobile |
| Free Tier | Unlimited | Generous |

---

## 🎯 Next Steps

1. ✅ Configure `firebase-config.js` with your Firebase project details
2. ✅ Add Firebase SDK to pages that need notifications
3. ✅ Test subscription and token generation
4. ✅ Set up Cloud Function to send notifications
5. ✅ Integrate with your messaging system

---

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com/)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FCM Web Setup Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Google Cloud Functions + FCM](https://firebase.google.com/docs/functions/get-started)

---

**Made with 🌌 by Adriano To The Star - I.T.A**

