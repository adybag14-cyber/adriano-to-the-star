$url = "https://cjrtnc.leaningtech.com/4.2/17/lib/modules"
$dest = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\17\lib\modules"

# Ensure directory exists
$parent = Split-Path $dest
if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }

Write-Host "Downloading Java 17 Modules (This is a large file)..."
try {
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    Write-Host "Success!" -ForegroundColor Green
} catch {
    Write-Error "Failed to download modules: $_"
}