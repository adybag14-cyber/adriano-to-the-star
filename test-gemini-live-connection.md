# Testing Gemini 2.5 Flash Live Model

## Issue: Model Not Replying

The `gemini-2.5-flash-live` model requires:
1. ✅ Backend server running on port 3001
2. ✅ Gemini API key configured in backend `.env` file
3. ✅ WebSocket connection working

## Quick Fix Steps

### Step 1: Check Backend Server

```bash
cd backend
npm run start-stellar-ai
```

The server should show:
```
🌟 ═══════════════════════════════════════════
   Stellar AI Server running on port 3001
🌟 ═══════════════════════════════════════════
```

### Step 2: Configure API Key

Create or edit `backend/.env` file:

```env
GEMINI_API_KEY=your-actual-api-key-here
# OR
GOOGLE_AI_API_KEY=your-actual-api-key-here
```

Get your API key from: https://aistudio.google.com/app/apikey

### Step 3: Test Connection

Open `test-gemini-live-debug.html` in your browser and:
1. Click "Test Backend Connection" - should show ✅
2. Click "Test WebSocket Connection" - should show ✅
3. Enter a test message and click "Test Gemini Live Model"

## Common Issues

### Issue 1: Backend Not Running
**Symptom:** Error message about backend not available
**Fix:** Start backend with `npm run start-stellar-ai` in backend folder

### Issue 2: API Key Not Configured
**Symptom:** "Gemini API key not configured" error
**Fix:** Add `GEMINI_API_KEY=your-key` to `backend/.env` file

### Issue 3: WebSocket Connection Failed
**Symptom:** WebSocket connection timeout or error
**Fix:** 
- Check if backend is running on port 3001
- Check firewall settings
- Verify WebSocket endpoint: `ws://localhost:3001/api/gemini-live`

### Issue 4: Model Name Mismatch
**Symptom:** Model not found errors
**Fix:** The code automatically normalizes model names:
- `gemini-2.5-flash-live-preview` → `gemini-2.5-flash-live`
- `gemini-live-2.5-flash-preview` → `gemini-2.5-flash-live`

## Debug Checklist

- [ ] Backend server is running (`npm run start-stellar-ai`)
- [ ] Backend responds to `/health` endpoint
- [ ] WebSocket endpoint accessible (`ws://localhost:3001/api/gemini-live`)
- [ ] API key is set in `backend/.env` file
- [ ] Browser console shows connection attempts
- [ ] No CORS errors in browser console
- [ ] Model name is correctly normalized

## Testing in Browser Console

Open browser console on `stellar-ai.html` and check:

```javascript
// Check backend URL
console.log('Backend URL:', window.STELLAR_AI_BACKEND_URL);

// Check API key (if set in frontend)
console.log('API Key:', window.GEMINI_API_KEY ? 'Set' : 'Not set');

// Test backend connection
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(d => console.log('Backend health:', d))
  .catch(e => console.error('Backend error:', e));
```

## Expected Behavior

When working correctly:
1. Select "Gemini 2.5 Flash Live Preview 🎤" from model selector
2. Type a message and send
3. Console shows: `[Stellar AI] Connecting to WebSocket: ws://localhost:3001/api/gemini-live`
4. Console shows: `✅ Success with model: gemini-2.5-flash-live`
5. Response appears in chat

## Next Steps

If still not working:
1. Check backend logs for errors
2. Check browser console for WebSocket errors
3. Verify API key is valid
4. Test with `test-gemini-live-debug.html` page

