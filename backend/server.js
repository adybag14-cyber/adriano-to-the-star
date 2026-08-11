const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;

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
        return res.status(403).json({ error: 'Disabled in production unless API_TOKEN is set' });
    }
    const token = String(req.headers.authorization || '').replace('Bearer ', '').trim();
    if (token !== API_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

const allowedOrigins = (process.env.CORS_ORIGINS && NODE_ENV === 'production')
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : null;
// Enable CORS for all origins (adjust in production)
if (allowedOrigins) {
    app.use(cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, false);
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    }));
} else if (NODE_ENV !== 'production') {
    app.use(cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, false);
            }
            callback(null, true);
        }
    }));
}

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
// API versioning and rate limiting
try {
    const apiVersioning = require('../api-versioning');
    const createRateLimiter = require('../api-rate-limiting-per-key');
    app.use(apiVersioning({ defaultVersion: 'v1' }));
    app.use(createRateLimiter({ windowMs: 60000, max: 120 }));
} catch (_e) { }

// Request logging
try {
    const APIRequestLogging = require('../api-request-logging');
    const logger = new APIRequestLogging();
    app.use((req, res, next) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        req.requestId = id;
        const start = Date.now();
        logger.logRequest(id, req.method, req.originalUrl || req.url, req.headers, req.body);
        res.on('finish', () => {
            logger.logResponse(id, res.statusCode, res.getHeaders(), null, Date.now() - start);
        });
        next();
    });
} catch (_e) { }

// Notifications and integrations endpoints
try {
    const SlackNotifications = require('../slack-notifications');
    const DiscordBotIntegration = require('../discord-bot-integration');
    const EmailServiceIntegration = require('../email-service-integration');
    const MonitoringServiceIntegration = require('../monitoring-service-integration');
    const CalendarIntegration = require('../calendar-integration');
    const FileStorageIntegrations = require('../file-storage-integrations');
    const AutomatedReportingSystem = require('../automated-reporting-system');
    const slack = new SlackNotifications();
    const discord = new DiscordBotIntegration();
    const email = new EmailServiceIntegration();
    const monitoring = new MonitoringServiceIntegration();
    const calendar = new CalendarIntegration();
    const storage = new FileStorageIntegrations();
    const reports = new AutomatedReportingSystem();
    monitoring.register('mock', { url: 'http://localhost' });
    calendar.registerProvider('mock', { region: 'UTC' });
    storage.registerService('mock', { bucket: 'local' });
    app.post('/api/notify/slack', requireTokenIfConfigured, async (req, res) => {
        try {
            const r = await slack.send({ channel: req.body?.channel, text: req.body?.text });
            return res.status(r.success ? 200 : 400).json(r);
        } catch (e) {
            return res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message });
        }
    });
    app.post('/api/notify/discord', requireTokenIfConfigured, async (req, res) => {
        const r = await discord.send({ channel: req.body?.channel, content: req.body?.content });
        res.status(r.success ? 200 : 400).json(r);
    });
    app.post('/api/notify/email', requireTokenIfConfigured, async (req, res) => {
        const r = await email.sendEmail({ to: req.body?.to, subject: req.body?.subject, text: req.body?.text, html: req.body?.html });
        res.status(r.success ? 200 : 400).json(r);
    });
    app.post('/api/monitoring/metric', requireTokenIfConfigured, async (req, res) => {
        try { const r = await monitoring.sendMetric('mock', req.body?.metric, req.body?.value, req.body?.tags || {}); res.json(r); }
        catch (e) { res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message }); }
    });
    app.post('/api/calendar/events', requireTokenIfConfigured, async (req, res) => {
        try { const r = await calendar.createEvent('mock', req.body || {}); res.status(201).json(r); }
        catch (e) { res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message }); }
    });
    app.get('/api/calendar/events', requireTokenIfConfigured, async (_req, res) => {
        try { const r = await calendar.listEvents('mock', {}); res.json(r); }
        catch (e) { res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message }); }
    });
    app.post('/api/storage/upload', requireTokenIfConfigured, async (req, res) => {
        try { const r = await storage.storeFile('mock', req.body?.file || {}, req.body?.path || 'uploads/item'); res.json(r); }
        catch (e) { res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message }); }
    });
    app.get('/api/storage/list', requireTokenIfConfigured, async (_req, res) => {
        try { const r = await storage.list('mock'); res.json({ files: r }); }
        catch (e) { res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message }); }
    });
    app.post('/api/reporting/schedule', requireTokenIfConfigured, (req, res) => {
        const j = reports.schedule(req.body?.name || 'job', Number(req.body?.intervalMs || 60000), () => { });
        res.status(201).json({ id: j.id, interval: j.interval });
    });
    app.get('/api/reporting/jobs', requireTokenIfConfigured, (_req, res) => {
        res.json({ jobs: reports.list() });
    });
} catch (_e) { }

