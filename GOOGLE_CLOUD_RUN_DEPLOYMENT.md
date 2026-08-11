# 🚀 LiveKit Agent - Google Cloud Run Deployment Guide

This guide shows you how to deploy the LiveKit agent to Google Cloud Run, integrating with your existing Google Cloud setup.

## ✅ What You Get

- ✅ **Always Running:** Agent stays online 24/7
- ✅ **Auto-scaling:** Handles traffic automatically
- ✅ **Managed Service:** No server maintenance needed
- ✅ **Integrated:** Works with your existing Google Cloud project
- ✅ **Cost-effective:** Pay only for what you use

## 📋 Prerequisites

1. **Google Cloud Project** (you already have: `adriano-broadband`)
2. **Google Cloud SDK** installed and authenticated
3. **APIs Enabled:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

## 🚀 Quick Deploy

### Step 1: Navigate to the Directory

```bash
cd cloud-run/livekit-agent
```

### Step 2: Update Configuration

Edit `deploy.sh` or `deploy.ps1` and verify:
- `PROJECT_ID="adriano-broadband"` (or your actual project ID)
- `REGION="europe-west2"` (or your preferred region)

### Step 3: Deploy

**Windows (PowerShell):**
```powershell
.\deploy.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x deploy.sh
./deploy.sh
```

**That's it!** The agent will be deployed and running in ~5 minutes.

## 🔐 Setting Up Secrets (Recommended)

For production, store API keys in Google Secret Manager:

### 1. Create Secrets

```bash
# Set your project
gcloud config set project adriano-broadband

# Create LIVEKIT_API_KEY secret
echo -n "API2L4oYScFxfvr" | gcloud secrets create LIVEKIT_API_KEY --data-file=-

# Create LIVEKIT_API_SECRET secret
echo -n "vgdeTSniXEACMV4tLePmPEGw48HIEPL8xsxDKKlwJ8U" | gcloud secrets create LIVEKIT_API_SECRET --data-file=-
```

### 2. Grant Cloud Run Access

```bash
PROJECT_NUMBER=$(gcloud projects describe adriano-broadband --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding LIVEKIT_API_KEY \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding LIVEKIT_API_SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. Update Deployment Script

The scripts already use `--set-secrets`, so secrets will be automatically loaded.

## 📊 Configuration Details

### Cloud Run Settings

- **Memory:** 512Mi (sufficient for the agent)
- **CPU:** 1 vCPU
- **Timeout:** 3600 seconds (1 hour)
- **Min Instances:** 1 (keeps agent always running)
- **Max Instances:** 1 (single instance is enough)

### Why Min Instances = 1?

The LiveKit agent needs to be **always available** to handle voice connections. Setting `min-instances=1` ensures:
- ✅ No cold starts
- ✅ Immediate connection handling
- ✅ Always-on service

## 💰 Cost Estimate

With `min-instances=1` in `europe-west2`:
- **Always-on instance:** ~$10-15/month
- **Traffic:** Minimal (agent doesn't receive HTTP requests)
- **Total:** ~$10-15/month

**Note:** You can set `min-instances=0` for development to save costs, but the agent will have cold starts.

## 🔍 Monitoring

### View Logs

```bash
gcloud run logs read livekit-agent --region=europe-west2 --project=adriano-broadband
```

### View Service Status

```bash
gcloud run services describe livekit-agent --region=europe-west2 --project=adriano-broadband
```

### View in Console

Visit: https://console.cloud.google.com/run/detail/europe-west2/livekit-agent

## 🔄 Updating the Agent

To update the agent code:

1. **Make changes** to `livekit_agent.py`
2. **Redeploy:**
   ```bash
   cd cloud-run/livekit-agent
   ./deploy.sh  # or .\deploy.ps1
   ```

Cloud Run will:
- Build new Docker image
- Deploy new version
- Keep old version for rollback

## 🛑 Stopping the Service

```bash
gcloud run services delete livekit-agent --region=europe-west2 --project=adriano-broadband
```

## 🐛 Troubleshooting

### Agent Not Connecting

1. **Check logs:**
   ```bash
   gcloud run logs read livekit-agent --region=europe-west2 --limit=50
   ```

2. **Verify environment variables:**
   ```bash
   gcloud run services describe livekit-agent --region=europe-west2 --format='value(spec.template.spec.containers[0].env)'
   ```

3. **Check service is running:**
   ```bash
   gcloud run services list --region=europe-west2
   ```

### Build Failures

- Check Dockerfile syntax
- Verify `requirements.txt` is correct
- Check Cloud Build logs in Google Cloud Console

### Connection Issues

- Verify LiveKit credentials are correct
- Check network connectivity from Cloud Run to LiveKit server
- Review agent logs for connection errors

## 🔗 Integration with Your Website

Once deployed, the agent will automatically:
- ✅ Connect to your LiveKit server
- ✅ Handle voice connections from your website
- ✅ Work with the LiveKit integration on `stellar-ai.html`

**No changes needed to your website!** The agent runs independently and connects to the same LiveKit server.

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [Your Existing Cloud Run Service](cloud-run/headless-scraper/)

---

**Ready to deploy?** Run `./deploy.sh` or `.\deploy.ps1` and you're done! 🚀

