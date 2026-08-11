# PowerShell script to clean public directory
# Moved from inline YAML to avoid parsing issues

$ErrorActionPreference = 'Continue'
$exitCode = 0

try {
    if (Test-Path public) {
        Get-ChildItem -Path public -Recurse | ForEach-Object {
            try {
                Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
            } catch {
                Start-Sleep -Milliseconds 100
                Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item public -Force -Recurse -ErrorAction SilentlyContinue
    }
    Write-Host "Public directory cleaned successfully"
} catch {
    Write-Host "Warning: Error cleaning public directory: $_"
    $exitCode = 1
}

exit $exitCode

