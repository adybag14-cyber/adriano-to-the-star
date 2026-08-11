$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$files = @("cj3n8.wasm", "c.js")

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = Join-Path "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector" $file
    Write-Host "Downloading $file from $url..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "Saved to $output"
    } catch {
        Write-Error "Failed to download $file : $_"
    }
}