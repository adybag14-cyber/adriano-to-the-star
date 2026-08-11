# 🚀 Stellar AI CLI - All-in-One Package

This is an **all-in-one package** that automatically sets up everything you need to run Stellar AI CLI.

## ✨ Automatic Setup

### Windows Users

1. **Extract the ZIP file** to any folder
2. **Double-click `setup.bat`** - This will automatically:
   - Check for Node.js installation
   - Install all required dependencies
   - Set up the environment
3. **Double-click `start.bat`** to launch Stellar AI CLI

### Linux/Mac Users

1. **Extract the ZIP file** to any folder
2. **Open terminal** in the extracted folder
3. **Run:**
   ```bash
   chmod +x setup.sh start.sh
   ./setup.sh
   ```
   This will automatically:
   - Check for Node.js installation
   - Install all required dependencies
   - Set up the environment
4. **Run:**
   ```bash
   ./start.sh
   ```
   to launch Stellar AI CLI

## 📋 Requirements

- **Node.js 14.0.0 or higher** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Internet connection** (for first-time setup)

## 🎯 Quick Start

### Option 1: Automatic (Recommended)

**Windows:**
```
1. Double-click setup.bat
2. Wait for setup to complete
3. Double-click start.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

### Option 2: Manual

```bash
npm install
node index.js
```

## 🔐 First-Time Authentication

When you first run Stellar AI CLI, you'll need to authenticate with Puter.js:

1. Type `/login` in the CLI
2. A browser window will open
3. Complete the authentication
4. Your token will be saved automatically

## 📖 Usage

Once started, you can:

- **Chat with AI** - Just type your message and press Enter
- **Use file paths** - Include file paths in your messages
- **Change models** - Type `/model sonnet-4.5` to switch models
- **Get help** - Type `/help` to see all commands

## 🛠️ Troubleshooting

### "Node.js not found"

- Install Node.js from https://nodejs.org/
- Make sure to restart your terminal/command prompt after installation

### "Dependencies failed to install"

- Check your internet connection
- Try running `npm install` manually
- Make sure you have write permissions in the folder

### "Permission denied" (Linux/Mac)

- Run: `chmod +x setup.sh start.sh`
- Or use: `bash setup.sh` and `bash start.sh`

## 📁 What's Included

- `index.js` - Main CLI application
- `package.json` - Dependencies and configuration
- `setup.bat` / `setup.sh` - Automatic setup scripts
- `start.bat` / `start.sh` - Quick start scripts
- `README.md` - Full documentation
- `SETUP.md` - Detailed setup guide

## 🎉 That's It!

The package is designed to be **plug-and-play**. Just extract, run setup, and start using!

---

**Need help?** Check the README.md for detailed documentation.

