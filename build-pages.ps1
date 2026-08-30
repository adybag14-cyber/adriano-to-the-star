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

# Root pages and presentation assets. Keep developer-only test/debug harnesses in the
# repository when they are still useful to CI, but never publish them to GitLab Pages.
function Test-IsNonProductionRootWebFile {
    param([Parameter(Mandatory = $true)][System.IO.FileInfo]$File)

    $Name = $File.Name
    if ($Name -in @(
        "index_scraped.html",
        "index-corrected.html",
        "index-simple.html",
        "index-ultra-simple.html",
        "index-working.html",
        "index_new.html",
        "game.html",
        "play.html",
        "starsector_4.2_final.html",
        "cj3_debug.js",
        "temp-music-player-backup.js",
        "auth-supabase.js",
        "supabase-config.js",
        "supabase-integration.js",
        "firebase-config.js",
        "auth.js"
    )) { return $true }
    if ($Name -match '(?i)^test(?:[-_].*|\.html$)') { return $true }
    if ($Name -match '(?i)(?:^|[-_])(?:test|debug)(?:[-_].*)?\.html$') { return $true }
    if ($Name -match '(?i)(?:benchmark|fuzz).*\.html$') { return $true }
    if ($Name -match '(?i)^test[-_].*\.js$') { return $true }
    if ($Name -match '(?i)(?:^|[-_])test\.js$') { return $true }
    if ($Name -match '(?i)\.(?:test|spec)\.js$') { return $true }
    return $false
}

$RootHtmlFiles = Get-ChildItem -Path . -File -Filter "*.html" |
    Where-Object { -not (Test-IsNonProductionRootWebFile $_) }
$RootHtmlFiles | Copy-Item -Destination "public\" -Force
Get-ChildItem -Path . -File -Filter "*.css" | Copy-Item -Destination "public\" -Force

# Root JavaScript is retained because many legacy pages load scripts directly by filename,
# except test/spec harnesses that are not part of the production site.
$RootJavaScriptFiles = Get-ChildItem -Path . -File -Filter "*.js" |
    Where-Object { -not (Test-IsNonProductionRootWebFile $_) }
$RootJavaScriptFiles | Copy-Item -Destination "public\" -Force

$ExcludedRootWebFiles = Get-ChildItem -Path . -File |
    Where-Object { ($_.Extension -in '.html', '.js') -and (Test-IsNonProductionRootWebFile $_) }
if ($ExcludedRootWebFiles) {
    Write-Host "Excluded $($ExcludedRootWebFiles.Count) developer-only root web files from Pages."
}

$CoreAssets = @(
    "manifest.json",
    "favicon.ico",
    "CNAME",
    ".nojekyll",
    "sitemap.xml",
    "sitemap_index.xml",
    "robots.txt",
    "70cf5dbdf5fa4e0f9e4f847c624468fe.txt",
    "sw.js",
    "games-manifest.json",
    "stellar-ai-cli.zip"
)
foreach ($file in $CoreAssets) {
    if (Test-Path $file) {
        Copy-Item $file -Destination "public\" -Force
    }
}

$IndexNowVerificationFile = "70cf5dbdf5fa4e0f9e4f847c624468fe.txt"
$IndexNowKey = (Get-Content -LiteralPath $IndexNowVerificationFile -Raw).Trim()
if ($IndexNowKey -ne [System.IO.Path]::GetFileNameWithoutExtension($IndexNowVerificationFile)) {
    throw "IndexNow verification filename and value do not match."
}
[System.IO.File]::WriteAllText(
    (Join-Path "public" $IndexNowVerificationFile),
    $IndexNowKey,
    [System.Text.UTF8Encoding]::new($false)
)

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

