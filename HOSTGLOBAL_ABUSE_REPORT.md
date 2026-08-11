# HOSTGLOBAL.PLUS ABUSE REPORT

**To:** abuse@hostglobal.plus
**Subject:** Abuse Report: Malicious Credential/Environment Fishing from IP 78.153.140.195

---

**Message Body (Copy below this line):**

Hello HostGlobal Abuse Team,

I am reporting malicious activity originating from your network (IP: 78.153.140.195).

Nature of Abuse: Credential/Environment File Fishing & Vulnerability Scanning
Target: adrianotothestar.com
Timeframe: 2026-01-10 06:51:31 to 06:51:40 UTC

Description:
The source IP performed a targeted scan for sensitive environment configuration files (/.env, /.env.example, /.env.save) across multiple directory levels (/api/, /admin/, /backend/, etc.). Additionally, it attempted to access server information disclosure endpoints (/phpinfo.php, /app_dev.php/_profiler/phpinfo). 

The bot utilized a high variety of antiquated and forged User-Agents (Opera 9.80, IE 6.0, Android 4.4.2) to evade detection while conducting rapid-fire probes (12 requests in 9 seconds). This behavior is characteristic of malicious automated scripts seeking to steal API keys, database credentials, and system configuration data.

Logs:
1582 /api/.env 78.153.140.195 GET 2026-01-10 06:51:31 404
1583 /app_dev.php/_profiler/phpinfo 78.153.140.195 GET 2026-01-10 06:51:32 404
1584 /admin/.env 78.153.140.195 GET 2026-01-10 06:51:33 404
1586 /.env.example 78.153.140.195 GET 2026-01-10 06:51:35 404
1589 /phpinfo.php 78.153.140.195 GET 2026-01-10 06:51:37 404
1592 /app/.env 78.153.140.195 GET 2026-01-10 06:51:39 404

This activity is a clear violation of your Acceptable Use Policy. Please investigate the account associated with this IP and take appropriate action to terminate this malicious probing.

Best regards,
Adriano (adybag14@gmail.com)
