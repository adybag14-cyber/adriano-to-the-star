const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 120000;
const ALLOWED_ORIGINS = new Set([
  'https://adrianotothestar.com',
  'https://www.adrianotothestar.com',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002'
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://adrianotothestar.com';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function text(data, status, headers, contentType = 'text/plain; charset=utf-8') {
  return new Response(data, { status, headers: { ...headers, 'Content-Type': contentType, 'Cache-Control': 'no-store' } });
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

async function derivePasswordHash(password, saltHex, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: hexToBytes(saltHex),
    iterations
  }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name || row.username,
    app_metadata: {},
    user_metadata: { username: row.username, full_name: row.full_name || row.username },
    groups: []
  };
}

async function issueSession(env, userId) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;
  await env.DB.prepare(
    'INSERT INTO sessions (id, token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), tokenHash, userId, now, expiresAt).run();
  return { token, expiresAt };
}

function bearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : '';
}

async function authenticatedUser(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`
    SELECT u.id, u.username, u.email, u.full_name, s.id AS session_id, s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, now).first();
  return row ? { ...publicUser(row), sessionId: row.session_id, tokenHash, expiresAt: row.expires_at } : null;
}

async function parseJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function handleRegister(request, env, headers) {
  const body = await parseJson(request);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, 400, headers);
  const username = clean(body.username);
  const email = clean(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = clean(body.fullName) || username;
  if (username.length < 3 || username.length > 40) return json({ success: false, error: 'Username must be 3-40 characters' }, 400, headers);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, error: 'Please enter a valid email address' }, 400, headers);
  if (password.length < 8 || password.length > 256) return json({ success: false, error: 'Password must be at least 8 characters' }, 400, headers);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE LIMIT 1').bind(username, email).first();
  if (existing) return json({ success: false, error: 'That username or email is already registered' }, 409, headers);

  const id = crypto.randomUUID();
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const passwordHash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO users (id, username, email, full_name, password_hash, password_salt, password_iterations, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, username, email, fullName, passwordHash, salt, PASSWORD_ITERATIONS, now, now).run();
  } catch (error) {
    if (/UNIQUE/i.test(error.message || '')) return json({ success: false, error: 'That username or email is already registered' }, 409, headers);
    throw error;
  }
  const session = await issueSession(env, id);
  return json({ success: true, user: { id, username, email, fullName, app_metadata: {}, user_metadata: { username, full_name: fullName }, groups: [] }, token: session.token, expiresAt: session.expiresAt }, 201, headers);
}

async function handleLogin(request, env, headers) {
  const body = await parseJson(request);
  if (!body) return json({ success: false, error: 'Invalid JSON body' }, 400, headers);
  const identifier = clean(body.username || body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!identifier || !password) return json({ success: false, error: 'Username/email and password are required' }, 400, headers);
  const user = await env.DB.prepare(`
    SELECT id, username, email, full_name, password_hash, password_salt, password_iterations
    FROM users WHERE lower(username) = ? OR lower(email) = ? LIMIT 1
  `).bind(identifier, identifier).first();
  if (!user) return json({ success: false, error: 'Invalid credentials' }, 401, headers);
  const candidate = await derivePasswordHash(password, user.password_salt, user.password_iterations || PASSWORD_ITERATIONS);
  if (candidate !== user.password_hash) return json({ success: false, error: 'Invalid credentials' }, 401, headers);
  const session = await issueSession(env, user.id);
  return json({ success: true, user: publicUser(user), token: session.token, expiresAt: session.expiresAt }, 200, headers);
}

async function handleMe(request, env, headers) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ success: false, error: 'Unauthorized' }, 401, headers);
  const { sessionId, tokenHash, expiresAt, ...safeUser } = user;
  return json({ success: true, user: safeUser, expiresAt }, 200, headers);
}

async function handleLogout(request, env, headers) {
  const token = bearerToken(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  return json({ success: true }, 200, headers);
}

async function handleMyClaims(request, env, headers) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ success: false, error: 'Unauthorized' }, 401, headers);
  const result = await env.DB.prepare(`
    SELECT id, user_id, username, email, kepid, planet_data, status, claimed_at, certificate_number, created_at, updated_at
    FROM planet_claims WHERE user_id = ? AND status = 'active' ORDER BY claimed_at DESC
  `).bind(user.id).all();
  const claims = (result.results || []).map(row => ({ ...row, planet_data: row.planet_data ? safeJson(row.planet_data) : null }));
  return json({ success: true, claims }, 200, headers);
}

function safeJson(value) {
  try { return JSON.parse(value); } catch { return value; }
}

async function handleClaim(request, env, headers) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ success: false, error: 'Unauthorized' }, 401, headers);
  const body = await parseJson(request);
  const kepid = body && (typeof body.kepid === 'number' || typeof body.kepid === 'string') ? String(body.kepid).trim() : '';
  if (!kepid || kepid.length > 80) return json({ success: false, error: 'Missing or invalid KEPID' }, 400, headers);
  const existing = await env.DB.prepare("SELECT * FROM planet_claims WHERE user_id = ? AND kepid = ? AND status = 'active' LIMIT 1").bind(user.id, kepid).first();
  if (existing) return json({ success: true, planet: existing, alreadyClaimed: true }, 200, headers);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const certificate = `ITA-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const planetData = body.planet ? JSON.stringify(body.planet).slice(0, 200000) : null;
  await env.DB.prepare(`
    INSERT INTO planet_claims (id, user_id, username, email, kepid, planet_data, status, claimed_at, certificate_number, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
  `).bind(id, user.id, user.username, user.email, kepid, planetData, now, certificate, now, now).run();
  return json({ success: true, planet: { id, user_id: user.id, username: user.username, email: user.email, kepid, planet_data: body.planet || null, status: 'active', claimed_at: now, certificate_number: certificate } }, 201, headers);
}

