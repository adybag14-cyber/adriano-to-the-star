#!/bin/bash
# Stellar AI CLI - Quick Start Script for Linux/Mac
# This script checks setup and starts the CLI

echo ""
echo "========================================"
echo "  Stellar AI CLI - Starting..."
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[WARNING] Dependencies not installed!"
    echo ""
    echo "Running automatic setup..."
    echo ""
    chmod +x setup.sh
    ./setup.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo "Setup failed. Please run ./setup.sh manually."
        exit 1
    fi
    echo ""
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Start the CLI
echo "Starting Stellar AI CLI..."
echo ""
node index.js

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to start Stellar AI CLI!"
    echo ""
    exit 1
fi

