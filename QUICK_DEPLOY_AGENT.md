# ⚡ Quick Deploy LiveKit Agent

## 🚀 Fastest Way: PM2 (Recommended)

```bash
# 1. Install PM2
npm install -g pm2

# 2. Edit ecosystem.config.js - update the path
nano ecosystem.config.js

# 3. Start agent
pm2 start ecosystem.config.js

# 4. Save and enable auto-start
pm2 save
pm2 startup
# Follow the instructions it prints
```

**Done!** Your agent will now:
- ✅ Run continuously
- ✅ Auto-restart if it crashes
- ✅ Start automatically on server reboot

---

## 🔍 Check Status

```bash
pm2 status
pm2 logs livekit-agent
```

---

## 🛑 Stop/Restart

```bash
pm2 restart livekit-agent
pm2 stop livekit-agent
```

---

## 📋 Alternative: systemd (Linux)

```bash
# 1. Edit the service file with your paths
sudo nano livekit-agent.service

# 2. Copy to systemd
sudo cp livekit-agent.service /etc/systemd/system/

# 3. Enable and start
sudo systemctl daemon-reload
sudo systemctl enable livekit-agent.service
sudo systemctl start livekit-agent.service

# Check status
sudo systemctl status livekit-agent.service
```

---

## 🪟 Windows: Use NSSM

1. Download: https://nssm.cc/download
2. Run: `nssm install LiveKitAgent`
3. Configure in GUI (see LIVEKIT_AGENT_DEPLOYMENT.md)
4. Start: `nssm start LiveKitAgent`

---

## ❓ Need Help?

See `LIVEKIT_AGENT_DEPLOYMENT.md` for detailed instructions.

