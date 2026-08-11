# 📦 Install Google Cloud SDK

## Quick Install for Windows

### Method 1: Download Installer (Easiest)

1. **Download**: https://cloud.google.com/sdk/docs/install
2. **Run the installer** and follow the prompts
3. **Restart PowerShell** after installation
4. **Verify installation**:
   ```powershell
   gcloud --version
   ```

### Method 2: Using PowerShell (Chocolatey)

If you have Chocolatey installed:
```powershell
choco install gcloudsdk
```

### Method 3: Using PowerShell (Scoop)

If you have Scoop installed:
```powershell
scoop install gcloud
```

## After Installation

1. **Authenticate**:
   ```powershell
   gcloud auth login
   ```

2. **Set your project**:
   ```powershell
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable required APIs**:
   ```powershell
   gcloud services enable cloudfunctions.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

4. **Then deploy**:
   ```powershell
   cd C:\Users\adyba\adriano-to-the-star-clean\cloud-functions\price-scraper
   .\DEPLOY-NOW.ps1
   ```

## Alternative: Deploy via Google Cloud Console

If you prefer not to install the SDK, you can deploy via the web console:

1. Go to: https://console.cloud.google.com/functions
2. Click "Create Function"
3. Upload the code from `cloud-functions/price-scraper/`
4. Set environment variable: `GEMINI_API_KEY=GEMINI_API_KEY_2`

