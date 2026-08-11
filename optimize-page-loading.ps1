# Performance Optimization Script
# Removes unnecessary scripts from pages while keeping essential widgets and music player

$essentialScripts = @(
    "loader.js",
    "i18n.js",
    "navigation.js",
    "animations.js",
    "universal-graphics.js",
    "cosmic-music-player.js",
    "theme-toggle.js",
    "keyboard-shortcuts.js",
    "accessibility.js"
)

$optionalScripts = @(
    "color-schemes.js",
    "animation-controls.js",
    "user-behavior-analytics.js"
)

# Scripts that should NOT be on index.html (page-specific)
$pageSpecificScripts = @(
    "database-optimized.js",
    "database-advanced-features.js",
    "database-ai-search-suggestions.js",
    "stellar-ai.js",
    "analytics-dashboard.js",
    "planet-trading-marketplace.js",
    "nasa-api-integration.js",
    "esa-api-integration.js",
    "spacex-api-integration.js",
    "ai-habitability-analysis.js",
    "ai-planet-discovery-predictions.js",
    "planet-surface-visualization.js",
    "orbital-mechanics-simulation.js",
    "ar-planet-viewing.js",
    "blockchain-nft-integration.js",
    "astronomy-courses.js",
    "nasa-mission-simulations.js",
    "two-factor-auth.js",
    "marketplace-payment-integration.js",
    "database-performance-optimizer.js"
)

Write-Host "Optimizing page loading performance..."
Write-Host "Keeping essential scripts: $($essentialScripts -join ', ')"

# Check index.html
$indexPath = "index.html"
if (Test-Path $indexPath) {
    Write-Host "`nChecking $indexPath..."
    $content = Get-Content $indexPath -Raw
    
    # Count current scripts
    $scriptMatches = [regex]::Matches($content, '<script[^>]*src="([^"]+)"')
    Write-Host "Found $($scriptMatches.Count) script tags"
    
    # Check which scripts exist
    $existingScripts = @()
    $missingScripts = @()
    
    foreach ($match in $scriptMatches) {
        $scriptPath = $match.Groups[1].Value
        if (Test-Path $scriptPath) {
            $existingScripts += $scriptPath
        } else {
            $missingScripts += $scriptPath
        }
    }
    
    Write-Host "Existing scripts: $($existingScripts.Count)"
    Write-Host "Missing scripts: $($missingScripts.Count)"
    
    if ($missingScripts.Count -gt 0) {
        Write-Host "`nMissing scripts that should be removed:"
        $missingScripts | ForEach-Object { Write-Host "  - $_" }
    }
}

Write-Host "`nPerformance optimization check complete!"

