# Deploy Price Scraper Function

## 🚀 Quick Deploy

The Cloud Function needs to be redeployed with the updated code that uses `gemini-2.5-flash-live`.

### Option 1: Auto Deploy (Recommended)

```powershell
cd cloud-functions/price-scraper
.\DEPLOY-AUTO.ps1
```

This will:
- Deploy to `europe-west2` region
- Use project `adriano-broadband`
- Set environment variables automatically
- Use the correct API key: `GEMINI_API_KEY_2`
- Enable live models: `USE_GEMINI_LIVE=true`

### Option 2: Manual Deploy

```powershell
cd cloud-functions/price-scraper
.\DEPLOY-NOW.ps1
```

You'll be prompted for your Google Cloud Project ID.

## ✅ Verify Deployment

After deployment, test the function:

```bash
curl "https://europe-west2-adriano-broadband.cloudfunctions.net/broadband-price-scraper?provider=BT"
```

Should return JSON with price data.

## 🔍 Troubleshooting

### If you see errors:

1. **Check function logs:**
   ```bash
   gcloud functions logs read broadband-price-scraper --region=europe-west2 --limit=50
   ```

2. **Verify environment variables:**
   - `GEMINI_API_KEY` should be set
   - `USE_GEMINI_LIVE` should be `true`

3. **Check the function URL:**
   - Should match: `https://europe-west2-adriano-broadband.cloudfunctions.net/broadband-price-scraper`
   - Verify in `broadband-checker.js` line 16

## 📋 Current Configuration

- **Function Name**: `broadband-price-scraper`
- **Entry Point**: `get_broadband_price`
- **Region**: `europe-west2`
- **Runtime**: `python311`
- **Primary Model**: `gemini-2.5-flash-live` (unlimited RPM/RPD)

