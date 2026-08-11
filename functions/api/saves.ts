import { Env, SaveData } from '../types/index.js';

const MAX_SAVES_PER_PLAYER = 50;
const MAX_SAVE_SIZE = 5 * 1024 * 1024; // 5MB

function validateSaveData(saveData: any): boolean {
  if (!saveData || typeof saveData !== 'object') return false;
  if (!saveData.gameState && !saveData.universe) return false;
  return true;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const saveId = url.searchParams.get('save_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check cache first
  const cacheKey = `saves:${playerId}${saveId ? `:${saveId}` : ''}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  if (saveId) {
    const result = await env.DB.prepare(
      'SELECT * FROM saves WHERE id = ? AND player_id = ?'
    ).bind(saveId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Save not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = JSON.stringify(result);
    await env.CACHE.put(cacheKey, response, { expirationTtl: 300 });
    
    return new Response(response, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  } else {
    const results = await env.DB.prepare(
      'SELECT id, save_name, is_autosave, created_at, updated_at, playtime, version FROM saves WHERE player_id = ? ORDER BY updated_at DESC LIMIT ?'
    ).bind(playerId, MAX_SAVES_PER_PLAYER).all();

    const response = JSON.stringify(results.results);
    await env.CACHE.put(cacheKey, response, { expirationTtl: 60 });
    
    return new Response(response, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, save_id, save_name, save_data, is_autosave = false, playtime = 0, version = '1.0.0' } = await request.json();

  if (!player_id || !save_data) {
    return new Response(JSON.stringify({ error: 'player_id and save_data required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate save data
  if (!validateSaveData(save_data)) {
    return new Response(JSON.stringify({ error: 'Invalid save data format' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check save size
  const saveSize = JSON.stringify(save_data).length;
  if (saveSize > MAX_SAVE_SIZE) {
    return new Response(JSON.stringify({ error: 'Save data too large (max 5MB)' }), { 
      status: 413,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check save limit for non-autosaves
  if (!is_autosave && !save_id) {
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM saves WHERE player_id = ? AND is_autosave = 0'
    ).bind(player_id).first();
    
    if (countResult && countResult.count >= MAX_SAVES_PER_PLAYER) {
      return new Response(JSON.stringify({ error: 'Maximum save limit reached' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const id = save_id || crypto.randomUUID();
  const name = save_name || `Save ${new Date().toLocaleDateString()}`;
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO saves (id, player_id, save_name, save_data, is_autosave, playtime, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        save_data = excluded.save_data,
        save_name = excluded.save_name,
        is_autosave = excluded.is_autosave,
        playtime = excluded.playtime,
        version = excluded.version,
        updated_at = excluded.updated_at
    `).bind(id, player_id, name, JSON.stringify(save_data), is_autosave ? 1 : 0, playtime, version, now, now).run();

    // Invalidate cache
    await env.CACHE.delete(`saves:${player_id}`);
    await env.CACHE.delete(`saves:${player_id}:${id}`);

    return new Response(JSON.stringify({ success: true, id, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save game' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const saveId = url.searchParams.get('save_id');

  if (!playerId || !saveId) {
    return new Response(JSON.stringify({ error: 'player_id and save_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await env.DB.prepare(
    'DELETE FROM saves WHERE id = ? AND player_id = ?'
  ).bind(saveId, playerId).run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: 'Save not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Invalidate cache
  await env.CACHE.delete(`saves:${playerId}`);
  await env.CACHE.delete(`saves:${playerId}:${saveId}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Clone a save
export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, save_id, new_name } = await request.json();

  if (!player_id || !save_id) {
    return new Response(JSON.stringify({ error: 'player_id and save_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get original save
  const original = await env.DB.prepare(
    'SELECT * FROM saves WHERE id = ? AND player_id = ?'
  ).bind(save_id, player_id).first();

  if (!original) {
    return new Response(JSON.stringify({ error: 'Save not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check save limit
  const countResult = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM saves WHERE player_id = ? AND is_autosave = 0'
  ).bind(player_id).first();
  
  if (countResult && countResult.count >= MAX_SAVES_PER_PLAYER) {
    return new Response(JSON.stringify({ error: 'Maximum save limit reached' }), { 
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const newId = crypto.randomUUID();
  const newName = new_name || `${original.save_name} (Copy)`;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO saves (id, player_id, save_name, save_data, is_autosave, playtime, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(newId, player_id, newName, original.save_data, 0, original.playtime, original.version, now, now).run();

  // Invalidate cache
  await env.CACHE.delete(`saves:${player_id}`);

  return new Response(JSON.stringify({ success: true, id: newId }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
