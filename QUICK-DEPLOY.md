# ⚡ Quick Deploy - Copy & Paste Commands

## If you're being prompted for runtime selection:

**Type `19` and press Enter** (for python311)

Or use this non-interactive command instead:

## Complete Deploy Command (Non-Interactive)

```bash
# Navigate to the function directory
cd cloud-functions/price-scraper

# Deploy (replace YOUR_PROJECT_ID with your actual Google Cloud project ID)
gcloud functions deploy broadband-price-scraper \
    --gen2 \
    --runtime=python311 \
    --region=europe-west2 \
    --source=. \
    --entry-point=get_broadband_price \
    --trigger-http \
    --allow-unauthenticated \
    --memory=256MB \
    --timeout=60s \
    --max-instances=10 \
    --set-env-vars="GEMINI_API_KEY=GEMINI_API_KEY_2" \
    --quiet
```

## Alternative: Use 1st Gen Functions (No Interactive Prompts)

If you prefer 1st gen functions (simpler, no prompts):

```bash
cd cloud-functions/price-scraper

gcloud functions deploy broadband-price-scraper \
    --no-gen2 \
    --runtime=python311 \
    --region=europe-west2 \
    --source=. \
    --entry-point=get_broadband_price \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars="GEMINI_API_KEY=GEMINI_API_KEY_2"
```

## After Deployment

1. Get the function URL:
```bash
gcloud functions describe broadband-price-scraper \
    --region=europe-west2 \
    --format='value(serviceConfig.uri)'
```

2. Update `broadband-checker.js` line 16 with the URL

