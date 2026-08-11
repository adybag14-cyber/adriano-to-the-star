# Fix: "Connection closed before setup" Error

## 🔍 Problem

The error "Connection closed before setup" occurs because:
- The **backend server is not running** on port 3001
- The frontend tries to connect to `ws://localhost:3001/api/gemini-live`
- But nothing is listening, so the connection closes immediately

## ✅ Solution

### Step 1: Start the Backend Server

**Option A: Use the Batch File (Easiest)**
```bash
cd backend
.\start-server.bat
```

**Option B: Use PowerShell**
```powershell
cd backend
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
npm run start-stellar-ai
```

**Option C: Use Command Prompt**
```cmd
cd backend
npm run start-stellar-ai
```

### Step 2: Verify Backend is Running

Open in browser: http://localhost:3001/health

You should see:
```json
{
  "status": "healthy",
  "chatsCount": 0,
  "imagesCount": 0
}
```

### Step 3: Test Gemini Live Again

1. Open: http://localhost:8000/stellar-ai.html
2. Select "Gemini 2.5 Flash Live Preview 🎤"
3. Send a message
4. It should work now! ✅

## 🔧 Troubleshooting

### Backend Won't Start

**Check 1: Port 3001 Already in Use**
```powershell
Get-NetTCPConnection -LocalPort 3001
```
If something is using it, stop that process first.

**Check 2: API Key Configured**
```bash
cd backend
cat .env
```
Should show: `GEMINI_API_KEY=GEMINI_API_KEY_2`

**Check 3: Dependencies Installed**
```bash
cd backend
npm install
```

### Still Getting "Connection closed before setup"

1. **Check backend terminal** for error messages
2. **Check browser console** (F12) for WebSocket errors
3. **Verify backend URL** in browser console:
   ```javascript
   console.log(window.STELLAR_AI_BACKEND_URL);
   // Should show: http://localhost:3001
   ```

## 📊 Expected Behavior

When working correctly:

1. **Backend starts** and shows:
   ```
   🌟 Stellar AI Server running on port 3001
   ```

2. **Browser console shows**:
   ```
   [Stellar AI] Connecting to WebSocket: ws://localhost:3001/api/gemini-live
   [Stellar AI] WebSocket opened
   ✅ Success with model: gemini-2.5-flash-live
   ```

3. **Response appears** in chat within 2-5 seconds

## 🚨 Common Issues

### Issue: "Backend server may not be running"
**Fix:** Start backend with `npm run start-stellar-ai` in backend folder

### Issue: "WebSocket connection failed"
**Fix:** 
- Check backend is running: http://localhost:3001/health
- Check firewall isn't blocking port 3001
- Check backend terminal for errors

### Issue: "Connection closed before setup"
**Fix:** 
- Backend server must be running
- Check backend logs for WebSocket errors
- Verify API key is in backend/.env

---

**Status:** Backend server needs to be running for Gemini Live to work!

