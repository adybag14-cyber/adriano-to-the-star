# Quick Deploy Script - Run this from the price-scraper directory

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Broadband Price Scraper..." -ForegroundColor Cyan

# Check if gcloud is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Please install the Google Cloud SDK first."
    exit 1
}

# Get project ID
$PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"

if (-not $PROJECT_ID) {
    Write-Error "Project ID is required."
    exit 1
}

Write-Host "Deploying function... This may take a few minutes." -ForegroundColor Yellow

gcloud functions deploy broadband-price-scraper `
    --gen2 `
    --runtime=python311 `
    --region=europe-west2 `
    --source=. `
    --entry-point=get_broadband_price `
    --trigger-http `
    --allow-unauthenticated `
    --memory=256MB `
    --timeout=60s `
    --max-instances=10 `
    --set-env-vars="GEMINI_API_KEY=GEMINI_API_KEY_2,USE_GEMINI_LIVE=true" `
    --project=$PROJECT_ID `
    --quiet

if ($LASTEXITCODE -eq 0) {
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
    Write-Host "⚠️  Don't forget to update broadband-checker.js line 16 with this URL!" -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

