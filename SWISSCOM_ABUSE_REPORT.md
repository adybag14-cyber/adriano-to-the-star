# SWISSCOM ABUSE REPORT

**To:** abuse@swisscom.com
**Subject:** Abuse Report: Malicious CMS Login Probing from IP 213.35.110.52

---

**Message Body (Copy below this line):**

Hello Swisscom Abuse Team,

I am reporting malicious activity originating from your network (IP: 213.35.110.52).

Nature of Abuse: Malicious CMS Login Probing / Vulnerability Scanning
Target: adrianotothestar.com
Timeframe: 2026-01-10 05:33:49 UTC

Description:
The source IP performed a targeted scan for administrative login panels, specifically WordPress (/wp-login.php, /wp-admin/) and Joomla (/administrator/). The bot utilized rotating User-Agents (iPhone, iPad, Macintosh) to simulate different devices while conducting these unauthorized probes. This IP is already listed on several global blocklists for similar aggressive scanning behavior.

Logs:
1548 /wp-login.php 213.35.110.52 GET 2026-01-10 05:33:49 404
1549 /wp-admin/ 213.35.110.52 GET 2026-01-10 05:33:49 404
1550 /administrator/ 213.35.110.52 GET 2026-01-10 05:33:49 404

This activity violates acceptable use standards regarding unauthorized probing and malicious network activity. Please investigate the customer associated with this IP and take necessary action to stop this behavior.

Best regards,
Adriano (adybag14@gmail.com)
