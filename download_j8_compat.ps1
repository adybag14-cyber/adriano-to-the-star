$baseUrl = "https://cjrtnc.leaningtech.com/4.2/8/jre/lib"
$destRoot = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\8\jre\lib"

# Ensure destination exists
if (-not (Test-Path $destRoot)) {
    New-Item -ItemType Directory -Path $destRoot -Force | Out-Null
}

$files = @(
    "rt.jar",
    "cheerpj-awt.jar",
    "jsse.jar",
    "jce.jar",
    "charsets.jar",
    "resources.jar",
    "javaws.jar"
)

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = Join-Path $destRoot $file
    Write-Host "Downloading $file..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Error "  Failed: $_"
    }
}

# Also create the dummy system files it wants
$etcDir = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\etc"
if (-not (Test-Path $etcDir)) { New-Item -ItemType Directory -Path $etcDir -Force | Out-Null }

Set-Content -Path "$etcDir\users" -Value "user:x:1000:1000:User:/files/user:/bin/bash"
Set-Content -Path "$etcDir\localtime" -Value "UTC"

Write-Host "Compatibility files installed."