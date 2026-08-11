$wshell = New-Object -ComObject WScript.Shell;
Write-Host "Auto-Enter script started. Pressing Enter every 30 seconds. Press Ctrl+C to stop."
while($true) {
    $wshell.SendKeys('{ENTER}');
    Start-Sleep -Seconds 30;
}