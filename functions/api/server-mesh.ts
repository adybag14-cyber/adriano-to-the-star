/**
 * 🌐 Era III: Server Meshing - Cloudflare API
 * 
 * Handles server meshing, shard management, and player assignments
 */

import { Env } from '../types';

export interface ServerShard {
  id: string;
  shard_name: string;
  region: string;
  capacity: number;
  current_players: number;
  status: string;
  coordinates_x: number;
  coordinates_y: number;
  coordinates_z: number;
  created_at: number;
  updated_at: number;
}

export interface PlayerShardAssignment {
  player_id: string;
  shard_id: string;
  assigned_at: number;
  last_active: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle different routes
    if (path === '/api/server-mesh/shards') {
      return handleShards(request, env);
    } else if (path === '/api/server-mesh/assign') {
      return handleAssign(request, env);
    } else if (path === '/api/server-mesh/assignment') {
      return handleAssignment(request, env);
    } else if (path === '/api/server-mesh/migrate') {
      return handleMigrate(request, env);
    } else if (path === '/api/server-mesh/disconnect') {
      return handleDisconnect(request, env);
    } else if (path === '/api/server-mesh/statistics') {
      return handleStatistics(request, env);
    } else if (path === '/api/server-mesh/message') {
      return handleMessage(request, env);
    } else if (path === '/api/server-mesh/broadcast') {
      return handleBroadcast(request, env);
    } else if (path === '/api/server-mesh/nearby') {
      return handleNearby(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleShards(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const shards = await env.DB.prepare(
      'SELECT * FROM server_shards ORDER BY created_at'
    ).all();
    
    return new Response(JSON.stringify({ shards: shards.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    // Create new shard (admin only)
    const body = await request.json() as any;
    
    const shard = {
      id: `shard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shard_name: body.shard_name,
      region: body.region,
      capacity: body.capacity,
      current_players: 0,
      status: 'active',
      coordinates_x: body.coordinates_x || 0,
      coordinates_y: body.coordinates_y || 0,
      coordinates_z: body.coordinates_z || 0,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    await env.DB.prepare(`
      INSERT INTO server_shards (id, shard_name, region, capacity, current_players, status, coordinates_x, coordinates_y, coordinates_z, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      shard.id,
      shard.shard_name,
      shard.region,
      shard.capacity,
      shard.current_players,
      shard.status,
      shard.coordinates_x,
      shard.coordinates_y,
      shard.coordinates_z,
      shard.created_at,
      shard.updated_at
    ).run();
    
    return new Response(JSON.stringify({ shard }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleAssign(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const body = await request.json() as any;
  const { player_id, shard_id } = body;
  
  // Update shard player count
  await env.DB.prepare(`
    UPDATE server_shards
    SET current_players = current_players + 1, updated_at = ?
    WHERE id = ?
  `).bind(Date.now(), shard_id).run();
  
  // Create player assignment
  await env.DB.prepare(`
    INSERT INTO player_shard_assignments (player_id, shard_id, assigned_at, last_active)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      shard_id = excluded.shard_id,
      assigned_at = excluded.assigned_at,
      last_active = excluded.last_active
  `).bind(player_id, shard_id, Date.now(), Date.now()).run();
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAssignment(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  
  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const assignment = await env.DB.prepare(
    'SELECT * FROM player_shard_assignments WHERE player_id = ?'
  ).bind(playerId).first();
  
  return new Response(JSON.stringify({ assignment }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleMigrate(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const body = await request.json() as any;
  const { player_id, from_shard_id, to_shard_id, game_state } = body;
  
  // Decrease old shard player count
  await env.DB.prepare(`
    UPDATE server_shards
    SET current_players = current_players - 1, updated_at = ?
    WHERE id = ?
  `).bind(Date.now(), from_shard_id).run();
  
  // Increase new shard player count
  await env.DB.prepare(`
    UPDATE server_shards
    SET current_players = current_players + 1, updated_at = ?
    WHERE id = ?
  `).bind(Date.now(), to_shard_id).run();
  
  // Update player assignment
  await env.DB.prepare(`
    UPDATE player_shard_assignments
    SET shard_id = ?, assigned_at = ?, last_active = ?
    WHERE player_id = ?
  `).bind(to_shard_id, Date.now(), Date.now(), player_id).run();
  
  // Store game state (would use KV or R2 in production)
  // For now, just acknowledge the migration
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleDisconnect(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const body = await request.json() as any;
  const { player_id, shard_id } = body;
  
  // Decrease shard player count
  await env.DB.prepare(`
    UPDATE server_shards
    SET current_players = current_players - 1, updated_at = ?
    WHERE id = ?
  `).bind(Date.now(), shard_id).run();
  
  // Remove player assignment
  await env.DB.prepare(
    'DELETE FROM player_shard_assignments WHERE player_id = ?'
  ).bind(player_id).run();
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleStatistics(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  // Get total players across all shards
  const totalPlayers = await env.DB.prepare(
    'SELECT SUM(current_players) as total FROM server_shards'
  ).first();
  
  // Get total capacity
  const totalCapacity = await env.DB.prepare(
    'SELECT SUM(capacity) as total FROM server_shards'
  ).first();
  
  // Get active shards count
  const activeShards = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM server_shards WHERE status = ?'
  ).bind('active').first();
  
  // Get average load
  const avgLoad = await env.DB.prepare(
    'SELECT AVG(current_players * 1.0 / capacity) as avg_load FROM server_shards WHERE status = ?'
  ).bind('active').first();
  
  return new Response(JSON.stringify({
    statistics: {
      total_players: totalPlayers?.total || 0,
      total_capacity: totalCapacity?.total || 0,
      active_shards: activeShards?.count || 0,
      average_load: avgLoad?.avg_load || 0
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleMessage(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const body = await request.json() as any;
  
  // In a real implementation, this would use Durable Objects for real-time messaging
  // For now, just acknowledge the message
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleBroadcast(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const body = await request.json() as any;
  
  // In a real implementation, this would broadcast to all shards via Durable Objects
  // For now, just acknowledge the broadcast
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleNearby(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const url = new URL(request.url);
  const shardId = url.searchParams.get('shard_id');
  const playerId = url.searchParams.get('player_id');
  const radius = parseInt(url.searchParams.get('radius') || '1000');
  
  if (!shardId || !playerId) {
    return new Response(JSON.stringify({ error: 'shard_id and player_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get all players in the same shard
  const assignments = await env.DB.prepare(
    'SELECT player_id FROM player_shard_assignments WHERE shard_id = ? AND player_id != ?'
  ).bind(shardId, playerId).all();
  
  // In a real implementation, this would calculate actual distances
  // For now, return all players in the shard
  const nearbyPlayers = assignments.results.map(a => a.player_id);
  
  return new Response(JSON.stringify({ players: nearbyPlayers }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
