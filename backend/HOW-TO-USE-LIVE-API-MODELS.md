# How to Use Gemini Live API Models

## 🔍 Current Situation

**Problem:** `gemini-2.5-flash-live` is **not available** in Vertex AI because:
1. Live models require **special access** (Private GA - need to request from Google)
2. Live models use a **different SDK** (`google-genai`, not `@google-cloud/vertexai`)
3. Live models may have **different model names** (e.g., `gemini-2.0-flash-live-preview-04-09`)

## ✅ Solution: Use Google Gen AI SDK

Live API models require the **Google Gen AI SDK** (`google-genai`), not the VertexAI SDK.

### Step 1: Request Access

Live models are in **Private GA** - you need to:
1. Contact your **Google account team representative**
2. Request access to `gemini-live-2.5-flash` or `gemini-2.0-flash-live-preview`
3. Wait for approval

### Step 2: Install Google Gen AI SDK

**For Python:**
```bash
pip install --upgrade google-genai
```

**For Node.js:**
Currently, the `google-genai` SDK is primarily Python-based. For Node.js, you may need to:
- Use Python backend for Live API
- Or wait for Node.js SDK support
- Or use REST API fallback (current working solution)

### Step 3: Configure Environment

```bash
export GOOGLE_CLOUD_PROJECT=adriano-broadband
export GOOGLE_CLOUD_LOCATION=global  # or us-central1
export GOOGLE_GENAI_USE_VERTEXAI=True
export GOOGLE_APPLICATION_CREDENTIALS=./stellar-ai-key.json
```

### Step 4: Use Live API (Python Example)

```python
from google import genai
from google.genai.types import Content, HttpOptions, LiveConnectConfig, Modality, Part

# Initialize client
client = genai.Client(
    http_options=HttpOptions(api_version="v1beta1")
)

# Connect to Live API
model_id = "gemini-2.0-flash-live-preview-04-09"  # or gemini-live-2.5-flash

async with client.aio.live.connect(
    model=model_id,
    config=LiveConnectConfig(response_modalities=[Modality.TEXT]),
) as session:
    # Send text input
    text_input = "Hello, how are you?"
    await session.send_client_content(
        turns=Content(role="user", parts=[Part(text=text_input)])
    )

    # Receive response
    response = []
    async for message in session.receive():
        if message.text:
            response.append(message.text)

    print("".join(response))
```

## 🔧 Alternative: Node.js Implementation

Since `google-genai` is primarily Python, for Node.js you have options:

### Option 1: Python Backend Service
Create a Python service that handles Live API and communicate via REST/WebSocket.

### Option 2: Use REST API Fallback (Current)
The current setup automatically falls back to REST API with `gemini-2.5-flash`, which works perfectly.

### Option 3: Wait for Node.js SDK
Google may release Node.js support for `google-genai` SDK in the future.

## 📋 Available Live Models

Once you have access, these models may be available:
- `gemini-2.0-flash-live-preview-04-09`
- `gemini-live-2.5-flash`
- `gemini-live-2.5-flash-preview`

## 🎯 Current Working Solution

**Right now, the best approach is:**
1. ✅ Use REST API fallback (already working)
2. ✅ Maps live models to `gemini-2.5-flash` (available in Vertex AI)
3. ✅ Provides same functionality via streaming

## 🚀 If You Get Live API Access

If you get approved for Live API access:

1. **Install Python SDK:**
   ```bash
   pip install google-genai
   ```

2. **Create Python Backend Service:**
   - Create `backend/live-api-service.py`
   - Handle Live API WebSocket connections
   - Bridge to Node.js backend

3. **Update Backend:**
   - Detect Live API availability
   - Route to Python service for Live models
   - Keep Node.js for standard models

## 📝 Summary

**To use Live API models:**
1. ✅ Request access from Google (Private GA)
2. ✅ Install `google-genai` SDK (Python)
3. ✅ Use Python backend for Live API
4. ✅ Or wait for Node.js SDK support

**Current Status:**
- ✅ REST API fallback works perfectly
- ✅ Standard models work via VertexAI SDK
- ⏳ Live models require special access + Python SDK

---

**Status:** Live API requires special access and Python SDK

**Recommendation:** Use REST API fallback (current working solution) until Live API access is approved

