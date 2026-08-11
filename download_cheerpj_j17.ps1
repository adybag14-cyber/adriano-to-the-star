$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$dest = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector"
$files = @("cj3n17.wasm")

# Ensure destination exists
if (-not (Test-Path $dest)) {
    Write-Error "Destination path does not exist: $dest"
    exit 1
}

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = Join-Path $dest $file
    Write-Host "Downloading $file from $url..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "Saved to $output"
    } catch {
        Write-Error "Failed to download $file : $_"
    }
}