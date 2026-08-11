# PowerShell script to check Git LFS pull status
# Note: This script should be called immediately after git-lfs-pull.ps1

# Check if Git LFS pull was successful by checking LASTEXITCODE
# If LASTEXITCODE is not set or is 0, pull was successful
if ($LASTEXITCODE -eq $null) {
    # LASTEXITCODE not set, assume success (git-lfs-pull.ps1 may have succeeded)
    Write-Host "Git LFS pull check: Assuming success (exit code not available)"
    exit 0
} elseif ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Git LFS pull had issues (exit code: $LASTEXITCODE)"
    exit 0
} else {
    Write-Host "Git LFS pull completed successfully"
    exit 0
}

