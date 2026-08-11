/**
 * Authentication Backend Server
 * Handles user registration, login, JWT tokens, groups, and posts
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.AUTH_PORT || 3000;

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'your-secret-key-change-in-production');
const DATA_DIR = path.join(__dirname, 'database');
const LOGS_DIR = path.join(__dirname, 'logs');

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
}

// Ensure directories exist
[DATA_DIR, LOGS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

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
} catch (_e) {}

// Logging middleware
function logAccess(req, res, next) {
    const timestamp = new Date().toISOString();
    // Get IP address safely (req.ip might not be available without trust proxy)
    const ip =
        req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const logEntry = `[${timestamp}] ${req.method} ${req.path} - IP: ${ip}\n`;
    try {
        fs.appendFileSync(path.join(LOGS_DIR, 'access.log'), logEntry);
    } catch (error) {
        console.error('Error writing to access log:', error);
    }
    next();
}

function logError(error, req) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${error.message}\n${error.stack}\n\n`;
    try {
        fs.appendFileSync(path.join(LOGS_DIR, 'error.log'), logEntry);
    } catch (logErr) {
        console.error('Error writing to error log:', logErr);
    }
}

app.use(logAccess);

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

// Load data functions
function loadUsers() {
    const usersPath = path.join(DATA_DIR, 'users.json');
    if (fs.existsSync(usersPath)) {
        try {
            return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        } catch (_e) {
            return [];
        }
    }
    return [];
}

function saveUsers(users) {
    const usersPath = path.join(DATA_DIR, 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

function loadGroups() {
    const groupsPath = path.join(DATA_DIR, 'groups.json');
    if (fs.existsSync(groupsPath)) {
        try {
            return JSON.parse(fs.readFileSync(groupsPath, 'utf8'));
        } catch (_e) {
            return [];
        }
    }
    // Initialize default groups
    const defaultGroups = [
        {
            id: 1,
            name: 'Cosmic Explorers',
            description: 'Main community for all space enthusiasts',
            members: [],
            posts: [],
        },
    ];
    saveGroups(defaultGroups);
    return defaultGroups;
}

function saveGroups(groups) {
    const groupsPath = path.join(DATA_DIR, 'groups.json');
    fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));
}

function loadPosts() {
    const postsPath = path.join(DATA_DIR, 'posts.json');
    if (fs.existsSync(postsPath)) {
        try {
            return JSON.parse(fs.readFileSync(postsPath, 'utf8'));
        } catch (_e) {
            return [];
        }
    }
    return [];
}

function savePosts(posts) {
    const postsPath = path.join(DATA_DIR, 'posts.json');
    fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
}

// ===== AUTHENTICATION ENDPOINTS =====

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const users = loadUsers();

        // Check if username already exists
        if (users.find((u) => u.username === username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Check if email already exists
        if (users.find((u) => u.email === email)) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        console.log(`📝 Registration attempt: ${username} (${email})`);
        console.log('🔒 Hashing password...');

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
            username,
            email,
            password: hashedPassword,
            fullName: fullName || username,
            createdAt: new Date().toISOString(),
            groups: [1], // Auto-join main group
        };

        users.push(newUser);
        saveUsers(users);

        // Add user to main group
        const groups = loadGroups();
        const mainGroup = groups.find((g) => g.id === 1);
        if (mainGroup && !mainGroup.members.includes(newUser.id)) {
            mainGroup.members.push(newUser.id);
            saveGroups(groups);
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✓ User registered successfully: ${username}`);

        // Return user (without password)
        const { password: _, ...userWithoutPassword } = newUser;
        res.json({
            success: true,
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('✗ Registration error:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        console.log(`🔑 Login attempt: ${username}`);

        const users = loadUsers();

        // Find user by username or email
        const user = users.find((u) => u.username === username || u.email === username);

        if (!user) {
            console.log('✗ User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('✗ Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✓ Login successful: ${user.username}`);

        // Return user (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('✗ Login error:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
        const users = loadUsers();
        const user = users.find((u) => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('✗ Error loading user:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== GROUPS ENDPOINTS =====

// Get all groups
app.get('/api/groups', (req, res) => {
    try {
        const groups = loadGroups();
        res.json(groups);
    } catch (error) {
        console.error('✗ Error loading groups:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join a group
app.post('/api/groups/:groupId/join', authenticateToken, (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId, 10);
        const userId = req.user.id;

        const groups = loadGroups();
        const group = groups.find((g) => g.id === groupId);

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        if (group.members.includes(userId)) {
            return res.status(409).json({ error: 'Already a member of this group' });
        }

        group.members.push(userId);
        saveGroups(groups);

        // Update user's groups
        const users = loadUsers();
        const user = users.find((u) => u.id === userId);
        if (user && !user.groups.includes(groupId)) {
            user.groups.push(groupId);
            saveUsers(users);
        }

        res.json({ success: true, message: 'Joined group successfully' });
    } catch (error) {
        console.error('✗ Error joining group:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===== POSTS ENDPOINTS =====

// Get all posts (optionally filtered by group)
app.get('/api/posts', (req, res) => {
    try {
        const groupId = req.query.groupId ? parseInt(req.query.groupId, 10) : null;
        let posts = loadPosts();

        if (groupId) {
            posts = posts.filter((p) => p.groupId === groupId);
        }

        res.json(posts);
    } catch (error) {
        console.error('✗ Error loading posts:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a post
app.post('/api/posts', authenticateToken, (req, res) => {
    try {
        const { groupId, content } = req.body;
        const userId = req.user.id;

        const groupIdNum = Number.parseInt(String(groupId), 10);
        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        if (!Number.isInteger(groupIdNum) || groupIdNum <= 0) {
            return res.status(400).json({ error: 'Invalid groupId' });
        }
        if (!trimmedContent) {
            return res.status(400).json({ error: 'Post content is required' });
        }
        if (trimmedContent.length > 5000) {
            return res.status(413).json({ error: 'Post content too long' });
        }

        const groups = loadGroups();
        const group = groups.find((g) => g.id === groupIdNum);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const users = loadUsers();
        const user = users.find((u) => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMember = (Array.isArray(user.groups) && user.groups.includes(groupIdNum)) ||
            (Array.isArray(group.members) && group.members.includes(userId));
        if (!isMember) {
            return res.status(403).json({ error: 'You must join the group before posting' });
        }

        const posts = loadPosts();
        const newPost = {
            id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
            groupId: groupIdNum,
            authorId: userId,
            authorName: req.user.username,
            content: trimmedContent,
            likes: 0,
            comments: [],
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        posts.push(newPost);
        savePosts(posts);

        console.log(`✓ Post created: ${newPost.id} by ${req.user.username}`);

        res.json(newPost);
    } catch (error) {
        console.error('✗ Error creating post:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Like a post
app.post('/api/posts/:postId/like', authenticateToken, (req, res) => {
    try {
        const postId = parseInt(req.params.postId, 10);
        if (!Number.isInteger(postId)) {
            return res.status(400).json({ error: 'Invalid postId' });
        }
        const posts = loadPosts();
        const post = posts.find((p) => p.id === postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const groupIdNum = Number.parseInt(String(post.groupId), 10);
        if (!Number.isInteger(groupIdNum) || groupIdNum <= 0) {
            return res.status(400).json({ error: 'Invalid post groupId' });
        }

        const groups = loadGroups();
        const group = groups.find((g) => g.id === groupIdNum);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const users = loadUsers();
        const user = users.find((u) => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMember = (Array.isArray(user.groups) && user.groups.includes(groupIdNum)) ||
            (Array.isArray(group.members) && group.members.includes(req.user.id));
        if (!isMember) {
            return res.status(403).json({ error: 'You must join the group to interact with posts' });
        }

        post.likes = (post.likes || 0) + 1;
        savePosts(posts);

        res.json({ likes: post.likes });
    } catch (error) {
        console.error('✗ Error liking post:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add comment to post
app.post('/api/posts/:postId/comments', authenticateToken, (req, res) => {
    try {
        const postId = parseInt(req.params.postId, 10);
        const { content } = req.body;

        if (!Number.isInteger(postId)) {
            return res.status(400).json({ error: 'Invalid postId' });
        }

        const trimmedContent = typeof content === 'string' ? content.trim() : '';

        if (!trimmedContent) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        if (trimmedContent.length > 2000) {
            return res.status(413).json({ error: 'Comment content too long' });
        }

        const posts = loadPosts();
        const post = posts.find((p) => p.id === postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const groupIdNum = Number.parseInt(String(post.groupId), 10);
        if (!Number.isInteger(groupIdNum) || groupIdNum <= 0) {
            return res.status(400).json({ error: 'Invalid post groupId' });
        }

        const groups = loadGroups();
        const group = groups.find((g) => g.id === groupIdNum);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const users = loadUsers();
        const user = users.find((u) => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMember = (Array.isArray(user.groups) && user.groups.includes(groupIdNum)) ||
            (Array.isArray(group.members) && group.members.includes(req.user.id));
        if (!isMember) {
            return res.status(403).json({ error: 'You must join the group to interact with posts' });
        }

        if (!post.comments) {
            post.comments = [];
        }

        const newComment = {
            id: post.comments.length > 0 ? Math.max(...post.comments.map((c) => c.id)) + 1 : 1,
            authorId: req.user.id,
            authorName: req.user.username,
            content: trimmedContent,
            createdAt: new Date().toISOString(),
        };

        post.comments.push(newComment);
        savePosts(posts);

        res.json(newComment);
    } catch (error) {
        console.error('✗ Error adding comment:', error);
        logError(error, req);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🔐 ADRIANO TO THE STAR - Authentication Server',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            me: 'GET /api/auth/me',
            groups: 'GET /api/groups',
            joinGroup: 'POST /api/groups/:id/join',
            posts: 'GET /api/posts',
            createPost: 'POST /api/posts',
            likePost: 'POST /api/posts/:id/like',
            addComment: 'POST /api/posts/:id/comments',
        },
    });
});

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        server: 'Authentication Server',
        port: PORT,
        timestamp: new Date().toISOString(),
    });
});

// Start server
app.listen(PORT, () => {
    console.log('============================================================');
    console.log('🚀 ADRIANO TO THE STAR - Backend Server');
    console.log('============================================================');
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Database directory: ${DATA_DIR}`);
    console.log(`✓ Logs directory: ${LOGS_DIR}`);
    console.log('✓ JWT encryption enabled');
    console.log('✓ Password hashing: bcrypt (12 rounds)');
    console.log('============================================================');
});
