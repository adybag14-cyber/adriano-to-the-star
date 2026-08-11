# PowerShell script to update console.log in init() methods to trackEvent
# This script updates all JavaScript files that use console.log in init() to use trackEvent instead

Write-Host "Starting trackEvent update script..." -ForegroundColor Green

# Get all JavaScript files
$jsFiles = Get-ChildItem -Path . -Filter "*.js" -Recurse -File | Where-Object { 
    $_.FullName -notmatch "node_modules|\.git|update-trackevent\.ps1"
}

$updatedCount = 0
$errorCount = 0

foreach ($file in $jsFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        
        # Check if file has console.log in init() method
        if ($content -match 'init\(\)\s*\{[^}]*console\.log') {
            Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
            
            # Extract class name from file
            $className = ""
            if ($content -match 'class\s+(\w+)') {
                $className = $matches[1]
            } else {
                # Fallback: use filename without extension
                $className = $file.BaseName
            }
            
            # Generate event prefix from class name (convert PascalCase to snake_case)
            $eventPrefix = $className -replace '([a-z])([A-Z])', '$1_$2' -replace '([A-Z]+)([A-Z][a-z])', '$1_$2'
            $eventPrefix = $eventPrefix.ToLower()
            
            # Pattern 1: Replace console.log in init() with trackEvent call
            $initPattern = '(init\(\)\s*\{)\s*console\.log\([^)]+\);'
            $trackEventCall = "`$1`n        this.trackEvent('${eventPrefix}_initialized');"
            
            if ($content -match $initPattern) {
                $content = $content -replace $initPattern, $trackEventCall
            }
            
            # Pattern 2: Add trackEvent method after init() if it doesn't exist
            if ($content -notmatch 'trackEvent\s*\(eventName') {
                # Create trackEvent method
                $trackEventMethod = "`n`n    trackEvent(eventName, data = {}) {`n        try {`n            if (typeof window !== 'undefined' && window.performanceMonitoring) {`n                window.performanceMonitoring.recordMetric(`"${eventPrefix}_`" + eventName, 1, data);`n            }`n        } catch (e) { /* Silent fail */ }`n    }`n"
                
                # Insert after init() method
                $content = $content -replace '(init\(\)\s*\{[^}]*\})', "`$1$trackEventMethod"
            }
            
            # Only write if content changed
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -NoNewline -ErrorAction Stop
                $updatedCount++
                Write-Host "  Updated: $($file.Name)" -ForegroundColor Green
            }
        }
    }
    catch {
        Write-Host "  Error processing $($file.Name): $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "Script completed!" -ForegroundColor Green
Write-Host "Files updated: $updatedCount" -ForegroundColor Cyan
if ($errorCount -gt 0) {
    Write-Host "Errors: $errorCount" -ForegroundColor Red
} else {
    Write-Host "Errors: $errorCount" -ForegroundColor Green
}
