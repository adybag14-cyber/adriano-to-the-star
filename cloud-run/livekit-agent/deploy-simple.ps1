# Simple Google Cloud Run Deployment Script for LiveKit Agent (PowerShell)
# Uses environment variables directly (no secrets required)

# Configuration
$PROJECT_ID = "adriano-broadband"  # Your Google Cloud project ID
$REGION = "europe-west2"            # London region
$SERVICE_NAME = "livekit-agent"

# Environment variables
$LIVEKIT_URL = if ($env:LIVEKIT_URL) { $env:LIVEKIT_URL } else { "wss://gemini-integration-pxcg6ngt.livekit.cloud" }
$LIVEKIT_API_KEY = $env:LIVEKIT_API_KEY
$LIVEKIT_API_SECRET = $env:LIVEKIT_API_SECRET
$GOOGLE_API_KEY = if ($env:GOOGLE_API_KEY) { $env:GOOGLE_API_KEY } else { $env:GEMINI_API_KEY }

Write-Host "🚀 Deploying LiveKit Agent to Google Cloud Run..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Please install the Google Cloud SDK first."
    exit 1
}

if (-not $LIVEKIT_API_KEY) { Write-Error "LIVEKIT_API_KEY is not set"; exit 1 }
if (-not $LIVEKIT_API_SECRET) { Write-Error "LIVEKIT_API_SECRET is not set"; exit 1 }
if (-not $GOOGLE_API_KEY) { Write-Error "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set"; exit 1 }

# Build and deploy
gcloud run deploy $SERVICE_NAME `
    --source . `
    --platform managed `
    --region $REGION `
    --project $PROJECT_ID `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --timeout 3600 `
    --min-instances 1 `
    --max-instances 1 `
    --set-env-vars "LIVEKIT_URL=$LIVEKIT_URL,LIVEKIT_API_KEY=$LIVEKIT_API_KEY,LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET,GOOGLE_API_KEY=$GOOGLE_API_KEY" `
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
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

