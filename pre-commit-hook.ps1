# Pre-commit hook to validate YAML and PowerShell syntax
# Run this before committing to catch errors early

Write-Host "Running pre-commit validation..."

$errors = 0

# Validate YAML
Write-Host "Validating .gitlab-ci.yml..."
if (Test-Path "validate-yaml.ps1") {
    & powershell -ExecutionPolicy Bypass -File validate-yaml.ps1
    if ($LASTEXITCODE -ne 0) {
        $errors++
    }
} else {
    Write-Host "Warning: validate-yaml.ps1 not found"
}

# Validate PowerShell scripts
Write-Host "Validating PowerShell scripts..."
$psFiles = Get-ChildItem -Filter *.ps1 -Recurse | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" }

foreach ($file in $psFiles) {
    Write-Host "  Checking $($file.Name)..."
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) {
        Write-Host "    Warning: Could not read $($file.Name)"
        continue
    }
    
    # Basic syntax check
    $null = [System.Management.Automation.PSParser]::Tokenize($content, [ref]$null)
    if ($?) {
        Write-Host "    $($file.Name) syntax OK"
    } else {
        Write-Host "    ERROR: $($file.Name) has syntax errors"
        $errors++
    }
}

if ($errors -gt 0) {
    Write-Host "ERROR: Validation failed with $errors error(s)"
    exit 1
} else {
    Write-Host "All validations passed"
    exit 0
}

