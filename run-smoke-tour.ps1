param(
    [int]$Port = 8095,
    [string]$BaseUrl = "",
    [int]$StartupTimeoutSeconds = 30,
    [string]$TestFile = "tests/e2e/smoke-tour.spec.js"
)

Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$baseUrlWasProvided = $PSBoundParameters.ContainsKey('BaseUrl') -and ($BaseUrl -ne "")
if (-not $BaseUrl) {
    $BaseUrl = "http://localhost:$Port"
}

function Test-PortListening([int]$PortToCheck) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $PortToCheck -State Listen -ErrorAction SilentlyContinue
        return [bool]$connections
    } catch {
        return $false
    }
}

function Find-FreePort([int]$StartPort, [int]$MaxTries = 20) {
    for ($p = $StartPort; $p -lt ($StartPort + $MaxTries); $p++) {
        if (-not (Test-PortListening -PortToCheck $p)) {
            return $p
        }
    }

    return $null
}

function Wait-ForUrl([string]$UrlToCheck, [int]$TimeoutSeconds) {
    $start = Get-Date
    while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $TimeoutSeconds)) {
        try {
            $res = Invoke-WebRequest -Uri $UrlToCheck -UseBasicParsing -TimeoutSec 3
            if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) {
                return $true
            }
        } catch {}

        Start-Sleep -Milliseconds 500
    }

    return $false
}

Write-Host " Running Playwright smoke tour..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "" 

$serverProc = $null

try {
    $quickReady = Wait-ForUrl -UrlToCheck "$BaseUrl/index.html" -TimeoutSeconds 3

    if (-not $quickReady) {
        if (-not $baseUrlWasProvided -and (Test-PortListening -PortToCheck $Port)) {
            Write-Host " Port $Port is already in use. Stop the other server or specify a different -Port." -ForegroundColor Red
            exit 1
        }

        Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
        Write-Host "" 

    try {
        $null = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " Starting Custom Range Server on port $Port" -ForegroundColor Green
            $serverScript = Join-Path $root "custom_server_fixed.py"
            $serverProc = Start-Process -FilePath "python" -ArgumentList @($serverScript, "$Port") -WorkingDirectory $root -PassThru
        }
    } catch {}

    if (-not $serverProc) {
        try {
            $httpServerCmd = Get-Command http-server -ErrorAction SilentlyContinue
            if ($httpServerCmd) {
                Write-Host " Starting http-server on port $Port" -ForegroundColor Green
                $serverProc = Start-Process -FilePath $httpServerCmd.Source -ArgumentList @("-p", "$Port") -WorkingDirectory $root -PassThru
            }
        } catch {}
    }

    if (-not $serverProc) {
        try {
            $npxCmd = Get-Command npx -ErrorAction SilentlyContinue
            if ($npxCmd) {
                Write-Host " Starting npx http-server on port $Port" -ForegroundColor Green
                $serverProc = Start-Process -FilePath $npxCmd.Source -ArgumentList @("-y", "http-server", "-p", "$Port") -WorkingDirectory $root -PassThru
            }
        } catch {}
    }

    if (-not $serverProc) {
        Write-Host " No server found. Install Python or http-server." -ForegroundColor Red
        exit 1
    }

    $ready = Wait-ForUrl -UrlToCheck "$BaseUrl/index.html" -TimeoutSeconds $StartupTimeoutSeconds
    if (-not $ready) {
        Write-Host " Server did not become ready within ${StartupTimeoutSeconds}s" -ForegroundColor Red
        exit 1
    }
    }

    $env:BASE_URL = $BaseUrl

    Push-Location $root
    try {
        & npx playwright test $TestFile --reporter=line
        $exitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($exitCode -ne 0) {
        Write-Host " Smoke tour failed (exit code $exitCode). See test-results/ for details." -ForegroundColor Red
    } else {
        Write-Host " Smoke tour passed." -ForegroundColor Green
    }

    exit $exitCode
} finally {
    if ($serverProc -and -not $serverProc.HasExited) {
        try {
            Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}