# Vendor the exact React runtime used by tracker.html. The production browser never
# depends on a third-party CDN for the core tracker UI.
$TrackerVendorFiles = @{
    "node_modules\react\umd\react.production.min.js" = "public\vendor\tracker\react-18.3.1.production.min.js"
    "node_modules\react-dom\umd\react-dom.production.min.js" = "public\vendor\tracker\react-dom-18.3.1.production.min.js"
    "node_modules\react\LICENSE" = "public\vendor\tracker\react-LICENSE.txt"
    "node_modules\react-dom\LICENSE" = "public\vendor\tracker\react-dom-LICENSE.txt"
}
foreach ($entry in $TrackerVendorFiles.GetEnumerator()) {
    if (-not (Test-Path -LiteralPath $entry.Key)) {
        throw "Required tracker runtime is missing: $($entry.Key). Run npm ci before the Pages build."
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $entry.Value) -Force | Out-Null
    Copy-Item -LiteralPath $entry.Key -Destination $entry.Value -Force
}

$BitGpuVendorFiles = @{
    "node_modules\bitgpu\dist\index.js" = "public\vendor\bitgpu\index.js"
    "node_modules\bitgpu\dist\chat.js" = "public\vendor\bitgpu\chat.js"
    "node_modules\bitgpu\LICENSE" = "public\vendor\bitgpu\LICENSE.txt"
    "node_modules\bitgpu\THIRD_PARTY_LICENSES.md" = "public\vendor\bitgpu\THIRD_PARTY_LICENSES.md"
}
foreach ($entry in $BitGpuVendorFiles.GetEnumerator()) {
    if (-not (Test-Path -LiteralPath $entry.Key)) {
        throw "Required Bonsai runtime file is missing: $($entry.Key). Run npm ci before the Pages build."
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $entry.Value) -Force | Out-Null
    Copy-Item -LiteralPath $entry.Key -Destination $entry.Value -Force
}

# Refresh the nearby-star/NASA discovery snapshot before page preparation. Failure
# is non-destructive: the checked-in, already-copied same-origin snapshot remains.
$TrackerFeedUpdater = "scripts\update-tracker-data.mjs"
$TrackerFeedSnapshot = "public\data\tracker\stellar-neighborhood.json"
if (Test-Path -LiteralPath $TrackerFeedUpdater) {
    try {
        & node $TrackerFeedUpdater "--output=$TrackerFeedSnapshot"
        if ($LASTEXITCODE -ne 0) { throw "tracker updater exited with code $LASTEXITCODE" }
    }
    catch {
        Write-Warning "Tracker refresh failed; retaining the checked-in snapshot. $($_.Exception.Message)"
        if (-not (Test-Path -LiteralPath $TrackerFeedSnapshot)) {
            throw "Tracker refresh failed and no fallback snapshot exists in the Pages artifact."
        }
    }
}
elseif (-not (Test-Path -LiteralPath $TrackerFeedSnapshot)) {
    throw "Tracker updater and fallback snapshot are both missing."
}

# Never publish nested developer fixtures from otherwise production-facing directories.
if (Test-Path -LiteralPath "public\forms\test") {
    Remove-Item -LiteralPath "public\forms\test" -Recurse -Force
}

