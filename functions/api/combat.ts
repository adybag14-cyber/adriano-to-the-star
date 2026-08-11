import { Env } from '../types/index.js';

interface CombatShip {
  ship_id: string;
  player_id: string;
  name: string;
  position_x: number;
  position_y: number;
  position_z: number;
  velocity_x: number;
  velocity_y: number;
  velocity_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  rotation_w: number;
  mass: number;
  thrust: number;
  max_speed: number;
  turn_rate: number;
  health: number;
  max_health: number;
  shields: number;
  max_shields: number;
  weapons: any[];
  owner: string;
  target_id?: string;
  combat_state: string;
  last_fired: Record<string, number>;
}

interface CombatProjectile {
  projectile_id: string;
  type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  velocity_x: number;
  velocity_y: number;
  velocity_z: number;
  damage: number;
  range: number;
  lifetime: number;
  owner: string;
  source_ship_id: string;
  target_position_x?: number;
  target_position_y?: number;
  target_position_z?: number;
  trail: any[];
  creation_time: number;
  player_id: string;
}

// Get combat ships for a player
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const shipId = url.searchParams.get('ship_id');
  const owner = url.searchParams.get('owner');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (shipId) {
    const result = await env.DB.prepare(
      'SELECT * FROM combat_ships WHERE ship_id = ? AND player_id = ?'
    ).bind(shipId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Ship not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    let query = 'SELECT * FROM combat_ships WHERE player_id = ?';
    const params = [playerId];

    if (owner) {
      query += ' AND owner = ?';
      params.push(owner);
    }

    query += ' ORDER BY updated_at DESC LIMIT 50';

    const results = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create or update combat ship
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const shipData = await request.json();

  if (!shipData.player_id || !shipData.name || !shipData.owner) {
    return new Response(JSON.stringify({ error: 'player_id, name, and owner required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();
  const shipId = shipData.ship_id || `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await env.DB.prepare(`
      INSERT INTO combat_ships (
        ship_id, player_id, name, position_x, position_y, position_z,
        velocity_x, velocity_y, velocity_z, rotation_x, rotation_y, rotation_z, rotation_w,
        mass, thrust, max_speed, turn_rate, health, max_health, shields, max_shields,
        weapons, owner, target_id, combat_state, last_fired, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ship_id) DO UPDATE SET
        position_x = excluded.position_x,
        position_y = excluded.position_y,
        position_z = excluded.position_z,
        velocity_x = excluded.velocity_x,
        velocity_y = excluded.velocity_y,
        velocity_z = excluded.velocity_z,
        rotation_x = excluded.rotation_x,
        rotation_y = excluded.rotation_y,
        rotation_z = excluded.rotation_z,
        rotation_w = excluded.rotation_w,
        health = excluded.health,
        shields = excluded.shields,
        target_id = excluded.target_id,
        combat_state = excluded.combat_state,
        last_fired = excluded.last_fired,
        updated_at = excluded.updated_at
    `).bind(
      shipId,
      shipData.player_id,
      shipData.name,
      shipData.position_x || 0,
      shipData.position_y || 0,
      shipData.position_z || 0,
      shipData.velocity_x || 0,
      shipData.velocity_y || 0,
      shipData.velocity_z || 0,
      shipData.rotation_x || 0,
      shipData.rotation_y || 0,
      shipData.rotation_z || 0,
      shipData.rotation_w || 1,
      shipData.mass || 10000,
      shipData.thrust || 50000,
      shipData.max_speed || 1000,
      shipData.turn_rate || 1.0,
      shipData.health || 100,
      shipData.max_health || 100,
      shipData.shields || 0,
      shipData.max_shields || 50,
      JSON.stringify(shipData.weapons || []),
      shipData.owner,
      shipData.target_id || null,
      shipData.combat_state || 'idle',
      JSON.stringify(shipData.last_fired || {}),
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, ship_id: shipId, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Ship save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save ship' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get combat log
export async function onRequestOptions(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const type = url.searchParams.get('type');
  const since = url.searchParams.get('since');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let query = 'SELECT * FROM combat_log WHERE player_id = ?';
  const params = [playerId];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (since) {
    query += ' AND timestamp > ?';
    params.push(since);
  }

  query += ' ORDER BY timestamp DESC LIMIT 100';

  const results = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify(results.results), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Log combat event
export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const logData = await request.json();

  if (!logData.player_id || !logData.type || !logData.timestamp) {
    return new Response(JSON.stringify({ error: 'player_id, type, and timestamp required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await env.DB.prepare(`
      INSERT INTO combat_log (
        log_id, timestamp, type, source, target, damage, position_x, position_y,
        position_z, details, player_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      logData.timestamp,
      logData.type,
      logData.source,
      logData.target || null,
      logData.damage || null,
      logData.position_x || null,
      logData.position_y || null,
      logData.position_z || null,
      JSON.stringify(logData.details || {}),
      logData.player_id
    ).run();

    return new Response(JSON.stringify({ success: true, log_id: logId }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Combat log error:', error);
    return new Response(JSON.stringify({ error: 'Failed to log combat event' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete ship
export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const shipId = url.searchParams.get('ship_id');

  if (!playerId || !shipId) {
    return new Response(JSON.stringify({ error: 'player_id and ship_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'DELETE FROM combat_ships WHERE ship_id = ? AND player_id = ?'
  ).bind(shipId, playerId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
