# Google Cloud Function Deployment Script for Broadband Price Scraper (PowerShell)
# 
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID

# Configuration - Update these values
$PROJECT_ID = "your-project-id"  # Replace with your Google Cloud project ID
$REGION = "europe-west2"          # London region for UK broadband data
$FUNCTION_NAME = "broadband-price-scraper"

Write-Host "🚀 Deploying Broadband Price Scraper to Google Cloud Functions..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "Function: $FUNCTION_NAME" -ForegroundColor Yellow
Write-Host ""

# Deploy the function
Write-Host "📦 Deploying get_broadband_price function..." -ForegroundColor Green

gcloud functions deploy $FUNCTION_NAME `
    --gen2 `
    --runtime=python311 `
    --region=$REGION `
    --source=. `
    --entry-point=get_broadband_price `
    --trigger-http `
    --allow-unauthenticated `
    --memory=256MB `
    --timeout=60s `
    --max-instances=10 `
    --project=$PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Function URL:" -ForegroundColor Cyan
    
    $functionUrl = gcloud functions describe $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --format='value(serviceConfig.uri)'
    Write-Host $functionUrl -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Test with:" -ForegroundColor Cyan
    Write-Host "curl '$functionUrl?provider=BT'" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📝 IMPORTANT: Update your broadband-checker.js with this URL:" -ForegroundColor Magenta
    Write-Host "this.cloudFunctionUrl = '$functionUrl';" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

