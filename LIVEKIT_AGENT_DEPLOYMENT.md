# 🚀 LiveKit Agent Deployment Guide

This guide explains how to keep the LiveKit agent running continuously on your production server.

## 📋 Prerequisites

- Python 3.8+ installed
- LiveKit agent dependencies installed (`pip install -r requirements.txt`)
- Environment variables configured (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GOOGLE_API_KEY)

## 🎯 Deployment Options

### Option 1: PM2 (Recommended for Linux/Mac)

PM2 is a process manager that keeps your agent running and automatically restarts it if it crashes.

#### Installation

```bash
# Install PM2 globally
npm install -g pm2

# Or using pip (if you prefer)
pip install pm2
```

#### Setup

1. **Update `ecosystem.config.js`** with your project path:
   ```javascript
   cwd: '/path/to/your/project',  // Change this to your actual path
   ```

2. **Start the agent:**
   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Save the PM2 configuration:**
   ```bash
   pm2 save
   ```

4. **Enable PM2 to start on system boot:**
   ```bash
   pm2 startup
   # Follow the instructions it prints
   ```

#### Useful PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs livekit-agent

# Restart agent
pm2 restart livekit-agent

# Stop agent
pm2 stop livekit-agent

# Delete agent from PM2
pm2 delete livekit-agent

# Monitor (CPU, memory)
pm2 monit
```

---

### Option 2: systemd Service (Linux)

systemd is the default service manager on most Linux distributions.

#### Setup

1. **Copy the service file:**
   ```bash
   sudo cp livekit-agent.service /etc/systemd/system/
   ```

2. **Edit the service file** with your actual paths:
   ```bash
   sudo nano /etc/systemd/system/livekit-agent.service
   ```
   
   Update these lines:
   - `WorkingDirectory=/path/to/your/project`
   - `ExecStart=/usr/bin/python3 /path/to/your/project/livekit_agent.py dev`
   - `User=www-data` (or your username)

3. **Reload systemd:**
   ```bash
   sudo systemctl daemon-reload
   ```

4. **Enable the service (start on boot):**
   ```bash
   sudo systemctl enable livekit-agent.service
   ```

5. **Start the service:**
   ```bash
   sudo systemctl start livekit-agent.service
   ```

#### Useful systemd Commands

```bash
# Check status
sudo systemctl status livekit-agent.service

# View logs
sudo journalctl -u livekit-agent.service -f

# Restart
sudo systemctl restart livekit-agent.service

# Stop
sudo systemctl stop livekit-agent.service

# Disable auto-start
sudo systemctl disable livekit-agent.service
```

---

### Option 3: Windows Service (Windows Server)

For Windows, you can use NSSM (Non-Sucking Service Manager) or Task Scheduler.

#### Using NSSM

1. **Download NSSM:** https://nssm.cc/download

2. **Install the service:**
   ```powershell
   nssm install LiveKitAgent
   ```

3. **Configure in the GUI:**
   - **Path:** `C:\Python39\python.exe` (or your Python path)
   - **Startup directory:** `C:\path\to\your\project`
   - **Arguments:** `livekit_agent.py dev`
   - **Environment:**
     - `LIVEKIT_URL=wss://gemini-integration-pxcg6ngt.livekit.cloud`
     - `LIVEKIT_API_KEY=API2L4oYScFxfvr`
     - `LIVEKIT_API_SECRET=vgdeTSniXEACMV4tLePmPEGw48HIEPL8xsxDKKlwJ8U`
     - `GOOGLE_API_KEY=GEMINI_API_KEY_2`

4. **Start the service:**
   ```powershell
   nssm start LiveKitAgent
   ```

#### Using Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: "When the computer starts"
4. Action: Start a program
   - Program: `python.exe`
   - Arguments: `livekit_agent.py dev`
   - Start in: `C:\path\to\your\project`
5. Check "Run whether user is logged on or not"

---

### Option 4: Docker Container

For containerized deployments.

#### Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY livekit_agent.py .

ENV LIVEKIT_URL=wss://gemini-integration-pxcg6ngt.livekit.cloud
ENV LIVEKIT_API_KEY=API2L4oYScFxfvr
ENV LIVEKIT_API_SECRET=vgdeTSniXEACMV4tLePmPEGw48HIEPL8xsxDKKlwJ8U
ENV GOOGLE_API_KEY=GEMINI_API_KEY_2

CMD ["python", "livekit_agent.py", "dev"]
```

#### Build and Run

```bash
# Build
docker build -t livekit-agent .

# Run
docker run -d --name livekit-agent --restart unless-stopped livekit-agent

# View logs
docker logs -f livekit-agent

# Stop
docker stop livekit-agent

# Start
docker start livekit-agent
```

---

### Option 5: Cloud Services

#### Railway.app

1. Connect your Git repository
2. Set root directory to project root
3. Set start command: `python livekit_agent.py dev`
4. Add environment variables in Railway dashboard
5. Deploy automatically

#### Heroku

1. Create `Procfile`:
   ```
   worker: python livekit_agent.py dev
   ```

2. Deploy:
   ```bash
   heroku create your-livekit-agent
   heroku config:set LIVEKIT_URL=wss://...
   heroku config:set LIVEKIT_API_KEY=...
   heroku config:set LIVEKIT_API_SECRET=...
   heroku config:set GOOGLE_API_KEY=...
   git push heroku main
   ```

#### Google Cloud Run

1. Create `Dockerfile` (see Option 4)
2. Build and deploy:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/livekit-agent
   gcloud run deploy livekit-agent \
     --image gcr.io/PROJECT_ID/livekit-agent \
     --platform managed \
     --set-env-vars LIVEKIT_URL=wss://...,LIVEKIT_API_KEY=...
   ```

---

## 🔍 Monitoring & Troubleshooting

### Check if Agent is Running

```bash
# PM2
pm2 status

# systemd
sudo systemctl status livekit-agent.service

# Docker
docker ps | grep livekit-agent

# Check process
ps aux | grep livekit_agent.py
```

### View Logs

```bash
# PM2
pm2 logs livekit-agent

# systemd
sudo journalctl -u livekit-agent.service -f

# Docker
docker logs -f livekit-agent

# Direct
tail -f logs/livekit-agent.log
```

### Common Issues

1. **Agent not connecting:**
   - Check environment variables are set correctly
   - Verify LiveKit credentials are valid
   - Check network connectivity to LiveKit server

2. **Agent crashes:**
   - Check logs for error messages
   - Verify Python dependencies are installed
   - Check system resources (memory, CPU)

3. **Agent stops after reboot:**
   - Ensure service is enabled: `pm2 startup` or `systemctl enable`
   - Check service status after reboot

---

## 📝 Quick Start Scripts

### Linux/Mac

```bash
chmod +x start-livekit-agent.sh
./start-livekit-agent.sh
```

### Windows

```powershell
.\start-livekit-agent.ps1
```

---

## 🔐 Security Notes

- **Never commit API keys to Git!** Use environment variables or secret management.
- Use `.env` files (not committed) or secure vaults (AWS Secrets Manager, HashiCorp Vault).
- Restrict file permissions on service files: `chmod 600 livekit-agent.service`

---

## 📚 Additional Resources

- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [systemd Service Tutorial](https://www.digitalocean.com/community/tutorials/how-to-use-systemctl-to-manage-systemd-services-and-units)

