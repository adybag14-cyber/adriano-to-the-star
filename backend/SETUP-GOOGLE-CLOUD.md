# Setting Up Google Cloud Vertex AI for Gemini Live Models

## 🔍 Why WebSocket Doesn't Work

**The Problem:**
- Gemini Live models (`gemini-2.5-flash-live`) **require Google Cloud Vertex AI**
- REST API keys **only work** with standard models via REST API
- WebSocket Live API (`BidiGenerateContent`) **requires Vertex AI**, not REST API keys

**The Solution:**
Set up Google Cloud Vertex AI to use Live models via WebSocket.

## 📋 Prerequisites

1. Google Cloud account
2. A Google Cloud project
3. Billing enabled (Vertex AI has free tier, but billing must be enabled)

## 🚀 Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "stellar-ai")
4. Click "Create"

### Step 2: Enable Vertex AI API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Vertex AI API"
3. Click "Enable"

### Step 3: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click "Create Service Account"
3. Enter name: `stellar-ai-service`
4. Click "Create and Continue"
5. Grant role: **Vertex AI User**
6. Click "Continue" → "Done"

### Step 4: Create Service Account Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click "Add Key" → "Create new key"
4. Choose **JSON** format
5. Click "Create"
6. **Save the downloaded JSON file** (e.g., `stellar-ai-key.json`)

### Step 5: Install Google Cloud SDK (Optional but Recommended)

**Windows:**
```powershell
# Download and install from:
# https://cloud.google.com/sdk/docs/install
```

**Or use npm package:**
```bash
npm install @google-cloud/aiplatform
```

### Step 6: Configure Backend

1. **Place the service account key file** in the `backend` directory:
   ```
   backend/
     stellar-ai-key.json  (your downloaded key file)
   ```

2. **Update `backend/.env`** file:
   ```env
   # Google Cloud Vertex AI Configuration
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=./stellar-ai-key.json
   
   # Keep your REST API key for fallback
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```

3. **Install dependencies** (if not already installed):
   ```bash
   cd backend
   npm install @google-cloud/aiplatform
   ```

### Step 7: Restart Backend Server

```bash
cd backend
.\start-server.bat
```

You should see:
```
[INFO] Google Cloud Vertex AI initialized { project: 'your-project-id', location: 'us-central1' }
```

## ✅ Verification

### Check Backend Logs

When you start the server, you should see:
```
[INFO] Google Cloud Vertex AI initialized
[Gemini Live Proxy] Using Vertex AI WebSocket endpoint
```

Instead of:
```
[INFO] Google Cloud not configured, using API key method
[Gemini Live Proxy] Using REST API WebSocket endpoint (may not work for Live models)
```

### Test Live Model

1. Open: http://localhost:8000/stellar-ai.html
2. Select "Gemini 2.5 Flash Live Preview 🎤"
3. Send a message
4. Should work via WebSocket now! ✅

## 🔧 Alternative: Use REST API (Current Working Solution)

If you don't want to set up Google Cloud, the current setup **automatically falls back to REST API**:
- WebSocket fails (404) → Frontend detects error
- Frontend automatically uses REST API with `gemini-2.5-flash`
- Works perfectly, just not via WebSocket

## 💰 Cost Considerations

**Vertex AI Pricing:**
- **Free Tier:** $0 for first 60 requests/minute
- **After Free Tier:** Very affordable pricing
- **Live Models:** May have different pricing, check [Vertex AI Pricing](https://cloud.google.com/vertex-ai/pricing)

**REST API (Current):**
- **Free Tier:** 15 requests/minute
- **Paid:** $0.00025 per 1K characters

## 🎯 Recommendation

**For Development:**
- Use REST API fallback (current setup) - **It works!**
- No setup needed, just works

**For Production with Live Models:**
- Set up Google Cloud Vertex AI
- Get unlimited RPM/RPD with Live models
- Better for high-volume usage

## 📝 Troubleshooting

### Error: "Google Cloud not configured"
- Check `GOOGLE_CLOUD_PROJECT` in `.env`
- Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Verify service account key file exists

### Error: "Permission denied"
- Ensure service account has "Vertex AI User" role
- Check that Vertex AI API is enabled

### Error: "Project not found"
- Verify project ID is correct
- Ensure project exists in Google Cloud Console

---

**Status:** ✅ Setup instructions ready

**Current Status:** REST API fallback works perfectly - Google Cloud is optional for Live WebSocket support

