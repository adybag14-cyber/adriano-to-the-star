@echo off
echo 🌐 Starting Local Web Server...
echo.
echo Server will be available at:
echo   http://localhost:8095
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

set PORT=8095

REM Try Python first
python --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Using Custom Range Server...
    python custom_server_fixed.py %PORT%
    goto :end
)

REM Try Node.js http-server
where http-server >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Using Node.js http-server...
    http-server -p %PORT% -o
    goto :end
)

REM Try npx http-server
where npx >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Using npx http-server...
    npx -y http-server -p %PORT% -o
    goto :end
)

echo ❌ No server found. Please install one of:
echo   1. Python (for python -m http.server)
echo   2. Node.js http-server (npm install -g http-server)
echo   3. Or use VS Code Live Server extension
pause

:end

