# Calculate and display public directory size
$result = Get-ChildItem -Path public -Recurse | Measure-Object -Property Length -Sum
$sizeMB = [math]::Round($result.Sum / 1MB, 2)
Write-Host "Public directory size: $sizeMB MB"

