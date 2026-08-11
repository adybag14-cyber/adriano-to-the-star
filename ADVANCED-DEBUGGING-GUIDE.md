# Advanced Debugging Guide for Gemini Live API

## 🔍 Enhanced Debugging Features Added

### 1. Backend Debugging (`backend/gemini-live-proxy.js`)

**New Debug Logs:**
- ✅ Connection status tracking
- ✅ Message type detection (setup, clientContent, serverContent)
- ✅ WebSocket state monitoring
- ✅ Endpoint URL logging (with API key masked)
- ✅ Error code explanations
- ✅ Setup completion tracking
- ✅ Message queuing status

**Debug Levels:**
- `info` - Connection status, setup completion
- `debug` - Message flow, state changes
- `warn` - Fallback suggestions, non-critical issues
- `error` - Connection failures, API errors

### 2. Frontend Debugging (`stellar-ai.js`)

**New Console Logs:**
- ✅ Model attempt tracking
- ✅ WebSocket vs REST API detection
- ✅ Fallback mechanism logging
- ✅ Response length tracking
- ✅ Detailed error messages with suggestions

### 3. Error Handling Improvements

**Circular JSON Fix:**
- Added `sanitizeForJSON()` method to handle error objects
- Prevents crashes when logging complex error structures

**Error Categorization:**
- API key errors
- Network errors
- WebSocket errors
- Endpoint errors

## 📊 How to Debug

### Step 1: Check Backend Logs

Look for these patterns in backend terminal:

```
[INFO] [Gemini Live Proxy] Client connected
[INFO] [Gemini Live Proxy] Connecting to Gemini WebSocket
[INFO] [Gemini Live Proxy] Using REST API WebSocket endpoint
[INFO] [Gemini Live Proxy] ✅ Successfully connected to Gemini API WebSocket
[INFO] [Gemini Live Proxy] ✅ Setup completed successfully
```

### Step 2: Check Browser Console

Look for these patterns:

```
[Stellar AI] WebSocket URL: ws://localhost:3001/api/gemini-live
[Stellar AI] Using backend WebSocket proxy
Trying model: gemini-2.5-flash-live...
⚠️ WebSocket not available for live models. Skipping to REST API fallback...
🔄 Falling back to REST API streaming...
✅ Success with REST API model: gemini-2.5-flash
```

### Step 3: Check Error Types

**404 Error:**
- Endpoint not found
- May indicate wrong endpoint format
- Or Live models require Vertex AI

**Connection Closed:**
- WebSocket closed before setup
- Usually means endpoint rejected connection
- Frontend should fallback to REST

**Timeout:**
- Request took too long
- Check network connection
- API might be slow

## 🔧 Troubleshooting Steps

### Issue: Still Getting 404

1. **Verify Endpoint:**
   - Should be: `google.ai.generativelanguage.v1beta.GenerativeService`
   - NOT: `google.cloud.aiplatform.v1beta1.LlmBidiService`

2. **Check API Key:**
   - Verify in `backend/.env`: `GEMINI_API_KEY=AIza...`
   - Key should be 39 characters
   - Should start with `AIza`

3. **Check Model Name:**
   - Live models: `gemini-2.5-flash-live`
   - Standard models: `gemini-2.5-flash`

### Issue: Connection Closes Immediately

1. **Check Backend Logs:**
   - Look for error messages
   - Check if API key is being read
   - Verify WebSocket server is running

2. **Check Browser Console:**
   - Look for WebSocket connection errors
   - Check if backend URL is correct
   - Verify CORS is not blocking

### Issue: No Response After Setup

1. **Check Setup Completion:**
   - Backend should log: `Setup completed successfully`
   - Frontend should receive `setupComplete` message

2. **Check Message Flow:**
   - Setup message sent?
   - Client content sent after setup?
   - Server content received?

## 📝 Debug Endpoints

### Backend Debug Endpoints

- `http://localhost:3001/debug/stats` - Error statistics
- `http://localhost:3001/debug/errors` - Recent errors
- `http://localhost:3001/debug/health` - System health

### Log Files

- Location: `backend/logs/debug-YYYY-MM-DD.log`
- Contains: All debug logs with timestamps
- Format: JSON lines

## 🎯 Expected Flow

### Successful WebSocket Connection:

1. Client connects to backend WebSocket
2. Backend connects to Gemini WebSocket
3. Client sends setup message
4. Backend forwards setup to Gemini
5. Gemini responds with `setupComplete`
6. Client sends content message
7. Gemini streams response
8. Response forwarded to client
9. Connection closes normally

### Fallback to REST API:

1. WebSocket connection fails (404)
2. Backend sends error to client
3. Frontend detects WebSocket error
4. Frontend switches to REST API streaming
5. Uses `gemini-2.5-flash` model
6. Gets response via REST
7. Displays response in chat

## 💡 Tips

1. **Enable Verbose Logging:**
   - Backend logs are already verbose
   - Browser console shows all steps
   - Check both for complete picture

2. **Monitor Network Tab:**
   - Check WebSocket connection in browser DevTools
   - Look for failed requests
   - Check response codes

3. **Test Incrementally:**
   - First: Test backend health endpoint
   - Second: Test WebSocket connection
   - Third: Test with actual message

---

**Status:** ✅ Advanced debugging enabled

