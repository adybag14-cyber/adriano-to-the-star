# 🚀 Quick Deploy Commands for Cloud Function

## Step 1: Navigate to the Function Directory

```bash
cd cloud-functions/price-scraper
```

## Step 2: Set Your Google Cloud Project

First, you need to know your Google Cloud project ID. If you don't have one, create a project at https://console.cloud.google.com

```bash
# Set your project (replace YOUR_PROJECT_ID with your actual project ID)
gcloud config set project YOUR_PROJECT_ID
```

## Step 3: Deploy the Function

### Option A: Using the deploy script (recommended)

First, edit `deploy.sh` and replace `your-project-id` with your actual project ID, then:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option B: Manual deploy command

```bash
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
    --set-env-vars="GEMINI_API_KEY=GEMINI_API_KEY_2"
```

## Step 4: Get the Function URL

After deployment, get the URL:

```bash
gcloud functions describe broadband-price-scraper \
    --region=europe-west2 \
    --format='value(serviceConfig.uri)'
```

## Step 5: Update broadband-checker.js

Copy the URL from Step 4 and update line 16 in `broadband-checker.js`:

```javascript
this.cloudFunctionUrl = 'YOUR_FUNCTION_URL_HERE';
```

## Prerequisites

1. **Install Google Cloud SDK**: https://cloud.google.com/sdk/docs/install
2. **Authenticate**: `gcloud auth login`
3. **Enable APIs**:
   ```bash
   gcloud services enable cloudfunctions.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

## Troubleshooting

### "No such file or directory"
Make sure you're in the correct directory:
```bash
pwd  # Should show: .../cloud-functions/price-scraper
ls   # Should show: main.py, requirements.txt, deploy.sh
```

### "command not found: gcloud"
Install Google Cloud SDK first:
```bash
# macOS
brew install google-cloud-sdk

# Linux
# Follow: https://cloud.google.com/sdk/docs/install
```

### "Permission denied"
Make the script executable:
```bash
chmod +x deploy.sh
```

