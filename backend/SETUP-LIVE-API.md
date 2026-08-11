# Setup Guide: Gemini Live API Models

## 📋 Prerequisites

1. **Google Cloud Project** ✅ (You have: `adriano-broadband`)
2. **Vertex AI Enabled** ✅ (Already enabled)
3. **Service Account** ✅ (Already created: `stellar-ai-service`)
4. **Live API Access** ⚠️ (Need to request from Google)

## 🔑 Step 1: Request Live API Access

Live models are in **Private GA** (General Availability). You need to:

1. **Contact Google Support:**
   - Go to [Google Cloud Support](https://cloud.google.com/support)
   - Create a support case
   - Request access to: `gemini-live-2.5-flash` or `gemini-2.0-flash-live-preview`

2. **Or Contact Your Account Representative:**
   - If you have a Google Cloud account manager
   - Request access to Live API models

3. **Wait for Approval:**
   - Google will review your request
   - You'll receive notification when approved

## 🐍 Step 2: Install Python SDK

Once you have access, install the Google Gen AI SDK:

```bash
# Install Python SDK
pip install --upgrade google-genai

# Verify installation
python -c "from google import genai; print('✅ SDK installed')"
```

## ⚙️ Step 3: Configure Environment

Update `backend/.env`:

```env
# Existing config
GOOGLE_CLOUD_PROJECT=adriano-broadband
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./stellar-ai-key.json

# Add for Live API
GOOGLE_GENAI_USE_VERTEXAI=True
```

## 🧪 Step 4: Test Live API

Test if Live API works:

```bash
cd backend
python live-api-service.py gemini-2.0-flash-live-preview-04-09 "Hello, test message"
```

If you get an error about model not found, you don't have access yet.

## 🔧 Step 5: Integrate with Backend

Once Live API works, we can:
1. Create a Python service that handles Live API
2. Bridge it to the Node.js backend
3. Route Live model requests to Python service

## 📝 Current Status

**What Works:**
- ✅ Vertex AI with standard models (`gemini-2.5-flash`, `gemini-1.5-flash`)
- ✅ REST API fallback (automatic)
- ✅ SDK streaming (working)

**What Needs Access:**
- ⏳ Live API models (need Google approval)
- ⏳ Python SDK setup (once access is granted)

## 🎯 Recommendation

**For Now:**
- ✅ Use REST API fallback (works perfectly)
- ✅ Standard models via VertexAI SDK (working)

**When You Get Access:**
- Install Python SDK
- Test with `live-api-service.py`
- Integrate with Node.js backend

---

**Status:** Waiting for Live API access approval

**Action Required:** Request access from Google Cloud Support

