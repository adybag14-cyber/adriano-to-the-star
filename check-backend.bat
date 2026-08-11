@echo off
echo 🔍 Checking Backend Server Status...
echo.

curl -s http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✅ Backend IS RUNNING!
    echo.
    echo 🎉 Gemini Live should work now!
    echo.
    echo Test at: http://localhost:8000/stellar-ai.html
) else (
    echo ❌ Backend is NOT running!
    echo.
    echo To start the backend:
    echo   1. Open a NEW terminal window
    echo   2. Run: cd backend
    echo   3. Run: .\start-server.bat
    echo.
    echo Or use Command Prompt:
    echo   cd backend
    echo   npm run start-stellar-ai
)

echo.
pause

