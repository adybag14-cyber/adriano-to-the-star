# 🚀 Quick Start Guide - Oracle Cloud Kubernetes Setup

**User:** Tdamre Steve  
**Email:** adybag1@gmail.com  
**Country:** United Kingdom  
**Region:** UK London (uk-london-1)

---

## ⚡ Fast Setup (5 Steps)

### Step 1: Create Oracle Cloud Account
1. Go to: https://cloud.oracle.com/
2. Sign up with: **adybag1@gmail.com**
3. Select region: **UK London (uk-london-1)**
4. Complete verification

### Step 2: Create VM Instance
1. Login to Oracle Cloud Console
2. Navigate to **Compute** → **Instances**
3. Click **Create Instance**
4. Configure:
   - **Name:** `k3s-master`
   - **Image:** Oracle Linux 8 (ARM)
   - **Shape:** `VM.Standard.A1.Flex`
     - **OCPUs:** 4
     - **Memory:** 24 GB
   - **Region:** UK London
   - **SSH Keys:** Upload your public key
5. Click **Create**

### Step 3: Configure Security List
1. Go to **Networking** → **Virtual Cloud Networks**
2. Select your VCN → **Security Lists** → **Default Security List**
3. Click **Add Ingress Rules**
4. Add these rules:

| Source | Protocol | Port | Description |
|-------|----------|------|-------------|
| 0.0.0.0/0 | TCP | 22 | SSH |
| 0.0.0.0/0 | TCP | 6443 | Kubernetes API |
| 0.0.0.0/0 | TCP | 10250 | Kubelet |
| 0.0.0.0/0 | TCP | 30000-32767 | NodePort Services |
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |

### Step 4: Install k3s
1. SSH into your VM:
   ```bash
   ssh opc@<YOUR_PUBLIC_IP>
   ```

2. Run installation script:
   ```bash
   curl -O https://raw.githubusercontent.com/your-repo/install-k3s.sh
   chmod +x install-k3s.sh
   sudo ./install-k3s.sh
   ```

3. Save the **Node Token** displayed at the end

### Step 5: Configure Local kubectl
1. On your local machine, download kubeconfig:
   ```bash
   scp opc@<YOUR_PUBLIC_IP>:/etc/rancher/k3s/k3s.yaml ~/.kube/config
   ```

2. Edit the config file:
   ```bash
   nano ~/.kube/config
   # Replace: server: https://127.0.0.1:6443
   # With: server: https://<YOUR_PUBLIC_IP>:6443
   ```

3. Test connection:
   ```bash
   kubectl get nodes
   kubectl get pods --all-namespaces
   ```

---

## ✅ Verification

Run these commands to verify everything works:

```bash
# Check cluster
kubectl cluster-info

# Check nodes
kubectl get nodes

# Deploy test app
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=NodePort

# Get service URL
kubectl get svc nginx
# Access: http://<YOUR_PUBLIC_IP>:<NODEPORT>
```

---

## 📚 Next Steps

- Deploy your applications using `k8s-deployment-example.yaml`
- Set up monitoring and logging
- Configure ingress controller
- Set up CI/CD pipeline

---

## 🆘 Troubleshooting

**Can't connect to cluster?**
- Check Security List rules in OCI
- Verify k3s is running: `sudo systemctl status k3s`
- Check firewall: `sudo firewall-cmd --list-all`

**Pods not starting?**
- Check resources: `kubectl describe node`
- Check pod events: `kubectl describe pod <pod-name>`

**Need help?**
- Check full guide: `KUBERNETES-ORACLE-CLOUD-SETUP.md`
- k3s docs: https://k3s.io/
- Oracle Cloud docs: https://docs.oracle.com/en-us/iaas/

---

**Made with 🌌 by Adriano To The Star - I.T.A**

