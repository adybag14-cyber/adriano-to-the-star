# 🔧 Fix Setup Message Format for Live API

## 🐛 Issue

**Error:** `code: 1007, reason: 'Invalid resource field value in the request.'`

**Status:**
- ✅ WebSocket connects successfully (endpoint correct)
- ✅ OAuth2 authentication works
- ❌ Setup message model format is incorrect

## ✅ Fix Applied

### Problem
The setup message was using:
```json
{
  "setup": {
    "model": "models/gemini-2.5-flash-live"
  }
}
```

### Solution
For Vertex AI Live API, the model needs to be in full resource path format:
```json
{
  "setup": {
    "model": "projects/{project}/locations/{location}/publishers/google/models/{model}"
  }
}
```

### Implementation
- ✅ Added multiple model format attempts
- ✅ Tries full resource path first
- ✅ Falls back to simpler formats if needed
- ✅ Retries automatically on "Invalid resource field value" error

## 📊 Model Format Priority

1. **Full Resource Path** (most likely):
   ```
   projects/adriano-broadband/locations/us-central1/publishers/google/models/gemini-2.5-flash-live
   ```

2. **Just Model Name**:
   ```
   gemini-2.5-flash-live
   ```

3. **models/ Prefix**:
   ```
   models/gemini-2.5-flash-live
   ```

4. **publishers/ Prefix**:
   ```
   publishers/google/models/gemini-2.5-flash-live
   ```

## 🧪 Testing

**After restart:**

**Expected logs:**
- `[Gemini Live Direct] Setup message attempt { attempt: 1, modelFormat: 'projects/...' }`
- `[Gemini Live Direct] Setup complete, sending content` ✅
- `[Gemini Live Direct] ✅ WebSocket succeeded` ✅

**If first format fails:**
- `[Gemini Live Direct] Retrying with different model format` ✅
- Automatically tries next format

---

**Status:** ✅ **Fix Applied - Restart Backend to Test**

