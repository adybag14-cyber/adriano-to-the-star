# PowerShell script to check Python setup status
# Note: This script should be called immediately after setup-python.ps1

# Check if Python setup was successful by checking LASTEXITCODE
# If LASTEXITCODE is not set or is 0, setup was successful
if ($LASTEXITCODE -eq $null) {
    # LASTEXITCODE not set, assume success (setup-python.ps1 may have succeeded)
    Write-Host "Python setup check: Assuming success (exit code not available)"
    exit 0
} elseif ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Python setup failed with exit code $LASTEXITCODE"
    exit 1
} else {
    Write-Host "Python setup completed successfully"
    exit 0
}

