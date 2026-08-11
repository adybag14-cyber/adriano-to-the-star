# Comprehensive Fix Script
# Adds loader.css + loader.js to all pages
# Adds Ruffle to games.html
# Adds manifest.json link to all pages

Write-Host "Starting comprehensive fix..." -ForegroundColor Cyan

# Pages that need loader
$pagesNeedingLoader = @(
    "about.html", "blog.html", "book-online.html", "broadband-checker.html",
    "business-promise.html", "dashboard.html", "education.html", "events.html",
    "file-storage.html", "followers.html", "forum.html", "games.html",
    "groups.html", "gta-6-videos.html", "loyalty.html", "members.html",
    "offline.html", "projects.html", "shop.html", "stellar-ai.html"
)

$fixed = 0
$skipped = 0

foreach ($page in $pagesNeedingLoader) {
    if (-not (Test-Path $page)) {
        Write-Host "  ⚠ $page not found" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $page -Raw -Encoding UTF8
    
    # Skip if already has loader.js
    if ($content -match 'loader\.js') {
        Write-Host "  ✓ $page already has loader" -ForegroundColor Green
        $skipped++
        continue
    }
    
    # Add loader.css and loader.js after pages-styles.css (or styles.css if no pages-styles)
    if ($content -match '(<link rel="stylesheet" href="pages-styles\.css">)') {
        $content = $content -replace '(<link rel="stylesheet" href="pages-styles\.css">)', "`$1`r`n    <link rel=`"stylesheet`" href=`"loader.css`">`r`n    <script src=`"loader.js`"></script>"
    }
    elseif ($content -match '(<link rel="stylesheet" href="styles\.css">)') {
        $content = $content -replace '(<link rel="stylesheet" href="styles\.css">)', "`$1`r`n    <link rel=`"stylesheet`" href=`"loader.css`">`r`n    <script src=`"loader.js`"></script>"
    }
    
    # Add manifest.json link if missing
    if ($content -notmatch 'manifest\.json') {
        $content = $content -replace '(</head>)', "    <link rel=`"manifest`" href=`"manifest.json`">`r`n`$1"
    }
    
    Set-Content $page $content -NoNewline -Encoding UTF8
    Write-Host "  ✅ Fixed $page" -ForegroundColor Cyan
    $fixed++
}

# Special fix for games.html - add Ruffle
if (Test-Path "games.html") {
    $gamesContent = Get-Content "games.html" -Raw -Encoding UTF8
    if ($gamesContent -notmatch '@ruffle-rs/ruffle') {
        $gamesContent = $gamesContent -replace '(<script src="games\.js")', "    <!-- Ruffle Player -->`r`n    <script src=`"https://unpkg.com/@ruffle-rs/ruffle`"></script>`r`n    `$1"
        Set-Content "games.html" $gamesContent -NoNewline -Encoding UTF8
        Write-Host "  ✅ Added Ruffle to games.html" -ForegroundColor Magenta
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor White
Write-Host "  Fixed: $fixed pages" -ForegroundColor Cyan
Write-Host "  Skipped: $skipped pages (already had loader)" -ForegroundColor Green
Write-Host "`n✅ Batch fix complete!" -ForegroundColor Green
