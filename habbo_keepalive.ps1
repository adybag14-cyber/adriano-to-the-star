Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName System.Windows.Forms

$windowTitle = "Habbo COM" # Partial match

Write-Host "Starting Habbo Anti-AFK script (Every 120 seconds)..."
Write-Host "Targeting window: $windowTitle"

while ($true) {
    try {
        $process = Get-Process | Where-Object { $_.MainWindowTitle -like "*$windowTitle*" } | Select-Object -First 1
        
        if ($process) {
            $wshell = New-Object -ComObject WScript.Shell
            $wshell.AppActivate($process.Id)
            Start-Sleep -Milliseconds 500
            
            # Type two spaces and Enter
            [System.Windows.Forms.SendKeys]::SendWait("  ")
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
            
            Write-Host "Sent anti-AFK keys at $(Get-Date)"
        } else {
            Write-Host "Warning: Habbo window not found."
        }
    } catch {
        Write-Host "Error occurred: $($_.Exception.Message)"
    }
    
    Start-Sleep -Seconds 120
}
