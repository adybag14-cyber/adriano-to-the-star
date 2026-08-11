# 🚀 Oracle Cloud Free Tier Kubernetes Setup Guide

**Date:** January 2025  
**Platform:** Oracle Cloud Infrastructure (OCI) Free Tier  
**Kubernetes:** k3s (Lightweight Kubernetes)  
**VM Type:** ARM-based Ampere A1 (24GB RAM)

---

## 📋 Prerequisites

1. **Oracle Cloud Account** (Free Tier)
   - Sign up at: https://cloud.oracle.com/
   - **Account Email:** adybag1@gmail.com
   - **Region:** UK London (uk-london-1) recommended for United Kingdom
   - Free Tier includes:
     - 2 Ampere A1 Compute instances (up to 4 OCPUs, 24GB RAM each)
     - 200GB block storage
     - 10TB egress per month

2. **SSH Client** (for Windows: PuTTY, WSL, or Git Bash)

3. **Basic Linux knowledge**

---

## 🎯 Step 1: Create ARM VM Instance

### 1.1 Login to Oracle Cloud Console
1. Go to: https://cloud.oracle.com/
2. Navigate to **Compute** → **Instances**

### 1.2 Create Instance
1. Click **Create Instance**
2. Configure:
   - **Name:** `k3s-master` (or your preferred name)
   - **Image:** Oracle Linux 8 or Ubuntu 22.04
   - **Shape:** **VM.Standard.A1.Flex**
     - **OCPUs:** 4 (maximum for free tier)
     - **Memory:** 24 GB
   - **Networking:** Use default VCN or create new
   - **SSH Keys:** Upload your public SSH key or generate new

### 1.3 Configure Security List
1. Go to **Networking** → **Virtual Cloud Networks**
2. Select your VCN → **Security Lists**
3. Add Ingress Rules:
   - **Source:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination Port Range:** `22` (SSH)
   - **Description:** SSH Access

4. Add Kubernetes Ports:
   - **Port 6443** (Kubernetes API)
   - **Port 10250** (Kubelet)
   - **Port 30000-32767** (NodePort Services)
   - **Port 80, 443** (HTTP/HTTPS)

### 1.4 Launch Instance
1. Review configuration
2. Click **Create**
3. Wait for instance to be **Running** (green status)
4. Note the **Public IP Address**

---

## 🔧 Step 2: Connect to VM

### 2.1 SSH Connection
```bash
# Replace with your public IP
ssh opc@<YOUR_PUBLIC_IP>

# Or if using Oracle Linux with different user:
ssh opc@<YOUR_PUBLIC_IP>
```

### 2.2 Update System
```bash
# For Oracle Linux
sudo dnf update -y

# For Ubuntu
sudo apt update && sudo apt upgrade -y
```

---

## 🐳 Step 3: Install k3s

### 3.1 Install k3s (Master Node)
```bash
# Install k3s server (master)
curl -sfL https://get.k3s.io | sh -

# Check status
sudo systemctl status k3s

# Get kubeconfig
sudo cat /etc/rancher/k3s/k3s.yaml
```

### 3.2 Configure k3s for External Access
```bash
# Edit k3s service
sudo nano /etc/systemd/system/k3s.service

# Add these flags to ExecStart:
# --tls-san <YOUR_PUBLIC_IP>
# --bind-address 0.0.0.0
# --advertise-address <YOUR_PUBLIC_IP>

# Example:
# ExecStart=/usr/local/bin/k3s server --tls-san 123.456.789.0 --bind-address 0.0.0.0 --advertise-address 123.456.789.0

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart k3s
```

### 3.3 Get Node Token (for adding worker nodes)
```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

### 3.4 Install kubectl (Optional - on local machine)
```bash
# Download kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl"

# Make executable
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify
kubectl version --client
```

---

## 📝 Step 4: Configure Local kubectl

### 4.1 Download kubeconfig
```bash
# On your local machine, create .kube directory
mkdir -p ~/.kube

# Copy kubeconfig from server (replace IP and user)
scp opc@<YOUR_PUBLIC_IP>:/etc/rancher/k3s/k3s.yaml ~/.kube/config

