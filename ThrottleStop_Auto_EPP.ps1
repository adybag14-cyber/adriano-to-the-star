# ThrottleStop Automatic EPP Switcher
# Automatically switches EPP based on AC/Battery power
# AC Power: EPP = 0 (Maximum Performance)
# Battery: EPP = 255 (Maximum Efficiency)

# ============================================
# CONFIGURATION - EDIT THESE SETTINGS
# ============================================

# Path to ThrottleStop.exe
$ThrottleStopPath = "C:\Users\adyba\Downloads\ThrottleStop_9.7.3\ThrottleStop.exe"

# EPP Settings
$EPP_AC = 0          # Maximum Performance when plugged in
$EPP_Battery = 255   # Maximum Efficiency when on battery

# Power Limit Settings (PL1 - Long Power)
$PL1_AC = 25         # 25W when on AC power
$PL1_Battery = 10    # 10W when on battery

# Check interval in seconds (how often to check power status)
$CheckInterval = 5   # Check every 5 seconds

# Log file location
$LogFile = "$env:USERPROFILE\ThrottleStop_EPP_Log.txt"

# ============================================
# FUNCTIONS
# ============================================

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp [$Level] $Message"
    
    # Write to console
    Write-Host $logMessage
    
    # Write to log file
    try {
        Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
    } catch {
        # If log file can't be written, continue anyway
    }
}

function Get-PowerStatus {
    try {
        $battery = Get-WmiObject -Class Win32_Battery -ErrorAction SilentlyContinue
        
        if ($battery) {
            # BatteryStatus: 2 = AC Power, 1 = Battery, Other = Unknown
            if ($battery.BatteryStatus -eq 2) {
                return "AC"
            } elseif ($battery.BatteryStatus -eq 1) {
                return "Battery"
            } else {
                # If status is unknown, check if battery is charging
                if ($battery.Charging) {
                    return "AC"
                } else {
                    return "Battery"
                }
            }
        } else {
            # No battery detected (desktop PC) - assume AC power
            Write-Log "No battery detected - assuming AC power" "WARN"
            return "AC"
        }
    } catch {
        Write-Log "Error detecting power status: $_" "ERROR"
        return "AC"  # Default to AC on error
    }
}

function Set-ThrottleStopEPP {
    param(
        [int]$EPPValue,
        [int]$PL1Value,
        [string]$PowerSource
    )
    
    if (-not (Test-Path $ThrottleStopPath)) {
        Write-Log "ERROR: ThrottleStop not found at: $ThrottleStopPath" "ERROR"
        Write-Log "Please edit the script and set the correct path to ThrottleStop.exe" "ERROR"
        return $false
    }
    
    try {
        Write-Log "Setting EPP to $EPPValue and PL1 to ${PL1Value}W for $PowerSource power" "INFO"
        
        # Try to find ThrottleStop process
        $throttleStopProcess = Get-Process -Name "ThrottleStop" -ErrorAction SilentlyContinue
        
        if (-not $throttleStopProcess) {
            Write-Log "ThrottleStop is not running. Starting ThrottleStop..." "WARN"
            
            # Start ThrottleStop as administrator
            try {
                Start-Process -FilePath $ThrottleStopPath -Verb RunAs -WindowStyle Minimized
                Start-Sleep -Seconds 3  # Wait for ThrottleStop to start
                Write-Log "ThrottleStop started successfully" "INFO"
            } catch {
                Write-Log "Failed to start ThrottleStop: $_" "ERROR"
                Write-Log "Please start ThrottleStop manually and run this script again" "ERROR"
                return $false
            }
        }
        
        # Update ThrottleStop.ini file (if it exists)
        $iniPath = Join-Path (Split-Path $ThrottleStopPath -Parent) "ThrottleStop.ini"
        
        if (Test-Path $iniPath) {
            $iniContent = Get-Content $iniPath -Raw
            
            # Update EPP value in INI file
            if ($iniContent -match 'EPP\s*=\s*\d+') {
                $iniContent = $iniContent -replace 'EPP\s*=\s*\d+', "EPP = $EPPValue"
            } else {
                # Add EPP setting if it doesn't exist
                $iniContent += "`nEPP = $EPPValue`n"
            }
            
            # Update PL1 value in INI file (look for TPL settings)
            # ThrottleStop stores PL1 in format like "TPL1 = 25" or "LongPower = 25"
            if ($iniContent -match '(TPL1|LongPower)\s*=\s*\d+') {
                $iniContent = $iniContent -replace '(TPL1|LongPower)\s*=\s*\d+', "`$1 = $PL1Value"
            } else {
                # Add PL1 setting if it doesn't exist
                $iniContent += "`nTPL1 = $PL1Value`n"
            }
            
            try {
                Set-Content -Path $iniPath -Value $iniContent -Force
                Write-Log "Updated ThrottleStop.ini with EPP = $EPPValue and PL1 = ${PL1Value}W" "INFO"
            } catch {
                Write-Log "Could not write to ThrottleStop.ini: $_" "WARN"
            }
        } else {
            Write-Log "ThrottleStop.ini not found. ThrottleStop may need to be configured manually." "WARN"
        }
        
        Write-Log "EPP setting applied: $EPPValue, PL1 setting applied: ${PL1Value}W (Power: $PowerSource)" "INFO"
        
        return $true
        
    } catch {
        Write-Log "Error setting EPP/PL1: $_" "ERROR"
        return $false
    }
}

