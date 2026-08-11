# 🔍 Live API 404 Error Troubleshooting

## Current Issue

Getting 404 errors when trying to connect to Live API WebSocket endpoints, even with API key authentication.

## ✅ What's Working

- API key authentication detected ✅
- Correct endpoint domain: `generativelanguage.googleapis.com` ✅
- Model names are correct ✅
- Fallback to SDK streaming works ✅

## ❌ What's Not Working

- WebSocket connection returns 404
- All Live model names fail with 404
- Direct WebSocket connection not establishing

## 🔍 Possible Causes

### 1. **Endpoint Path Incorrect**
The Live API might use a different WebSocket path than standard REST API.

**Current endpoint:**
```
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent?key=API_KEY
```

**Possible alternatives:**
- Different service name (e.g., `LiveService` instead of `GenerativeService`)
- Different method name
- Model needs to be in URL path, not just setup message

### 2. **Live API Requires SDK**
The documentation shows using Python SDK (`client.aio.live.connect()`), which suggests:
- Live API might only work through SDK, not direct WebSocket
- SDK handles authentication and connection setup internally
- Direct WebSocket might not be supported for Live API

### 3. **API Key Permissions**
Even though you have access to `gemini-2.5-flash-live` in rate limits:
- API key might not have Live API WebSocket permissions
- Different authentication method might be needed
- Ephemeral tokens might be required (as mentioned in docs)

### 4. **Model Name Format**
The model name in the setup message might need different format:
- Current: `models/gemini-2.5-flash-live`
- Might need: Just `gemini-2.5-flash-live` (without `models/` prefix)
- Or full path: `projects/{project}/locations/{location}/publishers/google/models/{model}`

## 🔧 Solutions to Try

### Solution 1: Use Python SDK (Recommended)
Based on documentation, Live API works best with Python SDK:

```python
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
model = "gemini-2.5-flash-live"

async with client.aio.live.connect(
    model=model,
    config=types.LiveConnectConfig(response_modalities=["TEXT"])
) as session:
    # Use session here
```

**Action:** Create Python backend service for Live API, bridge to Node.js

### Solution 2: Try Different Endpoint Formats
Updated code to try:
1. Model in query parameter: `?key=API_KEY&model=MODEL`
2. Model only in setup message (current)
3. Alternative service path: `LiveService/Connect`

### Solution 3: Check API Key Permissions
Verify your API key has Live API access:
- Check Google AI Studio: https://aistudio.google.com/
- Test Live API there
- If it works there, the issue is endpoint format

### Solution 4: Use Ephemeral Tokens
Documentation mentions ephemeral tokens for client-to-server:
- More secure than API keys
- Required for production
- Might be required for Live API WebSocket

## 📋 Current Status

**Working:**
- ✅ API key authentication
- ✅ SDK streaming fallback
- ✅ System doesn't crash, gracefully falls back

**Not Working:**
- ❌ Direct WebSocket to Live API (404 errors)
- ❌ All Live model names fail

## 🎯 Recommendation

**For Now:**
- ✅ Continue using SDK streaming fallback (works perfectly!)
- ✅ Provides same functionality (streaming responses)
- ✅ No special setup needed

**Future:**
- Consider Python backend service for Live API
- Or wait for official Node.js SDK support
- Or use partner platforms (Daily, LiveKit, Voximplant)

## 📝 Next Steps

1. **Test in Google AI Studio:**
   - Go to: https://aistudio.google.com/
   - Try Live API there
   - If it works, note the endpoint format

2. **Check Documentation:**
   - Look for official WebSocket endpoint format
   - Check if direct WebSocket is supported

3. **Consider Python Service:**
   - Create `backend/live-api-python-service.py`
   - Use official Python SDK
   - Bridge to Node.js via REST/WebSocket

---

**Status:** 404 errors on Live API WebSocket, but fallback works perfectly

**Action:** Continue using SDK streaming (works great!) or implement Python service

