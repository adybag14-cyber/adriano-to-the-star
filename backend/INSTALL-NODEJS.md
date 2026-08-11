# Installing Node.js - Step by Step Guide

## Node.js Not Found

Node.js doesn't appear to be installed on your system. Follow these steps:

## Method 1: Official Installer (Recommended)

### Step 1: Download Node.js
1. Go to: **https://nodejs.org/**
2. Download the **LTS (Long Term Support)** version
3. Choose the **Windows Installer (.msi)** for your system (64-bit or 32-bit)

### Step 2: Install Node.js
1. Run the downloaded `.msi` file
2. **IMPORTANT**: During installation, make sure to check:
   - ✅ **"Add to PATH"** option (should be checked by default)
   - ✅ **"npm package manager"** (included automatically)
3. Click "Next" through the installation
4. Click "Install" (may require administrator privileges)
5. Wait for installation to complete
6. Click "Finish"

### Step 3: Verify Installation
1. **Close and reopen PowerShell** (important!)
2. Open a new PowerShell window
3. Run these commands:
   ```powershell
   node --version
   npm --version
   ```
4. You should see version numbers (e.g., `v20.10.0` and `10.2.3`)

## Method 2: Using Chocolatey (If you have it)

If you have Chocolatey package manager installed:

```powershell
choco install nodejs
```

Then restart PowerShell and verify:
```powershell
node --version
npm --version
```

## Method 3: Using Winget (Windows 11/10)

If you have Windows Package Manager (winget):

```powershell
winget install OpenJS.NodeJS.LTS
```

Then restart PowerShell and verify:
```powershell
node --version
npm --version
```

## Troubleshooting

### "node is not recognized" after installation

1. **Restart PowerShell** - PATH changes require a new session
2. **Verify PATH was added:**
   ```powershell
   [Environment]::GetEnvironmentVariable('Path', 'User') -split ';' | Where-Object { $_ -like '*node*' }
   ```
3. **If not in PATH, add manually:**
   - Open System Properties → Environment Variables
   - Find Node.js installation (usually `C:\Program Files\nodejs`)
   - Add to User PATH or System PATH
   - Restart PowerShell

### Find Node.js Installation Location

If Node.js is installed but not in PATH, find it:

```powershell
# Check common locations
Get-ChildItem "C:\Program Files\nodejs\node.exe" -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files (x86)\nodejs\node.exe" -ErrorAction SilentlyContinue
Get-ChildItem "$env:LOCALAPPDATA\Programs\nodejs\node.exe" -ErrorAction SilentlyContinue
```

### Use Full Path Temporarily

If Node.js is installed but not in PATH, you can use the full path:

```powershell
# Replace with your actual Node.js path
& "C:\Program Files\nodejs\npm.cmd" install
```

## After Installation

Once Node.js is installed and working:

1. **Navigate to backend:**
   ```powershell
   cd C:\Users\adyba\Documents\adrianostar-website\backend
   ```

2. **Install packages:**
   ```powershell
   npm install
   npm install @google-cloud/aiplatform --save
   ```

3. **Configure .env:**
   - Edit `backend\.env`
   - Add your `GEMINI_API_KEY`

4. **Start server:**
   ```powershell
   node stellar-ai-server.js
   ```

## Quick Download Links

- **Node.js LTS (Recommended)**: https://nodejs.org/en/download/
- **Direct Windows 64-bit Installer**: https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi
- **Direct Windows 32-bit Installer**: https://nodejs.org/dist/v20.10.0/node-v20.10.0-x86.msi

## Verification Checklist

After installation, verify everything works:

- [ ] `node --version` shows a version number
- [ ] `npm --version` shows a version number
- [ ] Can run `npm install` in backend directory
- [ ] Packages install successfully

If all checkboxes are checked, you're ready to proceed with the setup!

