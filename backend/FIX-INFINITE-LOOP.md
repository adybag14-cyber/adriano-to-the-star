# 🔧 Fix Infinite Loop - Model Not Found Error

## 🐛 Issue

**Problem:** Code stuck in infinite loop trying the same model format
- Error: `code: 1008, reason: 'Publisher Model ... not found'`
- Always trying format attempt 1 (full resource path)
- Not moving to next format or next model

## ✅ Fix Applied

### Problem
The close handler was only checking for:
- `1007` with "Invalid resource field value"
- `1007` with "Unknown name"

But NOT checking for:
- `1008` with "not found" (Publisher Model not found)

### Solution
Added handling for "Publisher Model not found" error (code 1008):

1. **Detect "not found" error:**
   ```javascript
   if (code === 1008 && reasonStr.includes('not found') && !setupComplete && formatAttempt < setupFormats.length - 1)
   ```

2. **Reject with special error code:**
   ```javascript
   reject(new Error(`MODEL_NOT_FOUND:${formatAttempt}:${reasonStr}`));
   ```

3. **Handle in outer loop:**
   ```javascript
   else if ((error.message && (error.message.startsWith('MODEL_NOT_FOUND:') || error.message.startsWith('INVALID_MODEL_FORMAT:'))) && formatAttempt < maxFormatAttempts - 1)
   ```

## 🔄 Retry Flow (Fixed)

**Before (broken):**
- Gets "not found" error → Doesn't detect it → Tries same format again → Infinite loop ❌

**After (fixed):**
- Gets "not found" error → Detects it → Tries next format → Moves to next model if all formats fail ✅

## 📊 Model Format Priority

1. **Full Resource Path:**
   ```
   projects/.../models/gemini-2.5-flash-live
   ```
   → If "not found", try format 2

2. **Just Model Name:**
   ```
   gemini-2.5-flash-live
   ```
   → If "not found", try format 3

3. **models/ Prefix:**
   ```
   models/gemini-2.5-flash-live
   ```
   → If "not found", try format 4

4. **publishers/ Prefix:**
   ```
   publishers/google/models/gemini-2.5-flash-live
   ```
   → If "not found", try next model name

## 🧪 Testing

**After restart:**

**Expected logs:**
- `[Gemini Live Direct] Model not found, will retry with next format { formatAttempt: 1 }`
- `[Gemini Live Direct] Retrying with different model format { formatAttempt: 2 }`
- Eventually tries all formats, then moves to next model name
- No more infinite loops ✅

**Success indicators:**
- Tries all 4 formats for each model
- Moves to next model when formats exhausted
- Eventually finds a working model or falls back to SDK streaming ✅

---

**Status:** ✅ **Infinite Loop Fixed - Restart to Test!**

