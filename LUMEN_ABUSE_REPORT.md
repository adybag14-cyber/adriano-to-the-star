# LUMEN ABUSE REPORT

**To:** abuse@aup.lumen.com
**Subject:** Abuse Report: Malicious Vulnerability Scanning from IP 4.197.100.161

---

**Message Body (Copy below this line):**

Hello Lumen Abuse Team,

I am reporting malicious activity originating from your network (IP: 4.197.100.161). 

Nature of Abuse: Malicious Vulnerability Scanning / Directory Brute-Force
Target: adrianotothestar.com
Timeframe: 2026-01-10 18:19:36 to 18:19:44 UTC

Description: 
The source IP performed a rapid-fire directory brute-force attack, attempting to find administrative backdoors and common CMS vulnerabilities (e.g., /admin/, /wp-admin/, /cgi-bin/, /wso.php). The attacker made over 20 requests in 8 seconds, utilizing rotating mobile User-Agents and forged referrers to evade standard detection.

Logs:
1876 /admin/ 4.197.100.161 GET 2026-01-10 18:19:36 404
1878 /wordpress/wp-admin/maint/ 4.197.100.161 GET 2026-01-10 18:19:44 404
1879 /admin/controller/extension/extension/ 4.197.100.161 GET 2026-01-10 18:19:44 404
1881 /cgi-bin/ 4.197.100.161 GET 2026-01-10 18:19:44 404
1890 /wp-admin/ 4.197.100.161 GET 2026-01-10 18:19:44 404

This activity is a clear violation of Lumen's Acceptable Use Policy. Please investigate the customer/entity associated with this IP and take appropriate action.

Best regards,
Adriano (adybag14@gmail.com)
