# Start Local Web Server
# Bypasses PowerShell execution policy for this script

Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "🌐 Starting Local Web Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Yellow
Write-Host "  http://localhost:8095" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

$port = 8095
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# Try Python first
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Using Custom Range Server..." -ForegroundColor Green
        python "$root\custom_server_fixed.py" $port
        exit
    }
} catch {}

# Try Node.js http-server
try {
    $httpServer = Get-Command http-server -ErrorAction SilentlyContinue
    if ($httpServer) {
        Write-Host "✅ Using Node.js http-server..." -ForegroundColor Green
        http-server -p $port -o
        exit
    }
} catch {}

# Try npx http-server
try {
    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if ($npx) {
        Write-Host "✅ Using npx http-server..." -ForegroundColor Green
        npx -y http-server -p $port -o
        exit
    }
} catch {}

Write-Host "❌ No server found. Please install one of:" -ForegroundColor Red
Write-Host "  1. Python (for python -m http.server)" -ForegroundColor Yellow
Write-Host "  2. Node.js http-server (npm install -g http-server)" -ForegroundColor Yellow
Write-Host "  3. Or use VS Code Live Server extension" -ForegroundColor Yellow
Read-Host "Press Enter to exit"

