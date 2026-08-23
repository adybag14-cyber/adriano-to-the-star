# Setting Up API Keys

This guide explains how to securely set up your API keys for the broadband scraper.

## Required API Keys

1. **GEMINI_API_KEY** - Google Gemini AI API key (required for AI-enhanced scraping)
2. **BROWSERLESS_API_KEY** - Browserless.io API key (optional, for JavaScript-rendered pages)

## Setting API Keys Locally

### Windows PowerShell

**Temporary (current session only):**
```powershell
$env:GEMINI_API_KEY = "GEMINI_API_KEY_2"
$env:BROWSERLESS_API_KEY = "your_browserless_key"
```

**Permanent (for current user):**
```powershell
[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "GEMINI_API_KEY_2", "User")
[System.Environment]::SetEnvironmentVariable("BROWSERLESS_API_KEY", "your_browserless_key", "User")
```

**Permanent (system-wide - requires admin):**
```powershell
[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "GEMINI_API_KEY_2", "Machine")
```

### Windows CMD

**Temporary:**
```cmd
set GEMINI_API_KEY=GEMINI_API_KEY_2
set BROWSERLESS_API_KEY=your_browserless_key
```

**Permanent:**
```cmd
setx GEMINI_API_KEY "GEMINI_API_KEY_2"
setx BROWSERLESS_API_KEY "your_browserless_key"
```

### Linux/Mac

**Temporary:**
```bash
export GEMINI_API_KEY="GEMINI_API_KEY_2"
export BROWSERLESS_API_KEY="your_browserless_key"
```

**Permanent (add to ~/.bashrc or ~/.zshrc):**
```bash
echo 'export GEMINI_API_KEY="GEMINI_API_KEY_2"' >> ~/.bashrc
echo 'export BROWSERLESS_API_KEY="your_browserless_key"' >> ~/.bashrc
source ~/.bashrc
```

## Setting API Keys in GitLab CI/CD

1. Go to your GitLab project
2. Navigate to **Settings** → **CI/CD** → **Variables**
3. Click **Add variable** for each key:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `GEMINI_API_KEY_2`
   - **Type**: Variable
   - **Protect variable**: ✅ (recommended)
   - **Mask variable**: ✅ (recommended - hides in logs)
   - **Expand variable reference**: ✅

   - **Key**: `BROWSERLESS_API_KEY`
   - **Value**: `your_browserless_key`
   - **Type**: Variable
   - **Protect variable**: ✅
   - **Mask variable**: ✅
   - **Expand variable reference**: ✅

4. Click **Add variable** to save

## Setting API Keys in Google Cloud Functions

### Using gcloud CLI

```bash
gcloud functions deploy price-scraper \
  --set-env-vars GEMINI_API_KEY=GEMINI_API_KEY_2,BROWSERLESS_API_KEY=your_browserless_key
```

### Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Functions**
3. Select your function
4. Click **Edit**
5. Go to **Runtime, build, connections and security settings**
6. Expand **Runtime environment variables**
7. Add variables:
   - `GEMINI_API_KEY` = `GEMINI_API_KEY_2`
   - `BROWSERLESS_API_KEY` = `your_browserless_key`
8. Click **Deploy**

## Verifying API Keys

Test your Gemini API key:
```bash
python test-gemini.py
```

Expected output:
```
[OK] Gemini configured successfully
[OK] Gemini API responded successfully!
[OK] Gemini integration is working correctly!
```

## Security Best Practices

⚠️ **NEVER commit API keys to Git!**

- ✅ Use environment variables
- ✅ Use GitLab CI/CD variables (masked)
- ✅ Use Google Cloud Secrets Manager for production
- ❌ Don't hardcode keys in source files
- ❌ Don't commit `.env` files with keys
- ❌ Don't share keys in chat/email

## Current Configuration

- **Fallback Model**: `gemini-2.5-flash` (non-live, REST API)
- **Live Models**: Enabled by default (unlimited RPM/RPD)
- **Fallback Behavior**: If live models fail, automatically uses `gemini-2.5-flash`

## Troubleshooting

### "GEMINI_API_KEY not found"
- Verify the environment variable is set: `echo $env:GEMINI_API_KEY` (PowerShell)
- Restart your terminal/IDE after setting permanent variables
- Check GitLab CI/CD variables are set correctly

### "API key invalid"
- Verify the key is correct (no extra spaces)
- Check the key hasn't been revoked in Google Cloud Console
- Ensure the key has Gemini API access enabled

### "Model not found"
- The code automatically falls back to `gemini-2.5-flash`
- Check your API key has access to the model you're trying to use
- Some models may require specific API tiers

