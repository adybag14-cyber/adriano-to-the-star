#!/bin/bash

# Script to add a worker node to existing k3s cluster
# Run this on the worker node VM

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Adding Worker Node to k3s Cluster${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗${NC} Please run as root or with sudo"
    exit 1
fi

# Get master IP and token
read -p "Enter Master Node IP: " MASTER_IP
read -p "Enter Node Token (from master): " NODE_TOKEN

if [ -z "$MASTER_IP" ] || [ -z "$NODE_TOKEN" ]; then
    echo -e "${RED}✗${NC} Master IP and Node Token are required"
    exit 1
fi

# Disable swap
echo -e "${YELLOW}🔄 Disabling swap...${NC}"
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Enable IP forwarding
echo -e "${YELLOW}🌐 Enabling IP forwarding...${NC}"
echo 'net.ipv4.ip_forward=1' | tee -a /etc/sysctl.conf
sysctl -p

# Install k3s agent
echo -e "${YELLOW}🐳 Installing k3s agent...${NC}"
curl -sfL https://get.k3s.io | K3S_URL=https://${MASTER_IP}:6443 K3S_TOKEN=${NODE_TOKEN} sh -

# Wait for agent to start
echo -e "${YELLOW}⏳ Waiting for k3s agent to start...${NC}"
sleep 10

# Check status
if systemctl is-active --quiet k3s-agent; then
    echo -e "${GREEN}✓${NC} Worker node added successfully!"
    echo -e "${GREEN}✓${NC} Check status on master: kubectl get nodes"
else
    echo -e "${RED}✗${NC} Failed to start k3s agent. Check logs: journalctl -u k3s-agent"
    exit 1
fi

echo -e "\n${GREEN}✅ Worker Node Setup Complete!${NC}"

