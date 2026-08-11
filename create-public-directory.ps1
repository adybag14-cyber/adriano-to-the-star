# PowerShell script to create public directory

try {
    New-Item -ItemType Directory -Path public -Force | Out-Null
    Write-Host "Public directory created"
} catch {
    Write-Host "Error creating public directory: $_"
    exit 1
}

