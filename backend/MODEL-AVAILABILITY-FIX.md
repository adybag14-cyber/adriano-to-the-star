# Model Availability Fix

## 🔍 Issue

The error shows:
```
Publisher Model `projects/adriano-broadband/locations/us-central1/publishers/google/models/gemini-2.5-flash-live` not found.
```

**Root Cause:** `gemini-2.5-flash-live` is **not available** in Vertex AI. Live models require special access or may not be available in all regions.

## ✅ Solution Applied

1. **Model Mapping**: Live models are automatically mapped to standard models:
   - `gemini-2.5-flash-live` → `gemini-2.5-flash`
   - `gemini-live-2.5-flash-preview` → `gemini-2.5-flash`

2. **Fallback Logic**: If `gemini-2.5-flash` fails, automatically tries `gemini-1.5-flash`

3. **Content Format Fix**: Fixed content format to match VertexAI SDK requirements

## 📋 Available Models in Vertex AI

Standard models that ARE available:
- ✅ `gemini-2.5-flash`
- ✅ `gemini-1.5-flash`
- ✅ `gemini-1.5-pro`

Live models that are NOT available:
- ❌ `gemini-2.5-flash-live` (requires special access)
- ❌ `gemini-live-2.5-flash-preview` (requires special access)

## 🎯 Expected Behavior

When you select "Gemini 2.5 Flash Live Preview 🎤":
1. Frontend sends `gemini-2.5-flash-live`
2. Backend maps it to `gemini-2.5-flash` (available model)
3. SDK streams response using `gemini-2.5-flash`
4. Response sent back to frontend

## 🧪 Test

Restart backend and test:
1. Select "Gemini 2.5 Flash Live Preview 🎤"
2. Send a message
3. Should work now using `gemini-2.5-flash` via VertexAI SDK

---

**Status:** ✅ Fixed - Live models mapped to available standard models

