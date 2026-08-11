const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const http = require('http');
const WS = require('ws');
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const API_TOKEN = process.env.API_TOKEN || null;

function requireTokenIfConfigured(req, res, next) {
    if (NODE_ENV !== 'production') return next();
    if (!API_TOKEN) {
        return res.status(403).json({ error: 'Disabled in production unless API_TOKEN is set' });
    }
    const auth = String(req.headers.authorization || '');
    const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : auth.trim();
    if (!provided || provided !== API_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Advanced debugging and error handling
const debugMonitor = require('./debug-monitor');
const errorHandler = require('./error-handler');
const googleCloudBackend = require('./google-cloud-backend');

// Helper function to add files to archive
function addToArchive(dirPath, archivePath, archive) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const archiveEntryPath = archivePath ? `${archivePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            // Recursively add subdirectories
            addToArchive(fullPath, archiveEntryPath, archive);
        } else {
            // Add file with proper path in archive
            archive.file(fullPath, { name: `stellar-ai-cli/${archiveEntryPath}` });
        }
    });
}

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
// Cloud Run uses PORT environment variable, fallback to 3001 for local
const PORT = process.env.PORT || process.env.STELLAR_AI_PORT || 3001;
// For Cloud Run, we need to listen on 0.0.0.0 (all interfaces)
const HOST = process.env.PORT ? '0.0.0.0' : 'localhost';

const allowedOrigins = (process.env.CORS_ORIGINS && NODE_ENV === 'production')
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : null;
// Enable CORS
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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Data directories
const DATA_DIR = path.join(__dirname, 'stellar-ai-data');
const CHATS_DIR = path.join(DATA_DIR, 'chats');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const IMAGE_MIME_EXTENSION = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
};

function resolveImagePath(filename) {
    if (typeof filename !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return null;
    }
    const imagesDir = path.resolve(IMAGES_DIR);
    const resolvedPath = path.resolve(imagesDir, filename);
    const relative = path.relative(imagesDir, resolvedPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }
    return resolvedPath;
}

// Ensure directories exist
[DATA_DIR, CHATS_DIR, IMAGES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const ext = IMAGE_MIME_EXTENSION[file.mimetype];
        if (!ext) {
            return cb(new Error('Only image files are allowed'));
        }
        const uniqueName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (IMAGE_MIME_EXTENSION[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

if (NODE_ENV === 'production') {
    app.use((req, res, next) => {
        const p = String(req.path || '');
        const blocked = p.endsWith('/ecosystem.config.js') ||
            p.endsWith('/package.json') ||
            p.endsWith('.ps1') ||
            p.endsWith('.sh') ||
            p.endsWith('.py') ||
            p.endsWith('.pem') ||
            p.endsWith('.key') ||
            p.endsWith('.log');
        if (blocked) {
            return res.status(404).end();
        }
        next();
    });
}

// Serve static files from parent directory
app.use(express.static(PUBLIC_DIR, { index: false, dotfiles: 'ignore' }));

// Root endpoint - serve stellar-ai.html
app.get('/', (req, res) => {
    const htmlPath = path.join(PUBLIC_DIR, 'stellar-ai.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.json({
            message: '🌟 Stellar AI Server',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                saveChat: 'POST /api/chats/:userId',
                getChats: 'GET /api/chats/:userId',
                uploadImage: 'POST /api/upload',
                getImage: 'GET /api/images/:filename',
            },
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    const stats = {
        chatsCount: fs.readdirSync(CHATS_DIR).length,
        imagesCount: fs.readdirSync(IMAGES_DIR).length,
    };

    res.json({
        status: 'healthy',
        ...stats,
    });
});

// Save chat for user
app.post('/api/chats/:userId', requireTokenIfConfigured, (req, res) => {
    try {
        const { userId } = req.params;
        const { chats } = req.body;

        if (!userId || !chats) {
            return res.status(400).json({ error: 'Missing userId or chats' });
        }

        const safeUserId = typeof userId === 'string' && /^[a-zA-Z0-9._-]+$/.test(userId) ? userId : null;
        if (!safeUserId) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const userFile = path.join(CHATS_DIR, `${safeUserId}.json`);
        fs.writeFileSync(
            userFile,
            JSON.stringify(
                {
                    userId: safeUserId,
                    chats,
                    lastUpdate: new Date().toISOString(),
                },
                null,
                2
            )
        );

        res.json({
            success: true,
            message: 'Chats saved successfully',
            count: chats.length,
        });
    } catch (error) {
        console.error('Error saving chats:', error);
        res.status(500).json({ error: 'Failed to save chats' });
    }
});

// Get chats for user
app.get('/api/chats/:userId', requireTokenIfConfigured, (req, res) => {
    try {
        const { userId } = req.params;
        const safeUserId = typeof userId === 'string' && /^[a-zA-Z0-9._-]+$/.test(userId) ? userId : null;
        if (!safeUserId) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const userFile = path.join(CHATS_DIR, `${safeUserId}.json`);

        if (!fs.existsSync(userFile)) {
            return res.json({ chats: [] });
        }

        const data = JSON.parse(fs.readFileSync(userFile, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Error loading chats:', error);
        res.status(500).json({ error: 'Failed to load chats' });
    }
});

// Upload image
app.post('/api/upload', requireTokenIfConfigured, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/api/images/${req.file.filename}`;

        res.json({
            success: true,
            filename: req.file.filename,
            url: imageUrl,
            size: req.file.size,
            type: req.file.mimetype,
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Serve uploaded images
app.get('/api/images/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = resolveImagePath(filename);

        if (!filePath) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

// Delete old images (cleanup)
app.delete('/api/images/:filename', requireTokenIfConfigured, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = resolveImagePath(filename);

        if (!filePath) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Image deleted' });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// CLI Download endpoint - Generate and serve the CLI zip file
app.get('/api/cli/download', requireTokenIfConfigured, async (req, res) => {
    try {
        const path = require('path');
        const { execFileSync } = require('child_process');

        // Path to the packaging script
        const packageScript = path.join(__dirname, 'package-stellar-cli.js');
        const outputZip = path.join(__dirname, '..', 'stellar-ai-cli.zip');

        // Check if zip exists and is recent (less than 1 hour old)
        const fs = require('fs');
        let shouldRegenerate = true;

        if (fs.existsSync(outputZip)) {
            const stats = fs.statSync(outputZip);
            const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
            if (ageInHours < 1) {
                shouldRegenerate = false;
            }
        }

        // Generate zip if needed
        if (shouldRegenerate) {
            console.log('📦 Generating CLI zip file...');
            try {
                execFileSync(process.execPath, [packageScript], { stdio: 'inherit', cwd: __dirname, timeout: 30000 });
            } catch (error) {
                console.error('Error generating zip:', error);
                // Continue anyway, try to serve existing file
            }
        }

        // Serve the zip file
        if (fs.existsSync(outputZip)) {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="stellar-ai-cli.zip"');
            res.sendFile(outputZip);
        } else {
            res.status(404).json({ error: 'CLI package not found. Please contact support.' });
        }
    } catch (error) {
        console.error('Error serving CLI download:', error);
        res.status(500).json({
            error: 'Failed to generate CLI package',
            details: NODE_ENV === 'production' ? undefined : error.message,
        });
    }
});

const livekitTokenRateLimitByIp = new Map();

function rateLimitLivekitToken(req, res, next) {
    if (NODE_ENV !== 'production') return next();

    const windowMs = 60_000;
    const max = 20;

    const ip = req.ip || 'unknown';
    const now = Date.now();
    const bucket = livekitTokenRateLimitByIp.get(ip) || { count: 0, reset: now + windowMs };

    if (now > bucket.reset) {
        bucket.count = 0;
        bucket.reset = now + windowMs;
    }

    bucket.count += 1;
    livekitTokenRateLimitByIp.set(ip, bucket);

    if (bucket.count > max) {
        res.setHeader('Retry-After', String(Math.ceil((bucket.reset - now) / 1000)));
        return res.status(429).json({ error: 'rate_limit_exceeded', reset: bucket.reset });
    }

    next();
}

// LiveKit Access Token endpoint
app.post('/api/livekit/token', requireTokenIfConfigured, rateLimitLivekitToken, async (req, res) => {
    try {
        const { roomName, participantName, livekitUrl, apiKey, apiSecret } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ error: 'roomName and participantName are required' });
        }

        const safeRoomName = typeof roomName === 'string' && /^[a-zA-Z0-9._-]{1,128}$/.test(roomName) ? roomName : null;
        const safeParticipantName = typeof participantName === 'string' && /^[a-zA-Z0-9._-]{1,128}$/.test(participantName) ? participantName : null;
        if (!safeRoomName || !safeParticipantName) {
            return res.status(400).json({ error: 'Invalid roomName or participantName' });
        }

        if (!safeRoomName.startsWith('stellar-ai-')) {
            return res.status(400).json({ error: 'Invalid roomName prefix' });
        }

        // Use provided credentials or environment variables
        const url = NODE_ENV === 'production' ? process.env.LIVEKIT_URL : (livekitUrl || process.env.LIVEKIT_URL);
        const key = NODE_ENV === 'production' ? process.env.LIVEKIT_API_KEY : (apiKey || process.env.LIVEKIT_API_KEY);
        const secret = NODE_ENV === 'production' ? process.env.LIVEKIT_API_SECRET : (apiSecret || process.env.LIVEKIT_API_SECRET);

        if (!url || !key || !secret) {
            return res.status(400).json({
                error: 'LiveKit credentials not configured',
                message: 'Please provide livekitUrl, apiKey, and apiSecret or set environment variables'
            });
        }

        // Use official SDK to generate token
        const { AccessToken } = require('livekit-server-sdk');

        const at = new AccessToken(key, secret, {
            identity: safeParticipantName,
            ttl: '1h', // 1 hour expiration
        });

        at.addGrant({
            roomJoin: true,
            room: safeRoomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();

        res.json({
            token,
            url,
            roomName: safeRoomName,
            participantName: safeParticipantName
        });
    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        res.status(500).json({
            error: 'Failed to generate token',
            message: NODE_ENV === 'production' ? 'Failed to generate token' : error.message,
        });
    }
});

const cerebrasRateLimitByIp = new Map();

function rateLimitCerebras(req, res, next) {
    if (NODE_ENV !== 'production') return next();

    const windowMs = 60_000;
    const max = 30;

    const ip = req.ip || 'unknown';
    const now = Date.now();
    const bucket = cerebrasRateLimitByIp.get(ip) || { count: 0, reset: now + windowMs };

    if (now > bucket.reset) {
        bucket.count = 0;
        bucket.reset = now + windowMs;
    }

    bucket.count += 1;
    cerebrasRateLimitByIp.set(ip, bucket);

    if (bucket.count > max) {
        res.setHeader('Retry-After', String(Math.ceil((bucket.reset - now) / 1000)));
        return res.status(429).json({ error: 'rate_limit_exceeded', reset: bucket.reset });
    }

    next();
}

app.post('/api/cerebras/chat', requireTokenIfConfigured, rateLimitCerebras, async (req, res) => {
    try {
        const body = req.body || {};
        const apiKey = NODE_ENV === 'production'
            ? process.env.CEREBRAS_API_KEY
            : (body.apiKey || process.env.CEREBRAS_API_KEY);

        if (!apiKey) {
            return res.status(400).json({ error: 'cerebras_api_key_missing' });
        }

        const model = (typeof body.model === 'string' && body.model.trim())
            ? body.model.trim()
            : 'qwen-3-235b-a22b-instruct-2507';
        const temperature = (typeof body.temperature === 'number' && Number.isFinite(body.temperature))
            ? body.temperature
            : 0.7;
        const max_tokens = Number.isFinite(body.max_tokens)
            ? Number(body.max_tokens)
            : 600;

        if (!Array.isArray(body.messages) || body.messages.length === 0) {
            return res.status(400).json({ error: 'messages_required' });
        }

        const messages = body.messages
            .slice(-20)
            .map((m) => ({
                role: (m && typeof m.role === 'string') ? m.role : 'user',
                content: (m && typeof m.content === 'string') ? m.content : String((m && m.content) || '')
            }))
            .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0);

        if (messages.length === 0) {
            return res.status(400).json({ error: 'messages_required' });
        }

        const upstream = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens
            })
        });

        const rawText = await upstream.text();
        if (!upstream.ok) {
            return res.status(upstream.status).json({
                error: 'cerebras_api_error',
                status: upstream.status,
                message: upstream.statusText,
                details: NODE_ENV === 'production' ? undefined : rawText
            });
        }

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (_e) {
            return res.status(502).json({
                error: 'cerebras_bad_response',
                details: NODE_ENV === 'production' ? undefined : rawText
            });
        }

        const content = data && data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content
            : null;

        if (!content) {
            return res.status(502).json({ error: 'cerebras_empty_response' });
        }

        return res.json({ content });
    } catch (error) {
        console.error('Error calling Cerebras:', error);
        return res.status(500).json({
            error: 'cerebras_proxy_error',
            message: NODE_ENV === 'production' ? 'Cerebras proxy error' : error.message
        });
    }
});

