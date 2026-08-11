#!/bin/bash
# Stellar AI CLI - Automatic Setup Script for Linux/Mac
# This script automatically sets up the CLI environment

echo ""
echo "========================================"
echo "  Stellar AI CLI - Automatic Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Minimum version required: 14.0.0"
    echo ""
    exit 1
fi

# Check Node.js version
echo "[1/4] Checking Node.js installation..."
NODE_VERSION=$(node --version)
echo "       Found Node.js: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed!"
    echo ""
    echo "npm should come with Node.js. Please reinstall Node.js."
    echo ""
    exit 1
fi

echo "[2/4] Checking npm installation..."
NPM_VERSION=$(npm --version)
echo "       Found npm: $NPM_VERSION"
echo ""

# Install dependencies
echo "[3/4] Installing dependencies..."
echo "       This may take a few minutes..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to install dependencies!"
    echo "       Please check your internet connection and try again."
    echo ""
    exit 1
fi

echo ""
echo "[4/4] Checking Python for LiveKit Voice Agent (optional)..."
if command -v python3 &> /dev/null || command -v python &> /dev/null; then
    echo "       Python found! LiveKit Voice Agent is available."
    echo "       To install Python dependencies, run: pip install -r requirements.txt"
    echo "       To set up environment, run: source setup_env.sh"
else
    echo "       Python not found. LiveKit Voice Agent will not be available."
    echo "       Install Python 3.8+ from: https://www.python.org/"
fi

echo ""
echo "========================================"
echo "  Setup Successful!"
echo "========================================"
echo ""
echo "You can now start Stellar AI CLI by running:"
echo ""
echo "   ./start.sh"
echo ""
echo "Or manually:"
echo ""
echo "   node index.js"
echo ""
echo "For LiveKit Voice Agent (if Python is installed):"
echo "   python livekit_agent.py console"
echo ""
echo "========================================"
echo ""

