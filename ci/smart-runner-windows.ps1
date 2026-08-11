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
    $ApiHealthUrl = "https://api.adrianotothestar.com/api/health"
    $CacheKey = if ($env:CI_PIPELINE_ID) {
        $env:CI_PIPELINE_ID
    }
    else {
        [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    }

    $Checks = @(
        @{ Path = "/?deploy=$CacheKey"; Contains = 'data-release="2026-07-ita-experience"' },
        @{ Path = "/landing.css?deploy=$CacheKey"; Contains = "--electric" },
        @{ Path = "/landing-experience.js?deploy=$CacheKey"; Contains = "StellarField" },
        @{ Path = "/ita-music-player.css?deploy=$CacheKey"; Contains = "MISSION AUDIO" },
        @{ Path = "/i18n.js?deploy=$CacheKey"; Contains = "ita-language-switcher" },
        @{ Path = "/auth-supabase.js?deploy=$CacheKey"; Contains = "cloudflare-d1" },
        @{ Path = "/theme-styles.css?deploy=$CacheKey"; Contains = ".theme-toggle-btn" },
        @{ Path = "/code-splitting.js?deploy=$CacheKey"; Contains = "cosmic-music-player.js?v=" },
        @{ Path = "/database.html?deploy=$CacheKey"; Contains = "theme-styles.css?v=" },
        @{ Path = "/database.html?deploy=$CacheKey"; Contains = 'data-cfasync="false"' },
        @{ Path = "/database.html?deploy=$CacheKey"; Contains = "large-exoplanet-loader.js?v=" }
    )

    $MaximumAttempts = 12
    $DelaySeconds = 10
    for ($Attempt = 1; $Attempt -le $MaximumAttempts; $Attempt++) {
        try {
            foreach ($Check in $Checks) {
                $Url = "$BaseUrl$($Check.Path)"
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
            }

            $ApiResponse = Invoke-WebRequest -Uri "${ApiHealthUrl}?deploy=$CacheKey" -UseBasicParsing -TimeoutSec 30 -Headers @{
                "Cache-Control" = "no-cache"
                "Pragma" = "no-cache"
            }
            if ($ApiResponse.StatusCode -ne 200 -or -not $ApiResponse.Content.Contains('"version":"2.1.0-d1"') -or -not $ApiResponse.Content.Contains('"database":"ok"') -or -not $ApiResponse.Content.Contains('"storage":"d1"')) {
                throw "Production D1 API health check did not report version 2.1.0-d1 with database and D1 storage ok."
            }

            $HomeResponse = Invoke-WebRequest -Uri "$BaseUrl/?deploy=$CacheKey" -UseBasicParsing -TimeoutSec 30 -Headers @{
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

            Write-Host "Production checks passed: homepage, D1 API, versioned assets, database experience, Rocket Loader exclusions, and stale-content gate verified."
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
            if (Test-Path "package.json") {
                Invoke-CheckedCommand npm audit --audit-level=moderate
            }
        }
        "deploy-mechgen" {
            if (-not (Test-Path "mechgen_web\deploy.ps1")) {
                throw "mechgen_web\deploy.ps1 was not found."
            }
            Invoke-CheckedCommand powershell -ExecutionPolicy Bypass -File mechgen_web\deploy.ps1
        }
        "deploy-api-worker" {
            if (-not (Test-Path "wrangler-api.toml")) {
                throw "wrangler-api.toml was not found."
            }
            Invoke-CheckedCommand npx wrangler d1 migrations apply exoplanet-pioneer-db --remote --config wrangler-api.toml
            Invoke-CheckedCommand npx wrangler deploy --config wrangler-api.toml
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

    if ($Stage -eq "deploy-mechgen" -and (Test-Path "mechgen_backend_url.txt")) {
        Copy-Item "mechgen_backend_url.txt" -Destination "$env:CI_PROJECT_DIR" -Force
        Write-Host "MechGen deployment URL copied back to CI_PROJECT_DIR."
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
