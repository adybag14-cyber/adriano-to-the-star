# Adriano To The Star: Windows GitLab runner dispatcher
$ErrorActionPreference = "Stop"

$Architecture = $env:PROCESSOR_ARCHITECTURE
$Platform = [System.Environment]::OSVersion.Platform
if ($Architecture -ne "AMD64" -or $Platform -ne "Win32NT") {
    Write-Error "This runner requires x64 Windows. Architecture=$Architecture Platform=$Platform"
    exit 1
}

$Stage = $args[0]
if (-not $Stage) {
    Write-Error "A runner stage argument is required."
    exit 1
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command exited with code $LASTEXITCODE"
    }
}

function Invoke-ProductionHealthCheck {
    Write-Host "Running production content and asset checks..."
    $BaseUrl = "https://adrianotothestar.com"
    $CacheKey = if ($env:CI_PIPELINE_ID) {
        $env:CI_PIPELINE_ID
    }
    else {
        [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    }
    $ReleaseMarker = if ($env:CI_COMMIT_SHORT_SHA) {
        $env:CI_COMMIT_SHORT_SHA
    }
    else {
        $CacheKey
    }

    $Checks = @(
        @{ Path = "/?deploy=$CacheKey"; Contains = 'data-release="2026-07-ita-experience"' },
        @{ Path = "/?deploy=$CacheKey"; Contains = "landing.css?v=$ReleaseMarker" },
        @{ Path = "/?deploy=$CacheKey"; Contains = "passage-cosmos" },
        @{ Path = "/landing.css?deploy=$CacheKey"; Contains = "--landing-cta-ink" },
        @{ Path = "/landing.css?v=$ReleaseMarker"; Contains = "--landing-cta-ink" },
        @{ Path = "/landing-experience.js?deploy=$CacheKey"; Contains = "static-deep-space" },
        @{ Path = "/landing-experience.js?v=$ReleaseMarker"; Contains = "static-deep-space" },
        @{ Path = "/ita-music-player.css?deploy=$CacheKey"; Contains = "MISSION AUDIO" },
        @{ Path = "/i18n.js?deploy=$CacheKey"; Contains = "ita-language-switcher" },
        @{ Path = "/i18n.js?deploy=$CacheKey"; Contains = "assetVersion" },
        @{ Path = "/site-experience.css?deploy=$CacheKey"; Contains = "ita-site-refresh" },
        @{ Path = "/auth-local.js?deploy=$CacheKey"; Contains = "isLocalPlatform" },
        @{ Path = "/theme-styles.css?deploy=$CacheKey"; Contains = ".theme-toggle-btn" },
        @{ Path = "/code-splitting.js?deploy=$CacheKey"; Contains = "cosmic-music-player.js?v=" },
        @{ Path = "/database.html?deploy=$CacheKey"; Contains = "theme-styles.css?v=" },
        @{ Path = "/database.html?deploy=$CacheKey"; Contains = 'data-cfasync="false"' },
        @{ Path = "/database.html?deploy=$CacheKey"; Contains = "large-exoplanet-loader.js?v=" },
        @{ Path = "/projects.html?deploy=$CacheKey"; Contains = "2026 FLIGHT LAB" },
        @{ Path = "/projects.js?deploy=$CacheKey"; Contains = "checkCapabilities" },
        @{ Path = "/education.html?deploy=$CacheKey"; Contains = "ita-breadcrumb" },
        @{ Path = "/privacy.html?deploy=$CacheKey"; Contains = "Privacy" },
        @{ Path = "/tracker.html?deploy=$CacheKey"; Contains = "vendor/tracker/react-18.3.1.production.min.js?v=" },
        @{ Path = "/about.html?deploy=$CacheKey"; Contains = "ABOUT THE PROJECT"; Excludes = @("ABOUT ME", "My Story", "Britain.", "MI6", "Metropolitan Police") },
        # Versioned asset contents are checked only through attempt-specific
        # probes. The release HTML and manifest prove the canonical immutable
        # URL strings. Requesting those bare URLs from CI during propagation can
        # route to a different stale edge and poison the fresh cache key.
        @{ Path = "/book-online.html?deploy=$CacheKey"; Contains = "book-online.css?v=$ReleaseMarker" },
        @{ Path = "/book-online.css?v=$ReleaseMarker"; Contains = ".mission-plan-form" },
        @{ Path = "/star-maps.html?deploy=$CacheKey"; Contains = "interactive-star-maps.js?v=$ReleaseMarker" },
        @{ Path = "/interactive-star-maps.js?v=$ReleaseMarker"; Contains = "updateCanvasAccessibilityLabel" },
        @{ Path = "/manifest.json?v=$ReleaseMarker"; Contains = "icon-192x192.png?v=$ReleaseMarker" },
        @{ Path = "/images/icon-192x192.png?v=$ReleaseMarker"; Contains = $null },
        @{ Path = "/images/icon-512x512.png?v=$ReleaseMarker"; Contains = $null },
        @{ Path = "/sitemap.xml?deploy=$CacheKey"; Contains = "galaxy-object-trading.html" }
    )

    $MaximumAttempts = 18
    $DelaySeconds = 10
    for ($Attempt = 1; $Attempt -le $MaximumAttempts; $Attempt++) {
        try {
            foreach ($Check in $Checks) {
                $ProbePath = $Check.Path
                if ($ProbePath.Contains("deploy=$CacheKey")) {
                    $ProbePath = $ProbePath.Replace("deploy=$CacheKey", "deploy=$CacheKey-$Attempt")
                }
                else {
                    $Separator = if ($ProbePath.Contains("?")) { "&" } else { "?" }
                    $ProbePath = "${ProbePath}${Separator}deployProbe=$CacheKey-$Attempt"
                }
                $Url = "$BaseUrl$ProbePath"
                $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30 -Headers @{
                    "Cache-Control" = "no-cache"
                    "Pragma" = "no-cache"
                }

                if ($Response.StatusCode -ne 200) {
                    throw "$Url returned HTTP $($Response.StatusCode)"
                }
                if ($Check.Contains -and -not $Response.Content.Contains($Check.Contains)) {
                    throw "$Url did not contain the expected production marker."
                }
                if ($Check.Excludes) {
                    foreach ($ForbiddenText in $Check.Excludes) {
                        if ($Response.Content.IndexOf($ForbiddenText, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
                            throw "$Url still contained retired About-page content: $ForbiddenText"
                        }
                    }
                }
            }

            $HomeResponse = Invoke-WebRequest -Uri "$BaseUrl/?deploy=$CacheKey-$Attempt" -UseBasicParsing -TimeoutSec 30 -Headers @{
                "Cache-Control" = "no-cache"
                "Pragma" = "no-cache"
            }
            $ForbiddenContent = @(
                "hashmenow1234",
                "Q1 2025",
                "SPONSORED BY ELON MUSK AND DONALD TRUMP"
            )
            foreach ($ForbiddenText in $ForbiddenContent) {
                if ($HomeResponse.Content.Contains($ForbiddenText)) {
                    throw "Production homepage still contains forbidden stale content: $ForbiddenText"
                }
            }

            Write-Host "Production website checks passed: homepage, landing contrast/deep-space markers, privacy-safe About page, commit-stamped asset probes, PWA manifest, database, projects, breadcrumbs, sitemap, Rocket Loader exclusions, and stale-content gate verified."
            return
        }
        catch {
            if ($Attempt -eq $MaximumAttempts) {
                throw "Production health check failed after $MaximumAttempts attempts: $_"
            }
            Write-Host "Production is not updated yet (attempt $Attempt/$MaximumAttempts): $_"
            Start-Sleep -Seconds $DelaySeconds
        }
    }
}

# Deployment verification and production monitoring do not need a copied workspace.
if ($Stage -eq "deploy-pages") {
    if (-not (Test-Path "$env:CI_PROJECT_DIR\public\index.html")) {
        Write-Error "The GitLab Pages artifact is missing public\index.html."
        exit 1
    }
    if (-not (Test-Path "$env:CI_PROJECT_DIR\public\landing.css")) {
        Write-Error "The GitLab Pages artifact is missing public\landing.css."
        exit 1
    }
    Write-Host "GitLab Pages artifact is present and ready to publish."
    exit 0
}

if ($Stage -eq "monitor-health") {
    try {
        Invoke-ProductionHealthCheck
        exit 0
    }
    catch {
        Write-Error $_
        exit 1
    }
}

$IsolatedRoot = Join-Path $env:TEMP "starisdons-$env:CI_JOB_ID"
$ExitCode = 0

try {
    if (Test-Path $IsolatedRoot) {
        Remove-Item $IsolatedRoot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $IsolatedRoot -Force | Out-Null
    Write-Host "Isolated workspace: $IsolatedRoot"

    robocopy . $IsolatedRoot /S /E /MT:32 /R:1 /W:1 /NP /NFL /NDL /XD .git node_modules public | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "Robocopy failed with exit code $LASTEXITCODE"
    }

    if (Test-Path "node_modules") {
        $TargetNodeModules = Join-Path $IsolatedRoot "node_modules"
        if (-not (Test-Path $TargetNodeModules)) {
            cmd /c mklink /J "$TargetNodeModules" "$env:CI_PROJECT_DIR\node_modules" | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "Could not create the node_modules junction."
            }
        }
    }

    Set-Location $IsolatedRoot

    switch ($Stage) {
        "validate-lint" {
            if (Test-Path "package.json") {
                Invoke-CheckedCommand npm run lint
            }
        }
        "validate-test" {
            if (-not (Test-Path "coverage")) {
                New-Item -ItemType Directory -Path "coverage" -Force | Out-Null
            }
            if (Test-Path "package.json") {
                Invoke-CheckedCommand npm run test:coverage
            }
        }
        "build" {
            if (-not (Test-Path "build-pages.ps1")) {
                throw "build-pages.ps1 was not found."
            }
            Invoke-CheckedCommand powershell -ExecutionPolicy Bypass -File build-pages.ps1
        }
        "security" {
            Invoke-CheckedCommand node scripts/check-current-tree-secrets.mjs --self-test
            Invoke-CheckedCommand node scripts/check-current-tree-secrets.mjs --root $env:CI_PROJECT_DIR
            if (Test-Path "package.json") {
                Invoke-CheckedCommand npm audit --audit-level=low
            }
        }
        default {
            throw "Unknown runner stage: $Stage"
        }
    }

    if ($Stage -eq "build" -and (Test-Path "public")) {
        if (Test-Path "$env:CI_PROJECT_DIR\public") {
            Remove-Item "$env:CI_PROJECT_DIR\public" -Recurse -Force
        }
        Copy-Item "public" -Destination "$env:CI_PROJECT_DIR" -Recurse -Force
        Write-Host "Pages artifact copied back to CI_PROJECT_DIR."
    }

    if ($Stage -eq "validate-test" -and (Test-Path "coverage")) {
        if (Test-Path "$env:CI_PROJECT_DIR\coverage") {
            Remove-Item "$env:CI_PROJECT_DIR\coverage" -Recurse -Force
        }
        Copy-Item "coverage" -Destination "$env:CI_PROJECT_DIR" -Recurse -Force
        Write-Host "Coverage artifact copied back to CI_PROJECT_DIR."
    }

}
catch {
    Write-Error "Runner stage '$Stage' failed: $_"
    $ExitCode = 1
}
finally {
    Set-Location $env:CI_PROJECT_DIR
    $TargetNodeModules = Join-Path $IsolatedRoot "node_modules"
    if (Test-Path $TargetNodeModules) {
        cmd /c rd "$TargetNodeModules" | Out-Null
    }
    Remove-Item $IsolatedRoot -Recurse -Force -ErrorAction SilentlyContinue
}

exit $ExitCode
