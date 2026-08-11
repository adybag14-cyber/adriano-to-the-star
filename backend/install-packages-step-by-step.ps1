# Step-by-step package installation script
# This installs packages one at a time to identify any issues

Write-Host "Installing packages step by step..." -ForegroundColor Cyan
Write-Host ""

$packages = @(
    "express",
    "cors",
    "dotenv",
    "axios",
    "ws",
    "archiver",
    "bcryptjs",
    "jsonwebtoken",
    "multer",
    "googleapis",
    "@google-cloud/aiplatform"
)

foreach ($package in $packages) {
    Write-Host "Installing $package..." -ForegroundColor Yellow
    try {
        npm install $package --save --no-optional 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $package installed" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] $package failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [ERROR] $package failed: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green