// GraphQL-like endpoint (JSON operations)
// NOTE: Disabled - cart, orders, shipping, tax, fx are defined later in the file
// This endpoint should be moved after the Cart and Orders section or refactored
// try {
//     const GraphQLApiLayer = require('../graphql-api-layer');
//     const gql = new GraphQLApiLayer({ cart, orders, shipping, tax, fx });
//     app.post('/api/graphql', (req, res) => {
//         const result = gql.execute(req.body || {});
//         res.json(result);
//     });
// } catch (_e) {}

// Docs search and analytics endpoints
try {
    const DocumentationIndexBuilder = require('../documentation-index-builder');
    const AnalyticsStatsAggregator = require('../analytics-stats-aggregator');
    const PerformanceBudgetsEnforcer = require('../performance-budgets-enforcer');
    const PerformanceAlerts = require('../performance-alerts');
    const SyntheticMonitoringHarness = require('../synthetic-monitoring-harness');
    const docs = new DocumentationIndexBuilder();
    const analytics = new AnalyticsStatsAggregator();
    const budgets = new PerformanceBudgetsEnforcer();
    const alerts = new PerformanceAlerts();
    const synth = new SyntheticMonitoringHarness();
    alerts.configure([
        { field: 'lcp', operator: 'gt', threshold: 2500, severity: 'high', message: 'LCP too high' },
        { field: 'ttfb', operator: 'gt', threshold: 800, severity: 'medium', message: 'TTFB too high' }
    ]);
    // Simple request count metric
    app.use((req, _res, next) => { analytics.increment(`req:${req.method}`); next(); });
    app.post('/api/docs/index', requireTokenIfConfigured, (req, res) => {
        const id = docs.addDoc(req.body?.id || Date.now().toString(36), req.body?.title || 'Untitled', req.body?.content || '', req.body?.keywords || []);
        res.status(201).json({ id });
    });
    app.get('/api/docs/search', (req, res) => {
        const q = String(req.query?.q || '').trim();
        res.json({ results: docs.buildSearch(q) });
    });
    app.get('/api/analytics/snapshot', (_req, res) => {
        res.json(analytics.getSnapshot());
    });
    app.post('/api/perf/evaluate', (req, res) => {
        const metrics = req.body || {};
        const result = budgets.evaluate(metrics);
        const triggered = alerts.evaluate(metrics);
        res.json({ budgets: result, alerts: triggered });
    });
    synth.register('basic', async () => true);
    app.post('/api/synthetic/run', requireTokenIfConfigured, async (_req, res) => {
        const results = await synth.runAll({});
        res.json({ results });
    });
    app.get('/api/synthetic/results', requireTokenIfConfigured, (_req, res) => {
        res.json({ results: synth.getResults() });
    });
} catch (_e) { }

