$DesktopPath = [Environment]::GetFolderPath("Desktop")
$OldShortcut = "$DesktopPath\Fara 7B Agent.lnk"

if (Test-Path $OldShortcut) {
    Remove-Item $OldShortcut -Force
    Write-Host "🗑️  Removed old shortcut: $OldShortcut"
}
else {
    Write-Host "⚠️  Old shortcut not found."
}
