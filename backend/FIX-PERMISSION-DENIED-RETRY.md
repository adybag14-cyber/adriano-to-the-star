# 🔧 Fix Permission Denied Retry Logic

## 🐛 Issue

**Problem:** Code stuck in infinite loop on format 2
- Format 1: "Publisher Model not found" → Moves to format 2 ✅
- Format 2: "Permission denied on resource project gemini-2.5-flash-live" → Stuck, keeps retrying format 2 ❌
- Not moving to format 3 or 4

## ✅ Fix Applied

### Problem
The retry logic only handled:
- "not found" errors
- "Invalid resource field value" errors

But NOT:
- "Permission denied" errors

### Solution
Added handling for "Permission denied" errors:

1. **Detect "Permission denied" error:**
   ```javascript
   if (code === 1008 && (reasonStr.includes('not found') || reasonStr.includes('Permission denied')) && !setupComplete && formatAttempt < setupFormats.length - 1)
   ```

2. **Handle in outer loop:**
   ```javascript
   else if (error.message && error.message.includes('Permission denied') && formatAttempt < maxFormatAttempts - 1)
   ```

## 🔄 Retry Flow (Fixed)

**Before (broken):**
- Format 1: "not found" → Format 2 ✅
- Format 2: "Permission denied" → Stuck, retries format 2 infinitely ❌

**After (fixed):**
- Format 1: "not found" → Format 2 ✅
- Format 2: "Permission denied" → Format 3 ✅
- Format 3: If fails → Format 4 ✅
- Format 4: If fails → Next model ✅

## 📊 Model Format Priority

1. **Full Resource Path:**
   ```
   projects/.../models/gemini-2.5-flash-live
   ```
   → If "not found" or "Permission denied", try format 2

2. **Just Model Name:**
   ```
   gemini-2.5-flash-live
   ```
   → If "Permission denied", try format 3

3. **models/ Prefix:**
   ```
   models/gemini-2.5-flash-live
   ```
   → If fails, try format 4

4. **publishers/ Prefix:**
   ```
   publishers/google/models/gemini-2.5-flash-live
   ```
   → If fails, try next model name

## 🧪 Testing

**After restart:**

**Expected logs:**
- `[Gemini Live Direct] Model error, will retry with next format { errorType: 'Permission denied', formatAttempt: 2 }`
- `[Gemini Live Direct] Permission denied, retrying with different model format { formatAttempt: 3 }`
- Eventually tries all 4 formats, then moves to next model name
- No more infinite loops ✅

**Success indicators:**
- Tries all 4 formats for each model
- Moves to next model when formats exhausted
- Eventually finds a working model or falls back to SDK streaming ✅

---

**Status:** ✅ **Permission Denied Retry Logic Fixed - Restart to Test!**