// Webhooks receiver
try {
    const WebhookSystem = require('../webhook-system');
    const webhook = new WebhookSystem();
    webhook.register('stripe', (payload) => {
        console.log('📨 Stripe webhook received', payload.type || 'unknown');
        return true;
    });
    webhook.register('github', (payload) => {
        console.log('📨 GitHub webhook received', payload.action || 'unknown');
        return true;
    });

    // Unified Webhook Entrypoint
    app.post('/api/webhooks/:source', requireTokenIfConfigured, async (req, res) => {
        const source = req.params.source;
        console.log(`🪝 Webhook received from ${source}`);
        const result = await webhook.handle(source, req.body);
        res.status(result.delivered ? 200 : 400).json(result);
    });

    // PayPal Create Order
    app.post('/api/paypal/create-order', requireTokenIfConfigured, async (req, res) => {
        const { amount } = req.body;
        // Mock PayPal response
        console.log(`🅿️ Mock PayPal Order created: ${amount}`);
        res.json({
            id: 'ORDER-MOCK-' + Date.now(),
            status: 'CREATED'
        });
    });

    // PayPal Capture Order
    app.post('/api/paypal/capture-order', requireTokenIfConfigured, async (req, res) => {
        const { orderID } = req.body;
        // Mock PayPal Capture
        console.log(`🅿️ Mock PayPal Capture: ${orderID}`);
        res.json({
            id: orderID,
            status: 'COMPLETED',
            payer: { email_address: 'mock@payer.com' }
        });
    });
} catch (_e) { }

