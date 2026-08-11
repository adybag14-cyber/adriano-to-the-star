# Add Node.js to System PATH Permanently
# Run this script as Administrator to add Node.js to PATH permanently

Write-Host "🔧 Adding Node.js to System PATH" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs Administrator privileges" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, you can add to User PATH (no admin needed):" -ForegroundColor Cyan
    Write-Host "  [Environment]::SetEnvironmentVariable('Path', `$env:Path + ';C:\Program Files\nodejs', 'User')" -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "Add to User PATH instead? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        # Find Node.js
        $nodePaths = @(
            "C:\Program Files\nodejs",
            "C:\Program Files (x86)\nodejs",
            "$env:LOCALAPPDATA\Programs\nodejs"
        )
        
        $nodePath = $null
        foreach ($path in $nodePaths) {
            if (Test-Path (Join-Path $path "node.exe")) {
                $nodePath = $path
                break
            }
        }
        
        if ($nodePath) {
            $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
            if ($currentPath -notlike "*$nodePath*") {
                [Environment]::SetEnvironmentVariable('Path', "$currentPath;$nodePath", 'User')
                Write-Host "✅ Added $nodePath to User PATH" -ForegroundColor Green
                Write-Host "Please restart PowerShell for changes to take effect" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Node.js already in User PATH" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
        }
    }
    exit
}

# Find Node.js installation
$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
)

$nodePath = $null
foreach ($path in $nodePaths) {
    if (Test-Path (Join-Path $path "node.exe")) {
        $nodePath = $path
        Write-Host "✅ Found Node.js at: $nodePath" -ForegroundColor Green
        break
    }
}

if (-not $nodePath) {
    Write-Host "❌ Node.js not found in common locations" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Add to System PATH
$currentSystemPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
if ($currentSystemPath -notlike "*$nodePath*") {
    $newSystemPath = "$currentSystemPath;$nodePath"
    [Environment]::SetEnvironmentVariable('Path', $newSystemPath, 'Machine')
    Write-Host "✅ Added $nodePath to System PATH" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Please restart PowerShell for changes to take effect" -ForegroundColor Yellow
} else {
    Write-Host "✅ Node.js already in System PATH" -ForegroundColor Green
}

# Also add to current session
$env:Path = "$nodePath;$env:Path"

Write-Host ""
Write-Host "Testing Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version
    $npmVersion = & npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Node.js not working in current session" -ForegroundColor Yellow
    Write-Host "Restart PowerShell to use Node.js" -ForegroundColor Yellow
}

