# 🚀 Deploy Commands for Bash (Git Bash/WSL)

## Step 1: Navigate to the Function Directory

**If you're in Git Bash or WSL on Windows:**

```bash
# From the project root
cd cloud-functions/price-scraper

# Or use full path (adjust if needed)
cd /c/Users/adyba/adriano-to-the-star-clean/cloud-functions/price-scraper
```

**Verify you're in the right place:**
```bash
pwd
ls -la
# Should see: main.py, requirements.txt, deploy.sh
```

## Step 2: Deploy the Function

**Option A: Using the deploy script**

First, edit `deploy.sh` and replace `your-project-id` with your actual Google Cloud project ID, then:

```bash
chmod +x deploy.sh
./deploy.sh
```

**Option B: Direct command (replace YOUR_PROJECT_ID)**

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
    --set-env-vars="GEMINI_API_KEY=GEMINI_API_KEY_2" \
    --quiet
```

## Troubleshooting Path Issues

**If you get "No such file or directory":**

1. Check your current directory:
   ```bash
   pwd
   ```

2. List directories to verify:
   ```bash
   ls -la
   ls cloud-functions/
   ```

3. Use absolute path if relative doesn't work:
   ```bash
   cd /c/Users/adyba/adriano-to-the-star-clean/cloud-functions/price-scraper
   ```

4. On WSL, you might need:
   ```bash
   cd /mnt/c/Users/adyba/adriano-to-the-star-clean/cloud-functions/price-scraper
   ```

## Quick Test

```bash
# From project root, verify the path exists
ls cloud-functions/price-scraper/main.py

# If that works, then cd should work too
cd cloud-functions/price-scraper
```

