# NJALLA (1337 SERVICES) ABUSE REPORT

**To:** abuse@as210558.net
**Subject:** Abuse Report: Malicious WP Scanning from IP 2.58.56.117

---

**Message Body (Copy below this line):**

Hello Njalla Abuse Team,

I am reporting malicious activity originating from your network (IP: 2.58.56.117). 

Nature of Abuse: Malicious Vulnerability Scanning / WordPress Fingerprinting
Target: adrianotothestar.com
Timeframe: 2026-01-10 09:47:37 to 09:47:40 UTC

Description: 
The source IP performed a rapid-fire scan (15 requests in 3 seconds) targeting WordPress-specific configuration files (e.g., /wp-includes/wlwmanifest.xml). This is a known technique used to fingerprint CMS versions for exploitation. The bot utilized rotating User-Agents and direct-entry headers to bypass basic detection.

Logs:
1660 //blog/wp-includes/wlwmanifest.xml 2.58.56.117 GET 2026-01-10 09:47:37 404
1662 //wordpress/wp-includes/wlwmanifest.xml 2.58.56.117 GET 2026-01-10 09:47:38 404
1664 //wp/wp-includes/wlwmanifest.xml 2.58.56.117 GET 2026-01-10 09:47:38 404
1672 //wp2/wp-includes/wlwmanifest.xml 2.58.56.117 GET 2026-01-10 09:47:40 404

Please investigate the account associated with this IP and terminate their access for violating your Acceptable Use Policy regarding malicious network probing.

Best regards,
Adriano (adybag14@gmail.com)