# Edit config to replace localhost with public IP
nano ~/.kube/config
# Change: server: https://127.0.0.1:6443
# To: server: https://<YOUR_PUBLIC_IP>:6443
```

### 4.2 Test Connection
```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

---

## 🎨 Step 5: Install Additional Tools

### 5.1 Install Helm (Package Manager)
```bash
# On the VM
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
```

### 5.2 Install Docker (if needed)
```bash
# For Oracle Linux
sudo dnf install docker -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker opc

# For Ubuntu
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
```

---

## 🌐 Step 6: Deploy Sample Application

### 6.1 Create Namespace
```bash
kubectl create namespace stellar-ai
```

### 6.2 Deploy Nginx (Test)
```bash
kubectl create deployment nginx --image=nginx -n stellar-ai
kubectl expose deployment nginx --port=80 --type=NodePort -n stellar-ai

# Get service URL
kubectl get svc -n stellar-ai
# Access via: http://<YOUR_PUBLIC_IP>:<NODEPORT>
```

---

## 🔒 Step 7: Security Hardening

### 7.1 Firewall Configuration
```bash
# Install firewalld
sudo dnf install firewalld -y  # Oracle Linux
# OR
sudo apt install ufw -y  # Ubuntu

# Allow Kubernetes ports
sudo firewall-cmd --permanent --add-port=6443/tcp
sudo firewall-cmd --permanent --add-port=10250/tcp
sudo firewall-cmd --permanent --add-port=30000-32767/tcp
sudo firewall-cmd --reload
```

### 7.2 Disable Swap
```bash
# Check swap
sudo swapon --show

# Disable swap
sudo swapoff -a

# Make permanent (edit /etc/fstab and comment out swap line)
sudo nano /etc/fstab
```

### 7.3 Configure IP Forwarding
```bash
# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 📊 Step 8: Monitoring & Management

### 8.1 Install Kubernetes Dashboard (Optional)
```bash
# Deploy dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Create admin user
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF

# Get token
kubectl -n kubernetes-dashboard create token admin-user
```

### 8.2 Access Dashboard
```bash
# Port forward
kubectl port-forward -n kubernetes-dashboard service/kubernetes-dashboard 8443:443

# Access: https://localhost:8443
```

---

## 🚀 Step 9: Deploy Your Application

### 9.1 Create Deployment YAML
See `k8s-deployment-example.yaml` for example deployment.

### 9.2 Deploy
```bash
kubectl apply -f k8s-deployment-example.yaml
```

---

## 📝 Useful Commands

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes
kubectl get pods --all-namespaces

# View logs
kubectl logs <pod-name> -n <namespace>

# Describe resources
kubectl describe pod <pod-name> -n <namespace>

# Delete resources
kubectl delete deployment <name> -n <namespace>
kubectl delete service <name> -n <namespace>

# Scale deployment
kubectl scale deployment <name> --replicas=3 -n <namespace>
```

---

## 🔧 Troubleshooting

### Issue: Cannot connect to cluster
- Check security list rules in OCI
- Verify k3s is running: `sudo systemctl status k3s`
- Check firewall rules

### Issue: Pods not starting
- Check node resources: `kubectl describe node`
- Check pod events: `kubectl describe pod <pod-name>`
- Check logs: `kubectl logs <pod-name>`

### Issue: Services not accessible
- Verify NodePort range (30000-32767)
- Check security list ingress rules
- Verify service type: `kubectl get svc`

---

## 📚 Additional Resources

- **k3s Documentation:** https://k3s.io/
- **Kubernetes Documentation:** https://kubernetes.io/docs/
- **Oracle Cloud Documentation:** https://docs.oracle.com/en-us/iaas/
- **Helm Charts:** https://artifacthub.io/

---

## ✅ Verification Checklist

- [ ] VM instance created and running
- [ ] SSH access working
- [ ] k3s installed and running
- [ ] kubectl configured locally
- [ ] Can access cluster: `kubectl get nodes`
- [ ] Security list configured
- [ ] Firewall configured
- [ ] Sample application deployed
- [ ] Services accessible via NodePort

---

**Made with 🌌 by Adriano To The Star - I.T.A**

