# Broadband Price Scraper - Google Cloud Function

Real-time broadband price scraping API for UK providers.

## Features

- 🚀 **Real-time price scraping** from provider websites
- 🔄 **Uswitch fallback** when direct scraping fails
- ⚡ **Fast response** with 15-second timeout
- 🌐 **CORS enabled** for browser requests
- 📊 **Multiple price extraction patterns** for accuracy

## Setup Instructions

### 1. Prerequisites

1. **Google Cloud Account** - Create one at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud SDK** - Install from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)
3. **Enable APIs** - Enable Cloud Functions and Cloud Build APIs

### 2. Initial Setup

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create YOUR_PROJECT_ID --name="Broadband Checker"

# Set the project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### 3. Deploy the Function

#### Windows (PowerShell):
```powershell
cd cloud-functions/price-scraper

# Edit deploy.ps1 and set your PROJECT_ID
notepad deploy.ps1

# Run deployment
.\deploy.ps1
```

#### Linux/Mac (Bash):
```bash
cd cloud-functions/price-scraper

# Edit deploy.sh and set your PROJECT_ID
nano deploy.sh

# Make executable and run
chmod +x deploy.sh
./deploy.sh
```

### 4. Update Frontend

After deployment, you'll get a URL like:
```
https://europe-west2-YOUR_PROJECT_ID.cloudfunctions.net/broadband-price-scraper
```

Update `broadband-checker.js` line ~17:
```javascript
this.cloudFunctionUrl = 'https://europe-west2-YOUR_PROJECT_ID.cloudfunctions.net/broadband-price-scraper';
```

## API Usage

### Get Single Provider Price

```
GET /?provider=BT
GET /?provider=Sky&url=https://www.sky.com/broadband
```

**Response:**
```json
{
  "provider": "BT",
  "success": true,
  "deals": [
    {
      "price": "29.99",
      "speed": "100 Mbps",
      "name": "Deal 1"
    }
  ],
  "source": "direct"
}
```

### Error Response

```json
{
  "provider": "Unknown Provider",
  "success": false,
  "deals": [],
  "error": "No price data found"
}
```

## Supported Providers

The function has optimized URL mappings for major UK ISPs:
- BT, Sky, Virgin Media, TalkTalk, Vodafone
- Plusnet, EE, NOW, Three
- Hyperoptic, Community Fibre, Gigaclear
- Zen, YouFibre, Toob, Trooli
- Lightning Fibre, Cuckoo, Zzoomm, Yayzi
- And 300+ more via automatic URL construction

## Cost Estimate

Google Cloud Functions pricing (as of 2024):
- **Free tier**: 2 million invocations/month
- **Beyond free tier**: ~$0.40 per million invocations
- **Memory/CPU**: Minimal cost at 256MB

For a typical personal website, costs should be **< $1/month**.

## Troubleshooting

### Function not deploying?
```bash
# Check if APIs are enabled
gcloud services list --enabled

# Check deployment logs
gcloud functions logs read broadband-price-scraper --region=europe-west2
```

### CORS errors?
The function includes CORS headers. If issues persist, check browser console for specific errors.

### Prices not found?
Some providers block scraping. The function falls back to Uswitch data automatically.

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
functions-framework --target=get_broadband_price --port=8080

# Test
curl "http://localhost:8080?provider=BT"
```