// Cart and Orders endpoints
try {
    const ShoppingCartSystem = require('../shopping-cart-system');
    const PaymentProcessing = require('../payment-processing');
    const OrderManagementSystem = require('../order-management-system');
    const cart = new ShoppingCartSystem();
    const payments = new PaymentProcessing();
    const orders = new OrderManagementSystem();
    payments.register('mock', async ({ amount }) => ({ success: amount >= 0 }));
    app.post('/api/cart/add', requireTokenIfConfigured, (req, res) => {
        const id = req.headers['x-cart-id'] || req.ip;
        const { itemId, price, qty, meta } = req.body || {};
        const c = cart.addItem(id, itemId, Number(price || 0), Number(qty || 1), meta || {});
        res.json({ cart: cart.snapshot(c.id), totals: cart.total(c.id) });
    });
    app.post('/api/cart/remove', requireTokenIfConfigured, (req, res) => {
        const id = req.headers['x-cart-id'] || req.ip;
        const { itemId, qty } = req.body || {};
        const c = cart.removeItem(id, itemId, qty ? Number(qty) : null);
        res.json({ cart: cart.snapshot(c.id), totals: cart.total(c.id) });
    });
    app.get('/api/cart/:id', (req, res) => {
        const id = req.params.id;
        res.json({ cart: cart.snapshot(id), totals: cart.total(id) });
    });
    app.post('/api/orders', requireTokenIfConfigured, async (req, res) => {
        const id = req.headers['x-cart-id'] || req.ip;
        const totals = cart.total(id);
        const tx = await payments.charge({ amount: totals.total, currency: totals.currency, source: req.body?.source, gateway: req.body?.gateway || 'mock' });
        if (!tx.success) return res.status(402).json({ error: 'payment_required' });
        const o = orders.create({ cart: cart.snapshot(id), totals, payment: tx });
        cart.clear(id);
        res.status(201).json({ order: o });
    });
    app.get('/api/orders/:id', (req, res) => {
        const o = orders.get(req.params.id);
        if (!o) return res.status(404).json({ error: 'not_found' });
        res.json({ order: o });
    });
    const ProductReviewsRatings = require('../product-reviews-ratings');
    const WishlistFunctionality = require('../wishlist-functionality');
    const DiscountCodesCoupons = require('../discount-codes-coupons');
    const SubscriptionManagement = require('../subscription-management');
    const InvoiceGeneration = require('../invoice-generation');
    const ShippingIntegration = require('../shipping-integration');
    const TaxCalculation = require('../tax-calculation');
    const MultiCurrencySupport = require('../multi-currency-support');
    const reviews = new ProductReviewsRatings();
    const wishlist = new WishlistFunctionality();
    const discounts = new DiscountCodesCoupons();
    const subs = new SubscriptionManagement();
    const invoices = new InvoiceGeneration();
    const shipping = new ShippingIntegration();
    const tax = new TaxCalculation();
    const fx = new MultiCurrencySupport();
    discounts.createDiscountCode('WELCOME10', { type: 'percentage', value: 10 });
    subs.addPlan('basic', { price: 9.99, currency: 'USD' });
    shipping.register('mock', ({ qty }) => [{ service: 'standard', amount: 5 + qty }, { service: 'express', amount: 15 + qty }]);
    tax.setTaxRate('US-CA', 8.25);
    fx.setRate('USD', 'EUR', 0.92);
    app.post('/api/reviews/:itemId', requireTokenIfConfigured, (req, res) => {
        const r = reviews.add(req.params.itemId, { userId: req.body?.userId, rating: req.body?.rating, text: req.body?.text });
        res.status(201).json({ review: r, average: reviews.average(req.params.itemId) });
    });
    app.get('/api/reviews/:itemId', (req, res) => {
        res.json({ average: reviews.average(req.params.itemId), reviews: reviews.list(req.params.itemId) });
    });
    app.post('/api/wishlist', requireTokenIfConfigured, (req, res) => {
        const userId = req.body?.userId || 'guest';
        const list = wishlist.add(userId, req.body?.itemId);
        res.json({ userId, list });
    });
    app.delete('/api/wishlist', requireTokenIfConfigured, (req, res) => {
        const userId = req.body?.userId || 'guest';
        const list = wishlist.remove(userId, req.body?.itemId);
        res.json({ userId, list });
    });
    app.get('/api/wishlist/:userId', (req, res) => {
        res.json({ userId: req.params.userId, list: wishlist.list(req.params.userId) });
    });
    app.post('/api/discounts/apply', requireTokenIfConfigured, (req, res) => {
        const id = req.headers['x-cart-id'] || req.ip;
        const code = req.body?.code;
        const totals = cart.total(id);
        // Note: applyDiscountCode typically wants (code, amount, userId)
        // Here we just pass subtotal. It might throw if validFrom/validUntil checks fail (defaults are permissive though).
        try {
            const result = discounts.applyDiscountCode(code, totals.subtotal);
            res.json(result);
        } catch (e) {
            res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message });
        }
    });

    app.post('/api/subscriptions', requireTokenIfConfigured, (req, res) => {
        try {
            const subId = subs.createSubscription(req.body?.userId || 'guest', req.body?.planId || 'basic');
            res.status(201).json({ subscriptionId: subId });
        } catch (e) {
            res.status(400).json({ error: NODE_ENV === 'production' ? 'Bad request' : e.message });
        }
    });
    app.get('/api/subscriptions/:id', (req, res) => {
        const sub = subs.getSubscription(req.params.id);
        if (!sub) return res.status(404).json({ error: 'not_found' });
        res.json({ subscription: sub });
    });
    app.get('/api/invoice/:orderId', (req, res) => {
        const order = orders.get(req.params.orderId);
        if (!order) return res.status(404).json({ error: 'not_found' });
        const inv = invoices.generate(order);
        res.json({ invoice: inv });
    });
    app.get('/api/shipping/rates', (req, res) => {
        const rates = shipping.rates({ carrier: req.query?.carrier || 'mock', qty: Number(req.query?.qty || 1), weight: Number(req.query?.weight || 0) });
        res.json({ rates });
    });
    app.get('/api/tax/calc', (req, res) => {
        // Updated to use calculateSimple
        const result = tax.calculateSimple(Number(req.query?.amount || 0), req.query?.region || 'US-CA');
        res.json(result);
    });
    app.get('/api/fx/convert', (req, res) => {
        const amount = fx.convert(Number(req.query?.amount || 0), req.query?.from || 'USD', req.query?.to || 'USD');
        if (amount === null) return res.status(400).json({ error: 'rate_not_found' });
        res.json({ amount });
    });
} catch (_e) { }

