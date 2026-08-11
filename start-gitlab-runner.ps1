# Start GitLab Runner manually
# This runs the runner in the current session (no admin required)

$runnerPath = "$env:USERPROFILE\gitlab-runner\gitlab-runner.exe"
$configPath = "$env:USERPROFILE\gitlab-runner\config.toml"

if (-not (Test-Path $runnerPath)) {
    Write-Host "Error: GitLab Runner not found at $runnerPath" -ForegroundColor Red
    exit 1
}

Write-Host "Starting GitLab Runner..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the runner" -ForegroundColor Yellow
Write-Host ""

# Run the runner (this will block until stopped)
& $runnerPath run --config $configPath

