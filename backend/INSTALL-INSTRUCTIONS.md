# Installation Instructions

## Quick Start

Since Node.js may not be in your PATH, here are the steps to complete setup:

### Option 1: Use Batch Files (Easiest)

1. **Run the complete setup:**
   ```cmd
   cd backend
   complete-setup.bat
   ```

   Or run individually:
   ```cmd
   setup-nodejs-path.bat
   setup-google-cloud.bat
   ```

### Option 2: Manual Installation

1. **Install Node.js** (if not installed):
   - Download from: https://nodejs.org/
   - Install Node.js (includes npm)
   - Restart your terminal after installation

2. **Add Node.js to PATH** (if not automatically added):
   - Find Node.js installation (usually `C:\Program Files\nodejs`)
   - Add to System PATH or User PATH
   - Restart terminal

3. **Install packages:**
   ```cmd
   cd backend
   npm install
   ```

4. **Install Google Cloud package:**
   ```cmd
   npm install @google-cloud/aiplatform --save
   ```

5. **Configure .env file:**
   - Edit `backend\.env`
   - Add your `GEMINI_API_KEY`
   - (Optional) Add Google Cloud configuration

### Option 3: Direct Commands (If Node.js is in PATH)

```powershell
# Navigate to backend
cd backend

# Install all packages
npm install

# Verify Google Cloud package
npm list @google-cloud/aiplatform

# If not installed, install it
npm install @google-cloud/aiplatform --save
```

## Verify Installation

After installation, verify:

```powershell
# Check Node.js
node --version

# Check npm
npm --version

# Check if packages are installed
cd backend
Test-Path node_modules\@google-cloud\aiplatform
```

## Troubleshooting

### "node is not recognized"
- Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Or add Node.js to PATH manually

### "npm is not recognized"
- npm comes with Node.js
- Reinstall Node.js if npm is missing

### Package installation fails
- Check internet connection
- Try: `npm install --verbose` for detailed output
- Clear npm cache: `npm cache clean --force`

### PowerShell script execution disabled
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Or use the `.bat` files instead

## Next Steps

After installation:
1. Edit `backend\.env` and add your `GEMINI_API_KEY`
2. (Optional) Configure Google Cloud
3. Start server: `node backend/stellar-ai-server.js`

