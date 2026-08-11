@echo off
REM Setup Node.js PATH and Install Dependencies
REM This batch file finds Node.js, adds it to PATH, and installs packages

echo.
echo ========================================
echo   Node.js Setup and Package Installation
echo ========================================
echo.

REM Check if Node.js is already in PATH
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js found in PATH
    node --version
    npm --version
    goto :install
)

REM Common Node.js installation paths
if exist "C:\Program Files\nodejs\node.exe" (
    echo [OK] Found Node.js at: C:\Program Files\nodejs
    set "NODE_PATH=C:\Program Files\nodejs"
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto :verify
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo [OK] Found Node.js at: C:\Program Files (x86)\nodejs
    set "NODE_PATH=C:\Program Files (x86)\nodejs"
    set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    goto :verify
)

if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    echo [OK] Found Node.js at: %LOCALAPPDATA%\Programs\nodejs
    set "NODE_PATH=%LOCALAPPDATA%\Programs\nodejs"
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    goto :verify
)

echo [ERROR] Node.js not found!
echo.
echo Please install Node.js from: https://nodejs.org/
echo Or if already installed, add it to PATH manually.
echo.
pause
exit /b 1

:verify
echo.
echo Verifying installation...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js verification failed
    pause
    exit /b 1
)

npm --version
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm verification failed
    pause
    exit /b 1
)

:install
echo.
echo Installing npm packages...
echo This may take a few minutes...
echo.

cd backend

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Package installation failed!
    cd ..
    pause
    exit /b 1
)

if exist "node_modules\@google-cloud\aiplatform" (
    echo [OK] @google-cloud/aiplatform package installed
) else (
    echo [WARN] @google-cloud/aiplatform not found, installing...
    call npm install @google-cloud/aiplatform --save
)

cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next: Set up Google Cloud (optional)
echo Run: setup-google-cloud.bat
echo.
pause

