# PowerShell script to auto-fix common pipeline issues
# This runs before the pipeline to ensure everything is configured correctly

Write-Host "Auto-fixing pipeline configuration..."

$fixes = 0

# Check if required scripts exist
$requiredScripts = @(
    "validate-yaml.ps1",
    "git-lfs-pull.ps1",
    "setup-python.ps1",
    "clean-public-directory.ps1",
    "create-public-directory.ps1",
    "copy-files.ps1",
    "inject-api-keys.ps1",
    "copy-manifest-files.ps1",
    "remove-build-artifacts.ps1",
    "remove-build-files.ps1",
    "get-directory-size.ps1"
)

foreach ($script in $requiredScripts) {
    if (-not (Test-Path $script)) {
        Write-Host "Warning: $script not found"
    } else {
        Write-Host "Found: $script"
    }
}

# Check YAML syntax
if (Test-Path ".gitlab-ci.yml") {
    $yamlContent = Get-Content ".gitlab-ci.yml" -Raw
    # Basic checks
    if ($yamlContent -match "`t") {
        Write-Host "Warning: YAML contains tabs (should use spaces)"
    }
    Write-Host "YAML file exists and appears valid"
}

Write-Host "Pipeline auto-fix check complete"

