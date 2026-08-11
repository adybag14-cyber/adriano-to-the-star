[CmdletBinding()]
param(
    [string]$OutputPath = "public\data\space-feeds.json",
    [string]$FallbackPath = "data\space-feeds.json",
    [int]$TimeoutSec = 12
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

$Utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
$UserAgent = "AdrianoToTheStar-PagesBuild/1.0"

function Read-Snapshot {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    try {
        return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    }
    catch {
        Write-Warning "Ignoring unreadable space-feed snapshot at ${Path}: $($_.Exception.Message)"
        return $null
    }
}

function Invoke-JsonFeed {
    param([Parameter(Mandatory = $true)][string]$Url)
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSec -Headers @{
        "User-Agent" = $UserAgent
        "Accept" = "application/json"
    }
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw "HTTP $($response.StatusCode)"
    }
    return $response.Content | ConvertFrom-Json
}

function Get-FallbackByType {
    param($Snapshot, [string]$Type)
    if (-not $Snapshot -or -not $Snapshot.feeds) { return @() }
    return @($Snapshot.feeds | Where-Object { $_.type -eq $Type })
}

function Get-TruncatedText {
    param([string]$Text, [int]$MaxLength = 180)
    if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
    $clean = ($Text -replace '\s+', ' ').Trim()
    if ($clean.Length -le $MaxLength) { return $clean }
    return $clean.Substring(0, $MaxLength).TrimEnd() + "…"
}

$fallback = Read-Snapshot -Path $FallbackPath
$feeds = New-Object System.Collections.Generic.List[object]
$sourceStatus = [ordered]@{}
$refreshedSources = 0

# NASA Exoplanet Archive: server-side TAP query avoids browser CORS entirely.
try {
    $query = [uri]::EscapeDataString("select top 5 pl_name,hostname,disc_year,sy_dist from pscomppars order by disc_year desc")
    $url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=$query&format=json"
    $data = Invoke-JsonFeed -Url $url
    foreach ($planet in $data) {
        $distance = if ($null -ne $planet.sy_dist) { "{0:N1} pc" -f [double]$planet.sy_dist } else { "N/A" }
        $planetTitle = if ($planet.pl_name) { [string]$planet.pl_name } else { "Unknown planet" }
        $discoveryYear = if ($planet.disc_year) { [string]$planet.disc_year } else { "N/A" }
        $hostName = if ($planet.hostname) { [string]$planet.hostname } else { "N/A" }
        $feeds.Add([ordered]@{
            type = "exoplanet"
            source = "NASA Exoplanet Archive"
            title = $planetTitle
            desc = "Discovered: $discoveryYear | Host: $hostName | Dist: $distance"
            link = "https://exoplanetarchive.ipac.caltech.edu/"
            meta = [ordered]@{
                discoveryYear = if ($planet.disc_year) { [int]$planet.disc_year } else { $null }
                host = $hostName
                distancePc = if ($null -ne $planet.sy_dist) { [double]$planet.sy_dist } else { $null }
            }
        })
    }
    $sourceStatus.exoplanets = "refreshed"
    $refreshedSources++
}
catch {
    Get-FallbackByType -Snapshot $fallback -Type "exoplanet" | ForEach-Object { $feeds.Add($_) }
    $sourceStatus.exoplanets = "fallback"
    Write-Host "Space feeds: NASA Exoplanet Archive unavailable; keeping fallback snapshot. $($_.Exception.Message)"
}

