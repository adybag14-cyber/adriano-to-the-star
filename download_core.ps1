$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$dest = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector"
$files = @("loader.js", "cj3.js", "cj3.wasm", "c.html", "cheerpj.css", "cheerpOS.js")

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = Join-Path $dest $file
    Write-Host "Downloading $file..."
    try { Invoke-WebRequest -Uri $url -OutFile $output } catch { Write-Error $_ }
}
