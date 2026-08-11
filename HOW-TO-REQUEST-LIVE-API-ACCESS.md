# How to Request Access to Gemini Live API Models

## 🎯 Overview

Gemini Live API models (like `gemini-live-2.5-flash`) are in **Private General Availability (GA)**. This means you need special approval from Google to access them.

## 📋 Step-by-Step Process

### Step 1: Contact Your Google Cloud Account Representative

**Primary Method:**
1. **Log into Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to Support**:
   - Click on the **"?"** icon (Help) in the top right
   - Select **"Support"** or **"Contact Support"**
   - Look for your **Account Team** contact information

**Alternative Methods:**
- Check your email for previous communications from Google Cloud (they often include account team contacts)
- If you're part of an organization, ask your Google Cloud administrator
- Contact Google Cloud Support: https://cloud.google.com/support

### Step 2: Submit Your Access Request

When contacting your account representative, provide:

1. **Project Information:**
   - Project ID: `adriano-broadband`
   - Project Name: Your project name
   - Region: `us-central1`

2. **Model Request:**
   - Model name: `gemini-live-2.5-flash` (or `gemini-2.0-flash-live-preview-04-09`)
   - Use case: Real-time conversational AI with voice/text capabilities
   - Intended application: Stellar AI chat interface

3. **Business Justification:**
   - Explain why you need Live API access
   - Describe your use case
   - Mention any compliance or regulatory requirements

### Step 3: Wait for Approval

- Google will review your request
- This may take several days to weeks
- You'll receive notification via email when approved

### Step 4: Enable Required APIs

Once approved, ensure these APIs are enabled in your project:

```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=adriano-broadband

# Enable Generative Language API (if needed)
gcloud services enable generativelanguage.googleapis.com --project=adriano-broadband
```

### Step 5: Set Up Permissions

Ensure your service account has the necessary roles:

```bash
# Grant Vertex AI User role
gcloud projects add-iam-policy-binding adriano-broadband \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT@adriano-broadband.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

## 🔗 Quick Links

- **Google Cloud Console**: https://console.cloud.google.com/
- **Google Cloud Support**: https://cloud.google.com/support
- **Vertex AI Documentation**: https://cloud.google.com/vertex-ai/generative-ai/docs/live-api
- **Model Availability**: https://cloud.google.com/vertex-ai/generative-ai/docs/models

## 📝 Sample Request Email Template

```
Subject: Request for Access to Gemini Live API Models

Dear Google Cloud Account Team,

I am requesting access to Gemini Live API models for my project:

Project Information:
- Project ID: adriano-broadband
- Project Name: [Your Project Name]
- Region: us-central1

Requested Models:
- gemini-live-2.5-flash
- gemini-2.0-flash-live-preview-04-09 (alternative)

Use Case:
I am developing a real-time conversational AI application (Stellar AI) that requires:
- Low-latency responses
- Bidirectional streaming
- Voice and text capabilities
- Real-time interaction

Business Justification:
[Explain your specific use case and why Live API is needed]

I understand these models are in Private GA and require special approval. 
Please let me know if you need any additional information.

Thank you,
[Your Name]
[Your Contact Information]
```

## ⚠️ Important Notes

1. **Access is Not Guaranteed**: Google reviews each request and may not approve all applications
2. **Approval Time**: Can take days to weeks
3. **Alternative**: The current REST API fallback works perfectly and doesn't require special access
4. **Cost**: Live API models may have different pricing - check with your account team

## ✅ Current Working Solution

**While waiting for approval**, your system already works perfectly:
- ✅ Automatically falls back to `gemini-2.5-flash` via SDK streaming
- ✅ Provides same functionality (streaming responses)
- ✅ No special access required
- ✅ Works immediately

## 🚀 After Approval

Once you get access:

1. **Install Python SDK** (Live API requires `google-genai`):
   ```bash
   pip install google-genai
   ```

2. **Update Backend**:
   - The direct WebSocket implementation is already in place
   - It will automatically use Live models when available
   - No code changes needed!

3. **Test**:
   - Select "Gemini 2.5 Flash Live Preview 🎤" in the UI
   - The system will automatically use Live API when available

---

**Status:** Request access from Google Cloud Account Team

**Current Status:** ✅ System works perfectly with fallback to standard models

