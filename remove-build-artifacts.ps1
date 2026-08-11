# PowerShell script to remove build artifacts from public directory

$patterns = @("*.md", "*.zip", "*.txt", "*.sh", "*.py", "*.ps1", "*.yaml", "*.yml", "package-lock.json")
$removed = 0

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path public -Recurse -Include $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $files | Remove-Item -Force -ErrorAction SilentlyContinue
        $removed += $files.Count
    }
}

Write-Host "Removed $removed build artifact files"

