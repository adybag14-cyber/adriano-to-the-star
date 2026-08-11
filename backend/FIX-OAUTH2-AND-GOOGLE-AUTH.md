# 🔧 Fix OAuth2 and Google-Auth Compatibility Issues

## 📋 Issues to Fix

1. **OAuth2 for Live API WebSocket** - Need Vertex AI access tokens
2. **Google-Auth Compatibility** - Python SDK compatibility issue
3. **SDK with Live Models** - Currently falls back to standard models

## 🔧 Solution 1: Fix OAuth2 for Direct WebSocket

### Current Issue
- Direct WebSocket gets 400 errors with API keys
- Live API WebSocket requires Vertex AI OAuth2 tokens

### Fix: Use Vertex AI Access Tokens

The code already has `getAccessToken()` function. We need to:
1. Prioritize Vertex AI when available
2. Use access tokens for Live API WebSocket
3. Only use API keys for REST API

## 🔧 Solution 2: Fix Google-Auth Compatibility

### Current Issue
```
Error: module 'google.auth.transport' has no attribute 'requests'
```

### Fix Options

**Option A: Downgrade google-auth (Quick Fix)**
```bash
pip install google-auth==2.23.4
pip install google-auth-oauthlib==1.1.0
```

**Option B: Use Application Default Credentials**
```bash
gcloud auth application-default login
```

**Option C: Wait for SDK Update**
- Google is aware of the issue
- May be fixed in future SDK versions

## 🔧 Solution 3: Use Live Models with SDK

### Current Behavior
- SDK streaming uses `gemini-2.5-flash` (standard model)
- Doesn't use Live models even when available

### Fix: Try Live Models First
- Check if Live model is available in Vertex AI
- Use Live model if available
- Fallback to standard model if not

## 📝 Implementation Steps

Let me implement these fixes now...

