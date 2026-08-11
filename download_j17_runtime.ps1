$baseUrl = "https://cjrtnc.leaningtech.com/4.2/17"
$destRoot = "C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\17"

# Ensure destination exists
if (-not (Test-Path $destRoot)) {
    New-Item -ItemType Directory -Path $destRoot | Out-Null
    Write-Host "Created directory: $destRoot"
}

# List of Modules required for a GUI Application like Starsector
# We download the JARs which contain the class files for J17
$modules = @(
    "java.base.jar",
    "java.desktop.jar",
    "java.logging.jar",
    "java.prefs.jar",
    "java.xml.jar",
    "java.management.jar",
    "java.naming.jar",
    "java.datatransfer.jar",
    "java.instrument.jar",
    "java.scripting.jar",
    "jdk.unsupported.jar"
)

foreach ($mod in $modules) {
    $url = "$baseUrl/$mod"
    $output = Join-Path $destRoot $mod
    
    Write-Host "Downloading $mod..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Error "  Failed to download $mod : $_"
    }
}

# Also verify if 'meta' folder is needed for 4.2 J17
# Usually 4.2 fetches /17/java.base.jar directly.
