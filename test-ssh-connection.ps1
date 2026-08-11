# Test SSH connection to GitLab with the new key
Write-Host "Testing SSH connection to GitLab with adybag14 key..." -ForegroundColor Yellow

# Test 1: Basic connection test
Write-Host "`n1. Testing basic connection..." -ForegroundColor Cyan
$result = ssh -i C:\Users\adyba\.ssh\id_ed25519_adybag14 -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -T git@gitlab.com 2>&1
Write-Host "Result: $result" -ForegroundColor Green

# Test 2: Check if key format is correct
Write-Host "`n2. Verifying key format..." -ForegroundColor Cyan
$pubKey = Get-Content C:\Users\adyba\.ssh\id_ed25519_adybag14.pub
if ($pubKey -match '^ssh-ed25519') {
    Write-Host "✓ Key format is correct (ED25519)" -ForegroundColor Green
    Write-Host "Public key: $pubKey" -ForegroundColor Gray
} else {
    Write-Host "✗ Key format issue detected" -ForegroundColor Red
}

# Test 3: Check key permissions
Write-Host "`n3. Checking file permissions..." -ForegroundColor Cyan
$keyFile = Get-Item C:\Users\adyba\.ssh\id_ed25519_adybag14 -ErrorAction SilentlyContinue
if ($keyFile) {
    Write-Host "✓ Private key file exists" -ForegroundColor Green
    Write-Host "Permissions: $($keyFile.GetAccessControl().AccessToString)" -ForegroundColor Gray
} else {
    Write-Host "✗ Private key file not found!" -ForegroundColor Red
}

# Test 4: Verify SSH config
Write-Host "`n4. Checking SSH config..." -ForegroundColor Cyan
if (Test-Path C:\Users\adyba\.ssh\config) {
    Write-Host "✓ SSH config file exists" -ForegroundColor Green
    Get-Content C:\Users\adyba\.ssh\config | Select-String -Pattern "adybag14" -Context 2,2
} else {
    Write-Host "✗ SSH config file not found" -ForegroundColor Red
}

Write-Host "`nDone! Check the results above." -ForegroundColor Yellow

