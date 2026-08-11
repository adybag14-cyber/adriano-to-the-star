@echo off
echo Building project...
call npm run build:vite

echo.
echo Removing model files (served from R2 CDN)...
if exist "dist\assets\models" (
    rmdir /S /Q "dist\assets\models"
    echo Removed models directory (assets served from R2 CDN)
) else (
    echo models directory not found
)

echo.
echo Deploying to Cloudflare Pages...
call wrangler pages deploy --project-name=exoplanet-pioneer dist --commit-dirty=true

pause