// Frontend Compatibility API - Mocks for missing endpoints
try {
    const enableMockApis = process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_APIS === 'true';
    if (enableMockApis) {
        // Analytics
        app.get('/api/analytics', (req, res) => {
            res.json({
                visitors: 120,
                pageviews: 350,
                bounceRate: 0.45,
                averageSession: '2m 30s'
            });
        });

        // Booking Data
        app.get('/api/booking-data', (req, res) => {
            res.json({
                availableSlots: ['10:00', '14:00', '16:00'],
                pricing: { standard: 99, premium: 199 }
            });
        });

        // Batch Operations
        app.post('/api/batch', (req, res) => {
            res.json({ success: true, processed: (req.body?.requests || []).length });
        });

        // Logs
        app.get('/api/logs', (req, res) => {
            res.json({ logs: [{ level: 'info', message: 'System online', timestamp: new Date() }] });
        });

        app.post('/api/logs', (req, res) => {
            res.status(201).json({ success: true });
        });

        // OpenAPI
        app.get('/api/openapi.json', (req, res) => {
            res.json({ openapi: '3.0.0', info: { title: 'Adriano API', version: '1.0.0' } });
        });

        // Sync
        app.post('/api/sync', (req, res) => {
            res.json({ success: true, syncedAt: new Date() });
        });

        app.post('/api/sync/updates', (req, res) => {
            res.json({ success: true, updates: [] });
        });

        // Push
        app.post('/api/push/subscribe', (req, res) => {
            res.json({ success: true, subscriptionId: 'sub_' + Date.now() });
        });

        app.post('/api/push/unsubscribe', (req, res) => {
            res.json({ success: true });
        });

        // Protected
        app.get('/api/protected', (req, res) => {
            res.json({ message: 'Access granted', user: 'mock-user' });
        });

        // Collaboration
        app.get('/api/collaboration/presence', (req, res) => {
            res.json({ activeUsers: [] });
        });

        app.post('/api/collaboration/presence', (req, res) => {
            res.json({ success: true });
        });
    }
} catch (_e) { }

// Secure ping route with OAuth2-style Bearer token
try {
    const oauth2Auth = require('../oauth2-api-authentication');
    const API_TOKEN = process.env.API_TOKEN || null;
    if (!API_TOKEN) {
        console.warn('API_TOKEN is not set; /api/secure/ping endpoint is disabled.');
    } else {
        app.get('/api/secure/ping', oauth2Auth({ token: API_TOKEN }), (_req, res) => {
            res.json({ ok: true, version: 'v1' });
        });
    }
} catch (_e) { }

// Music files directory
const MUSIC_DIR = path.join(__dirname, 'music');

function resolveMusicPath(filename) {
    if (typeof filename !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return null;
    }
    const baseDir = path.resolve(MUSIC_DIR);
    const resolvedPath = path.resolve(baseDir, filename);
    const relative = path.relative(baseDir, resolvedPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }
    return resolvedPath;
}

// Ensure music directory exists
if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
    console.log('📁 Created music directory');
}

// Track metadata
const tracks = [
    {
        id: 1,
        name: 'Track 1: Cosmic Journey',
        filename: 'track1.mp3',
        driveId: process.env.TRACK_1_ID,
    },
    {
        id: 2,
        name: 'Track 2: Stellar Voyage',
        filename: 'track2.mp3',
        driveId: process.env.TRACK_2_ID,
    },
    {
        id: 3,
        name: 'Track 3: Galactic Odyssey',
        filename: 'track3.mp3',
        driveId: process.env.TRACK_3_ID,
    },
];

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎵 Adriano To The Star - Music Server',
        version: '1.0.0',
        endpoints: {
            tracks: '/api/tracks',
            stream: '/api/stream/:id',
            download: '/api/download/:id',
            health: '/health',
        },
    });
});

// robots.txt and sitemap.xml
try {
    const SEOOptimizationSystem = require('../seo-optimization-system');
    const seo = new SEOOptimizationSystem();
    app.get('/robots.txt', (_req, res) => {
        res.type('text/plain').send('User-agent: *\nAllow: /');
    });
    app.get('/sitemap.xml', (_req, res) => {
        const base = `http://localhost:${PORT}`;
        const xml = seo.generateSitemap([
            `${base}/`,
            `${base}/health`,
            `${base}/api/tracks`
        ]);
        res.type('application/xml').send(xml);
    });
} catch (_e) { }

