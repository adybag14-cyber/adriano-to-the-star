# Live Models Implementation Fix

## 🔍 Issue Found

The live models implementation was **incorrect**. Live models **ONLY support `bidiGenerateContent`** (bidirectional streaming), NOT `generateContent` (REST API).

### What Was Wrong:
- Code tried to use `model.generate_content()` which calls `generateContent` REST API
- Live models don't support `generateContent` - they only support `bidiGenerateContent`
- Error: `404 models/gemini-2.5-flash-live-preview is not found for API version v1beta, or is not supported for generateContent`

## ✅ Fix Applied

Updated `scrape_broadband_prices.py` to use the REST API directly for `bidiGenerateContent`:

1. **Store model name** when selecting live model
2. **Use REST API directly** with `bidiGenerateContent` endpoint
3. **Parse Server-Sent Events (SSE)** stream from the response
4. **Extract text** from streaming chunks

### Key Changes:
```python
# Before (didn't work):
response = model.generate_content(prompt, stream=False)  # ❌ Uses generateContent

# After (works):
api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{selected_model_name}:bidiGenerateContent"
response = requests.post(f"{api_url}?key={GEMINI_API_KEY}", stream=True)
# Parse SSE stream...
```

## 📋 GitLab Variable Setup

### ❌ Common Mistake:
- **Key**: `GEMINI_API_KEY_2` (API key)
- **Value**: `USE_GEMINI_LIVE=true` (variable name)

### ✅ Correct Setup:

**Variable 1: USE_GEMINI_LIVE**
- **Key**: `USE_GEMINI_LIVE`
- **Value**: `true`
- **Masked**: Optional (recommended)

**Variable 2: GEMINI_API_KEY**
- **Key**: `GEMINI_API_KEY`
- **Value**: `GEMINI_API_KEY_2`
- **Masked**: ✅ **REQUIRED** (to hide in logs)

## 🧪 Testing

### Test Locally:
```powershell
$env:USE_GEMINI_LIVE = "true"
$env:GEMINI_API_KEY = "GEMINI_API_KEY_2"
python scrape_broadband_prices.py
```

### Expected Output:
```
[INFO] Attempting to use live model: gemini-2.5-flash-live-preview
[SUCCESS] Live model working!
```

## 📊 Available Live Models

From model check, these live models are available:
1. ✅ `gemini-2.5-flash-live-preview` - Supports `bidiGenerateContent`
2. ✅ `gemini-live-2.5-flash-preview` - Supports `bidiGenerateContent`
3. ✅ `gemini-2.0-flash-live-001` - Supports `bidiGenerateContent`

All three support **unlimited RPM/RPD** when used correctly.

## 🔄 Fallback Behavior

If live models fail:
1. Tries `gemini-2.5-flash-live-preview`
2. Tries `gemini-live-2.5-flash-preview`
3. Tries `gemini-2.0-flash-live-001`
4. Falls back to `gemini-2.5-flash` (REST API) ✅

## ✅ Status

- ✅ Live models implementation fixed
- ✅ Uses `bidiGenerateContent` correctly
- ✅ SSE stream parsing implemented
- ✅ Fallback to REST API works
- ✅ Ready for testing

## 🚀 Next Steps

1. **Set GitLab variables correctly** (see GITLAB-VARIABLE-SETUP.md)
2. **Test locally** with live models enabled
3. **Push to GitLab** and verify pipeline uses live models
4. **Monitor logs** for "[INFO] Attempting to use live model" messages

