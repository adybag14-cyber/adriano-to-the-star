/**
 * Headless Browser Scraper for Broadband Prices
 * Uses Puppeteer to render JavaScript-heavy websites
 * Integrates with Gemini AI for intelligent price extraction
 */

const express = require('express');
const puppeteer = require('puppeteer');
const dns = require('dns');
const net = require('net');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const NODE_ENV = process.env.NODE_ENV || 'development';
const API_TOKEN = process.env.API_TOKEN || null;

if (NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});

function requireTokenIfConfigured(req, res, next) {
    if (NODE_ENV !== 'production') return next();
    if (!API_TOKEN) {
        return res.status(403).json({ success: false, error: 'Disabled in production unless API_TOKEN is set' });
    }
    const token = String(req.headers.authorization || '').replace('Bearer ', '').trim();
    if (token !== API_TOKEN) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
}

// Known provider URLs
const PROVIDER_URLS = {
    'bt': 'https://www.bt.com/broadband/deals',
    'sky': 'https://www.sky.com/shop/broadband-talk/',
    'virgin media': 'https://www.virginmedia.com/broadband',
    'talktalk': 'https://www.talktalk.co.uk/shop/broadband',
    'vodafone': 'https://www.vodafone.co.uk/broadband',
    'plusnet': 'https://www.plus.net/broadband/',
    'ee': 'https://ee.co.uk/broadband',
    'now': 'https://www.nowtv.com/broadband',
    'hyperoptic': 'https://www.hyperoptic.com/broadband/',
    'community fibre': 'https://communityfibre.co.uk/home-broadband',
    'gigaclear': 'https://www.gigaclear.com/residential',
    'zen': 'https://www.zen.co.uk/broadband',
    'shell energy': 'https://www.shellenergy.co.uk/broadband',
    'three': 'https://www.three.co.uk/broadband',
    'youfibre': 'https://www.youfibre.com/packages',
    'toob': 'https://www.toob.co.uk/',
    'trooli': 'https://www.trooli.com/packages/',
    'lightning fibre': 'https://www.lightningfibre.co.uk/packages/',
    'cuckoo': 'https://www.cuckoo.co/our-broadband',
    'zzoomm': 'https://www.zzoomm.com/packages',
    'yayzi': 'https://yayzi.com/packages/',
    'v4 consumer': 'https://www.v4consumer.co.uk/residential/broadband',
};

// Browser instance (reused for performance)
let browser = null;

function isPrivateHostname(hostname) {
    return isPrivateHostnameQuick(hostname);
}

function normalizeHostname(hostname) {
    const host = String(hostname || '').trim().toLowerCase().replace(/\.+$/, '');
    if (host.startsWith('www.')) return host.slice(4);
    return host;
}

function hostnameMatchesProvider(hostname, providerHostname) {
    const host = normalizeHostname(hostname);
    const base = normalizeHostname(providerHostname);
    if (!host || !base) return false;
    return host === base || host.endsWith(`.${base}`);
}

function isPrivateIp(ip) {
    const ipType = net.isIP(ip);
    const value = String(ip || '').toLowerCase();

    if (ipType === 4) {
        const parts = value.split('.').map((p) => Number(p));
        if (parts.length !== 4) return true;
        if (parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true;
        const [a, b] = parts;
        if (a === 0) return true;
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 100 && b >= 64 && b <= 127) return true;
        if (a >= 224) return true;
        return false;
    }

    if (ipType === 6) {
        if (value === '::' || value === '::1') return true;
        if (value.startsWith('fc') || value.startsWith('fd')) return true;
        if (value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb')) return true;
        if (value.startsWith('ff')) return true;
        if (value.startsWith('::ffff:')) {
            const v4 = value.slice('::ffff:'.length);
            if (net.isIP(v4) === 4) return isPrivateIp(v4);
        }
        return false;
    }

    return true;
}

function isPrivateHostnameQuick(hostname) {
    const host = normalizeHostname(hostname);
    if (!host) return true;

    if (host === 'localhost' || host === '0.0.0.0' || host === '127.0.0.1' || host === '::1') return true;
    if (host.endsWith('.localhost')) return true;

    const ipType = net.isIP(host);
    if (ipType) return isPrivateIp(host);

    return false;
}

async function isPrivateHostnameResolved(hostname) {
    const host = normalizeHostname(hostname);
    if (isPrivateHostnameQuick(host)) return true;

    try {
        const results = await dns.promises.lookup(host, { all: true, verbatim: true });
        if (!results.length) return true;
        return results.some((r) => isPrivateIp(r.address));
    } catch {
        return true;
    }
}

const inFlightHostnameChecks = new Map();

async function isPrivateHostnameResolvedSafely(hostname) {
    const host = normalizeHostname(hostname);
    if (!host) return true;

    const existing = inFlightHostnameChecks.get(host);
    if (existing) return existing;

    const check = isPrivateHostnameResolved(host).finally(() => {
        inFlightHostnameChecks.delete(host);
    });

    inFlightHostnameChecks.set(host, check);
    return check;
}

async function sanitizeExternalUrl(rawUrl) {
    if (!rawUrl) return null;
    try {
        const u = new URL(String(rawUrl));
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        if (u.username || u.password) return null;
        if (u.port && u.port !== '80' && u.port !== '443') return null;
        if (String(rawUrl).length > 2048) return null;
        if (String(rawUrl).includes('\n') || String(rawUrl).includes('\r')) return null;
        if (await isPrivateHostnameResolved(u.hostname)) return null;
        u.hash = '';
        return u.toString();
    } catch {
        return null;
    }
}

async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--metrics-recording-only',
                '--mute-audio',
                '--safebrowsing-disable-auto-update'
            ]
        });
    }
    return browser;
}

