# Google Cloud Run Deployment Script for LiveKit Agent (PowerShell)
# 
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID
# 4. Enable APIs: gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Configuration - Update these values
$PROJECT_ID = "adriano-broadband"  # Your Google Cloud project ID
$REGION = "europe-west2"            # London region (or your preferred region)
$SERVICE_NAME = "livekit-agent"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Environment variables (set as secrets in production)
$LIVEKIT_URL = if ($env:LIVEKIT_URL) { $env:LIVEKIT_URL } else { "wss://gemini-integration-pxcg6ngt.livekit.cloud" }
$GOOGLE_API_KEY = if ($env:GOOGLE_API_KEY) { $env:GOOGLE_API_KEY } else { $env:GEMINI_API_KEY }

Write-Host "🚀 Deploying LiveKit Agent to Google Cloud Run..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Yellow
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Please install the Google Cloud SDK first."
    exit 1
}

if (-not $GOOGLE_API_KEY) {
    Write-Error "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set"
    exit 1
}

# Build the Docker image
Write-Host "📦 Building Docker image..." -ForegroundColor Cyan
gcloud builds submit --tag $IMAGE_NAME --project=$PROJECT_ID --suppress-logs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to Cloud Run
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --project $PROJECT_ID `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --timeout 3600 `
    --min-instances 1 `
    --max-instances 1 `
    --set-env-vars "LIVEKIT_URL=$LIVEKIT_URL,GOOGLE_API_KEY=$GOOGLE_API_KEY" `
    --set-secrets "LIVEKIT_API_KEY=LIVEKIT_API_KEY:latest,LIVEKIT_API_SECRET=LIVEKIT_API_SECRET:latest" `
    --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service URL:" -ForegroundColor Cyan
    $url = gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)'
    Write-Host $url -ForegroundColor White
    Write-Host ""
    Write-Host "View logs:" -ForegroundColor Cyan
    Write-Host "gcloud run logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Note: For production, set secrets in Secret Manager:" -ForegroundColor Yellow
    Write-Host "  gcloud secrets create LIVEKIT_API_KEY --data-file=-" -ForegroundColor White
    Write-Host "  gcloud secrets create LIVEKIT_API_SECRET --data-file=-" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

