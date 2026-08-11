# PowerShell script to search for and optionally install Python
# Run this on the GitLab CI runner machine (ADYPC) if Python is not found

Write-Host "Searching for Python installations..."

# Common Python installation locations
$pythonPaths = @(
    "$env:LOCALAPPDATA\Programs\Python",
    "$env:ProgramFiles\Python*",
    "$env:ProgramFiles(x86)\Python*",
    "$env:USERPROFILE\AppData\Local\Programs\Python",
    "C:\Python*",
    "C:\Program Files\Python*",
    "$env:LOCALAPPDATA\Microsoft\WindowsApps\python.exe"
)

$foundPython = $false

# Check if python or py commands are available
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = (Get-Command python).Source
    Write-Host "[OK] Python found via 'python' command: $pythonExe"
    & python --version
    $foundPython = $true
}

if (Get-Command py -ErrorAction SilentlyContinue) {
    $pyExe = (Get-Command py).Source
    Write-Host "[OK] Python launcher found via 'py' command: $pyExe"
    & py --version
    $foundPython = $true
}

# Search common installation directories
Write-Host "`nSearching common installation directories..."
foreach ($path in $pythonPaths) {
    $resolvedPaths = Resolve-Path $path -ErrorAction SilentlyContinue
    foreach ($resolvedPath in $resolvedPaths) {
        if (Test-Path $resolvedPath) {
            Write-Host "  Found: $resolvedPath"
            # Check if it's a directory or executable
            if (Test-Path "$resolvedPath\python.exe") {
                Write-Host "    -> Contains python.exe"
                $foundPython = $true
            }
        }
    }
}

# Check PATH environment variable
Write-Host "`nChecking PATH environment variable..."
$pathEntries = $env:PATH -split ';'
foreach ($entry in $pathEntries) {
    if ($entry -match 'Python|python') {
        Write-Host "  Python-related PATH entry: $entry"
        if (Test-Path "$entry\python.exe") {
            Write-Host "    -> python.exe exists"
            $foundPython = $true
        }
    }
}

if (-not $foundPython) {
    Write-Host "`n[ERROR] Python not found in common locations."
    Write-Host "`nTo install Python, you can use one of these methods:"
    Write-Host ""
    Write-Host "1. Using winget (Windows Package Manager):"
    Write-Host "   winget install Python.Python.3.12"
    Write-Host ""
    Write-Host "2. Using Chocolatey (if installed):"
    Write-Host "   choco install python --version=3.12.0"
    Write-Host ""
    Write-Host "3. Download from python.org:"
    Write-Host "   https://www.python.org/downloads/"
    Write-Host ""
    Write-Host "4. Using Microsoft Store:"
    Write-Host "   Search for 'Python 3.12' in Microsoft Store"
    Write-Host ""
    
    $install = Read-Host "Would you like to install Python using winget? (Y/N)"
    if ($install -eq 'Y' -or $install -eq 'y') {
        Write-Host "Installing Python via winget..."
        winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements
        Write-Host "`nPlease restart your terminal/PowerShell session after installation."
        Write-Host "Then run 'python --version' to verify installation."
    }
} else {
    Write-Host "`nPython is available on this system!"
}

