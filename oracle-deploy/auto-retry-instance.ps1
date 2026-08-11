# Oracle Cloud Instance Auto-Retry Script (PowerShell version)
# Attempts to create an instance every 5 minutes until successful
#
# SETUP:
# 1. Install OCI CLI: Run this in PowerShell:
#    Set-ExecutionPolicy Bypass -Scope Process -Force
#    Invoke-WebRequest https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1 -OutFile install.ps1
#    .\install.ps1 -AcceptAllDefaults
# 2. Run: oci setup config
# 3. Add the generated API key to Oracle Cloud Console

# ============================================
# CONFIGURATION - EDIT THESE VALUES
# ============================================
$CompartmentId = "ocid1.tenancy.oc1..aaaaaaaan3fwo3yruzh7ucpbnlw4rhuytctzjh42gobfniscdda4cotv5lwq"
$AvailabilityDomain = "YqAQ:UK-LONDON-1-AD-1"
$ImageId = "ocid1.image.oc1.uk-london-1.aaaaaaaaw2hy6tmpi4k2mjbuj3japjqiw32fbaz6ffhglzkwpdy4pholqynq"
$Shape = "VM.Standard.A1.Flex"
$Ocpus = 4
$MemoryGb = 24
$InstanceName = "starsector-server"
$SshKeyFile = "C:\Users\adyba\Downloads\ssh-key-2025-12-08.key.pub"
$RetryIntervalSeconds = 300  # 5 minutes

# ============================================
# SCRIPT LOGIC
# ============================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Oracle Cloud Instance Auto-Retry Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Compartment: $CompartmentId"
Write-Host "AD: $AvailabilityDomain"
Write-Host "Shape: $Shape ($Ocpus OCPUs, $MemoryGb GB)"
Write-Host "Retry Interval: $RetryIntervalSeconds seconds"
Write-Host ""
Write-Host "Press Ctrl+C to stop at any time." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

# Read SSH key
$SshKey = Get-Content $SshKeyFile -Raw
$SshKey = $SshKey.Trim()

$attempt = 0
$success = $false

while (-not $success) {
    $attempt++
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Yellow
    Write-Host "Attempt #$attempt - $(Get-Date)" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Yellow
    
    try {
        # First, we need to create VCN and subnet if they don't exist
        # For simplicity, we'll use the Resource Manager stack approach
        
        $shapeConfig = @{
            ocpus       = $Ocpus
            memoryInGBs = $MemoryGb
        } | ConvertTo-Json -Compress
        
        $metadata = @{
            ssh_authorized_keys = $SshKey
        } | ConvertTo-Json -Compress
        
        # Try to launch instance
        $result = oci compute instance launch `
            --compartment-id $CompartmentId `
            --availability-domain $AvailabilityDomain `
            --shape $Shape `
            --shape-config $shapeConfig `
            --image-id $ImageId `
            --display-name $InstanceName `
            --metadata $metadata `
            2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "=============================================" -ForegroundColor Green
            Write-Host "SUCCESS! Instance creation started!" -ForegroundColor Green
            Write-Host "=============================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Check the Oracle Console for your instance status."
            Write-Host $result
            $success = $true
        }
        else {
            Write-Host "Failed: $result" -ForegroundColor Red
            Write-Host ""
            Write-Host "Will retry in $RetryIntervalSeconds seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds $RetryIntervalSeconds
        }
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host "Will retry in $RetryIntervalSeconds seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds $RetryIntervalSeconds
    }
}

Write-Host ""
Write-Host "Script completed successfully!" -ForegroundColor Green
Read-Host "Press Enter to exit"
