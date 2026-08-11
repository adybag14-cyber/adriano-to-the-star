# PowerShell script to copy files to public directory

param(
    [string]$FileType = "html"
)

try {
    $files = Get-ChildItem -Filter "*.$FileType" -ErrorAction SilentlyContinue
    if ($files) {
        $count = ($files | Copy-Item -Destination public/ -ErrorAction SilentlyContinue -Force).Count
        Write-Host "Copied $count $FileType files"
    } else {
        Write-Host "No $FileType files found"
    }
} catch {
    Write-Host "Warning copying $FileType files: $_"
}

