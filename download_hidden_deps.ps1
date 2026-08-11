$baseUrl = "https://cjrtnc.leaningtech.com/4.2/17"
$dest = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\17"

# Note: Some might be in root 4.2/ instead of 4.2/17/, we'll try both.
$files = @("cheerpj-handlers.jar", "cheerpj-awt.jar", "cheerpj-jsobject.jar")

foreach ($file in $files) {
    # Try /17/ path first
    $url = "$baseUrl/$file"
    $output = Join-Path $dest $file
    
    try {
        Write-Host "Fetching $file..."
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing -ErrorAction Stop
        Write-Host "  OK ($url)" -ForegroundColor Green
    } catch {
        # Fallback to root 4.2/ path (some common jars are shared)
        try {
            $fallbackUrl = "https://cjrtnc.leaningtech.com/4.2/$file"
            Write-Host "  Retrying at root..."
            Invoke-WebRequest -Uri $fallbackUrl -OutFile $output -UseBasicParsing
            Write-Host "  OK ($fallbackUrl)" -ForegroundColor Green
        } catch {
             Write-Error "  FAILED to find $file"
        }
    }
}

# x11.wasm is usually in the root or /17/
$x11Dest = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\x11.wasm"
try {
    Invoke-WebRequest -Uri "https://cjrtnc.leaningtech.com/4.2/x11.wasm" -OutFile $x11Dest -UseBasicParsing
    Write-Host "Fetched x11.wasm" -ForegroundColor Green
} catch {
    Write-Warning "Could not find x11.wasm (might not be needed for this version)"
}