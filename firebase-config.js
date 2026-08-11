// Firebase Cloud Messaging Configuration
// Get your Firebase config from: https://console.firebase.google.com/

const FIREBASE_CONFIG = {
    // Your Firebase project configuration
    // NOTE: This apiKey is public by design.
    // SECURITY: You MUST configure Firebase Security Rules in the Firebase Console
    // to prevent unauthorized access to your data.
    // Get this from Firebase Console > Project Settings > General > Your apps
    apiKey: "GEMINI_API_KEY_2",
    authDomain: "adrianotostar-5047a.firebaseapp.com",
    projectId: "adrianotostar-5047a",
    storageBucket: "adrianotostar-5047a.firebasestorage.app",
    messagingSenderId: "667226437764",
    appId: "1:667226437764:web:b6b4013dee0d8981a72ad1",
    measurementId: "G-F47HCYPSMN",

    // Enable Firebase
    enabled: true // ✅ Firebase is now configured and enabled
};

// Check if Firebase should be used
const USE_FIREBASE = FIREBASE_CONFIG.enabled &&
    FIREBASE_CONFIG.apiKey !== "YOUR_FIREBASE_API_KEY";

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FIREBASE_CONFIG, USE_FIREBASE };
}

