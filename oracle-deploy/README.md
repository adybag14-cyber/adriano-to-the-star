# Starsector Oracle Cloud Deployment 🚀

Run Starsector in your browser from Oracle Cloud Free Tier.

## Quick Start

### 1. Create Oracle Cloud Account
Go to [cloud.oracle.com/free](https://cloud.oracle.com/free) and sign up.

### 2. Create VM Instance
- **Shape**: `VM.Standard.A1.Flex` (ARM - FREE!)
- **OCPUs**: 4
- **Memory**: 24 GB
- **Image**: Ubuntu 22.04

### 3. SSH to VM and Run Setup
```bash
scp -r oracle-deploy/* ubuntu@YOUR_VM_IP:~/starsector-server/
ssh ubuntu@YOUR_VM_IP
cd ~/starsector-server
chmod +x setup-starsector.sh
./setup-starsector.sh
```

### 4. Upload Starsector Game
```bash
# From your Windows PC:
scp -r "D:\starsector updated\Starsector" ubuntu@YOUR_VM_IP:~/starsector-server/starsector/
```

### 5. Launch!
```bash
docker compose up -d
```

### 6. Open Firewall
In Oracle Cloud Console: **Networking → Virtual Cloud Networks → Security List → Add Ingress Rule**
- Port: 8080
- Protocol: TCP

### 7. Play!
Open: `http://YOUR_VM_IP:8080/starsector`

**Login**: adriano / hashmenow1234

## Files

| File | Purpose |
|------|---------|
| `Dockerfile` | ARM64 container with Webswing + Java 17 |
| `docker-compose.yml` | Container orchestration |
| `webswing.config` | Game config with your login |
| `setup-starsector.sh` | VM setup script |

## Cost: $0/month 💰

Oracle Always Free includes everything you need!
