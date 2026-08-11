# GitLab Runner Service Installation Script
# Run this script as Administrator

$ErrorActionPreference = "Stop"

Write-Host "Installing GitLab Runner as Windows Service..." -ForegroundColor Green

$runnerPath = "$env:USERPROFILE\gitlab-runner\gitlab-runner.exe"
$configPath = "$env:USERPROFILE\gitlab-runner\config.toml"

if (-not (Test-Path $runnerPath)) {
    Write-Host "Error: GitLab Runner not found at $runnerPath" -ForegroundColor Red
    exit 1
}

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Error: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    exit 1
}

# Stop existing service if it exists
$service = Get-Service -Name "gitlab-runner" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Stopping existing GitLab Runner service..." -ForegroundColor Yellow
    Stop-Service -Name "gitlab-runner" -Force -ErrorAction SilentlyContinue
    & $runnerPath uninstall
}

# Install the service
Write-Host "Installing GitLab Runner service..." -ForegroundColor Green
& $runnerPath install --user "$env:USERNAME" --password ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting GitLab Runner service..." -ForegroundColor Green
    Start-Service -Name "gitlab-runner"
    
    Write-Host "`nGitLab Runner service installed and started successfully!" -ForegroundColor Green
    Write-Host "Service status:" -ForegroundColor Cyan
    Get-Service -Name "gitlab-runner"
} else {
    Write-Host "Error: Failed to install GitLab Runner service" -ForegroundColor Red
    exit 1
}

