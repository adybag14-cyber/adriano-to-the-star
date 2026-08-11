# Gemini 2.5 Flash Live Troubleshooting Guide

## 🔍 Issue Identified

The `gemini-2.5-flash-live` model is not replying. Here's what we found and how to fix it.

## ✅ Root Causes

### 1. Backend Server Not Running
**Status:** ❌ Backend server is NOT running
**Fix:** Start the backend server

### 2. API Key Not Configured
**Status:** ⚠️ `.env` file created but needs API key
**Fix:** Add your Gemini API key to `backend/.env`

## 🚀 Quick Fix Steps

### Step 1: Add API Key to Backend

1. Open `backend/.env` file
2. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
3. Get your API key from: https://aistudio.google.com/app/apikey

```env
GEMINI_API_KEY=your-actual-api-key-here
STELLAR_AI_PORT=3001
```

### Step 2: Start Backend Server

Open a terminal in the `backend` folder and run:

```bash
npm run start-stellar-ai
```

You should see:
```
🌟 ═══════════════════════════════════════════
   Stellar AI Server running on port 3001
🌟 ═══════════════════════════════════════════
```

**Keep this terminal open!** The server must stay running.

### Step 3: Test the Connection

1. Open `test-gemini-live-debug.html` in your browser
2. Click "Test Backend Connection" - should show ✅
3. Click "Test WebSocket Connection" - should show ✅
4. Enter a test message and click "Test Gemini Live Model"

### Step 4: Test on Stellar AI Page

1. Open `stellar-ai.html` in your browser
2. Select "Gemini 2.5 Flash Live Preview 🎤" from the model dropdown
3. Type a message and send
4. Check browser console (F12) for connection logs

## 🔍 How It Works

1. **Frontend** (`stellar-ai.js`) detects `gemini-2.5-flash-live-preview` model
2. **Checks** if backend is available (localhost:3001)
3. **Connects** to WebSocket: `ws://localhost:3001/api/gemini-live`
4. **Backend** (`gemini-live-proxy.js`) proxies to Gemini Live API
5. **Backend** uses API key from `.env` file
6. **Response** flows back through WebSocket to frontend

## 🐛 Common Issues & Solutions

### Issue: "Backend server may not be running"
**Solution:** 
- Start backend: `cd backend && npm run start-stellar-ai`
- Verify: Open http://localhost:3001/health in browser

### Issue: "Gemini API key not configured"
**Solution:**
- Add `GEMINI_API_KEY=your-key` to `backend/.env`
- Restart backend server

### Issue: "WebSocket connection failed"
**Solution:**
- Check backend is running on port 3001
- Check firewall isn't blocking port 3001
- Verify WebSocket URL: `ws://localhost:3001/api/gemini-live`

### Issue: "Model not found" or "404 error"
**Solution:**
- The code automatically normalizes model names
- `gemini-2.5-flash-live-preview` → `gemini-2.5-flash-live`
- Check backend logs for actual error

### Issue: Connection timeout
**Solution:**
- Check API key is valid
- Check internet connection
- Check backend logs for Gemini API errors

## 📊 Debug Checklist

Use this checklist to verify everything is working:

- [ ] Backend `.env` file exists with `GEMINI_API_KEY` set
- [ ] Backend server is running (`npm run start-stellar-ai`)
- [ ] Backend health check works: http://localhost:3001/health
- [ ] WebSocket endpoint accessible: `ws://localhost:3001/api/gemini-live`
- [ ] Browser console shows: `[Stellar AI] Connecting to WebSocket`
- [ ] Browser console shows: `✅ Success with model: gemini-2.5-flash-live`
- [ ] No CORS errors in browser console
- [ ] No WebSocket errors in browser console

## 🔧 Testing Tools

### 1. Debug Test Page
Open `test-gemini-live-debug.html` for interactive testing:
- Test backend connection
- Test WebSocket connection
- Test Gemini Live model
- View detailed debug logs

### 2. Browser Console
Open browser console (F12) and check for:
```javascript
// Should see these logs:
[Stellar AI] WebSocket URL: ws://localhost:3001/api/gemini-live
[Stellar AI] Backend URL: http://localhost:3001
[Stellar AI] Model: gemini-2.5-flash-live
[Stellar AI] Using backend WebSocket proxy (API key handled by backend)
✅ Success with model: gemini-2.5-flash-live
```

### 3. Backend Logs
Check backend terminal for:
```
[Gemini Live Proxy] Client connected
[Gemini Live Proxy] Connected to Gemini API
[Gemini Live Proxy] Normalized model name
```

## 📝 Code Flow

```
User sends message
  ↓
stellar-ai.js: getGeminiLiveResponse()
  ↓
Checks: backendUrl available? (localhost:3001)
  ↓
YES → callGeminiLiveWebSocket() with backend WebSocket
  ↓
Connects to: ws://localhost:3001/api/gemini-live
  ↓
backend/gemini-live-proxy.js receives connection
  ↓
Checks: GEMINI_API_KEY in .env?
  ↓
YES → Connects to Gemini Live API WebSocket
  ↓
Sends setup message with model: gemini-2.5-flash-live
  ↓
Receives response from Gemini
  ↓
Forwards response to frontend
  ↓
Frontend displays response
```

## ✅ Expected Behavior When Working

1. Select "Gemini 2.5 Flash Live Preview 🎤" from dropdown
2. Type message: "Hello, can you hear me?"
3. Click Send
4. Console shows connection logs
5. Response appears in chat within 2-5 seconds
6. Response is complete and accurate

## 🚨 If Still Not Working

1. **Check Backend Logs:**
   - Look for error messages in backend terminal
   - Check for API key errors
   - Check for WebSocket errors

2. **Check Browser Console:**
   - Look for WebSocket connection errors
   - Look for CORS errors
   - Look for timeout errors

3. **Verify API Key:**
   - Test API key at: https://aistudio.google.com/app/apikey
   - Make sure key is active and has permissions

4. **Test with Debug Page:**
   - Use `test-gemini-live-debug.html` for detailed diagnostics
   - Check each step of the connection process

## 📞 Next Steps

1. ✅ Add API key to `backend/.env`
2. ✅ Start backend server: `npm run start-stellar-ai`
3. ✅ Test with `test-gemini-live-debug.html`
4. ✅ Test on `stellar-ai.html` page
5. ✅ Check console logs for any errors

---

**Created:** January 2025  
**Status:** Ready for testing after backend setup

