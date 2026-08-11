const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const allowedOrigins = (process.env.CORS_ORIGINS && NODE_ENV === 'production')
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : null;
const API_TOKEN = process.env.API_TOKEN || null;

function isOriginAllowed(origin) {
    if (!origin) return true;
    if (NODE_ENV !== 'production') return true;
    if (!allowedOrigins) return false;
    return allowedOrigins.includes(origin);
}

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

// Initialize Express
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
if (allowedOrigins) {
    app.use(cors({
        origin(origin, cb) {
            if (!origin) {
                return cb(null, false);
            }
            if (allowedOrigins.includes(origin)) cb(null, true);
            else cb(new Error('Not allowed by CORS'));
        }
    }));
} else if (NODE_ENV !== 'production') {
    app.use(cors({
        origin(origin, cb) {
            if (!origin) {
                return cb(null, false);
            }
            cb(null, true);
        }
    }));
}
app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Server
const wss = new WebSocketServer({
    server,
    verifyClient(info, done) {
        try {
            // Origin check (only enforced when allowlist configured)
            const origin = info.origin || info.req.headers?.origin || '';
            if (!isOriginAllowed(origin)) {
                return done(false, 403, 'Origin not allowed');
            }

            // Optional token auth in production
            if (NODE_ENV === 'production') {
                if (!API_TOKEN) {
                    return done(false, 403, 'Disabled in production unless API_TOKEN is set');
                }
                const auth = String(info.req.headers?.authorization || '');
                const bearer = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
                if (!bearer || bearer !== API_TOKEN) {
                    return done(false, 401, 'Unauthorized');
                }
            }

            return done(true);
        } catch (_e) {
            return done(false, 400, 'Bad request');
        }
    }
});

// Simulation State
const GALAXY_STATE = {
    events: [],
    weather: {}, // PlanetID -> Weather Data
    clients: 0
};

// Galactic Events Simulation Logic (Server-Side)
class ServerGalacticEventsManager {
    constructor() {
        this.activeEvents = [];
        this.history = [];
        this.eventTypes = [
            { type: 'SOLAR_FLARE', name: 'Solar Flare', probability: 0.05, duration: 1000 * 60 * 60 * 24 * 3, severity: 'medium' },
            { type: 'supernova', name: 'Supernova', probability: 0.001, duration: 1000 * 60 * 60 * 24 * 30, severity: 'critical' },
            { type: 'geomagnetic_storm', name: 'Geomagnetic Storm', probability: 0.1, duration: 1000 * 60 * 60 * 12, severity: 'low' }
        ];

        // Start Loop
        setInterval(() => this.tick(), 60000); // Check every minute
    }

    tick() {
        this.cleanupExpired();
        if (Math.random() < 0.3) { // 30% chance per minute to try triggering
            this.triggerRandomEvent();
        }
        this.broadcastState();
    }

    cleanupExpired() {
        const now = Date.now();
        const initialCount = this.activeEvents.length;
        this.activeEvents = this.activeEvents.filter(e => e.endTime > now);
        if (this.activeEvents.length !== initialCount) {
            console.log('Server - Cleared expired events');
        }
    }

    triggerRandomEvent() {
        const rand = Math.random();
        let cumulative = 0;
        const totalProb = this.eventTypes.reduce((sum, e) => sum + e.probability, 0);
        const r = rand * totalProb;

        for (const type of this.eventTypes) {
            cumulative += type.probability;
            if (r <= cumulative) {
                this.createEvent(type);
                return;
            }
        }
    }

    createEvent(def) {
        const event = {
            id: 'evt_' + Date.now(),
            type: def.type,
            name: def.name,
            severity: def.severity,
            startTime: Date.now(),
            endTime: Date.now() + def.duration
        };
        this.activeEvents.push(event);
        console.log(`🌌 Server: Triggered ${event.name}`);
    }

    broadcastState() {
        const message = JSON.stringify({ type: 'GALAXY_STATE_UPDATE', events: this.activeEvents });
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(message);
            }
        });
    }
}

const eventsManager = new ServerGalacticEventsManager();

// WebSocket Connection Handling
wss.on('connection', (ws) => {
    console.log('Client connected to Simulation Server');
    GALAXY_STATE.clients++;

    // Send initial state
    ws.send(JSON.stringify({
        type: 'INIT_STATE',
        events: eventsManager.activeEvents,
        clientCount: GALAXY_STATE.clients
    }));

    ws.on('close', () => {
        GALAXY_STATE.clients--;
    });
});

// REST API Endpoints
app.get('/api/galaxy/status', (req, res) => {
    res.json({
        activeEvents: eventsManager.activeEvents,
        clientCount: GALAXY_STATE.clients,
        timestamp: Date.now()
    });
});

app.post('/api/galaxy/trigger-event', requireTokenIfConfigured, (req, res) => {
    // Admin/Debug endpoint to force an event
    const { type } = req.body;
    const def = eventsManager.eventTypes.find(e => e.type === type || e.name === type);
    if (def) {
        eventsManager.createEvent(def);
        eventsManager.broadcastState();
        res.json({ success: true, message: `Triggered ${def.name}` });
    } else {
        res.status(400).json({ error: 'Invalid event type' });
    }
});

const PORT = process.env.SIMULATION_PORT || 3003; // Distinct from main app port
server.listen(PORT, () => {
    console.log(`🚀 Simulation Server running on http://localhost:${PORT}`);
});
