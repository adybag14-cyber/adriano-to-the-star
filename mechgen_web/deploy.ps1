# Optimized MechGen Deployment Script
param([string]$ProjectId, [string]$Region, [string]$ServiceName)

$ErrorActionPreference = "Stop"

# 1. Initialization and Parameter Fallbacks
if (-not $ProjectId) { $ProjectId = $env:PROJECT_ID }
if (-not $Region) { $Region = if ($env:REGION) { $env:REGION } else { "europe-west2" } }
if (-not $ServiceName) { $ServiceName = if ($env:SERVICE_NAME) { $env:SERVICE_NAME } else { "mechgen-web" } }

if (-not $ProjectId -or -not $ServiceName) {
    Write-Error "ProjectId and ServiceName are required for deployment."
    exit 1
}

Write-Host "Starting MechGen Deployment..."
Write-Host "Project: $ProjectId | Region: $Region | Service: $ServiceName"

# 1.1 Verify gcloud availability
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI not found in PATH. Please ensure it is installed and configured."
    exit 1
}

$ContextDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$Image = "gcr.io/${ProjectId}/${ServiceName}:latest"

# 2. Retry Helper Function for gcloud commands
function Invoke-GCloudWithRetry($Arguments) {
    $MaxRetries = 3
    $RetryCount = 0
    while ($RetryCount -lt $MaxRetries) {
        try {
            & gcloud @Arguments --quiet
            if ($LASTEXITCODE -eq 0) { return }
        } catch {
            Write-Warning "Attempt $($RetryCount + 1) failed. Retrying..."
        }
        $RetryCount++
        Start-Sleep -Seconds (5 * $RetryCount)
    }
    Write-Error "Command failed after $MaxRetries attempts: gcloud $Arguments"
    exit 1
}

# 3. Secure Secret Management
if ($env:GEMINI_API_KEY) {
    Write-Host "Syncing Gemini API Key..."
    $SecretName = if ($env:GEMINI_SECRET_NAME) { $env:GEMINI_SECRET_NAME } else { "GEMINI_API_KEY" }

    & gcloud secrets describe $SecretName --project $ProjectId --quiet 2>$null
    if ($LASTEXITCODE -ne 0) {
        & gcloud secrets create $SecretName --project $ProjectId --replication-policy="automatic" --quiet
    }

    $TmpFile = [System.IO.Path]::GetTempFileName()
    Set-Content -NoNewline -Path $TmpFile -Value $env:GEMINI_API_KEY
    Invoke-GCloudWithRetry @("secrets", "versions", "add", $SecretName, "--project", $ProjectId, "--data-file", $TmpFile)
    Remove-Item $TmpFile -Force

    # Ensure Cloud Run service account has access
    $ProjectNumber = (& gcloud projects describe $ProjectId --format="value(projectNumber)" --quiet).Trim()
    if ($ProjectNumber) {
        $ComputeSa = "$ProjectNumber-compute@developer.gserviceaccount.com"
        & gcloud secrets add-iam-policy-binding $SecretName --project $ProjectId --member "serviceAccount:$ComputeSa" --role "roles/secretmanager.secretAccessor" --quiet | Out-Null
    }
}

# 4. Build and Deploy
Write-Host "Submitting Cloud Build..."
$BuildId = (& gcloud builds submit $ContextDir.Path --project $ProjectId --config "mechgen_web/cloudbuild.yaml" --substitutions "_IMAGE=$Image" --async --format="value(id)" --quiet).Trim()

if (-not $BuildId) {
    Write-Error "Failed to submit Cloud Build."
    exit 1
}

Write-Host "Build submitted successfully. Build ID: $BuildId"
Write-Host "Waiting for build to complete..."

$Status = "WORKING"
while ($Status -eq "WORKING" -or $Status -eq "QUEUED" -or $Status -eq "PENDING") {
    Start-Sleep -Seconds 10
    $Status = (& gcloud builds describe $BuildId --project $ProjectId --format="value(status)" --quiet).Trim()
    Write-Host "Current Build Status: $Status"
}

if ($Status -ne "SUCCESS") {
    Write-Error "Cloud Build failed with status: $Status"
    exit 1
}

Write-Host "Cloud Build succeeded!"

Write-Host "Deploying to Cloud Run..."
$DeployArgs = @(
    "run", "deploy", $ServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--image", $Image,
    "--allow-unauthenticated",
    "--memory", "2Gi"
)

if (Test-Path "mechgen_web/cloudrun.env.yaml") {
    $DeployArgs += @("--env-vars-file", "mechgen_web/cloudrun.env.yaml")
}

if ($env:GEMINI_SECRET_NAME -or $SecretName) {
    $ActiveSecret = if ($env:GEMINI_SECRET_NAME) { $env:GEMINI_SECRET_NAME } else { $SecretName }
    $DeployArgs += @("--set-secrets", "GEMINI_API_KEY=$($ActiveSecret):latest")
}

Invoke-GCloudWithRetry $DeployArgs

Write-Host "Deployment Successful!"
