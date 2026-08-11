@echo off
REM Complete Setup Script - Node.js, Packages, and Google Cloud
REM This script does everything: finds Node.js, installs packages, sets up Google Cloud

echo.
echo ========================================
echo   Complete Setup Script
echo ========================================
echo.

echo [1/3] Setting up Node.js...
call setup-nodejs-path.bat
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js setup failed
    pause
    exit /b 1
)

echo.
echo [2/3] Setting up Google Cloud...
call setup-google-cloud.bat
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Google Cloud setup failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Summary:
echo   [OK] Node.js configured
echo   [OK] npm packages installed
echo   [OK] Google Cloud setup checked
echo.
echo Next Steps:
echo   1. Edit backend\.env and add your GEMINI_API_KEY
echo   2. ^(Optional^) Configure Google Cloud in .env
echo   3. Start server: cd backend ^&^& node stellar-ai-server.js
echo.
pause

