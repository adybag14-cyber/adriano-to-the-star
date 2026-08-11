# LiveKit Agent Environment Setup Script
# Run this script to set up all required environment variables

Write-Host "Setting up LiveKit Agent environment variables..." -ForegroundColor Cyan

# LiveKit Server Configuration
if (-not $env:LIVEKIT_URL) {
    $env:LIVEKIT_URL = "wss://gemini-integration-pxcg6ngt.livekit.cloud"
}
if (-not $env:LIVEKIT_API_KEY) {
    $env:LIVEKIT_API_KEY = Read-Host "Enter LIVEKIT_API_KEY"
}
if (-not $env:LIVEKIT_API_SECRET) {
    $secure = Read-Host "Enter LIVEKIT_API_SECRET" -AsSecureString
    $env:LIVEKIT_API_SECRET = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
}

Write-Host " LiveKit URL: $env:LIVEKIT_URL" -ForegroundColor Green
Write-Host " LiveKit API Key is set (length: $($env:LIVEKIT_API_KEY.Length))" -ForegroundColor Green
Write-Host " LiveKit API Secret: [HIDDEN]" -ForegroundColor Green

# Google API Key Configuration
if (-not $env:GOOGLE_API_KEY -and $env:GEMINI_API_KEY) {
    $env:GOOGLE_API_KEY = $env:GEMINI_API_KEY
}
if (-not $env:GOOGLE_API_KEY) {
    $env:GOOGLE_API_KEY = Read-Host "Enter GOOGLE_API_KEY"
}
Write-Host " GOOGLE_API_KEY is set (length: $($env:GOOGLE_API_KEY.Length))" -ForegroundColor Green

Write-Host "`nEnvironment setup complete!" -ForegroundColor Cyan
Write-Host "`nTo test the setup:" -ForegroundColor Cyan
Write-Host "  python test_full_setup.py" -ForegroundColor White
Write-Host "`nTo run the agent:" -ForegroundColor Cyan
Write-Host "  python livekit_agent.py console  # Terminal mode (no server needed)" -ForegroundColor White
Write-Host "  python livekit_agent.py dev      # Development mode" -ForegroundColor White
Write-Host "  python livekit_agent.py start   # Production mode" -ForegroundColor White

