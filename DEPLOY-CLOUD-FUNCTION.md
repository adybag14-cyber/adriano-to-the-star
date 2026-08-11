# 🚀 Deploy Cloud Function for Real-Time Price Checking

## Overview

The broadband checker page has two price sources:

1. **Static Prices** (✅ Working): Updated during CI/CD deployment using Gemini
2. **Real-Time Prices** (Needs Deployment): Live prices when users click "Check Live Price" button

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** installed (`gcloud` CLI)
3. **Gemini API Key**: `GEMINI_API_KEY_2` (already have this)

## Quick Deploy

### Option 1: Using PowerShell Script

```powershell
cd C:\Users\adyba\adriano-to-the-star-clean
.\deploy-function.ps1
```

When prompted:
- **Gemini API Key**: `GEMINI_API_KEY_2`
- **Browserless Key**: (optional, can skip or use empty string)

### Option 2: Manual Deploy

```powershell
cd cloud-functions\price-scraper

gcloud functions deploy broadband-scraper `
    --runtime python311 `
    --trigger-http `
    --allow-unauthenticated `
    --region europe-west2 `
    --source . `
    --entry-point get_broadband_price `
    --set-env-vars "GEMINI_API_KEY=GEMINI_API_KEY_2"
```

## After Deployment

1. **Copy the Function URL** from the deployment output
2. **Update `broadband-checker.js`** line 16:
   ```javascript
   this.cloudFunctionUrl = 'YOUR_FUNCTION_URL_HERE';
   ```

## Testing

1. Visit your broadband checker page
2. Click "🔄 Check Live Price" on any provider
3. Should see real-time prices extracted by Gemini!

## Current Status

- ✅ Frontend code ready
- ✅ Cloud Function code ready with Gemini integration
- ⚠️ Cloud Function needs to be deployed
- ⚠️ Function URL needs to be updated in `broadband-checker.js`

## Notes

- The function uses Gemini 2.5 Flash for fast, accurate price extraction via REST API
- Note: Live models (flash-live) are for streaming APIs only, not REST API generateContent
- Prices are cached for 30 minutes to reduce API calls
- Falls back to regex if Gemini fails
- CORS is enabled for browser requests