function Apply-EPPSetting {
    param(
        [string]$PowerSource
    )
    
    if ($PowerSource -eq "AC") {
        $targetEPP = $EPP_AC
        $targetPL1 = $PL1_AC
        $powerDesc = "AC Power (Performance)"
    } else {
        $targetEPP = $EPP_Battery
        $targetPL1 = $PL1_Battery
        $powerDesc = "Battery (Efficiency)"
    }
    
    Write-Log "Power source: $powerDesc - Setting EPP to $targetEPP and PL1 to ${targetPL1}W" "INFO"
    
    $result = Set-ThrottleStopEPP -EPPValue $targetEPP -PL1Value $targetPL1 -PowerSource $PowerSource
    
    if ($result) {
        Write-Log "Successfully applied EPP = $targetEPP and PL1 = ${targetPL1}W" "SUCCESS"
    } else {
        Write-Log "Failed to apply EPP/PL1 settings" "ERROR"
    }
    
    return $result
}

# ============================================
# MAIN SCRIPT
# ============================================

Write-Log "========================================" "INFO"
Write-Log "ThrottleStop Auto EPP Switcher Started" "INFO"
Write-Log "AC Power - EPP: $EPP_AC (Performance), PL1: ${PL1_AC}W" "INFO"
Write-Log "Battery - EPP: $EPP_Battery (Efficiency), PL1: ${PL1_Battery}W" "INFO"
Write-Log "Check Interval: $CheckInterval seconds" "INFO"
Write-Log "========================================" "INFO"

# Verify ThrottleStop path
if (-not (Test-Path $ThrottleStopPath)) {
    Write-Log "ERROR: ThrottleStop.exe not found at: $ThrottleStopPath" "ERROR"
    Write-Log "" "ERROR"
    Write-Log "Please edit this script and set the correct path:" "ERROR"
    Write-Log "`$ThrottleStopPath = `"C:\Your\Path\To\ThrottleStop.exe`"" "ERROR"
    Write-Log "" "ERROR"
    Write-Log "Press any key to exit..." "ERROR"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Track previous power state
$previousPowerState = $null
$firstRun = $true

# Main monitoring loop
Write-Log "Starting power monitoring loop..." "INFO"
Write-Log "Press Ctrl+C to stop" "INFO"
Write-Log "" "INFO"

try {
    while ($true) {
        $currentPowerState = Get-PowerStatus
        
        # Apply EPP on first run or when power state changes
        if ($firstRun -or $currentPowerState -ne $previousPowerState) {
            if ($firstRun) {
                Write-Log "Initial power state detected: $currentPowerState" "INFO"
                $firstRun = $false
            } else {
                Write-Log "Power state changed: $previousPowerState -> $currentPowerState" "INFO"
            }
            
            Apply-EPPSetting -PowerSource $currentPowerState
            $previousPowerState = $currentPowerState
        }
        
        # Wait before next check
        Start-Sleep -Seconds $CheckInterval
    }
} catch {
    Write-Log "Script error: $_" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
} finally {
    Write-Log "Script stopped" "INFO"
    Write-Log "Log file: $LogFile" "INFO"
}

