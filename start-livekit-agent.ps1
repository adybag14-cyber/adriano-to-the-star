# Start LiveKit Agent Script for Windows PowerShell
# Usage: .\start-livekit-agent.ps1

Write-Host "🚀 Starting LiveKit Agent..." -ForegroundColor Cyan

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed!" -ForegroundColor Red
    Write-Host "Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install/update dependencies
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt

# Set environment variables
if (-not $env:LIVEKIT_URL) {
    $env:LIVEKIT_URL = "wss://gemini-integration-pxcg6ngt.livekit.cloud"
}
if (-not $env:GOOGLE_API_KEY -and $env:GEMINI_API_KEY) {
    $env:GOOGLE_API_KEY = $env:GEMINI_API_KEY
}

if (-not $env:LIVEKIT_API_KEY) {
    Write-Host "❌ LIVEKIT_API_KEY is not set!" -ForegroundColor Red
    exit 1
}
if (-not $env:LIVEKIT_API_SECRET) {
    Write-Host "❌ LIVEKIT_API_SECRET is not set!" -ForegroundColor Red
    exit 1
}
if (-not $env:GOOGLE_API_KEY) {
    Write-Host "❌ GOOGLE_API_KEY (or GEMINI_API_KEY) is not set!" -ForegroundColor Red
    exit 1
}

# Check if livekit_agent.py exists
if (-not (Test-Path "livekit_agent.py")) {
    Write-Host "❌ livekit_agent.py not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Starting LiveKit Agent..." -ForegroundColor Green
Write-Host "💡 Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Run the agent
python livekit_agent.py dev

