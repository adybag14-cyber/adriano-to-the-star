# Setup Node.js PATH and Install Dependencies
# This script finds Node.js, adds it to PATH, and installs packages

Write-Host "🔧 Node.js Setup and Package Installation" -ForegroundColor Cyan
Write-Host ""

# Common Node.js installation paths
$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:ProgramFiles\nodejs",
    "$env:ProgramFiles(x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:APPDATA\npm",
    "$env:USERPROFILE\AppData\Local\Programs\nodejs"
)

$nodeFound = $false
$nodePath = $null
$npmPath = $null

# Search for Node.js
Write-Host "Searching for Node.js installation..." -ForegroundColor Yellow
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeExe = Join-Path $path "node.exe"
        $npmExe = Join-Path $path "npm.cmd"
        
        if (Test-Path $nodeExe) {
            $nodePath = $path
            $npmPath = if (Test-Path $npmExe) { $npmExe } else { Join-Path $path "npm.exe" }
            $nodeFound = $true
            Write-Host "✅ Found Node.js at: $nodePath" -ForegroundColor Green
            break
        }
    }
}

# Also check if node is already in PATH
if (-not $nodeFound) {
    try {
        $nodeVersion = & node --version 2>$null
        if ($nodeVersion) {
            $nodeFound = $true
            $nodePath = (Get-Command node).Source | Split-Path -Parent
            Write-Host "✅ Node.js found in PATH: $nodePath" -ForegroundColor Green
        }
    } catch {
        # Node not in PATH
    }
}

if (-not $nodeFound) {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Or if already installed, add it to PATH manually:" -ForegroundColor Yellow
    Write-Host "  1. Find Node.js installation directory" -ForegroundColor Gray
    Write-Host "  2. Add to System PATH or User PATH" -ForegroundColor Gray
    Write-Host "  3. Restart PowerShell" -ForegroundColor Gray
    Write-Host ""
    
    # Try to open Node.js download page
    $response = Read-Host "Open Node.js download page? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Start-Process "https://nodejs.org/"
    }
    
    exit 1
}

# Add Node.js to current session PATH
if ($nodePath -and $env:PATH -notlike "*$nodePath*") {
    Write-Host "Adding Node.js to current session PATH..." -ForegroundColor Yellow
    $env:PATH = "$nodePath;$env:PATH"
    Write-Host "[OK] Added to PATH for this session" -ForegroundColor Green
}

# Verify Node.js and npm
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version
    $npmVersion = & npm --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to verify Node.js/npm" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Install packages
Write-Host ""
Write-Host "Installing npm packages..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

Set-Location backend

try {
    & npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Packages installed successfully!" -ForegroundColor Green
        
        # Verify Google Cloud package
        if (Test-Path "node_modules\@google-cloud\aiplatform") {
            Write-Host "✅ @google-cloud/aiplatform package installed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  @google-cloud/aiplatform not found (may need manual install)" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "❌ Package installation failed!" -ForegroundColor Red
        Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error installing packages: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Set up Google Cloud (optional)" -ForegroundColor Yellow
Write-Host "Run: .\backend\setup-google-cloud.ps1" -ForegroundColor White
Write-Host ""

