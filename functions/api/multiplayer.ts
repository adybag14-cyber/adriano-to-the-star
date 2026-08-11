import { Env } from '../types/index.js';

interface RoomInfo {
  room_id: string;
  name: string;
  max_players: number;
  current_players: number;
  game_mode: string;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
}

interface MatchmakingRequest {
  player_id: string;
  skill_level?: number;
  preferred_modes?: string[];
}

const MAX_ROOM_NAME_LENGTH = 50;
const DEFAULT_MAX_PLAYERS = 4;
const MAX_PLAYERS = 10;

// Main multiplayer handler
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { action, player_id, room_id, data } = await request.json();

  if (!player_id) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  switch (action) {
    case 'create_room':
      return await handleCreateRoom(env, player_id, data);
    case 'join_room':
      return await handleJoinRoom(env, player_id, room_id);
    case 'leave_room':
      return await handleLeaveRoom(env, player_id, room_id);
    case 'broadcast':
      return await handleBroadcast(env, player_id, room_id, data);
    case 'get_state':
      return await handleGetState(env, room_id);
    case 'list_rooms':
      return await handleListRooms(env, data);
    case 'find_match':
      return await handleFindMatch(env, player_id, data);
    default:
      return new Response(JSON.stringify({ error: 'Unknown action' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Create a new game room
async function handleCreateRoom(env: Env, playerId: string, data: any) {
  const { name, max_players = DEFAULT_MAX_PLAYERS, game_mode = 'standard' } = data || {};

  if (!name || name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Room name required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (name.length > MAX_ROOM_NAME_LENGTH) {
    return new Response(JSON.stringify({ error: `Room name too long (max ${MAX_ROOM_NAME_LENGTH} characters)` }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (max_players < 2 || max_players > MAX_PLAYERS) {
    return new Response(JSON.stringify({ error: `Max players must be between 2 and ${MAX_PLAYERS}` }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const roomId = crypto.randomUUID();
  const id = env.GAME_ROOM.idFromName(roomId);
  const stub = env.GAME_ROOM.get(id);

  const response = await stub.fetch(new Request('https://dummy/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'create', 
      player_id: playerId,
      room_id: roomId,
      name: name.trim(),
      max_players,
      game_mode
    })
  }));

  const result = await response.json();

  if (result.success) {
    // Add room to database
    await env.DB.prepare(`
      INSERT INTO game_sessions (id, room_id, host_id, name, max_players, game_mode, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?)
    `).bind(
      crypto.randomUUID(),
      roomId,
      playerId,
      name.trim(),
      max_players,
      game_mode,
      new Date().toISOString()
    ).run();

    // Invalidate room list cache
    await env.CACHE.delete('rooms:list');
  }

  return new Response(JSON.stringify(result), response);
}

// Join an existing room
async function handleJoinRoom(env: Env, playerId: string, roomId: string) {
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'room_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = env.GAME_ROOM.idFromName(roomId);
  const stub = env.GAME_ROOM.get(id);

  const response = await stub.fetch(new Request('https://dummy/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'join', player_id: playerId })
  }));

  const result = await response.json();

  if (result.success) {
    // Update player count in database
    await env.DB.prepare(`
      UPDATE game_sessions
      SET current_players = current_players + 1
      WHERE room_id = ?
    `).bind(roomId).run();

    // Invalidate room list cache
    await env.CACHE.delete('rooms:list');
  }

  return new Response(JSON.stringify(result), response);
}

// Leave a room
async function handleLeaveRoom(env: Env, playerId: string, roomId: string) {
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'room_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = env.GAME_ROOM.idFromName(roomId);
  const stub = env.GAME_ROOM.get(id);

  const response = await stub.fetch(new Request('https://dummy/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'leave', player_id: playerId })
  }));

  const result = await response.json();

  if (result.success) {
    // Update player count in database
    await env.DB.prepare(`
      UPDATE game_sessions
      SET current_players = current_players - 1
      WHERE room_id = ? AND current_players > 0
    `).bind(roomId).run();

    // Invalidate room list cache
    await env.CACHE.delete('rooms:list');
  }

  return new Response(JSON.stringify(result), response);
}

// Broadcast message to room
async function handleBroadcast(env: Env, playerId: string, roomId: string, data: any) {
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'room_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!data) {
    return new Response(JSON.stringify({ error: 'data required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = env.GAME_ROOM.idFromName(roomId);
  const stub = env.GAME_ROOM.get(id);

  const response = await stub.fetch(new Request('https://dummy/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'broadcast', 
      player_id: playerId, 
      data 
    })
  }));

  return new Response(await response.text(), response);
}

// Get room state
async function handleGetState(env: Env, roomId: string) {
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'room_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = env.GAME_ROOM.idFromName(roomId);
  const stub = env.GAME_ROOM.get(id);

  const response = await stub.fetch(new Request('https://dummy/', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }));

  return new Response(await response.text(), response);
}

// List available rooms
async function handleListRooms(env: Env, data: any) {
  const { game_mode, status = 'waiting', limit = 50 } = data || {};

  // Check cache
  const cacheKey = `rooms:list:${game_mode || 'all'}:${status}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  let query = 'SELECT * FROM game_sessions WHERE status = ?';
  const params = [status];

  if (game_mode) {
    query += ' AND game_mode = ?';
    params.push(game_mode);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const results = await env.DB.prepare(query).bind(...params).all();

  const rooms = (results.results || []).map((room: any) => ({
    room_id: room.room_id,
    name: room.name,
    max_players: room.max_players,
    current_players: room.current_players || 0,
    game_mode: room.game_mode,
    status: room.status,
    created_at: room.created_at
  }));

  const response = JSON.stringify({ rooms, total: rooms.length });
  await env.CACHE.put(cacheKey, response, { expirationTtl: 30 });

  return new Response(response, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
  });
}

// Find a match (simple matchmaking)
async function handleFindMatch(env: Env, playerId: string, data: MatchmakingRequest) {
  const { skill_level, preferred_modes = ['standard'] } = data || {};

  // Look for available rooms with matching preferences
  let query = `
    SELECT * FROM game_sessions 
    WHERE status = 'waiting' 
    AND current_players < max_players
    AND game_mode IN (${preferred_modes.map(() => '?').join(',')})
    ORDER BY created_at ASC
    LIMIT 5
  `;

  const results = await env.DB.prepare(query).bind(...preferred_modes).all();
  const rooms = results.results || [];

  if (rooms.length > 0) {
    // Join the first available room
    const room = rooms[0];
    return await handleJoinRoom(env, playerId, room.room_id);
  }

  // No available rooms, create a new one
  const roomName = `Match ${Date.now()}`;
  return await handleCreateRoom(env, playerId, {
    name: roomName,
    max_players: DEFAULT_MAX_PLAYERS,
    game_mode: preferred_modes[0]
  });
}

// Get available game modes
export async function onRequestGet(context: { env: Env; request: Request }) {
  return new Response(JSON.stringify({
    game_modes: [
      { id: 'standard', name: 'Standard', description: 'Standard gameplay mode' },
      { id: 'hardcore', name: 'Hardcore', description: 'Increased difficulty' },
      { id: 'cooperative', name: 'Cooperative', description: 'Team-based gameplay' },
      { id: 'competitive', name: 'Competitive', description: 'PvP gameplay' }
    ],
    max_players: MAX_PLAYERS
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
