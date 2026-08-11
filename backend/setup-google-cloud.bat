@echo off
REM Google Cloud Setup Script for Windows
REM This script helps set up Google Cloud Vertex AI integration

echo.
echo ========================================
echo   Google Cloud Setup
echo ========================================
echo.

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Please run setup-nodejs-path.bat first
    pause
    exit /b 1
)

echo [1/3] Checking Node.js installation...
node --version
npm --version
echo.

echo [2/3] Installing @google-cloud/aiplatform package...
cd backend
call npm install @google-cloud/aiplatform --save
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install package
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Package installed
echo.

echo [3/3] Checking .env file...
if not exist "backend\.env" (
    echo [INFO] Creating .env file template...
    (
        echo # Gemini API Key ^(Required^)
        echo GEMINI_API_KEY=your-gemini-api-key-here
        echo.
        echo # Google Cloud Configuration ^(Optional^)
        echo # GOOGLE_CLOUD_PROJECT=your-project-id
        echo # GOOGLE_CLOUD_LOCATION=us-central1
        echo # GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account-key.json
    ) > backend\.env
    echo [OK] Created .env file template
) else (
    echo [OK] .env file exists
)

echo.
echo ========================================
echo   Setup Summary
echo ========================================
echo.
echo Next Steps:
echo   1. Edit backend\.env and add your GEMINI_API_KEY
echo   2. ^(Optional^) Configure Google Cloud:
echo      - Set GOOGLE_CLOUD_PROJECT=your-project-id
echo      - Set GOOGLE_APPLICATION_CREDENTIALS=path\to\key.json
echo      - OR run: gcloud auth application-default login
echo   3. Start server: cd backend ^&^& node stellar-ai-server.js
echo.
pause