# Publish only the model assets that live production code references directly.
# The rest of assets/models stays out of Pages and can remain source/R2 material.
$ProductionModelAssets = @(
    "assets\models\ships\viper.glb",
    "assets\models\defense\missile_battery.glb"
)
foreach ($asset in $ProductionModelAssets) {
    if (-not (Test-Path -LiteralPath $asset)) {
        throw "Required production model is missing: $asset"
    }
    $destination = Join-Path "public" $asset
    $destinationDirectory = Split-Path -Parent $destination
    New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    Copy-Item -LiteralPath $asset -Destination $destination -Force
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

# Apply the static production experience before asset versioning. This produces
# crawler-readable metadata and visible breadcrumbs for the exact public-page
# inventory while leaving experimental application internals untouched.
$ProductionPagePreparer = "scripts\prepare-production-pages.mjs"
if (-not (Test-Path -LiteralPath $ProductionPagePreparer)) {
    throw "Production page preparer is missing: $ProductionPagePreparer"
}
& node $ProductionPagePreparer "public"
if ($LASTEXITCODE -ne 0) {
    throw "Production page preparation failed with exit code $LASTEXITCODE"
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
$LocalAssetAttributePattern = '(?i)(?<prefix>\b(?:href|src)\s*=\s*(?<quote>["'']))(?<path>(?!https?:|//|data:|#|mailto:)[^"''?#]+?\.(?:css|js|json))(?<query>\?[^"'']*)?\k<quote>'
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

# Runtime loaders, workers, dynamic imports, and data feeds may contain local asset
# paths inside JavaScript strings rather than HTML attributes. Version those generated
# references too. JSON is included so returning visitors cannot receive a stale feed
# from an intermediary/browser cache after the JavaScript itself has been upgraded.
$LocalAssetStringPattern = '(?i)(?<quote>["''])(?<path>(?!https?:|//|data:|#|mailto:)[^"''?#\r\n]+?\.(?:css|js|json))(?<query>\?[^"'']*)?\k<quote>'
$VersionedJavaScriptReferenceCount = 0
foreach ($JavaScriptFile in Get-ChildItem "public" -Recurse -File -Filter "*.js" |
    Where-Object { $_.FullName -notlike "*\public\vendor\*" }) {
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

# Reject structurally corrupted HTML before deployment. A past bulk SEO edit duplicated
# complete bodies and even placed <main>/<footer> inside <head>; browsers recover
# unpredictably and execute scripts twice, so fail the build instead of publishing it.
$StructuralHtmlErrors = @()
foreach ($HtmlFile in Get-ChildItem "public" -Recurse -File -Filter "*.html") {
    $Markup = [System.IO.File]::ReadAllText($HtmlFile.FullName)
    $BodyCount = ([regex]::Matches($Markup, '(?i)<body\b')).Count
    $MainCount = ([regex]::Matches($Markup, '(?i)<main\b')).Count
    $FooterCount = ([regex]::Matches($Markup, '(?i)<footer\b')).Count
    $HeadMatch = [regex]::Match($Markup, '(?is)<head\b[^>]*>(.*?)</head>')
    $ContentInsideHead = $HeadMatch.Success -and [regex]::IsMatch($HeadMatch.Groups[1].Value, '(?i)<(?:main|footer)\b')

    if ($BodyCount -gt 1 -or $MainCount -gt 1 -or $FooterCount -gt 1 -or $ContentInsideHead) {
        $RelativeHtmlPath = [System.IO.Path]::GetRelativePath((Resolve-Path "public"), $HtmlFile.FullName)
        $StructuralHtmlErrors += "$RelativeHtmlPath (body=$BodyCount main=$MainCount footer=$FooterCount content-in-head=$ContentInsideHead)"
    }
}
if ($StructuralHtmlErrors.Count -gt 0) {
    throw "Structurally invalid production HTML: $($StructuralHtmlErrors -join '; ')"
}

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
    "site-experience.css",
    "experimental-lab.css",
    "ita-music-player.css",
    "i18n.js",
    "i18n-styles.css",
    "auth-local.js",
    "pioneer-local-service.js",
    "site-runtime.js",
    "large-exoplanet-loader.js",
    "database-3d-loader.js",
    "three.min.js",
    "OrbitControls-r128.js",
    "planet-3d-viewer.js",
    "theme-styles.css",
    "loader-minimal.css",
    "code-splitting.js",
    "fonts\fonts.css",
    "images\bg-large.jpg",
    "database.html",
    "database-ita-shell.css",
    "database-experience.js",
    "education.html",
    "education-bootstrap.js",
    "education-viewer.js",
    "privacy.html",
    "tracker.html",
    "tracker-app.js",
    "tracker-visualization.js",
    "tracker.css",
    "vendor\tracker\react-18.3.1.production.min.js",
    "vendor\tracker\react-dom-18.3.1.production.min.js",
    "vendor\tracker\react-LICENSE.txt",
    "vendor\tracker\react-dom-LICENSE.txt",
    "vendor\bitgpu\index.js",
    "vendor\bitgpu\chat.js",
    "vendor\bitgpu\LICENSE.txt",
    "vendor\bitgpu\THIRD_PARTY_LICENSES.md",
    "data\tracker\stellar-neighborhood.json",
    "images\earth_texture_map.png",
    "images\textures\mercury.jpg",
    "images\textures\venus.jpg",
    "images\textures\mars.jpg",
    "images\textures\jupiter.jpg",
    "images\textures\saturn.jpg",
    "images\textures\uranus.jpg",
    "images\textures\neptune.jpg",
    "data\space-feeds.json",
    "games-manifest.json",
    "stellar-ai-cli.zip",
    "assets\models\ships\viper.glb",
    "assets\models\defense\missile_battery.glb",
    "CNAME"
)

$MissingFiles = $RequiredFiles | Where-Object { -not (Test-Path (Join-Path "public" $_)) }
if ($MissingFiles) {
    throw "Build is missing required production files: $($MissingFiles -join ', ')"
}

# Education planet surfaces must be real image payloads, not tiny CDN/LFS/error text.
$EducationTextureAssets = @(
    "images\earth_texture_map.png",
    "images\textures\mercury.jpg",
    "images\textures\venus.jpg",
    "images\textures\mars.jpg",
    "images\textures\jupiter.jpg",
    "images\textures\saturn.jpg",
    "images\textures\uranus.jpg",
    "images\textures\neptune.jpg"
)
foreach ($TextureAsset in $EducationTextureAssets) {
    $TexturePath = Join-Path "public" $TextureAsset
    $TextureBytes = [System.IO.File]::ReadAllBytes($TexturePath)
    if ($TextureBytes.Length -lt 1024) {
        throw "Education texture is suspiciously small/corrupt: $TextureAsset ($($TextureBytes.Length) bytes)"
    }
    $IsJpeg = $TextureBytes.Length -ge 2 -and $TextureBytes[0] -eq 0xFF -and $TextureBytes[1] -eq 0xD8
    $IsPng = $TextureBytes.Length -ge 8 -and $TextureBytes[0] -eq 0x89 -and $TextureBytes[1] -eq 0x50 -and $TextureBytes[2] -eq 0x4E -and $TextureBytes[3] -eq 0x47
    if (-not ($IsJpeg -or $IsPng)) {
        throw "Education texture is not a valid JPEG/PNG payload: $TextureAsset"
    }
}

$StarsectorRedirectPage = Get-Content "public\starsector.html" -Raw
$StarsectorRedirectTarget = "https://adybag14-cyber.github.io/starsectorquick/launch.html?autostart=1"
if (-not $StarsectorRedirectPage.Contains($StarsectorRedirectTarget)) {
    throw "Starsector page does not redirect to the production StarsectorQuick launcher."
}
if ($StarsectorRedirectPage -match "(?i)cheerpj|starfarer_obf|lwjgl") {
    throw "Starsector redirect page unexpectedly contains the retired in-site Java launcher."
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
if (-not $DatabasePage.Contains("database-3d-loader.js?v=$AssetVersion")) {
    throw "Database page does not contain the versioned lazy 3D loader."
}
if ($DatabasePage -match '<script[^>]+src="[^"]*(?:three\.min\.js|OrbitControls-r128\.js|planet-3d-viewer\.js)') {
    throw "Database page eagerly loads the 3D rendering stack instead of using the lazy loader."
}
if ($DatabasePage.Contains("kepler_data_parsed.js")) {
    throw "Database page still loads the duplicate generated JavaScript catalogue instead of the JSONL snapshot."
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

$ProductionPageAuditor = "scripts\audit-production-pages.mjs"
if (-not (Test-Path -LiteralPath $ProductionPageAuditor)) {
    throw "Production page auditor is missing: $ProductionPageAuditor"
}
& node $ProductionPageAuditor "public"
if ($LASTEXITCODE -ne 0) {
    throw "Production page audit failed with exit code $LASTEXITCODE"
}

Set-Content -Path "public\test_file.txt" -Value "GitLab Pages artifact verified during build."
$ItemCount = (Get-ChildItem "public" -Recurse).Count
Write-Host "Build complete and verified. $ItemCount items in public directory."
