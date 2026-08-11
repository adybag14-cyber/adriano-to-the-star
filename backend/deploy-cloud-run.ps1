# Google Cloud Run Deployment Script for Stellar AI Backend (PowerShell)
# 
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID
# 4. Enable APIs: gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Configuration
$PROJECT_ID = "adriano-broadband"  # Your Google Cloud project ID
$REGION = "europe-west2"            # London region
$SERVICE_NAME = "stellar-ai-backend"

# Environment variables
$LIVEKIT_URL = if ($env:LIVEKIT_URL) { $env:LIVEKIT_URL } else { "wss://gemini-integration-pxcg6ngt.livekit.cloud" }
$LIVEKIT_API_KEY = $env:LIVEKIT_API_KEY
$LIVEKIT_API_SECRET = $env:LIVEKIT_API_SECRET
$GOOGLE_API_KEY = $env:GOOGLE_API_KEY
$GEMINI_API_KEY = if ($env:GEMINI_API_KEY) { $env:GEMINI_API_KEY } else { $env:GOOGLE_API_KEY }
$CEREBRAS_API_KEY = $env:CEREBRAS_API_KEY
$STELLAR_AI_PORT = if ($env:STELLAR_AI_PORT) { $env:STELLAR_AI_PORT } else { "8080" }

Write-Host "🚀 Deploying Stellar AI Backend to Google Cloud Run..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Yellow
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Please install the Google Cloud SDK first."
    exit 1
}

if (-not $LIVEKIT_API_KEY) { Write-Error "LIVEKIT_API_KEY is not set"; exit 1 }
if (-not $LIVEKIT_API_SECRET) { Write-Error "LIVEKIT_API_SECRET is not set"; exit 1 }
if (-not $GEMINI_API_KEY) { Write-Error "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set"; exit 1 }

$SetEnvVars = "LIVEKIT_URL=$LIVEKIT_URL,LIVEKIT_API_KEY=$LIVEKIT_API_KEY,LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET,GOOGLE_API_KEY=$GOOGLE_API_KEY,GEMINI_API_KEY=$GEMINI_API_KEY,STELLAR_AI_PORT=$STELLAR_AI_PORT"
if ($CEREBRAS_API_KEY) {
    $SetEnvVars = $SetEnvVars + ",CEREBRAS_API_KEY=$CEREBRAS_API_KEY"
} else {
    Write-Warning "CEREBRAS_API_KEY is not set. Cerebras proxy endpoint will return cerebras_api_key_missing."
}

# Build and deploy
gcloud run deploy $SERVICE_NAME `
    --source . `
    --platform managed `
    --region $REGION `
    --project $PROJECT_ID `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --timeout 300 `
    --min-instances 0 `
    --max-instances 10 `
    --port 8080 `
    --set-env-vars "$SetEnvVars" `
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
    Write-Host "⚠️  Note: Update the frontend to use this backend URL for LiveKit token generation" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

