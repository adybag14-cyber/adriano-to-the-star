$baseUrl = "https://cjrtnc.leaningtech.com/4.2"
$root = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector"

# 1. Download cheerpj.svg to root
$svgUrl = "$baseUrl/cheerpj.svg"
$svgOut = Join-Path $root "cheerpj.svg"
Write-Host "Downloading cheerpj.svg..."
try { Invoke-WebRequest -Uri $svgUrl -OutFile $svgOut; Write-Host "Saved cheerpj.svg" } catch { Write-Error $_ }

# 2. Download rt.jar to /8/jre/lib/
$rtUrl = "$baseUrl/8/jre/lib/rt.jar"
$rtOut = Join-Path $root "8\jre\lib\rt.jar"
Write-Host "Downloading rt.jar (This may take a moment)..."
try { Invoke-WebRequest -Uri $rtUrl -OutFile $rtOut; Write-Host "Saved rt.jar" } catch { Write-Error $_ }