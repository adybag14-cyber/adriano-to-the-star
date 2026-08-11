#!/bin/bash

# k3s Installation Script for Oracle Cloud ARM VM
# This script installs and configures k3s on Oracle Cloud Free Tier

set -e

echo "🚀 Starting k3s Installation on Oracle Cloud ARM VM..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
echo -e "${GREEN}✓${NC} Detected Public IP: $PUBLIC_IP"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
if [ -f /etc/oracle-release ]; then
    # Oracle Linux
    sudo dnf update -y
    sudo dnf install -y curl wget git
elif [ -f /etc/lsb-release ]; then
    # Ubuntu/Debian
    sudo apt update -y
    sudo apt upgrade -y
    sudo apt install -y curl wget git
fi

# Disable swap
echo -e "${YELLOW}🔄 Disabling swap...${NC}"
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Enable IP forwarding
echo -e "${YELLOW}🌐 Enabling IP forwarding...${NC}"
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
echo 'net.bridge.bridge-nf-call-iptables=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Install k3s
echo -e "${YELLOW}🐳 Installing k3s...${NC}"
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--tls-san $PUBLIC_IP --bind-address 0.0.0.0 --advertise-address $PUBLIC_IP" sh -

# Wait for k3s to be ready
echo -e "${YELLOW}⏳ Waiting for k3s to start...${NC}"
sleep 10

# Check k3s status
if sudo systemctl is-active --quiet k3s; then
    echo -e "${GREEN}✓${NC} k3s is running!"
else
    echo -e "${RED}✗${NC} k3s failed to start. Check logs: sudo journalctl -u k3s"
    exit 1
fi

# Get node token
NODE_TOKEN=$(sudo cat /var/lib/rancher/k3s/server/node-token)
echo -e "${GREEN}✓${NC} Node Token: $NODE_TOKEN"
echo -e "${YELLOW}💾 Save this token for adding worker nodes!${NC}"

# Install kubectl
echo -e "${YELLOW}📥 Installing kubectl...${NC}"
KUBECTL_VERSION=$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)
curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/arm64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify kubectl
kubectl version --client

# Configure firewall (if firewalld is installed)
if command -v firewall-cmd &> /dev/null; then
    echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
    sudo firewall-cmd --permanent --add-port=6443/tcp
    sudo firewall-cmd --permanent --add-port=10250/tcp
    sudo firewall-cmd --permanent --add-port=30000-32767/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✓${NC} Firewall configured"
fi

# Display cluster info
echo -e "\n${GREEN}✅ k3s Installation Complete!${NC}\n"
echo -e "${YELLOW}📋 Cluster Information:${NC}"
echo -e "  Public IP: $PUBLIC_IP"
echo -e "  API Server: https://$PUBLIC_IP:6443"
echo -e "  Node Token: $NODE_TOKEN"
echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo -e "  1. Download kubeconfig:"
echo -e "     scp opc@$PUBLIC_IP:/etc/rancher/k3s/k3s.yaml ~/.kube/config"
echo -e "  2. Edit ~/.kube/config and replace '127.0.0.1' with '$PUBLIC_IP'"
echo -e "  3. Test connection: kubectl get nodes"
echo -e "\n${YELLOW}🔐 Security Note:${NC}"
echo -e "  Make sure to configure OCI Security List to allow:"
echo -e "  - Port 6443 (Kubernetes API)"
echo -e "  - Port 10250 (Kubelet)"
echo -e "  - Ports 30000-32767 (NodePort Services)"

# Show current nodes
echo -e "\n${YELLOW}📊 Current Cluster Status:${NC}"
kubectl get nodes
kubectl get pods --all-namespaces

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"