// Health check
app.get('/health', (req, res) => {
    const musicFiles = fs.readdirSync(MUSIC_DIR);
    res.json({
        status: 'healthy',
        tracksAvailable: musicFiles.length,
        tracks: tracks.map((t) => ({
            id: t.id,
            name: t.name,
            downloaded: fs.existsSync(path.join(MUSIC_DIR, t.filename)),
        })),
    });
});

// Get all tracks metadata
app.get('/api/tracks', (req, res) => {
    const tracksWithStatus = tracks.map((track) => ({
        id: track.id,
        name: track.name,
        url: `http://localhost:${PORT}/api/stream/${track.id}`,
        downloaded: fs.existsSync(path.join(MUSIC_DIR, track.filename)),
    }));

    res.json({
        tracks: tracksWithStatus,
        message: tracksWithStatus.every((t) => t.downloaded)
            ? '✅ All tracks ready'
            : '⚠️ Some tracks need to be downloaded. Run: npm run download-music',
    });
});

// Stream audio file with range support (for seeking)
app.get('/api/stream/:id', (req, res) => {
    const trackId = parseInt(req.params.id, 10);
    const track = tracks.find((t) => t.id === trackId);

    if (!track) {
        return res.status(404).json({ error: 'Track not found' });
    }

    const filePath = resolveMusicPath(track.filename);
    if (!filePath) {
        return res.status(400).json({ error: 'Invalid track filename' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: 'Track file not found on server',
            message: 'Please run: npm run download-music',
        });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(String(range));
        if (!match) {
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            return res.status(416).end();
        }

        const startStr = match[1];
        const endStr = match[2];

        let start;
        let end;

        if (startStr === '' && endStr === '') {
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            return res.status(416).end();
        }

        if (startStr === '') {
            const suffixLength = Number(endStr);
            if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
                res.setHeader('Content-Range', `bytes */${fileSize}`);
                return res.status(416).end();
            }
            start = Math.max(0, fileSize - suffixLength);
            end = fileSize - 1;
        } else {
            start = Number(startStr);
            end = endStr ? Number(endStr) : fileSize - 1;
        }

        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < 0 || start > end || end >= fileSize) {
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            return res.status(416).end();
        }

        const chunksize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });

        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000',
        };

        res.writeHead(206, head);
        file.on('error', (e) => {
            console.error('Stream error:', e);
            if (!res.headersSent) {
                res.status(500).end();
            } else {
                res.destroy();
            }
        });
        file.pipe(res);
    } else {
        // Full file streaming
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000',
        };

        res.writeHead(200, head);
        const file = fs.createReadStream(filePath);
        file.on('error', (e) => {
            console.error('Stream error:', e);
            if (!res.headersSent) {
                res.status(500).end();
            } else {
                res.destroy();
            }
        });
        file.pipe(res);
    }

    console.log(`🎵 Streaming: ${track.name}`);
});

// Download endpoint (force download instead of stream)
app.get('/api/download/:id', (req, res) => {
    const trackId = parseInt(req.params.id, 10);
    const track = tracks.find((t) => t.id === trackId);

    if (!track) {
        return res.status(404).json({ error: 'Track not found' });
    }

    const filePath = resolveMusicPath(track.filename);
    if (!filePath) {
        return res.status(400).json({ error: 'Invalid track filename' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Track file not found on server' });
    }

    res.download(filePath, track.filename);
});

// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 ═══════════════════════════════════════════');
    console.log(`🎵 Music Server running on http://localhost:${PORT}`);
    console.log('🚀 ═══════════════════════════════════════════');
    console.log('');
    console.log('📡 Endpoints:');
    console.log(`   • API Docs:  http://localhost:${PORT}/`);
    console.log(`   • Health:    http://localhost:${PORT}/health`);
    console.log(`   • Tracks:    http://localhost:${PORT}/api/tracks`);
    console.log(`   • Stream:    http://localhost:${PORT}/api/stream/:id`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Run: npm run download-music');
    console.log('   2. Test: Visit http://localhost:3000/health');
    console.log('   3. Stream: Try http://localhost:3000/api/stream/1');
    console.log('');
});

module.exports = app;