/**
 * Extract prices using Gemini AI
 */
async function extractPricesWithAI(textContent, providerName) {
    if (!GEMINI_API_KEY) {
        console.log('No Gemini API key, using regex fallback');
        return extractPricesRegex(textContent);
    }

    const prompt = `You are a broadband pricing expert. Extract ALL broadband/internet package deals from this ${providerName} website content.

For each package/deal found, extract:
1. Package name (e.g., "Full Fibre 500", "Superfast", "1Gbps")
2. Download speed in Mbps (convert Gbps to Mbps: 1Gbps = 1000Mbps)
3. Monthly price in GBP (the actual recurring price, not setup fees)
4. Contract length if mentioned

IMPORTANT RULES:
- Only extract RESIDENTIAL BROADBAND packages (not business, not TV-only, not phone-only)
- Match the speed with its corresponding price from the SAME package
- If you see "Full Fibre 1000" or "1Gbps", the speed is 1000 Mbps
- Look for the main advertised packages, not promotional snippets
- Prices are typically shown as £XX.XX/month or £XX.XX per month

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"deals": [
  {"name": "Package Name", "speed_mbps": 500, "price": 34.99, "contract_months": 24},
  {"name": "Another Package", "speed_mbps": 1000, "price": 51.99, "contract_months": 24}
]}

If no valid broadband deals are found, return: {"deals": []}

Website content:
${textContent.substring(0, 15000)}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            console.error('Gemini API error:', response.status);
            return extractPricesRegex(textContent);
        }

        const result = await response.json();
        let aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Clean markdown code blocks
        aiResponse = aiResponse.trim();
        if (aiResponse.startsWith('```')) {
            aiResponse = aiResponse.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
        }

        // Extract JSON object using regex (handles extra text around JSON)
        const jsonMatch = aiResponse.match(/\{[\s\S]*"deals"[\s\S]*\}/);
        if (jsonMatch) {
            aiResponse = jsonMatch[0];
        }

        const parsed = JSON.parse(aiResponse);
        const deals = parsed.deals || [];

        return deals.slice(0, 5).map(deal => ({
            name: deal.name || 'Broadband Package',
            speed: deal.speed_mbps ? `${deal.speed_mbps} Mbps` : null,
            price: deal.price ? deal.price.toFixed(2) : null,
            contract: deal.contract_months ? `${deal.contract_months} months` : null
        }));

    } catch (error) {
        console.error('AI extraction failed:', error.message);
        return extractPricesRegex(textContent);
    }
}

/**
 * Fallback regex-based extraction
 */
function extractPricesRegex(text) {
    const deals = [];

    // Pattern to find speed + price combinations
    // These patterns are used on controlled scraped content, not user input
    /* eslint-disable security/detect-unsafe-regex */
    const patterns = [
        /(\d+)\s*(?:Mbps|Mb|Gbps).{0,80}?£(\d+(?:\.\d{2})?)/gi,
        /£(\d+(?:\.\d{2})?).{0,80}?(\d+)\s*(?:Mbps|Mb)/gi,
        /(?:Fibre|Full\s*Fibre)\s*(\d+).{0,50}?£(\d+(?:\.\d{2})?)/gi
    ];

    const foundDeals = new Map();

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            try {
                let speed, price;
                if (match[0].indexOf('£') < match[0].search(/\d+\s*(?:Mbps|Mb)/i)) {
                    price = parseFloat(match[1]);
                    speed = parseInt(match[2]);
                } else {
                    speed = parseInt(match[1]);
                    price = parseFloat(match[2]);
                }

                // Validate
                if (price >= 15 && price <= 150 && speed >= 10 && speed <= 10000) {
                    if (speed <= 10) speed *= 1000; // Convert Gbps
                    const key = `${speed}-${price}`;
                    if (!foundDeals.has(key)) {
                        foundDeals.set(key, { speed, price });
                    }
                }
            } catch (e) {
                continue;
            }
        }
    }

    // Sort by speed and format
    const sorted = Array.from(foundDeals.values()).sort((a, b) => b.speed - a.speed);

    return sorted.slice(0, 5).map((deal, i) => ({
        name: deal.speed >= 500 ? `Full Fibre ${deal.speed}` : `Fibre ${deal.speed}`,
        speed: `${deal.speed} Mbps`,
        price: deal.price.toFixed(2)
    }));
}

