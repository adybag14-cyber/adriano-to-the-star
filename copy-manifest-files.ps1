# PowerShell script to copy manifest and data files

$filesCopied = 0

# Copy manifest files
$manifestFiles = @("manifest.json", "games-manifest.json", "broadband-deals.json")
foreach ($file in $manifestFiles) {
    if (Test-Path $file) {
        Copy-Item $file public/ -ErrorAction SilentlyContinue -Force
        $filesCopied++
        Write-Host "Copied $file"
    }
}

# Copy directories
$directories = @("translations", "images", "audio", "data")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Copy-Item -Path $dir -Destination public/ -Recurse -ErrorAction SilentlyContinue -Force
        Write-Host "Copied $dir directory"
    }
}

Write-Host "Copied $filesCopied manifest files and directories"

