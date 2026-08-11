# GitLab Pages build script
# Produces a verified static artifact in public/ for the Pages job.
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

Write-Host "Starting GitLab Pages build..."

if (Test-Path "public") {
    Write-Host "Cleaning existing public directory..."
    Remove-Item "public" -Recurse -Force
}
New-Item -ItemType Directory -Path "public" -Force | Out-Null

function Copy-DirectorySafely {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    if (-not (Test-Path $Source)) {
        Write-Host "Skipping $Source (not present)"
        return
    }

    $items = Get-ChildItem -Path $Source -ErrorAction Stop
    if (-not $items) {
        Write-Host "Skipping $Source (empty)"
        return
    }

    Write-Host "Copying $Source ($($items.Count) top-level items)..."
    robocopy $Source $Destination /S /E /MT:32 /R:1 /W:1 /NP /NFL /NDL | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "Robocopy failed for $Source with exit code $LASTEXITCODE"
    }
}

# Root pages and presentation assets.
Get-ChildItem -Path . -File -Filter "*.html" | Copy-Item -Destination "public\" -Force
Get-ChildItem -Path . -File -Filter "*.css" | Copy-Item -Destination "public\" -Force

# Root JavaScript is retained because many legacy pages load scripts directly by filename.
Get-ChildItem -Path . -File -Filter "*.js" | Copy-Item -Destination "public\" -Force

$CoreAssets = @(
    "manifest.json",
    "favicon.ico",
    "CNAME",
    ".nojekyll",
    "sitemap.xml",
    "sitemap_index.xml",
    "robots.txt",
    "sw.js"
)
foreach ($file in $CoreAssets) {
    if (Test-Path $file) {
        Copy-Item $file -Destination "public\" -Force
    }
}

$Directories = @(
    "images",
    "audio",
    "data",
    "analysis",
    "fonts",
    "translations",
    "service-page",
    "forms",
    ".well-known",
    "wasm"
)
foreach ($directory in $Directories) {
    Copy-DirectorySafely $directory "public\$directory"
}

# Refresh Pioneer science feeds at build time. Browsers only read the resulting
# same-origin snapshot, so upstream CORS/rate-limit failures never leak into gameplay.
$SpaceFeedUpdater = "scripts\update-space-feeds.ps1"
$SpaceFeedFallback = "data\space-feeds.json"
$SpaceFeedSnapshot = "public\data\space-feeds.json"
if (Test-Path -LiteralPath $SpaceFeedUpdater) {
    try {
        & $SpaceFeedUpdater -OutputPath $SpaceFeedSnapshot -FallbackPath $SpaceFeedFallback
    }
    catch {
        Write-Warning "Space-feed refresh failed; retaining the checked-in snapshot. $($_.Exception.Message)"
        if (-not (Test-Path -LiteralPath $SpaceFeedSnapshot)) {
            throw "Space-feed refresh failed and no fallback snapshot exists in the Pages artifact."
        }
    }
}
elseif (-not (Test-Path -LiteralPath $SpaceFeedSnapshot)) {
    throw "Space-feed updater and fallback snapshot are both missing."
}

# Keep only web-facing experimental projects and strip large local build dependencies.
if (Test-Path "experimental") {
    New-Item -ItemType Directory -Path "public\experimental" -Force | Out-Null
    $ProjectFolders = @(
        "webgpu-galaxy",
        "procedural-planets",
        "fluid-nebula",
        "sentient-browser",
        "holographic-xr",
        "connected-cosmos",
        "native-integration"
    )

    foreach ($folder in $ProjectFolders) {
        if (Test-Path "experimental\$folder") {
            Copy-DirectorySafely "experimental\$folder" "public\experimental\$folder"
        }
    }

    $ExcludedDirectories = @(".git", "emsdk", "node_modules", "bin", "obj", "models")
    foreach ($excludedDirectory in $ExcludedDirectories) {
        Get-ChildItem "public\experimental" -Directory -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -eq $excludedDirectory } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }

    Get-ChildItem "public\experimental" -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -gt 50MB } |
        Remove-Item -Force
}