/**
 * Scrape a provider's website using headless browser
 */
async function scrapeProvider(providerName, providerUrl) {
    const result = {
        provider: providerName,
        success: false,
        deals: [],
        error: null,
        source: 'headless',
        rendered: true
    };

    const providerKey = providerName.toLowerCase().trim();
    const defaultUrl = PROVIDER_URLS[providerKey] || null;

    if (NODE_ENV === 'production' && !defaultUrl) {
        result.error = 'Unknown provider';
        return result;
    }

    const slug = providerKey.replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');
    let url = defaultUrl || (slug ? `https://www.${slug}.co.uk` : null);

    if (providerUrl) {
        const sanitizedUrl = await sanitizeExternalUrl(providerUrl);
        if (!sanitizedUrl) {
            result.error = 'Invalid url parameter';
            return result;
        }

        if (NODE_ENV === 'production' && defaultUrl) {
            const allowedHostname = new URL(defaultUrl).hostname;
            const requestedHostname = new URL(sanitizedUrl).hostname;
            if (!hostnameMatchesProvider(requestedHostname, allowedHostname)) {
                result.error = 'Invalid url parameter';
                return result;
            }
        }

        url = sanitizedUrl;
    }

    if (!url) {
        result.error = 'Invalid provider parameter';
        return result;
    }

    let page = null;

    try {
        console.log(`Scraping ${providerName} from ${url}`);

        const browserInstance = await getBrowser();
        page = await browserInstance.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Block unnecessary resources for faster loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const handleRequest = async () => {
                try {
                    const requestUrl = req.url();
                    if (
                        requestUrl.startsWith('data:') ||
                        requestUrl.startsWith('blob:') ||
                        requestUrl.startsWith('about:')
                    ) {
                        return req.continue();
                    }

                    const parsed = new URL(requestUrl);
                    if (
                        parsed.protocol !== 'http:' &&
                        parsed.protocol !== 'https:' &&
                        parsed.protocol !== 'ws:' &&
                        parsed.protocol !== 'wss:'
                    ) {
                        return req.abort();
                    }

                    if (await isPrivateHostnameResolvedSafely(parsed.hostname)) {
                        return req.abort();
                    }
                } catch {
                    return req.abort();
                }

                const resourceType = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    return req.abort();
                }
                return req.continue();
            };

            handleRequest().catch(() => {
                try {
                    req.abort();
                } catch {
                    // ignore
                }
            });
        });

        // Navigate with timeout
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait a bit for dynamic content
        await page.waitForTimeout(2000);

        // Try to scroll to load lazy content
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await page.waitForTimeout(1000);

        // Get the rendered page content
        const textContent = await page.evaluate(() => {
            // Remove script and style elements
            const scripts = document.querySelectorAll('script, style, noscript, iframe');
            scripts.forEach(el => el.remove());
            return document.body.innerText;
        });

        console.log(`Got ${textContent.length} chars of content from ${providerName}`);

        // Extract prices using AI
        const deals = await extractPricesWithAI(textContent, providerName);

        if (deals && deals.length > 0) {
            result.success = true;
            result.deals = deals;
            result.url = url;
        } else {
            result.error = 'No price data found';
        }

    } catch (error) {
        console.error(`Error scraping ${providerName}:`, error.message);
        const errorMessage = error && typeof error.message === 'string' ? error.message : String(error);
        result.error = NODE_ENV === 'production' ? 'Internal server error' : errorMessage;
    } finally {
        if (page) {
            await page.close().catch(() => { });
        }
    }

    return result;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main scraping endpoint
app.get('/scrape', requireTokenIfConfigured, async (req, res) => {
    const provider = typeof req.query.provider === 'string' ? req.query.provider.trim() : '';
    const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';

    if (provider && (provider.length > 128 || provider.includes('\n') || provider.includes('\r'))) {
        return res.status(400).json({ success: false, error: 'Invalid provider parameter' });
    }

    if (url && (url.length > 2048 || url.includes('\n') || url.includes('\r'))) {
        return res.status(400).json({ success: false, error: 'Invalid url parameter' });
    }

    if (!provider) {
        return res.status(400).json({ success: false, error: 'Missing provider parameter' });
    }

    try {
        const result = await scrapeProvider(provider, url);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: NODE_ENV === 'production' ? 'Internal server error' : error.message,
        });
    }
});

// Batch scraping endpoint
app.post('/scrape-multiple', requireTokenIfConfigured, async (req, res) => {
    const inputProviders = Array.isArray(req.body?.providers) ? req.body.providers : [];
    const providers = inputProviders
        .map((p) => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean);

    if (!providers.length) {
        return res.status(400).json({ success: false, error: 'Missing providers list' });
    }

    const results = {};
    for (const provider of providers.slice(0, 5)) { // Limit to 5 at a time
        results[provider] = await scrapeProvider(provider);
    }

    res.json({ success: true, results });
});

// Start server
app.listen(PORT, () => {
    console.log(`Headless scraper listening on port ${PORT}`);
});

// Cleanup on exit
process.on('SIGTERM', async () => {
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

