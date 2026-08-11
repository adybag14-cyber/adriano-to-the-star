# Fix PowerShell Execution Policy Error

## Quick Fix Options

### Option 1: Use the Batch File (Easiest) ✅
Just double-click or run:
```bash
start-server.bat
```

### Option 2: Bypass Policy for Current Session
Run this command in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
npm run start-stellar-ai
```

### Option 3: Use the PowerShell Script
Run:
```powershell
.\start-server.ps1
```

### Option 4: Use Command Prompt (CMD) Instead
1. Open Command Prompt (not PowerShell)
2. Navigate to backend folder
3. Run: `npm run start-stellar-ai`

### Option 5: Change Execution Policy Permanently (Requires Admin)
Run PowerShell as Administrator, then:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Recommended: Use the Batch File

The easiest solution is to use `start-server.bat`:
- Double-click it, OR
- Run: `.\start-server.bat` in any terminal

This bypasses PowerShell entirely and uses CMD instead.