# NASA APOD requires a real API key. Shared/demo credentials are never used in production builds.
$nasaApiKey = [string]$env:NASA_API_KEY
if (-not [string]::IsNullOrWhiteSpace($nasaApiKey)) {
    try {
        $key = [uri]::EscapeDataString($nasaApiKey)
        $apod = Invoke-JsonFeed -Url "https://api.nasa.gov/planetary/apod?api_key=$key"
        if (-not $apod.title) { throw "APOD response missing title" }
        $feeds.Add([ordered]@{
            type = "apod"
            source = "NASA APOD"
            title = "APOD: $($apod.title)"
            desc = Get-TruncatedText -Text ([string]$apod.explanation) -MaxLength 180
            link = [string]$apod.url
        })
        $sourceStatus.apod = "refreshed"
        $refreshedSources++
    }
    catch {
        Get-FallbackByType -Snapshot $fallback -Type "apod" | ForEach-Object { $feeds.Add($_) }
        $sourceStatus.apod = "fallback"
        Write-Host "Space feeds: NASA APOD unavailable; keeping fallback snapshot. $($_.Exception.Message)"
    }
}
else {
    $cachedApod = @(Get-FallbackByType -Snapshot $fallback -Type "apod")
    if ($cachedApod.Count -gt 0) {
        $cachedApod | ForEach-Object { $feeds.Add($_) }
        $sourceStatus.apod = "cached-no-key"
    }
    else {
        $sourceStatus.apod = "not-configured"
    }
}

# Launch Library 2: only the next two launches are needed in the compact Science Deck.
try {
    $launchData = Invoke-JsonFeed -Url "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=2&mode=detailed"
    foreach ($launch in @($launchData.results | Select-Object -First 2)) {
        $window = if ($launch.window_start) {
            ([DateTimeOffset]::Parse([string]$launch.window_start)).UtcDateTime.ToString("yyyy-MM-dd HH:mm 'UTC'")
        }
        else { "TBD" }
        $pad = if ($launch.pad -and $launch.pad.name) { [string]$launch.pad.name } else { "TBD" }
        $launchName = if ($launch.name) { [string]$launch.name } else { "Unknown mission" }
        $feeds.Add([ordered]@{
            type = "launch"
            source = "Launch Library 2"
            title = "Launch: $launchName"
            desc = "Window: $window | Pad: $pad"
            link = [string]$launch.url
        })
    }
    $sourceStatus.launches = "refreshed"
    $refreshedSources++
}
catch {
    Get-FallbackByType -Snapshot $fallback -Type "launch" | ForEach-Object { $feeds.Add($_) }
    $sourceStatus.launches = "fallback"
    Write-Host "Space feeds: Launch Library unavailable; keeping fallback snapshot. $($_.Exception.Message)"
}

# Spaceflight News API: small build-time sample, never fetched from the player's browser.
try {
    $newsData = Invoke-JsonFeed -Url "https://api.spaceflightnewsapi.net/v4/articles/?limit=3"
    foreach ($article in @($newsData.results | Select-Object -First 3)) {
        $articleTitle = if ($article.title) { [string]$article.title } else { "Space news" }
        $feeds.Add([ordered]@{
            type = "news"
            source = "Spaceflight News API"
            title = $articleTitle
            desc = Get-TruncatedText -Text ([string]$article.summary) -MaxLength 160
            link = [string]$article.url
        })
    }
    $sourceStatus.news = "refreshed"
    $refreshedSources++
}
catch {
    Get-FallbackByType -Snapshot $fallback -Type "news" | ForEach-Object { $feeds.Add($_) }
    $sourceStatus.news = "fallback"
    Write-Host "Space feeds: Spaceflight News API unavailable; keeping fallback snapshot. $($_.Exception.Message)"
}

if ($feeds.Count -eq 0) {
    throw "No space-feed entries are available and no fallback snapshot could be used."
}

$buildSha = if ($env:CI_COMMIT_SHA) { [string]$env:CI_COMMIT_SHA } else { "local" }
$snapshot = [ordered]@{
    schemaVersion = 1
    generatedAt = [DateTimeOffset]::UtcNow.ToString("o")
    buildSha = $buildSha
    delivery = "build-cached"
    refreshedSources = $refreshedSources
    sourceStatus = $sourceStatus
    feeds = $feeds.ToArray()
}

$outputDirectory = Split-Path -Parent $OutputPath
if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$json = $snapshot | ConvertTo-Json -Depth 8
$tempPath = "$OutputPath.tmp"
[System.IO.File]::WriteAllText($tempPath, $json, $Utf8WithoutBom)
Move-Item -LiteralPath $tempPath -Destination $OutputPath -Force
Write-Host "Space feeds: wrote $($feeds.Count) build-cached entries to $OutputPath ($refreshedSources upstream sources refreshed)."
