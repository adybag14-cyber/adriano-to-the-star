$baseUrl = "https://cjrtnc.leaningtech.com/4.2/8/jre/lib"
$destDir = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\8\jre\lib"
$files = @(
    "cheerpj-awt.jar",
    "jsse.jar",
    "jce.jar",
    "charsets.jar",
    "resources.jar",
    "javaws.jar"
)

# 1. Download missing JARs
foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $output = Join-Path $destDir $file
    Write-Host "Downloading $file..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "Saved $file"
    } catch {
        Write-Error "Failed to download $file : $_"
    }
}

# 2. Create /etc system files (Mocking Linux environment)
$etcDir = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\etc"
New-Item -Path $etcDir -ItemType Directory -Force | Out-Null

# Create dummy /etc/users
Set-Content -Path (Join-Path $etcDir "users") -Value "root:x:0:0:root:/root:/bin/bash"
Write-Host "Created /etc/users"

# Create dummy /etc/localtime (Using UTC)
Set-Content -Path (Join-Path $etcDir "localtime") -Value "UTC"
Write-Host "Created /etc/localtime"