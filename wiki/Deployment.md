# 🚀 Deployment Guide

This guide covers deploying **Adriano To The Star** to GitLab Pages.

## GitLab Pages Deployment

The project is configured for automatic deployment to GitLab Pages.

### Automatic Deployment

1. **Push to Main Branch**
   ```bash
   git push origin main
   ```

2. **CI/CD Pipeline Runs**
   - GitLab automatically runs the `.gitlab-ci.yml` script
   - Files are copied to `public/` directory
   - Site is deployed to GitLab Pages

3. **Access Your Site**
   - URL: `https://starisdons-d53656.gitlab.io`
   - Available within 1-2 minutes after push

### Manual Deployment

If automatic deployment fails:

1. Check `.gitlab-ci.yml` syntax
2. Verify all files are committed
3. Check pipeline logs in GitLab
4. Ensure `main` branch is protected (optional)

## CI/CD Configuration

The `.gitlab-ci.yml` file handles:

- **File Copying** - Copies HTML, CSS, JS, and assets
- **JSON Processing** - Handles data files
- **Manifest Files** - Copies PWA manifests
- **Price Scraping** - Runs Python scraper (if API key set)

### Environment Variables

Set in GitLab: **Settings → CI/CD → Variables**

- `GEMINI_API_KEY` - For AI-enhanced price scraping (required for live models)
- `USE_GEMINI_LIVE` - Set to `true` to enable unlimited RPM/RPD (recommended)
- `BROWSERLESS_API_KEY` - For JavaScript rendering (optional)

## Custom Domain

To use a custom domain:

1. Go to **Settings → Pages** in GitLab
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable SSL certificate (automatic)

## Supabase Configuration

### Required Setup

1. **Create Supabase Project**
   - Visit https://supabase.com
   - Create new project
   - Note your project URL and anon key

2. **Update Configuration**
   - Edit `supabase-config.js`
   - Add your project URL and anon key

3. **Create Database Tables**
   - See `SUPABASE-CLAIMS-SETUP.md` for schema
   - Create `planet_claims` table
   - Set up storage bucket `user-files`

4. **Configure Authentication**
   - Enable email authentication
   - Set up OAuth providers (optional)

## Google Cloud Function

For live broadband price checking with AI-powered extraction:

1. **Install Google Cloud SDK**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Authenticate: `gcloud auth login`

2. **Deploy Cloud Function**
   ```powershell
   cd cloud-functions/price-scraper
   .\DEPLOY-AUTO.ps1
   ```
   - Uses Gemini 2.5 Flash Live for unlimited requests
   - Automatically configures environment variables
   - See [DEPLOY-PRICE-SCRAPER.md](../DEPLOY-PRICE-SCRAPER.md) for details

3. **Update Frontend**
   - Function URL is already configured in `broadband-checker.js`
   - URL: `https://europe-west2-adriano-broadband.cloudfunctions.net/broadband-price-scraper`

## GitLab Runner Setup

For local CI/CD execution:

1. **Install GitLab Runner**
   - See `install-gitlab-runner-service.ps1` for Windows setup
   - Register with your project token from GitLab

2. **Configure Runner**
   - Tags: `windows`, `shell`
   - Executor: `shell` (PowerShell)
   - Concurrent jobs: 4 (configurable)

3. **Verify Runner**
   - Check runner status in GitLab: **Settings → CI/CD → Runners**
   - Runner should show as "online" and ready

## Troubleshooting

### Site Not Updating
- Wait 1-2 minutes for GitLab Pages rebuild
- Clear browser cache (Ctrl+F5)
- Check pipeline status in GitLab

### 404 Errors
- Verify file paths are correct
- Check that files are in root directory
- Ensure `.gitlab-ci.yml` copies all files

### Build Failures
- Check CI/CD pipeline logs
- Verify file permissions
- Ensure all dependencies included

### Supabase Errors
- Verify credentials in `supabase-config.js`
- Check Supabase dashboard for errors
- Review browser console for API errors

---

For more details, see the [Getting Started](Getting-Started) guide.

