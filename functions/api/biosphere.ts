import { Env } from '../types/index.js';

interface Species {
  species_id: string;
  name: string;
  type: string;
  generation: number;
  parent_species_id?: string;
  size: number;
  mass: number;
  color: string;
  shape: string;
  adaptations: any[];
  tolerances: any;
  population: number;
  carrying_capacity: number;
  birth_rate: number;
  death_rate: number;
  diet: any;
  behavior: any;
  genetic_diversity: number;
  fitness: number;
  player_id: string;
  planet_id?: string;
}

interface Ecosystem {
  ecosystem_id: string;
  name: string;
  type: string;
  location_x: number;
  location_y: number;
  location_z: number;
  size: number;
  species: any[];
  biomass: number;
  biodiversity: number;
  stability: number;
  productivity: number;
  environmental_conditions: any;
  player_id: string;
  planet_id?: string;
}

// Get species for a player
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const speciesId = url.searchParams.get('species_id');
  const planetId = url.searchParams.get('planet_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (speciesId) {
    const result = await env.DB.prepare(
      'SELECT * FROM species WHERE species_id = ? AND player_id = ?'
    ).bind(speciesId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Species not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    let query = 'SELECT * FROM species WHERE player_id = ?';
    const params = [playerId];

    if (planetId) {
      query += ' AND planet_id = ?';
      params.push(planetId);
    }

    query += ' ORDER BY updated_at DESC LIMIT 100';

    const results = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create or update species
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const speciesData = await request.json();

  if (!speciesData.player_id || !speciesData.name || !speciesData.type) {
    return new Response(JSON.stringify({ error: 'player_id, name, and type required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();
  const speciesId = speciesData.species_id || `species_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await env.DB.prepare(`
      INSERT INTO species (
        species_id, name, type, generation, parent_species_id, size, mass, color, shape,
        adaptations, tolerances, population, carrying_capacity, birth_rate, death_rate,
        diet, behavior, genetic_diversity, fitness, player_id, planet_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(species_id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        generation = excluded.generation,
        size = excluded.size,
        mass = excluded.mass,
        color = excluded.color,
        shape = excluded.shape,
        adaptations = excluded.adaptations,
        tolerances = excluded.tolerances,
        population = excluded.population,
        carrying_capacity = excluded.carrying_capacity,
        birth_rate = excluded.birth_rate,
        death_rate = excluded.death_rate,
        diet = excluded.diet,
        behavior = excluded.behavior,
        genetic_diversity = excluded.genetic_diversity,
        fitness = excluded.fitness,
        planet_id = excluded.planet_id,
        updated_at = excluded.updated_at
    `).bind(
      speciesId,
      speciesData.name,
      speciesData.type,
      speciesData.generation || 0,
      speciesData.parent_species_id || null,
      speciesData.size || 1.0,
      speciesData.mass || 100,
      speciesData.color || '#ffffff',
      speciesData.shape || 'generic',
      JSON.stringify(speciesData.adaptations || []),
      JSON.stringify(speciesData.tolerances || {}),
      speciesData.population || 100,
      speciesData.carrying_capacity || 5000,
      speciesData.birth_rate || 0.1,
      speciesData.death_rate || 0.05,
      JSON.stringify(speciesData.diet || {}),
      JSON.stringify(speciesData.behavior || {}),
      speciesData.genetic_diversity || 0.5,
      speciesData.fitness || 0.5,
      speciesData.player_id,
      speciesData.planet_id || null,
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, species_id: speciesId, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Species save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save species' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get ecosystems
export async function onRequestOptions(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const ecosystemId = url.searchParams.get('ecosystem_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (ecosystemId) {
    const result = await env.DB.prepare(
      'SELECT * FROM ecosystems WHERE ecosystem_id = ? AND player_id = ?'
    ).bind(ecosystemId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Ecosystem not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    const results = await env.DB.prepare(
      'SELECT * FROM ecosystems WHERE player_id = ? ORDER BY updated_at DESC LIMIT 50'
    ).bind(playerId).all();

    return new Response(JSON.stringify(results.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create or update ecosystem
export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const ecosystemData = await request.json();

  if (!ecosystemData.player_id || !ecosystemData.name || !ecosystemData.type) {
    return new Response(JSON.stringify({ error: 'player_id, name, and type required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();
  const ecosystemId = ecosystemData.ecosystem_id || `ecosystem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await env.DB.prepare(`
      INSERT INTO ecosystems (
        ecosystem_id, name, type, location_x, location_y, location_z, size, species,
        biomass, biodiversity, stability, productivity, environmental_conditions,
        player_id, planet_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ecosystem_id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        location_x = excluded.location_x,
        location_y = excluded.location_y,
        location_z = excluded.location_z,
        size = excluded.size,
        species = excluded.species,
        biomass = excluded.biomass,
        biodiversity = excluded.biodiversity,
        stability = excluded.stability,
        productivity = excluded.productivity,
        environmental_conditions = excluded.environmental_conditions,
        planet_id = excluded.planet_id,
        updated_at = excluded.updated_at
    `).bind(
      ecosystemId,
      ecosystemData.name,
      ecosystemData.type,
      ecosystemData.location_x || 0,
      ecosystemData.location_y || 0,
      ecosystemData.location_z || 0,
      ecosystemData.size || 100,
      JSON.stringify(ecosystemData.species || []),
      ecosystemData.biomass || 0,
      ecosystemData.biodiversity || 0,
      ecosystemData.stability || 0.5,
      ecosystemData.productivity || 0.5,
      JSON.stringify(ecosystemData.environmental_conditions || {}),
      ecosystemData.player_id,
      ecosystemData.planet_id || null,
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, ecosystem_id: ecosystemId, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Ecosystem save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save ecosystem' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete species or ecosystem
export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const speciesId = url.searchParams.get('species_id');
  const ecosystemId = url.searchParams.get('ecosystem_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (speciesId) {
    await env.DB.prepare(
      'DELETE FROM species WHERE species_id = ? AND player_id = ?'
    ).bind(speciesId, playerId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (ecosystemId) {
    await env.DB.prepare(
      'DELETE FROM ecosystems WHERE ecosystem_id = ? AND player_id = ?'
    ).bind(ecosystemId, playerId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    return new Response(JSON.stringify({ error: 'species_id or ecosystem_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
