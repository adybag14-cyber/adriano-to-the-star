$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Broadband Scraper Cloud Function..." -ForegroundColor Cyan

# Check if gcloud is installed
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Please install the Google Cloud SDK first."
    exit 1
}

# Get API Keys
$GeminiKey = Read-Host "Enter your Google Gemini API Key"
$BrowserlessKey = Read-Host "Enter your Browserless.io API Key"

if (-not $GeminiKey -or -not $BrowserlessKey) {
    Write-Error "Both API keys are required."
    exit 1
}

# Deploy
Write-Host "Deploying function... This may take a few minutes." -ForegroundColor Yellow

cd cloud-functions\broadband-scraper

gcloud functions deploy broadband-scraper `
    --runtime python311 `
    --trigger-http `
    --allow-unauthenticated `
    --region europe-west2 `
    --source . `
    --entry-point scrape_broadband `
    --set-env-vars "GEMINI_API_KEY=$GeminiKey,BROWSERLESS_API_KEY=$BrowserlessKey"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "Copy the 'httpsTrigger.url' from the output above and update your broadband-checker.js file." -ForegroundColor Cyan
