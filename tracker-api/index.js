const express = require('express');
const { Pool } = require('pg');

const PORT = process.env.PORT || 8080;
const REQUIRED_KEY = process.env.TRACKER_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!REQUIRED_KEY) {
    console.warn(' TRACKER_API_KEY is not defined. Requests will be rejected.');
}

const poolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    keepAlive: true
};

if (process.env.DB_HOST) {
    poolConfig.host = process.env.DB_HOST;
    poolConfig.port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
} else if (process.env.DB_INSTANCE) {
    poolConfig.host = `/cloudsql/${process.env.DB_INSTANCE}`;
} else {
    poolConfig.host = '127.0.0.1';
    poolConfig.port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
}

if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);
const app = express();

app.disable('x-powered-by');
if (NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});

// CORS middleware - allow requests from GitLab Pages and localhost
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://adybag14-group.gitlab.io',
        'https://starisdons-d53656.gitlab.io',
        ...(NODE_ENV === 'production' ? [] : [
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ])
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

const requireAuth = (req, res, next) => {
    if (!REQUIRED_KEY) {
        return res.status(500).json({ error: 'Server is not configured with TRACKER_API_KEY.' });
    }
    const token = req.headers.authorization?.replace('Bearer ', '')?.trim();
    if (token !== REQUIRED_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

const sanitizePayload = (payload = {}) => {
    const safeString = (value, fallback, { maxLen = 256, pattern = null } = {}) => {
        if (typeof value !== 'string') return fallback;
        const trimmed = value.trim();
        if (!trimmed) return fallback;
        if (trimmed.length > maxLen) return fallback;
        if (pattern && !pattern.test(trimmed)) return fallback;
        return trimmed;
    };

    const safeNumber = (value, fallback, { min = null, max = null } = {}) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        if (min !== null && parsed < min) return fallback;
        if (max !== null && parsed > max) return fallback;
        return parsed;
    };

    return {
        deviceId: safeString(payload.deviceId, 'primary-phone', {
            maxLen: 128,
            pattern: /^[a-zA-Z0-9._-]+$/
        }),
        lat: safeNumber(payload.lat, null, { min: -90, max: 90 }),
        lng: safeNumber(payload.lng, null, { min: -180, max: 180 }),
        battery: safeNumber(payload.battery, null, { min: 0, max: 100 }),
        connection: safeString(payload.connection, 'Unknown', { maxLen: 64 }),
        mode: safeString(payload.mode, 'Unknown', { maxLen: 64 }),
        note: safeString(payload.note, '', { maxLen: 1024 })
    };
};

app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/tracker/update', requireAuth, async (req, res) => {
    const payload = sanitizePayload(req.body);

    if (payload.lat === null || payload.lng === null) {
        return res.status(400).json({ error: 'lat and lng are required numbers' });
    }

    try {
        await pool.query(
            `INSERT INTO device_history (device_id, lat, lng, battery, connection, mode, note)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [payload.deviceId, payload.lat, payload.lng, payload.battery, payload.connection, payload.mode, payload.note]
        );

        await pool.query(
            `INSERT INTO device_status (device_id, last_lat, last_lng, battery, connection, mode, note, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
             ON CONFLICT (device_id)
             DO UPDATE SET last_lat = EXCLUDED.last_lat,
                           last_lng = EXCLUDED.last_lng,
                           battery = EXCLUDED.battery,
                           connection = EXCLUDED.connection,
                           mode = EXCLUDED.mode,
                           note = EXCLUDED.note,
                           updated_at = NOW()`,
            [payload.deviceId, payload.lat, payload.lng, payload.battery, payload.connection, payload.mode, payload.note]
        );

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Tracker update failed', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/tracker/status', requireAuth, async (req, res) => {
    const deviceIdRaw = typeof req.query.deviceId === 'string' ? req.query.deviceId.trim() : '';
    const safeDeviceId = deviceIdRaw
        ? (/^[a-zA-Z0-9._-]{1,128}$/.test(deviceIdRaw) ? deviceIdRaw : null)
        : 'primary-phone';
    if (!safeDeviceId) {
        return res.status(400).json({ error: 'Invalid deviceId' });
    }
    try {
        const { rows } = await pool.query(
            `SELECT device_id, last_lat, last_lng, battery, connection, mode, note, updated_at
             FROM device_status
             WHERE device_id = $1`,
            [safeDeviceId]
        );
        res.json(rows[0] || null);
    } catch (error) {
        console.error('Status lookup failed', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/tracker/history', requireAuth, async (req, res) => {
    const deviceIdRaw = typeof req.query.deviceId === 'string' ? req.query.deviceId.trim() : '';
    const safeDeviceId = deviceIdRaw
        ? (/^[a-zA-Z0-9._-]{1,128}$/.test(deviceIdRaw) ? deviceIdRaw : null)
        : 'primary-phone';
    if (!safeDeviceId) {
        return res.status(400).json({ error: 'Invalid deviceId' });
    }

    const limitRaw = typeof req.query.limit === 'string' ? req.query.limit.trim() : '';
    const parsedLimit = Number.parseInt(limitRaw, 10);
    const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 50;
    try {
        const { rows } = await pool.query(
            `SELECT device_id, lat, lng, battery, connection, mode, note, reported_at
             FROM device_history
             WHERE device_id = $1
             ORDER BY reported_at DESC
             LIMIT $2`,
            [safeDeviceId, limit]
        );
        res.json(rows);
    } catch (error) {
        console.error('History lookup failed', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.use((err, _req, res, _next) => {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
    console.log(`Tracker API listening on port ${PORT}`);
});

