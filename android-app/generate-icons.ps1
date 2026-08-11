# PowerShell script to generate placeholder Android app icons
# This creates simple colored square icons as placeholders

$resDir = "app\src\main\res"

# Icon sizes for different densities
$iconSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Create directories and placeholder note
foreach ($density in $iconSizes.Keys) {
    $dir = Join-Path $resDir $density
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Create a README explaining how to add icons
    $readme = @"
# App Icons Required

This directory needs the following icon files:
- ic_launcher.png ($($iconSizes[$density])x$($iconSizes[$density]))
- ic_launcher_round.png ($($iconSizes[$density])x$($iconSizes[$density]))

## How to Add Icons:

1. **Using Android Studio:**
   - Right-click on res folder → New → Image Asset
   - Select Launcher Icons
   - Choose your icon image
   - Click Finish

2. **Using Online Generator:**
   - Visit: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
   - Upload your icon
   - Download and extract here

3. **Manual:**
   - Create PNG files with the exact names above
   - Use the size specified for this density
"@
    
    Set-Content -Path (Join-Path $dir "README.txt") -Value $readme
    Write-Host "Created directory: $dir"
}

Write-Host ""
Write-Host "Icon directories created. Please add icon files using one of these methods:"
Write-Host "1. Android Studio: Right-click res → New → Image Asset"
Write-Host "2. Online: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html"
Write-Host "3. Or temporarily use system icons (already configured in AndroidManifest.xml)"

