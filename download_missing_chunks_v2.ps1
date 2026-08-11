$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$dest = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector"
$files = @("c.js", "cj3n8.wasm")

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = Join-Path $dest $file
    Write-Host "Downloading $file..."
    try { Invoke-WebRequest -Uri $url -OutFile $output } catch { Write-Error $_ }
}