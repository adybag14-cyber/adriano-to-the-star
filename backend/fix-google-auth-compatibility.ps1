# Fix Google-Auth Compatibility for Python SDK
# Run this script to fix the google-auth compatibility issue

Write-Host "🔧 Fixing Google-Auth Compatibility..." -ForegroundColor Cyan

# Check current versions
Write-Host "`n📋 Current versions:" -ForegroundColor Yellow
pip show google-auth | Select-String "Version"
pip show google-genai | Select-String "Version"

# Option 1: Downgrade google-auth to compatible version
Write-Host "`n🔧 Option 1: Downgrading google-auth to compatible version..." -ForegroundColor Yellow
pip install google-auth==2.23.4 google-auth-oauthlib==1.1.0

# Verify installation
Write-Host "`n✅ Verification:" -ForegroundColor Green
python -c "from google.auth.transport import requests; print('✅ google-auth fixed!')" 2>&1

Write-Host "`n📝 Note: If this doesn't work, try Option 2:" -ForegroundColor Yellow
Write-Host "   gcloud auth application-default login" -ForegroundColor Cyan

