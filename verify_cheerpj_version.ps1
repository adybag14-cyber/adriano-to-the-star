$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$localDir = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector"
$files = @("loader.js", "cj3.js", "cj3.wasm", "c.js", "cheerpOS.js")

foreach ($file in $files) {
    $localPath = Join-Path $localDir $file
    $tempPath = Join-Path $env:TEMP "cheerpj_verify_$file"
    
    # 1. Calculate Local Hash
    if (Test-Path $localPath) {
        $localHash = (Get-FileHash -Path $localPath -Algorithm SHA256).Hash
    } else {
        $localHash = "MISSING"
    }

    # 2. Download and Calculate Remote Hash
    try {
        Invoke-WebRequest -Uri "$baseUrl/$file" -OutFile $tempPath
        $remoteHash = (Get-FileHash -Path $tempPath -Algorithm SHA256).Hash
        Remove-Item $tempPath
    } catch {
        $remoteHash = "DOWNLOAD_FAILED"
    }

    # 3. Compare
    if ($localHash -eq $remoteHash) {
        Write-Host "[MATCH] $file is version 4.2" -ForegroundColor Green
    } else {
        Write-Host "[MISMATCH] $file is DIFFERENT from 4.2" -ForegroundColor Red
        Write-Host "  Local:  $localHash"
        Write-Host "  Remote: $remoteHash"
    }
}