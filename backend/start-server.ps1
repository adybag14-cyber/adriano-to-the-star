# Start Stellar AI Server
# This script bypasses execution policy for this session

# Set execution policy for current process only
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Start the server
Write-Host "🌟 Starting Stellar AI Server..." -ForegroundColor Cyan
Write-Host ""

npm run start-stellar-ai

