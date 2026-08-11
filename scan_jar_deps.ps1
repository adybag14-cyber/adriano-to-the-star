$cjDir = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\17"
$targetJars = @("cheerpj-awt.jar", "cheerpj-handlers.jar", "cheerpj-jsobject.jar", "javaws.jar")

$foundSubDeps = @()

foreach ($jarName in $targetJars) {
    $path = Join-Path $cjDir $jarName
    if (Test-Path $path) {
        Write-Host "Scanning $jarName..." -ForegroundColor Cyan
        $content = [System.IO.File]::ReadAllBytes($path)
        $text = [System.Text.Encoding]::ASCII.GetString($content)
        
        $matches = [regex]::Matches($text, '[\w\-\.\/]+\.(wasm|jar|js|properties|dat|so|dll|mem)')
        
        foreach ($m in $matches) {
            $dep = $m.Value
            if ($dep.Length -gt 5) { # Filter out tiny junk
                 $foundSubDeps += $dep
            }
        }
    }
}

$uniqueSubDeps = $foundSubDeps | Select-Object -Unique
Write-Host "`n--- Potential Sub-Dependencies ---" -ForegroundColor Yellow
$uniqueSubDeps | ForEach-Object { Write-Host "  - $_" }