// Error handling middleware with advanced debugging
app.use(async (err, req, res, next) => {
    // Use error handler for automatic recovery
    const handled = await errorHandler.handleError(err, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
    });

    debugMonitor.log('error', 'Express error caught', {
        error: err,
        path: req.path,
        method: req.method,
        handled
    });

    res.status(500).json({
        error: 'Internal server error',
        message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
        handled: handled.success || false
    });
});

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize Gemini Live WebSocket proxy
const { createGeminiLiveProxy } = require('./gemini-live-proxy');
createGeminiLiveProxy(server);

// Setup debug endpoints
const setupDebugEndpoints = require('./debug-endpoint');
setupDebugEndpoints(app, { authMiddleware: requireTokenIfConfigured });

// Initialize auto-recovery
const autoRecovery = require('./auto-recovery');

// Start server
server.listen(PORT, HOST, () => {
    console.log('🌟 ═══════════════════════════════════════════');
    console.log(`   Stellar AI Server running on port ${PORT}`);
    console.log('🌟 ═══════════════════════════════════════════');
    console.log('');
    console.log('📡 Endpoints:');
    console.log(`   • API Docs:  http://localhost:${PORT}/`);
    console.log(`   • Health:    http://localhost:${PORT}/health`);
    console.log(`   • Save Chat: POST /api/chats/:userId`);
    console.log(`   • Get Chats: GET /api/chats/:userId`);
    console.log(`   • Upload:    POST /api/upload`);
    console.log(`   • Gemini Live: ws://localhost:${PORT}/api/gemini-live`);
    console.log('');
    console.log(`📁 Data stored in: ${DATA_DIR}`);
    console.log('');
    console.log('💡 Note: Gemini API uses simple API key (no Google Cloud required)');
    console.log(`   Set GEMINI_API_KEY or GOOGLE_AI_API_KEY in .env file`);
    console.log('');
});

module.exports = app;
