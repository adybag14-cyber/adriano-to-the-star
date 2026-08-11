@echo off
echo ========================================
echo Exoplanet Pioneer - Setup Script
echo ========================================
echo.

echo [1/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [2/6] Creating Cloudflare D1 database...
call wrangler d1 create exoplanet-pioneer-db --config=wrangler-exoplanet.toml
if %errorlevel% neq 0 (
    echo WARNING: D1 database may already exist or failed to create
    echo Please update wrangler-exoplanet.toml with the correct database_id
)
echo.

echo [3/6] Creating Cloudflare KV namespace...
call wrangler kv:namespace create CACHE --config=wrangler-exoplanet.toml
if %errorlevel% neq 0 (
    echo WARNING: KV namespace may already exist or failed to create
    echo Please update wrangler-exoplanet.toml with the correct KV namespace id
)
echo.

echo [4/6] Applying database schema...
call wrangler d1 execute exoplanet-pioneer-db --file=schema.sql --config=wrangler-exoplanet.toml
if %errorlevel% neq 0 (
    echo ERROR: Failed to apply database schema
    exit /b 1
)
echo Database schema applied successfully!
echo.

echo [5/6] Building project with Vite...
call npm run build:vite
if %errorlevel% neq 0 (
    echo ERROR: Failed to build project
    exit /b 1
)
echo Project built successfully!
echo.

echo [6/6] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo 1. Update wrangler-exoplanet.toml with your database_id and KV namespace id
echo 2. Run 'npm run deploy:exoplanet' to deploy to Cloudflare Pages
echo 3. Or run 'npm run local:exoplanet' to test locally
echo ========================================
pause
