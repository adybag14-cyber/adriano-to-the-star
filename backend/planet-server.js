/**
 * Planet Claiming Backend Server
 * Handles exoplanet claiming, user claims, and dashboard data
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Unused - JWT used instead

require('dotenv').config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PLANET_PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'your-secret-key-change-in-production');
const DATA_DIR = path.join(__dirname, 'database');

let claimsWriteChain = Promise.resolve();
function withClaimsWriteLock(fn) {
    const run = claimsWriteChain.then(() => fn());
    claimsWriteChain = run.catch(() => { });
    return run;
}

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
}

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
if (NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});

const allowedOrigins = (process.env.CORS_ORIGINS && NODE_ENV === 'production')
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : null;

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
try {
    const apiVersioning = require('../api-versioning');
    const createRateLimiter = require('../api-rate-limiting-per-key');
    app.use(apiVersioning({ defaultVersion: 'v1' }));
    app.use(createRateLimiter({ windowMs: 60000, max: 300 }));
} catch (_e) { }

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Load users database
function loadUsers() {
    const usersPath = path.join(DATA_DIR, 'users.json');
    if (fs.existsSync(usersPath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse users.json:', e.message);
            return [];
        }
    }
    return [];
}

// Load claims database
function loadClaims() {
    const claimsPath = path.join(DATA_DIR, 'claims.json');
    if (fs.existsSync(claimsPath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(claimsPath, 'utf8'));
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse claims.json:', e.message);
            return [];
        }
    }
    return [];
}

// Save claims database
function saveClaims(claims) {
    const claimsPath = path.join(DATA_DIR, 'claims.json');
    fs.writeFileSync(claimsPath, JSON.stringify(claims, null, 2));
}

// Get user by ID (unused but kept for potential future use)
function _getUserById(userId) {
    const users = loadUsers();
    return users.find((u) => u.id === userId);
}

function normalizeKepid(kepid) {
    if (typeof kepid === 'number' && Number.isFinite(kepid)) return String(kepid);
    if (typeof kepid === 'string') return kepid.trim();
    return '';
}

// Check if planet is already claimed
function isPlanetClaimed(kepid, claimsInput, excludeUserId) {
    const target = normalizeKepid(kepid);
    if (!target) return false;
    const claims = Array.isArray(claimsInput) ? claimsInput : loadClaims();
    return claims.some((c) => normalizeKepid(c.kepid) === target && c.status === 'active' && (!excludeUserId || c.userId !== excludeUserId));
}

// Get planet by kepid (from merged database)
function getPlanetData(kepid) {
    // This would ideally query the actual database
    // For now, return basic structure
    return {
        kepid: kepid,
        kepler_name: `Kepler-${kepid}`,
        kepoi_name: `KOI-${kepid}`,
        status: 'CONFIRMED',
        type: 'Unknown',
        radius: 1.0,
        distance: 1000,
    };
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    const claims = loadClaims();
    res.json({
        status: 'healthy',
        totalClaims: claims.length,
        activeClaims: claims.filter((c) => c.status === 'active').length,
    });
});

// Claim a planet
app.post('/api/planets/claim', authenticateToken, async (req, res) => {
    const { kepid } = req.body;
    const userId = req.user.id;

    if (!kepid) {
        return res.status(400).json({ error: 'Planet ID (kepid) is required' });
    }

    const safeKepid = normalizeKepid(kepid);
    if (!/^\d{1,20}$/.test(safeKepid)) {
        return res.status(400).json({ error: 'Invalid kepid' });
    }

    try {
        return await withClaimsWriteLock(async () => {
            const claims = loadClaims();

            // Check if already claimed
            if (isPlanetClaimed(safeKepid, claims, userId)) {
                return res.status(409).json({
                    error: 'This planet is already claimed by another user',
                    success: false,
                });
            }

            // Check if user already claimed this planet
            const userClaim = claims.find((c) => normalizeKepid(c.kepid) === safeKepid && c.userId === userId);

            if (userClaim) {
                if (userClaim.status === 'active') {
                    return res.status(409).json({
                        error: 'You have already claimed this planet',
                        success: false,
                    });
                } else {
                    // Reactivate claim
                    userClaim.status = 'active';
                    userClaim.claimedAt = new Date().toISOString();
                    saveClaims(claims);

                    return res.json({
                        success: true,
                        message: 'Planet claim reactivated',
                        planet: getPlanetData(safeKepid),
                        claim: userClaim,
                    });
                }
            }

            // Create new claim
            const newClaim = {
                id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userId,
                username: req.user.username,
                kepid: safeKepid,
                planet: getPlanetData(safeKepid),
                status: 'active',
                claimedAt: new Date().toISOString(),
                certificate: {
                    number: `CERT-${Date.now()}`,
                    issued: new Date().toISOString(),
                },
            };

            claims.push(newClaim);
            saveClaims(claims);

            console.log(`✅ Planet claimed: ${kepid} by user ${req.user.username}`);

            return res.json({
                success: true,
                message: 'Planet claimed successfully',
                planet: newClaim.planet,
                claim: newClaim,
            });
        });
    } catch (err) {
        console.error('❌ Server error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
        });
    }
});

// Get user's claimed planets
app.get('/api/planets/my-claims', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const claims = loadClaims();

    const userClaims = claims
        .filter((c) => c.userId === userId && c.status === 'active')
        .map((c) => ({
            id: c.id,
            kepid: c.kepid,
            planet: c.planet,
            claimedAt: c.claimedAt,
            certificate: c.certificate,
        }));

    res.json({
        success: true,
        claims: userClaims,
        count: userClaims.length,
    });
});

// Get all claims (admin or public stats)
app.get('/api/planets/claims', (req, res) => {
    const claims = loadClaims();
    const activeClaims = claims.filter((c) => c.status === 'active');

    res.json({
        success: true,
        totalClaims: activeClaims.length,
        claims: activeClaims.map((c) => ({
            kepid: c.kepid,
            username: c.username,
            claimedAt: c.claimedAt,
        })),
    });
});

// Check if specific planet is claimed
app.get('/api/planets/:kepid/status', (req, res) => {
    const { kepid } = req.params;
    const safeKepid = normalizeKepid(kepid);
    if (!/^\d{1,20}$/.test(safeKepid)) {
        return res.status(400).json({ error: 'Invalid kepid' });
    }
    const claims = loadClaims();

    const claim = claims.find((c) => normalizeKepid(c.kepid) === safeKepid && c.status === 'active');

    res.json({
        claimed: !!claim,
        claim: claim
            ? {
                  username: claim.username,
                  claimedAt: claim.claimedAt,
              }
            : null,
    });
});

// Get user dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const claims = loadClaims();
    const users = loadUsers();

    const userClaims = claims.filter((c) => c.userId === userId && c.status === 'active');
    const user = users.find((u) => u.id === userId);

    // Calculate statistics
    const stats = {
        totalClaimed: userClaims.length,
        confirmedPlanets: userClaims.filter((c) => c.planet.status === 'CONFIRMED').length,
        candidatePlanets: userClaims.filter((c) => c.planet.status === 'CANDIDATE').length,
        earthLike: userClaims.filter((c) => c.planet.radius >= 0.8 && c.planet.radius <= 1.2)
            .length,
        gasGiants: userClaims.filter((c) => c.planet.radius > 3.0).length,
        superEarths: userClaims.filter((c) => c.planet.radius > 1.2 && c.planet.radius <= 3.0)
            .length,
        memberSince: user ? user.createdAt : null,
        username: req.user.username,
        email: req.user.email,
    };

    res.json({
        success: true,
        stats: stats,
        claims: userClaims,
    });
});

// Error handling
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
    console.log(`🌍 Planet Claiming Server running on port ${PORT}`);
    console.log('🚀 ═══════════════════════════════════════════');
    console.log('');
    console.log('📡 Endpoints:');
    console.log(`   • Health:     http://localhost:${PORT}/health`);
    console.log(`   • Claim:       POST /api/planets/claim`);
    console.log(`   • My Claims:   GET /api/planets/my-claims`);
    console.log(`   • All Claims:  GET /api/planets/claims`);
    console.log(`   • Dashboard:   GET /api/dashboard/stats`);
    console.log('');
});

module.exports = app;
