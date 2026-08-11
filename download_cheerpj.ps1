$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$files = @("loader.js", "cj3.js", "cj3.wasm", "c.html")

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