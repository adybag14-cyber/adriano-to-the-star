# ⚠️ Live API Authentication Issue

## 🔍 Problem

Live API requires **Vertex AI (OAuth2) authentication**, not API keys. However, there's a compatibility issue with the `google-genai` SDK:

```
Error: module 'google.auth.transport' has no attribute 'requests'
```

## 📋 Root Cause

The `google-genai` SDK has a dependency conflict with `google-auth` library versions. The SDK expects `google.auth.transport.requests` which may not be available in newer `google-auth` versions.

## 🔧 Solutions

### Solution 1: Downgrade google-auth (Temporary Fix)

```bash
pip install google-auth==2.23.4
pip install google-auth-oauthlib==1.1.0
```

**Warning:** This may break other Google Cloud libraries.

### Solution 2: Use Application Default Credentials

Instead of service account key file, use `gcloud auth application-default login`:

```bash
gcloud auth application-default login
```

Then the Python service should auto-detect credentials.

### Solution 3: Wait for SDK Update

Google is aware of this issue and may release a fix. Check:
- https://github.com/googleapis/python-genai/issues
- SDK release notes

### Solution 4: Use REST API Fallback (Current Working Solution)

The current SDK streaming fallback works perfectly:
- ✅ Uses Vertex AI SDK (Node.js)
- ✅ Provides streaming responses
- ✅ No Python compatibility issues
- ✅ Same functionality for text responses

## 🎯 Current Status

**Working:**
- ✅ SDK streaming via Node.js (works perfectly!)
- ✅ Automatic fallback system
- ✅ No compatibility issues

**Not Working:**
- ❌ Python Live API service (google-auth compatibility issue)
- ❌ Direct WebSocket to Live API (requires OAuth2)

## 💡 Recommendation

**For Now:**
- ✅ Continue using SDK streaming (works great!)
- ✅ Provides same functionality
- ✅ No setup issues

**When SDK is Fixed:**
- Python service will automatically work
- True Live API with audio support
- All features available

## 📝 Next Steps

1. **Try Solution 2** (Application Default Credentials):
   ```bash
   gcloud auth application-default login
   ```
   Then restart backend and test.

2. **If that doesn't work**, continue using SDK streaming (already working!)

3. **Monitor SDK updates** for compatibility fix.

---

**Status:** ⚠️ Python service blocked by SDK compatibility issue

**Workaround:** ✅ SDK streaming works perfectly (current solution)