async function handleFavorites(request, env, headers) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ success: false, error: 'Unauthorized' }, 401, headers);
  if (request.method === 'GET') {
    const result = await env.DB.prepare('SELECT kepid, created_at FROM planet_favorites WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all();
    return json({ success: true, favorites: result.results || [] }, 200, headers);
  }
  const body = await parseJson(request);
  const kepid = body && body.kepid != null ? String(body.kepid).trim() : '';
  if (!kepid) return json({ success: false, error: 'Missing KEPID' }, 400, headers);
  if (request.method === 'POST') {
    await env.DB.prepare('INSERT OR IGNORE INTO planet_favorites (user_id, kepid, created_at) VALUES (?, ?, ?)').bind(user.id, kepid, new Date().toISOString()).run();
    return json({ success: true }, 200, headers);
  }
  await env.DB.prepare('DELETE FROM planet_favorites WHERE user_id = ? AND kepid = ?').bind(user.id, kepid).run();
  return json({ success: true }, 200, headers);
}

function safeSegment(value, fallback = 'anonymous') {
  const normalized = clean(String(value || '')).replace(/[^a-zA-Z0-9_.@-]/g, '_').slice(0, 120);
  return normalized || fallback;
}

async function handleGameSave(request, env, headers) {
  const body = await parseJson(request);
  if (!body || body.gameData == null) return json({ success: false, error: 'Missing gameData' }, 400, headers);
  const user = await authenticatedUser(request, env);
  const userId = safeSegment(user?.id || body.userId || request.headers.get('CF-Connecting-IP'));
  const timestamp = new Date().toISOString();
  const saveId = safeSegment(body.saveName || `save_${timestamp.replace(/[:.]/g, '-')}`);
  const passwordHash = body.password ? await sha256Hex(String(body.password)) : null;
  const serialized = JSON.stringify(body.gameData);
  if (new TextEncoder().encode(serialized).byteLength > 2_000_000) {
    return json({ success: false, error: 'Save exceeds the 2 MB D1 storage limit' }, 413, headers);
  }

  if (env.STARSECTOR_BUCKET) {
    const content = { userId, timestamp, saveId, gameData: body.gameData, metadata: { passwordHash, userAgent: request.headers.get('user-agent') || '' } };
    await env.STARSECTOR_BUCKET.put(`game-saves/${userId}/${saveId}.json`, JSON.stringify(content), { httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' } });
  } else {
    await env.DB.prepare(`
      INSERT INTO game_saves (user_id, save_id, game_data, password_hash, user_agent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, save_id) DO UPDATE SET
        game_data = excluded.game_data,
        password_hash = excluded.password_hash,
        user_agent = excluded.user_agent,
        updated_at = excluded.updated_at
    `).bind(userId, saveId, serialized, passwordHash, request.headers.get('user-agent') || '', timestamp, timestamp).run();
  }
  return json({ success: true, saveId, userId, timestamp }, 200, headers);
}

async function handleGameLoad(request, env, headers) {
  const url = new URL(request.url);
  const user = await authenticatedUser(request, env);
  const userId = safeSegment(user?.id || url.searchParams.get('userId') || request.headers.get('CF-Connecting-IP'));
  const saveId = safeSegment(url.searchParams.get('saveId'), '');
  if (!saveId) return json({ success: false, error: 'Missing saveId' }, 400, headers);

  let saveData;
  if (env.STARSECTOR_BUCKET) {
    const object = await env.STARSECTOR_BUCKET.get(`game-saves/${userId}/${saveId}.json`);
    if (!object) return json({ success: false, error: 'Save not found' }, 404, headers);
    saveData = JSON.parse(await object.text());
  } else {
    const row = await env.DB.prepare(`
      SELECT user_id, save_id, game_data, password_hash, created_at, updated_at
      FROM game_saves WHERE user_id = ? AND save_id = ?
    `).bind(userId, saveId).first();
    if (!row) return json({ success: false, error: 'Save not found' }, 404, headers);
    saveData = {
      userId: row.user_id,
      saveId: row.save_id,
      timestamp: row.updated_at || row.created_at,
      gameData: JSON.parse(row.game_data),
      metadata: { passwordHash: row.password_hash || null }
    };
  }

  if (saveData.metadata?.passwordHash) {
    const supplied = url.searchParams.get('password') || '';
    if (!supplied || await sha256Hex(supplied) !== saveData.metadata.passwordHash) return json({ success: false, error: 'Invalid password' }, 401, headers);
  }
  return json({ success: true, saveData: { saveId: saveData.saveId, userId: saveData.userId, timestamp: saveData.timestamp, gameData: saveData.gameData } }, 200, headers);
}

async function handleGameList(request, env, headers) {
  const url = new URL(request.url);
  const user = await authenticatedUser(request, env);
  const userId = safeSegment(user?.id || url.searchParams.get('userId') || request.headers.get('CF-Connecting-IP'));
  let saves;
  if (env.STARSECTOR_BUCKET) {
    const listed = await env.STARSECTOR_BUCKET.list({ prefix: `game-saves/${userId}/` });
    saves = listed.objects.map(obj => ({ saveId: obj.key.split('/').pop().replace(/\.json$/i, ''), uploaded: obj.uploaded, size: obj.size }));
  } else {
    const result = await env.DB.prepare(`
      SELECT save_id, updated_at, length(game_data) AS size
      FROM game_saves WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100
    `).bind(userId).all();
    saves = (result.results || []).map(row => ({ saveId: row.save_id, uploaded: row.updated_at, size: row.size }));
  }
  return json({ success: true, userId, saves, total: saves.length }, 200, headers);
}

async function handleGameDelete(request, env, headers) {
  const url = new URL(request.url);
  const user = await authenticatedUser(request, env);
  const userId = safeSegment(user?.id || url.searchParams.get('userId') || request.headers.get('CF-Connecting-IP'));
  const saveId = safeSegment(url.searchParams.get('saveId'), '');
  if (!saveId) return json({ success: false, error: 'Missing saveId' }, 400, headers);
  if (env.STARSECTOR_BUCKET) {
    await env.STARSECTOR_BUCKET.delete(`game-saves/${userId}/${saveId}.json`);
  } else {
    await env.DB.prepare('DELETE FROM game_saves WHERE user_id = ? AND save_id = ?').bind(userId, saveId).run();
  }
  return json({ success: true, saveId, userId }, 200, headers);
}

function debugClientScript() {
  return `window.ITAApiDebug={version:'2.1.0-d1',backend:'cloudflare-d1',health:'/api/health'};`;
}

function healthClientScript() {
  return `window.ITAApiHealth={endpoint:'/api/health',check:()=>fetch('https://api.adrianotothestar.com/api/health',{cache:'no-store'}).then(r=>r.json())};`;
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    try {
      if (path === '/api/health' && (request.method === 'GET' || request.method === 'HEAD')) {
        let database = 'unavailable';
        try { await env.DB.prepare('SELECT 1 AS ok').first(); database = 'ok'; } catch { database = 'error'; }
        return json({ status: database === 'ok' ? 'ok' : 'degraded', version: '2.1.0-d1', database, storage: env.STARSECTOR_BUCKET ? 'r2' : 'd1' }, database === 'ok' ? 200 : 503, headers);
      }
      if (path === '/api/debug.js' && request.method === 'GET') return text(debugClientScript(), 200, headers, 'application/javascript; charset=utf-8');
      if (path === '/api/health.js' && request.method === 'GET') return text(healthClientScript(), 200, headers, 'application/javascript; charset=utf-8');
      if (path === '/api/auth/register' && request.method === 'POST') return await handleRegister(request, env, headers);
      if (path === '/api/auth/login' && request.method === 'POST') return await handleLogin(request, env, headers);
      if (path === '/api/auth/me' && request.method === 'GET') return await handleMe(request, env, headers);
      if (path === '/api/auth/logout' && request.method === 'POST') return await handleLogout(request, env, headers);
      if (path === '/api/planets/my-claims' && request.method === 'GET') return await handleMyClaims(request, env, headers);
      if (path === '/api/planets/claim' && request.method === 'POST') return await handleClaim(request, env, headers);
      if (path === '/api/favorites' && ['GET', 'POST', 'DELETE'].includes(request.method)) return await handleFavorites(request, env, headers);
      if (path === '/api/game/save' && request.method === 'POST') return await handleGameSave(request, env, headers);
      if (path === '/api/game/load' && request.method === 'GET') return await handleGameLoad(request, env, headers);
      if (path === '/api/game/list' && request.method === 'GET') return await handleGameList(request, env, headers);
      if (path === '/api/game/delete' && request.method === 'DELETE') return await handleGameDelete(request, env, headers);
      return json({ success: false, error: 'Not Found' }, 404, headers);
    } catch (error) {
      console.error('API worker error', error);
      return json({ success: false, error: 'Internal server error' }, 500, headers);
    }
  }
};
