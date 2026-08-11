# 🔧 Client Content Format Fix

## 🎉 Great Progress!

**One model got past setup!** ✅
- `gemini-2.0-flash-live-preview-04-09` successfully completed setup
- WebSocket connected and setup message accepted
- **New error:** Client content format is wrong

## 🐛 New Issue

**Error:** `Invalid JSON payload received. Unknown name "parts" at 'client_content': Cannot find field.`

**Status:**
- ✅ WebSocket connects
- ✅ OAuth2 works
- ✅ Setup message accepted (for one model!)
- ❌ Client content message format incorrect

## ✅ Fix Applied

### Problem
The client content was using:
```json
{
  "clientContent": {
    "parts": [{ "text": "..." }]
  }
}
```

But Live API expects a different format.

### Solution
Implemented retry logic that tries 4 different client content formats:

1. **Standard (parts array)** - Current format
   ```json
   {
     "clientContent": {
       "parts": [{ "text": "..." }]
     }
   }
   ```

2. **Turns array** (Most likely for Live API)
   ```json
   {
     "clientContent": {
       "turns": [{
         "role": "user",
         "parts": [{ "text": "..." }]
       }]
     }
   }
   ```

3. **Direct content array**
   ```json
   {
     "clientContent": [{
       "role": "user",
       "parts": [{ "text": "..." }]
     }]
   }
   ```

4. **Simple text field**
   ```json
   {
     "clientContent": {
       "text": "..."
     }
   }
   ```

## 🔄 Retry Logic

**Nested retry loops:**
1. **Outer loop:** Tries different model formats (4 formats)
2. **Inner loop:** Tries different client content formats (4 formats)
3. **Total combinations:** 16 attempts per model

**When "Unknown name parts" error occurs:**
- Detects error in `onclose` handler
- Increments client content format attempt
- Retries with next client content format
- If all client content formats fail, tries next model format

## 🧪 Testing

**After restart:**

**Expected logs:**
- `[Gemini Live Direct] Setup complete, sending content` ✅
- `[Gemini Live Direct] Sending client content { formatAttempt: 1, format: 'parts array' }`
- If fails: `[Gemini Live Direct] Retrying with different client content format { clientContentFormatAttempt: 2 }`
- Eventually: `[Gemini Live Direct] ✅ Success with model { clientContentFormatAttempt: X }`

**Success indicators:**
- `[Gemini Live Direct] Setup complete, sending content` ✅
- Client content accepted (no "Unknown name" error) ✅
- Response received from Live API ✅

---

**Status:** ✅ **Client Content Format Retry Logic Implemented - Restart to Test!**

