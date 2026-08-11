# Node.js Installation Checker
# This script helps verify if Node.js is installed and configured correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Node.js Installation Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$nodeFound = $false
$nodePath = $null

# Check if node is in PATH
Write-Host "[1/4] Checking if Node.js is in PATH..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>$null
    if ($nodeVersion) {
        $nodePath = (Get-Command node).Source | Split-Path -Parent
        Write-Host "  [OK] Node.js found in PATH!" -ForegroundColor Green
        Write-Host "  Version: $nodeVersion" -ForegroundColor Cyan
        Write-Host "  Location: $nodePath" -ForegroundColor Gray
        $nodeFound = $true
    }
} catch {
    Write-Host "  [NOT FOUND] Node.js not in PATH" -ForegroundColor Red
}

# Check common installation locations
if (-not $nodeFound) {
    Write-Host ""
    Write-Host "[2/4] Searching common installation locations..." -ForegroundColor Yellow
    
    $searchPaths = @(
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs",
        "$env:LOCALAPPDATA\Programs\nodejs",
        "$env:USERPROFILE\AppData\Local\Programs\nodejs"
    )
    
    foreach ($path in $searchPaths) {
        $nodeExe = Join-Path $path "node.exe"
        if (Test-Path $nodeExe) {
            Write-Host "  [FOUND] Node.js at: $path" -ForegroundColor Green
            $nodePath = $path
            $nodeFound = $true
            break
        }
    }
    
    if (-not $nodeFound) {
        Write-Host "  [NOT FOUND] Node.js not found in common locations" -ForegroundColor Red
    }
}

# Check npm
Write-Host ""
Write-Host "[3/4] Checking npm..." -ForegroundColor Yellow
if ($nodeFound) {
    try {
        if ($nodePath -and $env:PATH -notlike "*$nodePath*") {
            $env:PATH = "$nodePath;$env:PATH"
        }
        $npmVersion = & npm --version 2>$null
        if ($npmVersion) {
            Write-Host "  [OK] npm found!" -ForegroundColor Green
            Write-Host "  Version: $npmVersion" -ForegroundColor Cyan
        } else {
            Write-Host "  [WARNING] npm not found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [ERROR] npm not accessible" -ForegroundColor Red
    }
} else {
    Write-Host "  [SKIP] Cannot check npm (Node.js not found)" -ForegroundColor Gray
}

# Summary and recommendations
Write-Host ""
Write-Host "[4/4] Summary and Recommendations" -ForegroundColor Yellow
Write-Host ""

if ($nodeFound) {
    Write-Host "  [OK] Node.js is installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. If Node.js was just found (not in PATH), restart PowerShell" -ForegroundColor White
    Write-Host "  2. Run: cd backend" -ForegroundColor White
    Write-Host "  3. Run: npm install" -ForegroundColor White
    Write-Host "  4. Run: npm install @google-cloud/aiplatform --save" -ForegroundColor White
} else {
    Write-Host "  [NOT INSTALLED] Node.js is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation options:" -ForegroundColor Cyan
    Write-Host "  1. Download from: https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. Use Chocolatey: choco install nodejs" -ForegroundColor White
    Write-Host "  3. Use Winget: winget install OpenJS.NodeJS.LTS" -ForegroundColor White
    Write-Host ""
    Write-Host "See INSTALL-NODEJS.md for detailed instructions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

