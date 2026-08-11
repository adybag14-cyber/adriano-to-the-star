// Hardcoded mapping of Organization keywords to Abuse Emails
const ABUSE_MAP = {
  "microsoft": "abuse@microsoft.com",
  "azure": "abuse@microsoft.com",
  "digitalocean": "abuse@digitalocean.com",
  "lumen": "abuse@aup.lumen.com",
  "level 3": "abuse@aup.lumen.com",
  "centurylink": "abuse@aup.lumen.com",
  "1337 services": "abuse@as210558.net",
  "njalla": "abuse@as210558.net",
  "swisscom": "abuse@swisscom.com",
  "amazon": "abuse@amazonaws.com",
  "aws": "abuse@amazonaws.com",
  "google": "network-abuse@google.com",
  "vultr": "abuse@vultr.com",
  "choopa": "abuse@vultr.com",
  "hetzner": "abuse@hetzner.de",
  "linode": "abuse@linode.com",
  "akamai": "abuse@linode.com",
  "ovh": "abuse@ovh.net",
  "m247": "abuse@m247.com",
  "datacamp": "abuse@datacamp.com",
  "kprohost": "abuse@kprohost.com",
  "techoff": "dmzhostabuse@gmail.com"
};

// High-confidence malicious patterns for a static site
const MALICIOUS_PATTERNS = [
  '.env',
  '.git/config',
  'wp-admin',
  'wp-login',
  'wlwmanifest.xml',
  'xmlrpc.php',
  'administrator/',
  'aws-config',
  'sftp-config.json',
  '/.vscode/sftp.json',
  'https%3A'
];

// List of User-Agent substrings for legitimate crawlers to NEVER report
const GOOD_BOTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckgo',
  'baiduspider',
  'facebot',
  'ia_archiver'
];

// Emergency fallback configuration
const CLOUDFLARE_PAGES_URL = 'https://exoplanet-pioneer.pages.dev';

// Core pages that should redirect to Cloudflare Pages on 404
const CORE_PAGES = [
  '/exoplanet-pioneer.html',
  '/index.html',
  '/game.html',
  '/play.html'
];

// Files that should always redirect to Cloudflare Pages
const REDIRECT_PATTERNS = [
  'exoplanet-pioneer',
  'api/',
  'assets/models/',
  'assets/textures/'
];

