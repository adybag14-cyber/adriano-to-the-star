$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$dest = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector"

# Ensure destination exists
if (-not (Test-Path $dest)) {
    Write-Error "Destination path does not exist!"
    exit 1
}

$files = @(
    "loader.js",
    "cj3.js",
    "cj3.wasm",
    "cj3n17.wasm",
    "cheerpOS.js",
    "c.js",
    "cheerpj.css"
)

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = Join-Path $dest $file
    Write-Host "Fetching $file from CDN..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Error "  Failed to download $file : $_"
    }
}