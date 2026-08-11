import { Env } from '../types/index.js';

interface VoxelData {
  x: number;
  y: number;
  z: number;
  type: string;
  health: number;
}

interface TerrainChunk {
  chunk_id: string;
  chunk_x: number;
  chunk_z: number;
  voxel_data: VoxelData[];
  player_id: string;
  updated_at: string;
}

// Get terrain data for a player
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const chunkId = url.searchParams.get('chunk_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check cache
  const cacheKey = `terrain:${playerId}${chunkId ? `:${chunkId}` : ''}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  if (chunkId) {
    const result = await env.DB.prepare(
      'SELECT * FROM terrain_chunks WHERE chunk_id = ? AND player_id = ?'
    ).bind(chunkId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Chunk not found' }), { 
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
      'SELECT * FROM terrain_chunks WHERE player_id = ? ORDER BY updated_at DESC LIMIT 100'
    ).bind(playerId).all();

    const response = JSON.stringify(results.results);
    await env.CACHE.put(cacheKey, response, { expirationTtl: 60 });
    
    return new Response(response, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  }
}

// Save terrain data
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, chunk_id, chunk_x, chunk_z, voxel_data } = await request.json();

  if (!player_id || !chunk_id || !voxel_data) {
    return new Response(JSON.stringify({ error: 'player_id, chunk_id, and voxel_data required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO terrain_chunks (chunk_id, chunk_x, chunk_z, voxel_data, player_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(chunk_id) DO UPDATE SET
        voxel_data = excluded.voxel_data,
        updated_at = excluded.updated_at
    `).bind(chunk_id, chunk_x, chunk_z, JSON.stringify(voxel_data), player_id, now).run();

    // Invalidate cache
    await env.CACHE.delete(`terrain:${player_id}`);
    await env.CACHE.delete(`terrain:${player_id}:${chunk_id}`);

    return new Response(JSON.stringify({ success: true, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Terrain save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save terrain' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete terrain chunk
export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const chunkId = url.searchParams.get('chunk_id');

  if (!playerId || !chunkId) {
    return new Response(JSON.stringify({ error: 'player_id and chunk_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'DELETE FROM terrain_chunks WHERE chunk_id = ? AND player_id = ?'
  ).bind(chunkId, playerId).run();

  // Invalidate cache
  await env.CACHE.delete(`terrain:${playerId}`);
  await env.CACHE.delete(`terrain:${playerId}:${chunkId}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
