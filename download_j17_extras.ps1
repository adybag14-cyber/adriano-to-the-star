$baseUrl = "https://cjrtnc.leaningtech.com/4.2/17"
$destRoot = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\17"

$files = @(
    "lib/tzdb.dat",
    "lib/security/default.policy",
    "meta/java.base",
    "meta/java.desktop",
    "meta/java.logging",
    "meta/java.management",
    "meta/java.naming",
    "meta/java.xml"
)

foreach ($file in $files) {
    $fullUrl = "$baseUrl/$file"
    $localPath = Join-Path $destRoot $file
    
    # Create directory if it doesn't exist
    $dir = Split-Path $localPath
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    Write-Host "Downloading $file..."
    try {
        Invoke-WebRequest -Uri $fullUrl -OutFile $localPath -UseBasicParsing
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Error "  Failed: $_"
    }
}