function shouldRedirectToCloudflare(pathname) {
  // Don't redirect cheerpj-natives - they're served from R2 bucket
  if (pathname.includes('/cheerpj-natives/')) {
    return false;
  }
  
  // Check if it's a core page
  if (CORE_PAGES.includes(pathname)) {
    return true;
  }
  
  // Check if it matches redirect patterns
  for (const pattern of REDIRECT_PATTERNS) {
    if (pathname.includes(pattern)) {
      return true;
    }
  }
  
  // Check if it's a JavaScript file that might be missing
  // Exclude CheerpJ module imports - they should load directly from CDN
  if (pathname.endsWith('.js') && !pathname.includes('legacy') && !pathname.includes('/cjrtnc.leaningtech.com/')) {
    return true;
  }
  
  // Check if it's an API endpoint
  if (pathname.startsWith('/api/')) {
    return true;
  }
  
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // Serve cheerpj-natives directly from R2 bucket
    if (url.pathname.includes('/cheerpj-natives/')) {
      const key = url.pathname.slice(1); // Remove leading slash
      try {
        const object = await env.SWF_BUCKET.get(key);
        
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Accept-Ranges', 'bytes');
          headers.set('Content-Type', 'application/javascript');
          
          // Handle Range requests for partial content
          const rangeHeader = request.headers.get('Range');
          if (rangeHeader && object.size) {
            const range = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(range[0], 10);
            const end = range[1] ? parseInt(range[1], 10) : object.size - 1;
            
            if (start >= 0 && end < object.size && start <= end) {
              const rangeSize = end - start + 1;
              // Read the entire object and slice it
              const arrayBuffer = await object.arrayBuffer();
              const slicedBuffer = arrayBuffer.slice(start, end + 1);
              
              headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
              headers.set('Content-Length', rangeSize.toString());
              
              return new Response(slicedBuffer, {
                status: 206,
                headers
              });
            }
          }
          
          headers.set('Content-Length', object.size.toString());
          return new Response(object.body, { headers });
        }
        
        return new Response('File not found', { status: 404 });
      } catch (error) {
        console.error('Error serving cheerpj-natives:', error);
        return new Response('Error serving file', { status: 500 });
      }
    }

    // Serve Starsector game files directly from R2 bucket
    if (url.pathname.includes('/Starsector/')) {
      const key = url.pathname.slice(1); // Remove leading slash
      try {
        const object = await env.SWF_BUCKET.get(key);
        
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Accept-Ranges', 'bytes');
          
          // Set appropriate content type based on file extension
          if (key.endsWith('.jar')) {
            headers.set('Content-Type', 'application/java-archive');
          } else if (key.endsWith('.json')) {
            headers.set('Content-Type', 'application/json');
          } else if (key.endsWith('.png')) {
            headers.set('Content-Type', 'image/png');
          } else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
            headers.set('Content-Type', 'image/jpeg');
          }
          
          // Handle Range requests for partial content
          const rangeHeader = request.headers.get('Range');
          if (rangeHeader && object.size) {
            const range = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(range[0], 10);
            const end = range[1] ? parseInt(range[1], 10) : object.size - 1;
            
            if (start >= 0 && end < object.size && start <= end) {
              const rangeSize = end - start + 1;
              // Read the entire object and slice it
              const arrayBuffer = await object.arrayBuffer();
              const slicedBuffer = arrayBuffer.slice(start, end + 1);
              
              headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
              headers.set('Content-Length', rangeSize.toString());
              
              return new Response(slicedBuffer, {
                status: 206,
                headers
              });
            }
          }
          
          headers.set('Content-Length', object.size.toString());
          return new Response(object.body, { headers });
        }
        
        return new Response('File not found', { status: 404 });
      } catch (error) {
        console.error('Error serving Starsector files:', error);
        return new Response('Error serving file', { status: 500 });
      }
    }

    // 1. Redirect old Wix-style paths
    if (url.pathname === '/team-3' || url.pathname === '/team-3/') {
      return Response.redirect(`${url.origin}/business-promise.html`, 301);
    }

    // 2. Forward the request to the origin
    const response = await fetch(request);

    // 3. Emergency fallback: Redirect 404s to Cloudflare Pages for core pages
    if (response.status === 404 && shouldRedirectToCloudflare(url.pathname)) {
      console.log(`Emergency redirect: ${url.pathname} -> ${CLOUDFLARE_PAGES_URL}${url.pathname}`);
      return Response.redirect(`${CLOUDFLARE_PAGES_URL}${url.pathname}`, 307);
    }

    // 4. Persistent log and Auto-Abuse-Reporter
    if (response.status >= 400) {
      const ip = request.headers.get('cf-connecting-ip') || 'Unknown';
      const ua = request.headers.get('user-agent') || 'Unknown';
      const referer = request.headers.get('referer') || 'Direct';
      const method = request.method;
      const status = response.status;

      // Always log to D1
      ctx.waitUntil(
        env.DB.prepare(
          "INSERT INTO audit_logs (path, ip, user_agent, referer, method, status) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(url.pathname, ip, ua, referer, method, status)
        .run()
        .catch(err => console.error("D1 Logging Error:", err))
      );

      // AUTO-ABUSE-REPORTER
      const isPhp = path.endsWith('.php');
      const isMaliciousPath = MALICIOUS_PATTERNS.some(pattern => path.includes(pattern));
      const isGoodBot = GOOD_BOTS.some(bot => ua.toLowerCase().includes(bot));

      // Trigger ONLY if it's a malicious pattern and NOT a known good crawler
      if ((isPhp || isMaliciousPath) && !isGoodBot) {
        ctx.waitUntil(this.handleAbuseReport(ip, path, ua, env));
      }
    }

    return response;
  },

  async handleAbuseReport(ip, path, userAgent, env) {
    try {
      // 1. Get IP Info
      const ipResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,org,as`);
      const ipData = await ipResponse.json();
      
      if (ipData.status !== 'success') return;
      
      const orgName = (ipData.org || ipData.as || "Unknown").toLowerCase();

      // 2. Find Abuse Contact
      let abuseEmail = null;
      for (const [key, email] of Object.entries(ABUSE_MAP)) {
        if (orgName.includes(key)) {
          abuseEmail = email;
          break;
        }
      }

      // 3. Send via Resend
      if (abuseEmail && env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Security Alert <security@adrianotothestar.com>',
            to: [abuseEmail],
            subject: `Abuse Report: Malicious Vulnerability Scanning from IP ${ip}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #d32f2f;">Vulnerability Scanning Detected</h2>
                <p>Hello Abuse Team,</p>
                <p>This is an automated report of malicious network activity originating from your network.</p>
                <hr>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px; font-weight: bold;">Source IP:</td><td style="padding: 8px;">${ip}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Organization:</td><td style="padding: 8px;">${ipData.org} (${ipData.as})</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Target Host:</td><td style="padding: 8px;">adrianotothestar.com</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Incident Path:</td><td style="padding: 8px;"><code>${path}</code></td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Timestamp:</td><td style="padding: 8px;">${new Date().toISOString()}</td></tr>
                </table>
                <hr>
                <p><strong>Nature of Abuse:</strong> The source IP is performing rapid-fire vulnerability scanning and directory brute-forcing, specifically targeting known web shells and administrative backdoors. As adrianotothestar.com is a static site, this behavior constitutes unauthorized probing and a violation of standard Acceptable Use Policies.</p>
                <p>Please investigate the customer associated with this IP and take appropriate action.</p>
                <p style="font-size: 12px; color: #666;">Reporter: Adriano (adybag14@gmail.com)</p>
              </div>
            `
          })
        });
        console.log(`Auto-Report sent to ${abuseEmail} for IP ${ip}`);
      }
    } catch (err) {
      console.error("Auto-Reporter Logic Error:", err);
    }
  }
};
