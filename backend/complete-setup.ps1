# Complete Setup Script - Node.js, Packages, and Google Cloud
# This script does everything: finds Node.js, installs packages, sets up Google Cloud

Write-Host "🚀 Complete Setup Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup Node.js PATH
Write-Host "[1/3] Setting up Node.js..." -ForegroundColor Yellow
& "$PSScriptRoot\setup-nodejs-path.ps1"
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host ""
    Write-Host "❌ Node.js setup failed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Step 2: Install packages
Write-Host ""
Write-Host "[2/3] Installing npm packages..." -ForegroundColor Yellow
Set-Location backend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Running npm install..." -ForegroundColor Gray
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "✅ node_modules already exists" -ForegroundColor Green
    Write-Host "Running npm install to ensure all packages are up to date..." -ForegroundColor Gray
    & npm install
}

# Verify Google Cloud package
if (Test-Path "node_modules\@google-cloud\aiplatform") {
    Write-Host "✅ @google-cloud/aiplatform installed" -ForegroundColor Green
} else {
    Write-Host "Installing @google-cloud/aiplatform..." -ForegroundColor Yellow
    & npm install @google-cloud/aiplatform --save
}

Set-Location ..

# Step 3: Setup Google Cloud
Write-Host ""
Write-Host "[3/3] Setting up Google Cloud..." -ForegroundColor Yellow

# Check if .env exists
$envPath = "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file..." -ForegroundColor Gray
    $envTemplate = @"
# Gemini API Key (Required)
GEMINI_API_KEY=your-gemini-api-key-here

# Google Cloud Configuration (Optional)
# GOOGLE_CLOUD_PROJECT=your-project-id
# GOOGLE_CLOUD_LOCATION=us-central1
# GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account-key.json
"@
    Set-Content -Path $envPath -Value $envTemplate
    Write-Host "✅ Created .env file template" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Check Google Cloud configuration
$envContent = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
$hasProject = $envContent -match "GOOGLE_CLOUD_PROJECT\s*="
$hasCredentials = $envContent -match "GOOGLE_APPLICATION_CREDENTIALS\s*="

if ($hasProject -and -not ($envContent -match "GOOGLE_CLOUD_PROJECT\s*=\s*#")) {
    Write-Host "✅ Google Cloud project configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Google Cloud not configured (optional)" -ForegroundColor Yellow
    Write-Host "   To configure, edit backend\.env and add:" -ForegroundColor Gray
    Write-Host "   GOOGLE_CLOUD_PROJECT=your-project-id" -ForegroundColor Gray
}

if ($hasCredentials -and -not ($envContent -match "GOOGLE_APPLICATION_CREDENTIALS\s*=\s*#")) {
    Write-Host "✅ Google Cloud credentials configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Google Cloud credentials not configured" -ForegroundColor Yellow
    Write-Host "   Option 1: Add to .env: GOOGLE_APPLICATION_CREDENTIALS=path\to\key.json" -ForegroundColor Gray
    Write-Host "   Option 2: Run: gcloud auth application-default login" -ForegroundColor Gray
}

# Check for gcloud CLI
try {
    $gcloudVersion = & gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Google Cloud SDK found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Google Cloud SDK not found (optional)" -ForegroundColor Yellow
    Write-Host "   Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Node.js configured" -ForegroundColor Green
Write-Host "  ✅ npm packages installed" -ForegroundColor Green
Write-Host "  ✅ Google Cloud setup checked" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Edit backend\.env and add your GEMINI_API_KEY" -ForegroundColor White
Write-Host "  2. (Optional) Configure Google Cloud in .env" -ForegroundColor White
Write-Host "  3. Start server: cd backend && node stellar-ai-server.js" -ForegroundColor White
Write-Host ""

