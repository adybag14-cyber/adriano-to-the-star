# Add missing universal scripts to all HTML pages
$htmlFiles = @(
    "blog.html", "members.html", "forum.html", "gta-6-videos.html", 
    "total-war-2.html", "followers.html", "events.html", "loyalty.html", 
    "book-online.html", "education.html"
)

$requiredScripts = @(
    "i18n.js",
    "theme-toggle.js", 
    "accessibility.js"
)

foreach ($file in $htmlFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Skipping $file (not found)"
        continue
    }
    
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    $modified = $false
    
    # Check if cosmic-music-player.js exists (as anchor point)
    if ($content -match 'cosmic-music-player\.js') {
        # Find the line with cosmic-music-player.js
        $match = [regex]::Match($content, '(<script src="cosmic-music-player\.js"[^>]*>)')
        if ($match.Success) {
            $insertPos = $match.Index + $match.Length
            
            # Check which scripts are missing
            $scriptsToAdd = @()
            foreach ($script in $requiredScripts) {
                if ($content -notmatch [regex]::Escape($script)) {
                    $scriptsToAdd += "    <script src=`"$script`" defer></script>"
                    $modified = $true
                }
            }
            
            if ($scriptsToAdd.Count -gt 0) {
                $scriptsBlock = "`n" + ($scriptsToAdd -join "`n")
                $content = $content.Insert($insertPos, $scriptsBlock)
                Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
                Write-Host "Updated $file - Added: $($scriptsToAdd.Count) scripts"
            }
        }
    } else {
        Write-Host "Warning: $file doesn't have cosmic-music-player.js anchor"
    }
}

Write-Host "`nScript addition complete!"

