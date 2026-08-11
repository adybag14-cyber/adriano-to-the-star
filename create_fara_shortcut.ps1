# Create Desktop Shortcut for Fara 7B (Computer Agent)
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutFile = "$DesktopPath\Fara Agent (Qwen 7B).lnk"
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutFile)

# Path to the agent script (using current directory)
$AgentScript = "$PWD\fara_agent.py"

# Target: PowerShell
$Shortcut.TargetPath = "powershell.exe"

# Arguments: 
# 1. Set OLLAMA_MODELS to D:\fara7b
# 2. Check if Ollama is running, start if not
# 3. Run the Python agent script
$Command = "& { 
    `$env:OLLAMA_MODELS='D:\fara7b'; 
    if (-not (Get-Process ollama -ErrorAction SilentlyContinue)) { 
        Write-Host '🚀 Starting Ollama...'; 
        Start-Process ollama serve -WindowStyle Hidden; 
        Start-Sleep -Seconds 5 
    }; 
    Write-Host '🤖 Launching Fara Agent (Qwen 2.5 VL 7B)...';
    python '$AgentScript' 
}"

# Collapse command to single line for shortcut
$Shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -Command ""$Command"""

# Icon
$Shortcut.IconLocation = "shell32.dll,269" # Console icon

$Shortcut.Description = "Run Fara Agent (Powered by Qwen 2.5 VL 32B)"
$Shortcut.WorkingDirectory = "$PWD"
$Shortcut.Save()

Write-Host "✅ Shortcut updated on Desktop: $ShortcutFile"
Write-Host "    Target Script: $AgentScript"
