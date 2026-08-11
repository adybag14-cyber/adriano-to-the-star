# 🚀 LiveKit Agent - Google Cloud Run Deployment

This directory contains the Google Cloud Run deployment configuration for the LiveKit voice agent.

## 📋 Prerequisites

1. **Google Cloud SDK installed:**
   ```bash
   # Install from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate:**
   ```bash
   gcloud auth login
   ```

3. **Set your project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Enable required APIs:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

## 🚀 Quick Deployment

### Option 1: Using PowerShell (Windows)

```powershell
cd cloud-run/livekit-agent
.\deploy.ps1
```

### Option 2: Using Bash (Linux/Mac)

```bash
cd cloud-run/livekit-agent
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Configuration

Before deploying, update these values in `deploy.sh` or `deploy.ps1`:

- `PROJECT_ID`: Your Google Cloud project ID (e.g., "adriano-broadband")
- `REGION`: Your preferred region (e.g., "europe-west2" for London)
- Environment variables (API keys)

## 🔐 Setting Up Secrets (Recommended for Production)

For better security, store sensitive values in Google Secret Manager:

### 1. Create Secrets

```bash
# Create LIVEKIT_API_KEY secret
echo -n "<LIVEKIT_API_KEY>" | gcloud secrets create LIVEKIT_API_KEY --data-file=-

# Create LIVEKIT_API_SECRET secret
echo -n "<LIVEKIT_API_SECRET>" | gcloud secrets create LIVEKIT_API_SECRET --data-file=-
```

### 2. Grant Cloud Run Access

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding LIVEKIT_API_KEY \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding LIVEKIT_API_SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. Update Deployment Script

The deployment scripts already use `--set-secrets` for secure secret access.

## 📊 Cloud Run Configuration

- **Memory:** 512Mi (adjust if needed)
- **CPU:** 1 vCPU
- **Timeout:** 3600 seconds (1 hour)
- **Min Instances:** 1 (keeps agent always running)
- **Max Instances:** 1 (single instance)

### Why Min Instances = 1?

The LiveKit agent needs to be **always running** to handle voice connections. Setting `min-instances=1` ensures:
- ✅ Agent is always available
- ✅ No cold starts
- ✅ Immediate connection handling

## 🔍 Monitoring

### View Logs

```bash
gcloud run logs read livekit-agent --region=europe-west2 --project=YOUR_PROJECT_ID
```

### View Service Status

```bash
gcloud run services describe livekit-agent --region=europe-west2 --project=YOUR_PROJECT_ID
```

### View Metrics

Visit: https://console.cloud.google.com/run/detail/europe-west2/livekit-agent/metrics

## 💰 Cost Considerations

With `min-instances=1`:
- **Always-on instance:** ~$10-15/month (depending on region)
- **Traffic:** Pay per request (minimal for agent)
- **Free tier:** 2 million requests/month

**Cost optimization:**
- Use `min-instances=0` for development (agent starts on first request)
- Use `min-instances=1` for production (always available)

## 🔄 Updating the Agent

To update the agent code:

```bash
# Rebuild and redeploy
./deploy.sh
# or
.\deploy.ps1
```

Cloud Run will:
1. Build new Docker image
2. Deploy new version
3. Route traffic to new version
4. Keep old version for rollback

## 🛑 Stopping the Service

```bash
gcloud run services delete livekit-agent --region=europe-west2 --project=YOUR_PROJECT_ID
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
- Verify requirements.txt is correct
- Check Cloud Build logs in Google Cloud Console

### Connection Timeouts

- Increase `--timeout` value
- Check LiveKit server connectivity
- Verify API keys are correct

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)

