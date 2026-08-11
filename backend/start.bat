@echo off
echo ========================================
echo   Adriano To The Star - Music Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if music folder exists
if not exist "music\" (
    echo Music files not found. Downloading...
    call npm run download-music
    echo.
)

echo Starting music server...
echo.
call npm start

