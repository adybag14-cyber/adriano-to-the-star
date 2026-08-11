import { Env } from '../types/index.js';

interface Faction {
  faction_id: string;
  name: string;
  type: string;
  ideology: string;
  leader: string;
  territory: number;
  population: number;
  economy: number;
  military: number;
  technology: number;
  aggressiveness: number;
  trustworthiness: number;
  generosity: number;
  pride: number;
  primary_goal: string;
  secondary_goals: any[];
  allies: string[];
  enemies: string[];
  neutral: string[];
  long_term_memory: any[];
  short_term_memory: any[];
  generation: number;
  ancestral_memory: any[];
  player_id: string;
}

interface DiplomaticRelation {
  relation_id: string;
  faction1_id: string;
  faction2_id: string;
  value: number;
  trust: number;
  respect: number;
  fear: number;
  history: any[];
  treaties: string[];
  wars: string[];
  player_id: string;
}

// Get factions for a player
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const factionId = url.searchParams.get('faction_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (factionId) {
    const result = await env.DB.prepare(
      'SELECT * FROM factions WHERE faction_id = ? AND player_id = ?'
    ).bind(factionId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Faction not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    const results = await env.DB.prepare(
      'SELECT * FROM factions WHERE player_id = ? ORDER BY updated_at DESC LIMIT 50'
    ).bind(playerId).all();

    return new Response(JSON.stringify(results.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create or update faction
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const factionData = await request.json();

  if (!factionData.player_id || !factionData.name || !factionData.type || !factionData.ideology) {
    return new Response(JSON.stringify({ error: 'player_id, name, type, and ideology required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();
  const factionId = factionData.faction_id || `faction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await env.DB.prepare(`
      INSERT INTO factions (
        faction_id, name, type, ideology, leader, territory, population, economy, military,
        technology, aggressiveness, trustworthiness, generosity, pride, primary_goal,
        secondary_goals, allies, enemies, neutral, long_term_memory, short_term_memory,
        generation, ancestral_memory, player_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faction_id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        ideology = excluded.ideology,
        leader = excluded.leader,
        territory = excluded.territory,
        population = excluded.population,
        economy = excluded.economy,
        military = excluded.military,
        technology = excluded.technology,
        aggressiveness = excluded.aggressiveness,
        trustworthiness = excluded.trustworthiness,
        generosity = excluded.generosity,
        pride = excluded.pride,
        primary_goal = excluded.primary_goal,
        secondary_goals = excluded.secondary_goals,
        allies = excluded.allies,
        enemies = excluded.enemies,
        neutral = excluded.neutral,
        long_term_memory = excluded.long_term_memory,
        short_term_memory = excluded.short_term_memory,
        generation = excluded.generation,
        ancestral_memory = excluded.ancestral_memory,
        updated_at = excluded.updated_at
    `).bind(
      factionId,
      factionData.name,
      factionData.type,
      factionData.ideology,
      factionData.leader || 'Unknown',
      factionData.territory || 100,
      factionData.population || 100000,
      factionData.economy || 50,
      factionData.military || 50,
      factionData.technology || 50,
      factionData.aggressiveness || 0.5,
      factionData.trustworthiness || 0.5,
      factionData.generosity || 0.5,
      factionData.pride || 0.5,
      factionData.primary_goal || 'maintain_stability',
      JSON.stringify(factionData.secondary_goals || []),
      JSON.stringify(factionData.allies || []),
      JSON.stringify(factionData.enemies || []),
      JSON.stringify(factionData.neutral || []),
      JSON.stringify(factionData.long_term_memory || []),
      JSON.stringify(factionData.short_term_memory || []),
      factionData.generation || 0,
      JSON.stringify(factionData.ancestral_memory || []),
      factionData.player_id,
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, faction_id: factionId, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Faction save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save faction' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get diplomatic relations
export async function onRequestOptions(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const relationId = url.searchParams.get('relation_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (relationId) {
    const result = await env.DB.prepare(
      'SELECT * FROM diplomatic_relations WHERE relation_id = ? AND player_id = ?'
    ).bind(relationId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Relation not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    const results = await env.DB.prepare(
      'SELECT * FROM diplomatic_relations WHERE player_id = ? ORDER BY updated_at DESC LIMIT 100'
    ).bind(playerId).all();

    return new Response(JSON.stringify(results.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update diplomatic relation
export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, faction1_id, faction2_id, value, trust, respect, fear, history_entry } = await request.json();

  if (!player_id || !faction1_id || !faction2_id) {
    return new Response(JSON.stringify({ error: 'player_id, faction1_id, and faction2_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();
  const relationId = `${faction1_id}_${faction2_id}`;

  try {
    // Get existing relation
    const existing = await env.DB.prepare(
      'SELECT * FROM diplomatic_relations WHERE faction1_id = ? AND faction2_id = ? AND player_id = ?'
    ).bind(faction1_id, faction2_id, player_id).first();

    let history = existing ? JSON.parse(existing.history) : [];
    if (history_entry) {
      history.push(history_entry);
    }

    await env.DB.prepare(`
      INSERT INTO diplomatic_relations (
        relation_id, faction1_id, faction2_id, value, trust, respect, fear, history,
        treaties, wars, player_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(relation_id) DO UPDATE SET
        value = excluded.value,
        trust = excluded.trust,
        respect = excluded.respect,
        fear = excluded.fear,
        history = excluded.history,
        updated_at = excluded.updated_at
    `).bind(
      relationId,
      faction1_id,
      faction2_id,
      value !== undefined ? value : (existing?.value || 0),
      trust !== undefined ? trust : (existing?.trust || 0.5),
      respect !== undefined ? respect : (existing?.respect || 0.5),
      fear !== undefined ? fear : (existing?.fear || 0),
      JSON.stringify(history),
      JSON.stringify(existing?.treaties || []),
      JSON.stringify(existing?.wars || []),
      player_id,
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, relation_id: relationId, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Relation update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update relation' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Process generational transition
export async function onRequestPatch(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, faction_id } = await request.json();

  if (!player_id || !faction_id) {
    return new Response(JSON.stringify({ error: 'player_id and faction_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();

  try {
    await env.DB.prepare(`
      UPDATE factions
      SET generation = generation + 1,
        updated_at = ?
      WHERE faction_id = ? AND player_id = ?
    `).bind(now, faction_id, player_id).run();

    return new Response(JSON.stringify({ success: true, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Generation transition error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process generation transition' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete faction
export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const factionId = url.searchParams.get('faction_id');

  if (!playerId || !factionId) {
    return new Response(JSON.stringify({ error: 'player_id and faction_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'DELETE FROM factions WHERE faction_id = ? AND player_id = ?'
  ).bind(factionId, playerId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
