# Quick script to check if backend is running

Write-Host "🔍 Checking Backend Server Status..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Backend IS RUNNING!" -ForegroundColor Green
    Write-Host "   Status: $($json.status)" -ForegroundColor Green
    Write-Host "   Chats: $($json.chatsCount)" -ForegroundColor Green
    Write-Host "   Images: $($json.imagesCount)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Gemini Live should work now!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test at: http://localhost:8000/stellar-ai.html" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start the backend:" -ForegroundColor Yellow
    Write-Host "  1. Open a NEW terminal window" -ForegroundColor White
    Write-Host "  2. Run: cd backend" -ForegroundColor White
    Write-Host "  3. Run: .\start-server.bat" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Command Prompt:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run start-stellar-ai" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

