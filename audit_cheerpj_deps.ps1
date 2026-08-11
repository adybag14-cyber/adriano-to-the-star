$cjDir = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector"
$cjFiles = Get-ChildItem -Path $cjDir -Include *.js,*.jar -Recurse

$foundDeps = @()

foreach ($file in $cjFiles) {
    try {
        # Read file as text (if binary, skip to avoid huge output)
        if ($file.Extension -eq ".jar") { continue }
        
        $content = Get-Content $file.FullName -Raw
        
        # Regex for common extensions in quotes
        $matches = [regex]::Matches($content, '["\'']([\w\-\.\/]+\.(wasm|jar|js|properties|dat|so|dll|mem))["\'']')
        
        foreach ($m in $matches) {
            $dep = $m.Groups[1].Value.TrimStart('/')
            if ($dep -notlike "*http*" -and $dep -notlike "*github*") {
                $foundDeps += $dep
            }
        }
    } catch {}
}

$uniqueDeps = $foundDeps | Select-Object -Unique
$missing = @()

Write-Host "--- DEPENDENCY AUDIT ---" -ForegroundColor Cyan

foreach ($dep in $uniqueDeps) {
    # Normalize paths for check
    $checkPath1 = Join-Path $cjDir $dep
    $checkPath2 = Join-Path $cjDir ("17/" + $dep)
    $checkPath3 = Join-Path $cjDir ("native/" + $dep)

    if (Test-Path $checkPath1) { 
        # Found in root
    } elseif (Test-Path $checkPath2) { 
        # Found in 17/
    } elseif (Test-Path $checkPath3) {
        # Found in native/
    } else {
        # Check if it's a known "optional" or "system" file we might overlook
        $missing += $dep
    }
}

if ($missing.Count -eq 0) {
    Write-Host "100% Coverage! All referenced files found." -ForegroundColor Green
} else {
    Write-Host "Potential Missing Files:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" }
}
