# Auto Deploy Script - Uses project ID from broadband-checker.js
# Run this from the price-scraper directory

$ErrorActionPreference = "Stop"

# Project ID from broadband-checker.js URL
$PROJECT_ID = "adriano-broadband"

Write-Host "🚀 Deploying Broadband Price Scraper..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Please install the Google Cloud SDK first."
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploying function with WebSocket support for Live AI models..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

gcloud functions deploy broadband-price-scraper `
    --gen2 `
    --runtime=python311 `
    --region=europe-west2 `
    --source=. `
    --entry-point=get_broadband_price `
    --trigger-http `
    --allow-unauthenticated `
    --memory=512MB `
    --timeout=60s `
    --max-instances=10 `
    --set-env-vars="GEMINI_API_KEY=GEMINI_API_KEY_2,USE_GEMINI_LIVE=true" `
    --project=$PROJECT_ID `
    --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Getting function URL..." -ForegroundColor Cyan
    
    $URL = gcloud functions describe broadband-price-scraper `
        --region=europe-west2 `
        --project=$PROJECT_ID `
        --format='value(serviceConfig.uri)'
    
    Write-Host ""
    Write-Host "Function URL: $URL" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ WebSocket support enabled for Live AI models (unlimited RPM/RPD)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

