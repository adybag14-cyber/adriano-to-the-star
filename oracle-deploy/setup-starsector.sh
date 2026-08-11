#!/bin/bash
# Starsector Oracle Cloud Setup Script
# Run this on your Oracle Cloud VM

set -e

echo "=========================================="
echo "  Starsector Oracle Cloud Setup"
echo "=========================================="

# Update system
echo "[1/5] Updating system..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
echo "[2/5] Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "[3/5] Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin

# Create project directory
echo "[4/5] Setting up project directory..."
mkdir -p ~/starsector-server
cd ~/starsector-server

# Download deployment files from your repository
echo "[5/5] Downloading configuration files..."
# You'll need to copy your files here or clone from git

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Copy your Starsector game files to: ~/starsector-server/starsector/"
echo "2. Run: docker compose up -d"
echo "3. Access: http://YOUR_VM_IP:8080/starsector"
echo ""
echo "Open firewall port 8080:"
echo "  sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT"
echo ""
echo "Login credentials:"
echo "  Username: adriano"
echo "  Password: hashmenow1234"
echo ""
