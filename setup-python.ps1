# PowerShell script to detect and setup Python
# This script detects Python and automatically installs it if not found

function Install-Python {
    Write-Host "Attempting to install Python..."
    
    # Try winget first (built into Windows 10/11)
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Installing Python 3.12 using winget..."
        try {
            $wingetResult = winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements --silent 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Python installed successfully via winget"
                # Refresh PATH
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                return $true
            }
        } catch {
            Write-Host "winget installation failed: $_"
        }
    }
    
    # Try Chocolatey as fallback
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "Installing Python using Chocolatey..."
        try {
            choco install python --version=3.12.0 -y
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Python installed successfully via Chocolatey"
                # Refresh PATH
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                return $true
            }
        } catch {
            Write-Host "Chocolatey installation failed: $_"
        }
    }
    
    Write-Host "Automatic installation failed. Please install Python manually."
    return $false
}

# Detect Python - get full executable path to avoid Windows Store stub issues
$pythonExe = $null
$pythonCmd = $null

# Try to get actual Python executable path
try {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand) {
        $pythonExe = $pythonCommand.Source
        # Check if it's the Windows Store stub (usually in WindowsApps)
        if ($pythonExe -notlike "*WindowsApps*") {
            $pythonCmd = $pythonExe
            Write-Host "Python found at: $pythonExe"
        } else {
            # Windows Store stub - try to find actual Python installation
            $possiblePaths = @(
                "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
                "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
                "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
                "$env:ProgramFiles\Python312\python.exe",
                "$env:ProgramFiles\Python311\python.exe",
                "$env:ProgramFiles\Python310\python.exe"
            )
            foreach ($path in $possiblePaths) {
                if (Test-Path $path) {
                    $pythonCmd = $path
                    Write-Host "Python found at: $pythonCmd"
                    break
                }
            }
        }
    }
} catch {
    Write-Host "Error detecting Python: $_"
}

# Try py launcher if python not found
if (-not $pythonCmd) {
    try {
        $pyCommand = Get-Command py -ErrorAction SilentlyContinue
        if ($pyCommand) {
            $pythonCmd = 'py'
            Write-Host "Python launcher found: py"
        }
    } catch {
        Write-Host "Error detecting py launcher: $_"
    }
}

# If Python not found, try to install it
if (-not $pythonCmd) {
    Write-Host "Python not found. Attempting automatic installation..."
    $installed = Install-Python
    
    if ($installed) {
        # Wait a moment for PATH to refresh
        Start-Sleep -Seconds 2
        
        # Try to detect Python again with full path
        $possiblePaths = @(
            "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe"
        )
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                $pythonCmd = $path
                Write-Host "Python found after installation: $pythonCmd"
                break
            }
        }
        
        # Fallback to command name
        if (-not $pythonCmd) {
            if (Get-Command python -ErrorAction SilentlyContinue) {
                $pythonCmd = 'python'
            } elseif (Get-Command py -ErrorAction SilentlyContinue) {
                $pythonCmd = 'py'
            }
        }
    }
}

if ($pythonCmd) {
    Write-Host "Using Python: $pythonCmd"
    try {
        & $pythonCmd --version
    } catch {
        Write-Host "Warning: Could not execute Python version check: $_"
        Write-Host "Python may not be properly installed or accessible."
    }
    
    # Upgrade pip
    Write-Host "Upgrading pip..."
    try {
        & $pythonCmd -m pip install --upgrade pip --quiet
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: pip upgrade returned exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "Warning: Could not upgrade pip: $_"
    }
    
    # Install required packages
    Write-Host "Installing required packages..."
    try {
        & $pythonCmd -m pip install requests beautifulsoup4 google-generativeai websockets google-genai --quiet
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Package installation returned exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "Warning: Could not install packages: $_"
    }
    
    # Run scraper if API key is available and file exists
    if ($env:GEMINI_API_KEY) {
        $scraperPath = Join-Path $PSScriptRoot "scrape_broadband_prices.py"
        if (-not (Test-Path $scraperPath)) {
            $scraperPath = "scrape_broadband_prices.py"
        }
        
        if (Test-Path $scraperPath) {
            Write-Host "Gemini API key detected, running AI-enhanced scraper..."
            
            # Enable live models for unlimited RPM/RPD (can be disabled by setting USE_GEMINI_LIVE=false)
            if (-not $env:USE_GEMINI_LIVE) {
                $env:USE_GEMINI_LIVE = "true"
                Write-Host "Live models enabled for unlimited RPM/RPD (set USE_GEMINI_LIVE=false to disable)"
            }
            
            try {
                & $pythonCmd $scraperPath
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Scraper failed, continuing..."
                }
            } catch {
                Write-Host "Warning: Could not run scraper: $_"
                Write-Host "Scraper failed, continuing..."
            }
        } else {
            Write-Host "Scraper file not found at $scraperPath, skipping..."
        }
    } else {
        Write-Host "No Gemini API key found, skipping price scraper..."
    }
} else {
    Write-Host "Python not available and automatic installation failed. Skipping Python steps."
    Write-Host "Please install Python manually on the GitLab runner machine (ADYPC)."
    # Exit with 0 to allow pipeline to continue (Python is optional for some builds)
    exit 0
}