# Version local CSS and JavaScript references in generated output. Cloudflare can cache
# negative responses, so a commit-specific query prevents a stale 404 from surviving
# after the asset has been restored by a later deployment. Local script tags also opt
# out of Rocket Loader so Cloudflare preserves their exact versioned URLs and ordering.
$AssetVersion = if ($env:CI_COMMIT_SHORT_SHA) {
    [regex]::Replace($env:CI_COMMIT_SHORT_SHA, '[^A-Za-z0-9._-]', '')
}
else {
    "local"
}
if (-not $AssetVersion) {
    $AssetVersion = "local"
}

$Utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
$LocalAssetAttributePattern = '(?i)(?<prefix>\b(?:href|src)\s*=\s*(?<quote>["'']))(?<path>(?!https?:|//|data:|#|mailto:)[^"''?#]+?\.(?:css|js))(?<query>\?[^"'']*)?\k<quote>'
$LocalScriptTagPattern = '(?i)<script(?![^>]*\bdata-cfasync\s*=)(?=[^>]*\bsrc\s*=\s*["''](?!https?:|//|data:)[^"'']+\.js(?:\?[^"'']*)?["''])'
$VersionedHtmlReferenceCount = 0
$RocketLoaderExclusionCount = 0

foreach ($HtmlFile in Get-ChildItem "public" -Recurse -File -Filter "*.html") {
    $HtmlContent = [System.IO.File]::ReadAllText($HtmlFile.FullName)
    $UpdatedContent = [regex]::Replace(
        $HtmlContent,
        $LocalAssetAttributePattern,
        {
            param($Match)
            $script:VersionedHtmlReferenceCount++
            return "$($Match.Groups['prefix'].Value)$($Match.Groups['path'].Value)?v=$AssetVersion$($Match.Groups['quote'].Value)"
        }
    )
    $UpdatedContent = [regex]::Replace(
        $UpdatedContent,
        $LocalScriptTagPattern,
        {
            param($Match)
            $script:RocketLoaderExclusionCount++
            return '<script data-cfasync="false"'
        }
    )

    if ($UpdatedContent -ne $HtmlContent) {
        if ($HtmlFile.IsReadOnly) {
            $HtmlFile.IsReadOnly = $false
        }
        [System.IO.File]::WriteAllText($HtmlFile.FullName, $UpdatedContent, $Utf8WithoutBom)
    }
}

# Runtime loaders, workers, and dynamic imports may contain local asset paths inside
# JavaScript strings rather than HTML attributes. Version those generated references too.
$LocalAssetStringPattern = '(?i)(?<quote>["''])(?<path>(?!https?:|//|data:|#|mailto:)[^"''?#\r\n]+?\.(?:css|js))(?<query>\?[^"'']*)?\k<quote>'
$VersionedJavaScriptReferenceCount = 0
foreach ($JavaScriptFile in Get-ChildItem "public" -Recurse -File -Filter "*.js") {
    $JavaScriptContent = [System.IO.File]::ReadAllText($JavaScriptFile.FullName)
    $UpdatedJavaScriptContent = [regex]::Replace(
        $JavaScriptContent,
        $LocalAssetStringPattern,
        {
            param($Match)
            $script:VersionedJavaScriptReferenceCount++
            return "$($Match.Groups['quote'].Value)$($Match.Groups['path'].Value)?v=$AssetVersion$($Match.Groups['quote'].Value)"
        }
    )

    if ($UpdatedJavaScriptContent -ne $JavaScriptContent) {
        if ($JavaScriptFile.IsReadOnly) {
            $JavaScriptFile.IsReadOnly = $false
        }
        [System.IO.File]::WriteAllText($JavaScriptFile.FullName, $UpdatedJavaScriptContent, $Utf8WithoutBom)
    }
}

