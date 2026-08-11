# Git LFS Pull with Retry Logic and Better Error Handling
$maxRetries = 5
$retryCount = 0
$success = $false

# Configure Git LFS for better reliability
git config lfs.batch true
git config lfs.concurrenttransfers 4
git config http.postBuffer 1048576000
git config http.maxRequestBuffer 100M
git config core.compression 0

while ($retryCount -lt $maxRetries -and -not $success) {
    try {
        $output = git lfs pull 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "Git LFS pull successful"
            $success = $true
            break
        }
        else {
            Write-Host "Git LFS pull returned exit code: $exitCode"
            Write-Host "Output: $output"
            throw "Git LFS pull failed with exit code $exitCode"
        }
    }
    catch {
        $retryCount++
        if ($retryCount -ge $maxRetries) {
            Write-Host "Git LFS pull failed after $maxRetries attempts. Continuing anyway..."
            Write-Host "Note: Some LFS files may be missing, but build will continue."
            # Don't exit with error - allow build to continue
            $success = $false
            break
        }
        else {
            $waitTime = [math]::Min(10 * $retryCount, 30)
            Write-Host "Git LFS pull failed, retrying in $waitTime seconds... (attempt $retryCount of $maxRetries)"
            Start-Sleep -Seconds $waitTime
        }
    }
}

if (-not $success) {
    Write-Host "Warning: Git LFS pull did not complete successfully, but continuing build..."
}

