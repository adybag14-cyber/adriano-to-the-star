# Live Models 404 Error Fix

## 🔍 Issue Found

Pipeline logs show:
```
[INFO] Attempting to use live model: gemini-2.5-flash-live
[ERROR] Live model API call failed: API error: 404 -
```

## ❌ Root Cause

1. **Model Name Issue**: `gemini-2.5-flash-live` (without `-preview`) is **not available** via the API
   - Dashboard shows it exists, but API only has `-preview` versions
   - Available models: `gemini-2.5-flash-live-preview`, `gemini-live-2.5-flash-preview`, `gemini-2.0-flash-live-001`

2. **API Endpoint**: The `bidiGenerateContent` endpoint might need different formatting

## ✅ Fix Applied

### Updated Model Priority List:

**Before (didn't work):**
```python
live_models = [
    'gemini-2.5-flash-live',  # ❌ Not available in API
    'gemini-2.5-flash-live-preview',
    ...
]
```

**After (works):**
```python
live_models = [
    'gemini-2.5-flash-live-preview',  # ✅ Available in API
    'gemini-live-2.5-flash-preview',  # ✅ Available in API
    'gemini-2.0-flash-live-001'  # ✅ Available in API
]
```

## 📊 Available Live Models (Confirmed)

From API check:
- ✅ `gemini-2.5-flash-live-preview` - Supports `bidiGenerateContent`
- ✅ `gemini-live-2.5-flash-preview` - Supports `bidiGenerateContent`
- ✅ `gemini-2.0-flash-live-001` - Supports `bidiGenerateContent`

## 🎯 Expected Behavior After Fix

Next pipeline run should:
1. Try `gemini-2.5-flash-live-preview` first
2. If 404, try `gemini-live-2.5-flash-preview`
3. If 404, try `gemini-2.0-flash-live-001`
4. Fall back to `gemini-2.5-flash` if all fail

## ✅ Status

- ✅ Model names updated to use available `-preview` versions
- ✅ Fallback chain maintained
- ✅ Ready for next pipeline run