Write-Host "Versioned $VersionedHtmlReferenceCount HTML references and $VersionedJavaScriptReferenceCount JavaScript runtime references with asset version $AssetVersion."
Write-Host "Excluded $RocketLoaderExclusionCount local script tags from Cloudflare Rocket Loader."

# Minify only the generated Pioneer startup scripts after all runtime asset URLs have been
# rewritten. Source files remain untouched, and Terser keeps top-level/global names intact.
$PioneerMinifier = "scripts\minify-pioneer-pages.mjs"
if (-not (Test-Path -LiteralPath $PioneerMinifier)) {
    throw "Pioneer Pages minifier is missing: $PioneerMinifier"
}
& node $PioneerMinifier "public"
if ($LASTEXITCODE -ne 0) {
    throw "Pioneer Pages minification failed with exit code $LASTEXITCODE"
}
# Production artifact checks. A successful copy is not enough: the homepage and its
# required styling must be present, current, and free of known stale content.
$RequiredFiles = @(
    "index.html",
    "landing.css",
    "landing-experience.js",
    "ita-music-player.css",
    "i18n.js",
    "i18n-styles.css",
    "auth-supabase.js",
    "large-exoplanet-loader.js",
    "theme-styles.css",
    "loader-minimal.css",
    "code-splitting.js",
    "fonts\fonts.css",
    "images\bg-large.jpg",
    "database.html",
    "database-ita-shell.css",
    "database-experience.js",
    "data\space-feeds.json",
    "CNAME"
)

$MissingFiles = $RequiredFiles | Where-Object { -not (Test-Path (Join-Path "public" $_)) }
if ($MissingFiles) {
    throw "Build is missing required production files: $($MissingFiles -join ', ')"
}

$HomePage = Get-Content "public\index.html" -Raw
$DatabasePage = Get-Content "public\database.html" -Raw
if (-not $DatabasePage.Contains("theme-styles.css?v=$AssetVersion")) {
    throw "Database page does not contain a versioned theme stylesheet reference."
}
if (-not $DatabasePage.Contains('data-cfasync="false"')) {
    throw "Database page does not exclude local scripts from Cloudflare Rocket Loader."
}
if ($DatabasePage.Contains("supabase.co") -or $DatabasePage.Contains("@supabase/supabase-js") -or $DatabasePage.Contains("supabase-config.js")) {
    throw "Database page still contains a Supabase production dependency."
}
if (-not $DatabasePage.Contains("large-exoplanet-loader.js?v=$AssetVersion")) {
    throw "Database page does not contain the production large exoplanet loader."
}
if (-not $DatabasePage.Contains("database-ita-shell.css?v=$AssetVersion") -or -not $DatabasePage.Contains("database-experience.js?v=$AssetVersion")) {
    throw "Database I.T.A experience assets are not versioned in the production artifact."
}

$CodeSplittingScript = Get-Content "public\code-splitting.js" -Raw
if (-not $CodeSplittingScript.Contains("cosmic-music-player.js?v=$AssetVersion")) {
    throw "Runtime JavaScript asset references were not versioned."
}

$RequiredMarker = 'data-release="2026-07-ita-experience"'
if (-not $HomePage.Contains($RequiredMarker)) {
    throw "Homepage release marker is missing from the Pages artifact."
}

$ForbiddenContent = @(
    "hashmenow1234",
    "Q1 2025",
    "SPONSORED BY ELON MUSK AND DONALD TRUMP"
)
foreach ($ForbiddenText in $ForbiddenContent) {
    if ($HomePage.Contains($ForbiddenText)) {
        throw "Stale or unsafe homepage content remains in the Pages artifact: $ForbiddenText"
    }
}

Set-Content -Path "public\test_file.txt" -Value "GitLab Pages artifact verified during build."
$ItemCount = (Get-ChildItem "public" -Recurse).Count
Write-Host "Build complete and verified. $ItemCount items in public directory."
