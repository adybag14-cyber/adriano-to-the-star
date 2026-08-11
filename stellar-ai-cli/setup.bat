@echo off
REM Stellar AI CLI - Automatic Setup Script for Windows
REM This script automatically sets up the CLI environment

echo.
echo ========================================
echo   Stellar AI CLI - Automatic Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Minimum version required: 14.0.0
    echo.
    pause
    exit /b 1
)

REM Check Node.js version
echo [1/4] Checking Node.js installation...
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo        Found Node.js: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    echo.
    echo npm should come with Node.js. Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)

echo [2/4] Checking npm installation...
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo        Found npm: %NPM_VERSION%
echo.

REM Install dependencies
echo [3/4] Installing dependencies...
echo        This may take a few minutes...
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo        Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Checking Python for LiveKit Voice Agent (optional)...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo        Python found! LiveKit Voice Agent is available.
    echo        To install Python dependencies, run: pip install -r requirements.txt
    echo        To set up environment, run: setup_env.ps1
) else (
    echo        Python not found. LiveKit Voice Agent will not be available.
    echo        Install Python 3.8+ from: https://www.python.org/
)

echo.
echo ========================================
echo   Setup Successful!
echo ========================================
echo.
echo You can now start Stellar AI CLI by running:
echo.
echo    start.bat
echo.
echo Or manually:
echo.
echo    node index.js
echo.
echo For LiveKit Voice Agent (if Python is installed):
echo    python livekit_agent.py console
echo.
echo ========================================
echo.
pause

