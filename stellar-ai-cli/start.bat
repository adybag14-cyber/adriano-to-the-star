@echo off
REM Stellar AI CLI - Quick Start Script for Windows
REM This script checks setup and starts the CLI

echo.
echo ========================================
echo   Stellar AI CLI - Starting...
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] Dependencies not installed!
    echo.
    echo Running automatic setup...
    echo.
    call setup.bat
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Setup failed. Please run setup.bat manually.
        pause
        exit /b 1
    )
    echo.
)

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Start the CLI
echo Starting Stellar AI CLI...
echo.
node index.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to start Stellar AI CLI!
    echo.
    pause
    exit /b 1
)

