# Google Cloud Setup Script for Windows PowerShell
# This script helps set up Google Cloud Vertex AI integration

Write-Host "🔧 Google Cloud Setup Script" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Node.js installation may be incomplete." -ForegroundColor Red
    exit 1
}

# Install Google Cloud AI Platform package
Write-Host ""
Write-Host "Installing @google-cloud/aiplatform package..." -ForegroundColor Yellow
Set-Location backend
try {
    npm install @google-cloud/aiplatform --save
    Write-Host "✅ Package installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install package. Error: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Check if .env file exists
Write-Host ""
Write-Host "Checking .env file..." -ForegroundColor Yellow
$envPath = "backend\.env"
if (Test-Path $envPath) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check for Google Cloud configuration
    $envContent = Get-Content $envPath -Raw
    $hasProject = $envContent -match "GOOGLE_CLOUD_PROJECT"
    $hasLocation = $envContent -match "GOOGLE_CLOUD_LOCATION"
    $hasCredentials = $envContent -match "GOOGLE_APPLICATION_CREDENTIALS"
    
    if ($hasProject) {
        Write-Host "✅ GOOGLE_CLOUD_PROJECT is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GOOGLE_CLOUD_PROJECT not set" -ForegroundColor Yellow
        Write-Host "   Add to .env: GOOGLE_CLOUD_PROJECT=your-project-id" -ForegroundColor Gray
    }
    
    if ($hasLocation) {
        Write-Host "✅ GOOGLE_CLOUD_LOCATION is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GOOGLE_CLOUD_LOCATION not set (optional)" -ForegroundColor Yellow
        Write-Host "   Add to .env: GOOGLE_CLOUD_LOCATION=us-central1" -ForegroundColor Gray
    }
    
    if ($hasCredentials) {
        Write-Host "✅ GOOGLE_APPLICATION_CREDENTIALS is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GOOGLE_APPLICATION_CREDENTIALS not set" -ForegroundColor Yellow
        Write-Host "   Option 1: Add to .env: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json" -ForegroundColor Gray
        Write-Host "   Option 2: Run: gcloud auth application-default login" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "   Creating .env file template..." -ForegroundColor Gray
    
    $envTemplate = @"
# Gemini API Key (Required)
GEMINI_API_KEY=your-gemini-api-key-here

# Google Cloud Configuration (Optional)
# GOOGLE_CLOUD_PROJECT=your-project-id
# GOOGLE_CLOUD_LOCATION=us-central1
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
"@
    
    Set-Content -Path $envPath -Value $envTemplate
    Write-Host "✅ Created .env file template" -ForegroundColor Green
    Write-Host "   Please edit backend\.env and add your configuration" -ForegroundColor Yellow
}

# Check for gcloud CLI
Write-Host ""
Write-Host "Checking Google Cloud SDK (gcloud)..." -ForegroundColor Yellow
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Google Cloud SDK found" -ForegroundColor Green
    Write-Host "   $gcloudVersion" -ForegroundColor Gray
    
    # Check if authenticated
    try {
        $authStatus = gcloud auth list 2>&1
        if ($authStatus -match "ACTIVE") {
            Write-Host "✅ Google Cloud authenticated" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Not authenticated. Run: gcloud auth application-default login" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not check authentication status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Google Cloud SDK not found (optional)" -ForegroundColor Yellow
    Write-Host "   Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Gray
    Write-Host "   Or use service account key file instead" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Setup Summary:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ @google-cloud/aiplatform package installed" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend\.env and configure:" -ForegroundColor White
Write-Host "   - GEMINI_API_KEY (required)" -ForegroundColor Gray
Write-Host "   - GOOGLE_CLOUD_PROJECT (optional, for Vertex AI)" -ForegroundColor Gray
Write-Host "   - GOOGLE_APPLICATION_CREDENTIALS (optional)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. If using Google Cloud:" -ForegroundColor White
Write-Host "   - Set GOOGLE_CLOUD_PROJECT in .env" -ForegroundColor Gray
Write-Host "   - Either set GOOGLE_APPLICATION_CREDENTIALS or run:" -ForegroundColor Gray
Write-Host "     gcloud auth application-default login" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the server:" -ForegroundColor White
Write-Host "   npm run start-stellar-ai" -ForegroundColor Gray
Write-Host "   or" -ForegroundColor Gray
Write-Host "   node backend/stellar-ai-server.js" -ForegroundColor Gray
Write-Host ""
Write-Host "The system will automatically detect and use Google Cloud when available!" -ForegroundColor Green
Write-Host ""

