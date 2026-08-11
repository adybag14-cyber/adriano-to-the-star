# PowerShell script to validate YAML syntax
# This runs before committing to catch YAML errors early

Write-Host "Validating .gitlab-ci.yml syntax..."

$yamlFile = ".gitlab-ci.yml"

if (-not (Test-Path $yamlFile)) {
    Write-Host "Error: $yamlFile not found"
    exit 1
}

# Basic YAML validation - check for common syntax errors
$content = Get-Content $yamlFile -Raw

# Check for unclosed quotes
$singleQuotes = ($content | Select-String -Pattern "'" -AllMatches).Matches.Count
$doubleQuotes = ($content | Select-String -Pattern '"' -AllMatches).Matches.Count

# Check for basic YAML structure
if ($content -notmatch '^[a-zA-Z0-9_-]+:') {
    Write-Host "Warning: YAML may not have proper structure"
}

# Check for common errors
$errors = @()

# Check for tabs (YAML should use spaces)
if ($content -match "`t") {
    $errors += "YAML contains tabs (should use spaces)"
}

# Check for trailing spaces
if ($content -match ' +$') {
    $errors += "YAML contains trailing spaces"
}

if ($errors.Count -gt 0) {
    Write-Host "YAML validation errors found:"
    foreach ($error in $errors) {
        Write-Host "  - $error"
    }
    exit 1
}

Write-Host "YAML syntax appears valid"
exit 0
