import { Env } from '../types/index.js';

interface NPC {
  npc_id: string;
  name: string;
  species: string;
  role: string;
  faction_id?: string;
  personality: any;
  emotional_state: any;
  mood: number;
  short_term_memory: any[];
  long_term_memory: any[];
  working_memory: any[];
  relationships: Record<string, number>;
  goals: any[];
  motivations: any[];
  capabilities: any;
  current_activity: string;
  current_location: any;
  health: number;
  inventory: any[];
  learning_rate: number;
  adaptation_level: number;
  social_needs: any;
  player_id: string;
}

interface NPCMemory {
  memory_id: string;
  npc_id: string;
  type: string;
  content: string;
  importance: number;
  timestamp: number;
  decay: number;
  associated_entities: string[];
  emotions: any;
  context: any;
  player_id: string;
}

interface NPCRelationship {
  relationship_id: string;
  npc1_id: string;
  npc2_id: string;
  value: number;
  trust: number;
  respect: number;
  fear: number;
  love: number;
  hatred: number;
  history: any[];
  player_id: string;
}

// Get NPCs for a player
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const npcId = url.searchParams.get('npc_id');
  const factionId = url.searchParams.get('faction_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (npcId) {
    const result = await env.DB.prepare(
      'SELECT * FROM npcs WHERE npc_id = ? AND player_id = ?'
    ).bind(npcId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'NPC not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    let query = 'SELECT * FROM npcs WHERE player_id = ?';
    const params = [playerId];

    if (factionId) {
      query += ' AND faction_id = ?';
      params.push(factionId);
    }

    query += ' ORDER BY updated_at DESC LIMIT 100';

    const results = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create or update NPC
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const npcData = await request.json();

  if (!npcData.player_id || !npcData.name || !npcData.species || !npcData.role) {
    return new Response(JSON.stringify({ error: 'player_id, name, species, and role required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();
  const npcId = npcData.npc_id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await env.DB.prepare(`
      INSERT INTO npcs (
        npc_id, name, species, role, faction_id, personality, emotional_state, mood,
        short_term_memory, long_term_memory, working_memory, relationships, goals,
        motivations, capabilities, current_activity, current_location, health,
        inventory, learning_rate, adaptation_level, social_needs, player_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(npc_id) DO UPDATE SET
        name = excluded.name,
        species = excluded.species,
        role = excluded.role,
        faction_id = excluded.faction_id,
        personality = excluded.personality,
        emotional_state = excluded.emotional_state,
        mood = excluded.mood,
        short_term_memory = excluded.short_term_memory,
        long_term_memory = excluded.long_term_memory,
        working_memory = excluded.working_memory,
        relationships = excluded.relationships,
        goals = excluded.goals,
        motivations = excluded.motivations,
        capabilities = excluded.capabilities,
        current_activity = excluded.current_activity,
        current_location = excluded.current_location,
        health = excluded.health,
        inventory = excluded.inventory,
        learning_rate = excluded.learning_rate,
        adaptation_level = excluded.adaptation_level,
        social_needs = excluded.social_needs,
        updated_at = excluded.updated_at
    `).bind(
      npcId,
      npcData.name,
      npcData.species,
      npcData.role,
      npcData.faction_id || null,
      JSON.stringify(npcData.personality || {}),
      JSON.stringify(npcData.emotional_state || {}),
      npcData.mood || 0.5,
      JSON.stringify(npcData.short_term_memory || []),
      JSON.stringify(npcData.long_term_memory || []),
      JSON.stringify(npcData.working_memory || []),
      JSON.stringify(npcData.relationships || {}),
      JSON.stringify(npcData.goals || []),
      JSON.stringify(npcData.motivations || []),
      JSON.stringify(npcData.capabilities || {}),
      npcData.current_activity || 'idle',
      JSON.stringify(npcData.current_location || {}),
      npcData.health || 100,
      JSON.stringify(npcData.inventory || []),
      npcData.learning_rate || 0.1,
      npcData.adaptation_level || 0,
      JSON.stringify(npcData.social_needs || {}),
      npcData.player_id,
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, npc_id: npcId, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('NPC save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save NPC' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get NPC memories
export async function onRequestOptions(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const npcId = url.searchParams.get('npc_id');
  const memoryType = url.searchParams.get('type');

  if (!playerId || !npcId) {
    return new Response(JSON.stringify({ error: 'player_id and npc_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let query = 'SELECT * FROM npc_memories WHERE npc_id = ? AND player_id = ?';
  const params = [npcId, playerId];

  if (memoryType) {
    query += ' AND type = ?';
    params.push(memoryType);
  }

  query += ' ORDER BY timestamp DESC LIMIT 50';

  const results = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify(results.results), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Add NPC memory
export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const memoryData = await request.json();

  if (!memoryData.player_id || !memoryData.npc_id || !memoryData.content || !memoryData.type) {
    return new Response(JSON.stringify({ error: 'player_id, npc_id, content, and type required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  try {
    await env.DB.prepare(`
      INSERT INTO npc_memories (
        memory_id, npc_id, type, content, importance, timestamp, decay,
        associated_entities, emotions, context, player_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      memoryId,
      memoryData.npc_id,
      memoryData.type,
      memoryData.content,
      memoryData.importance || 0.5,
      now,
      0,
      JSON.stringify(memoryData.associated_entities || []),
      JSON.stringify(memoryData.emotions || {}),
      JSON.stringify(memoryData.context || {}),
      memoryData.player_id
    ).run();

    return new Response(JSON.stringify({ success: true, memory_id: memoryId }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Memory save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save memory' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update NPC relationship
export async function onRequestPatch(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, npc1_id, npc2_id, value_change, context_data } = await request.json();

  if (!player_id || !npc1_id || !npc2_id) {
    return new Response(JSON.stringify({ error: 'player_id, npc1_id, and npc2_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();
  const relationId = `${npc1_id}_${npc2_id}`;

  try {
    // Get existing relation
    const existing = await env.DB.prepare(
      'SELECT * FROM npc_relationships WHERE npc1_id = ? AND npc2_id = ? AND player_id = ?'
    ).bind(npc1_id, npc2_id, player_id).first();

    let history = existing ? JSON.parse(existing.history) : [];
    if (context_data) {
      history.push({ ...context_data, timestamp: Date.now() });
    }

    const newValue = existing ? Math.max(-1, Math.min(1, existing.value + value_change)) : value_change;

    await env.DB.prepare(`
      INSERT INTO npc_relationships (
        relationship_id, npc1_id, npc2_id, value, trust, respect, fear, love, hatred,
        history, player_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(relationship_id) DO UPDATE SET
        value = excluded.value,
        trust = excluded.trust,
        respect = excluded.respect,
        fear = excluded.fear,
        love = excluded.love,
        hatred = excluded.hatred,
        history = excluded.history,
        updated_at = excluded.updated_at
    `).bind(
      relationId,
      npc1_id,
      npc2_id,
      newValue,
      existing?.trust || 0.5,
      existing?.respect || 0.5,
      existing?.fear || 0,
      existing?.love || 0,
      existing?.hatred || 0,
      JSON.stringify(history),
      player_id,
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, relationship_id: relationId, value: newValue }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Relationship update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update relationship' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete NPC
export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const npcId = url.searchParams.get('npc_id');

  if (!playerId || !npcId) {
    return new Response(JSON.stringify({ error: 'player_id and npc_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'DELETE FROM npcs WHERE npc_id = ? AND player_id = ?'
  ).bind(npcId, playerId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
