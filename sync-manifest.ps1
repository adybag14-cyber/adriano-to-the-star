# Configuration
$swfDir = Join-Path $PSScriptRoot "swf"
$manifestPath = Join-Path $PSScriptRoot "games-manifest.json"
$backupPath = Join-Path $PSScriptRoot "games-manifest.backup.json"
# 1. Get list of all SWF files
Write-Host "Scanning SWF directory..."
$swfFiles = Get-ChildItem -Path $swfDir -Filter "*.swf" | Sort-Object Name
$deployedFiles = $swfFiles | ForEach-Object { $_.Name }

Write-Host "Found $($swfFiles.Count) SWF files."
Write-Host "Selected all $($deployedFiles.Count) files for deployment."

# 2. Read manifest
Write-Host "Reading manifest..."
$jsonContent = Get-Content -Path $manifestPath -Raw
$manifest = $jsonContent | ConvertFrom-Json

# 3. Filter manifest
Write-Host "Filtering manifest..."
$filteredManifest = $manifest | Where-Object {
    $filename = Split-Path $_.file -Leaf
    $deployedFiles -contains $filename
}

Write-Host "Manifest originally had $($manifest.Count) games."
Write-Host "Filtered manifest has $($filteredManifest.Count) games."

# 4. Backup original manifest
Write-Host "Backing up original manifest..."
$jsonContent | Set-Content -Path $backupPath

# 5. Write new manifest
Write-Host "Writing new manifest..."
$filteredJson = $filteredManifest | ConvertTo-Json -Depth 10
$filteredJson | Set-Content -Path $manifestPath

Write-Host "Done! Manifest synced with deployed files."
