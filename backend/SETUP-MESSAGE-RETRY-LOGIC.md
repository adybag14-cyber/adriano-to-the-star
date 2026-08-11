# 🔧 Setup Message Retry Logic - Fixed

## 🐛 Issue

**Error:** `code: 1007, reason: 'Invalid resource field value in the request.'`

**Status:**
- ✅ WebSocket connects successfully
- ✅ OAuth2 authentication works
- ❌ Setup message model format rejected

## ✅ Fix Applied

### Problem
The setup message was using one model format, and if it failed, we didn't retry with different formats.

### Solution
Implemented retry logic that:
1. Tries 4 different model name formats
2. Automatically retries on "Invalid resource field value" error
3. Uses the format attempt index to try next format

### Model Formats (in order)

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

## 🔄 Retry Logic

**When "Invalid resource field value" error occurs:**
1. Detects the error in `onclose` handler
2. Increments format attempt counter
3. Rejects with special error code
4. Outer loop catches and retries with next format
5. Continues until one format works or all formats tried

## 🧪 Testing

**After restart:**

**Expected logs:**
- `[Gemini Live Direct] Setup message attempt { attempt: 1, modelFormat: 'projects/...' }`
- If fails: `[Gemini Live Direct] Retrying with different model format { retryCount: 1 }`
- Eventually: `[Gemini Live Direct] ✅ Success with model { formatAttempt: X }`

**Success indicators:**
- `[Gemini Live Direct] Setup complete, sending content` ✅
- `[Gemini Live Direct] ✅ Success with model` ✅
- No more "Invalid resource field value" errors ✅

---

**Status:** ✅ **Retry Logic Implemented - Restart Backend to Test**

