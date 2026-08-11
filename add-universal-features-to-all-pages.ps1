# PowerShell script to add universal features to all HTML pages
# Adds: language switcher (i18n), dark/light theme toggle, music player, accessibility

$htmlFiles = Get-ChildItem -Path . -Filter "*.html" -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules|public|android-app|ios-app|\.git" -and
    $_.Name -notmatch "_scraped|_new|test-"
}

$requiredStyles = @(
    "theme-styles.css",
    "accessibility-styles.css",
    "i18n-styles.css"
)

$requiredScripts = @(
    "i18n.js",
    "cosmic-music-player.js",
    "theme-toggle.js",
    "accessibility.js"
)

$updatedCount = 0
$missingFiles = @()

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $modified = $false
    $fileMissing = @()
    
    # Check for required styles
    foreach ($style in $requiredStyles) {
        if ($content -notmatch [regex]::Escape($style)) {
            $fileMissing += "Style: $style"
            # Find the last </head> or last <link> tag
            if ($content -match '(<link[^>]*>)') {
                $lastLink = [regex]::Matches($content, '<link[^>]*>') | Select-Object -Last 1
                if ($lastLink) {
                    $insertPos = $lastLink.Index + $lastLink.Length
                    $content = $content.Insert($insertPos, "`n    <link rel=`"stylesheet`" href=`"$style`">")
                    $modified = $true
                }
            } elseif ($content -match '(<head[^>]*>)') {
                # Insert before </head>
                $content = $content -replace '(</head>)', "    <link rel=`"stylesheet`" href=`"$style`">`n`$1"
                $modified = $true
            }
        }
    }
    
    # Check for required scripts
    foreach ($script in $requiredScripts) {
        if ($content -notmatch [regex]::Escape($script)) {
            $fileMissing += "Script: $script"
            # Find the last <script> tag or insert before </head>
            if ($content -match '(<script[^>]*src=["''][^"'']+["''][^>]*>)') {
                $lastScript = [regex]::Matches($content, '<script[^>]*src=["''][^"'']+["''][^>]*>') | Select-Object -Last 1
                if ($lastScript) {
                    $insertPos = $lastScript.Index + $lastScript.Length
                    $content = $content.Insert($insertPos, "`n    <script src=`"$script`" defer></script>")
                    $modified = $true
                }
            } elseif ($content -match '(<head[^>]*>)') {
                # Insert before </head>
                $content = $content -replace '(</head>)', "    <script src=`"$script`" defer></script>`n`$1"
                $modified = $true
            }
        }
    }
    
    if ($modified) {
        try {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Updated: $($file.Name) - Added: $($fileMissing -join ', ')"
            $updatedCount++
        } catch {
            Write-Host "Error updating $($file.Name): $_"
        }
    }
}

Write-Host "`nUpdated $updatedCount files with universal features"

