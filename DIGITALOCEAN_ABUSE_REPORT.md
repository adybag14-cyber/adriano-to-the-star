# DIGITALOCEAN ABUSE REPORT

**To:** abuse@digitalocean.com
**Subject:** Abuse Report: Targeted Credential Fishing from IP 206.189.151.177

---

**Message Body (Copy below this line):**

Hello DigitalOcean Abuse Team,

I am reporting malicious activity originating from your network (IP: 206.189.151.177).

Nature of Abuse: Credential Fishing / Unauthorized Probing
Target: adrianotothestar.com
Timeframe: 2026-01-10 05:19:57 to 05:20:07 UTC

Description:
The source IP performed a targeted scan for sensitive SFTP configuration files, specifically /sftp-config.json (Sublime Text) and /.vscode/sftp.json (VS Code). These files typically contain plain-text server credentials. This is a high-signal indicator of a malicious actor seeking unauthorized access to the target server.

Logs:
1546 /sftp-config.json 206.189.151.177 GET 2026-01-10 05:19:57 404
1547 /.vscode/sftp.json 206.189.151.177 GET 2026-01-10 05:20:07 404

This activity is a clear violation of DigitalOcean's Acceptable Use Policy regarding malicious network activity. Please investigate the droplet associated with this IP and take appropriate action to terminate this probing.

Best regards,
Adriano (adybag14@gmail.com)
