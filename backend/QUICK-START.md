# Quick Start Guide - After Installing Node.js

## ⚠️ Important: Restart PowerShell

After installing Node.js and adding it to PATH, you **must restart PowerShell** for the changes to take effect.

1. **Close this PowerShell window**
2. **Open a new PowerShell window**
3. **Navigate to the project:**
   ```powershell
   cd C:\Users\adyba\Documents\adrianostar-website
   ```

## Verify Node.js is Working

```powershell
node --version
npm --version
```

If these commands work, proceed to installation!

## Install Packages

```powershell
cd backend
npm install
npm install @google-cloud/aiplatform --save
```

## Configure .env File

Edit `backend\.env` and add your API key:

```env
GEMINI_API_KEY=your-actual-api-key-here
```

## Start the Server

```powershell
node stellar-ai-server.js
```

## If Node.js Still Not Found

If Node.js is still not recognized after restarting PowerShell:

1. **Find where Node.js is installed:**
   - Usually: `C:\Program Files\nodejs`
   - Or: `C:\Program Files (x86)\nodejs`
   - Or: `%LOCALAPPDATA%\Programs\nodejs`

2. **Verify the installation:**
   - Check if `node.exe` exists in that folder
   - Check if `npm.cmd` exists in that folder

3. **Add to PATH manually:**
   - Open System Properties → Environment Variables
   - Add Node.js folder to User PATH or System PATH
   - Restart PowerShell again

4. **Or use full path temporarily:**
   ```powershell
   & "C:\Program Files\nodejs\npm.cmd" install
   ```

## Troubleshooting

### "node is not recognized"
- Restart PowerShell after adding to PATH
- Verify Node.js is actually installed
- Check PATH includes Node.js directory

### "npm is not recognized"
- npm comes with Node.js
- If missing, reinstall Node.js

### Package installation fails
- Check internet connection
- Try: `npm install --verbose`
- Clear cache: `npm cache clean --force`

