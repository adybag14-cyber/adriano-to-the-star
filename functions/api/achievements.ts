import { Env } from '../types/index.js';

interface Achievement {
  id: string;
  achievement_id: string;
  player_id: string;
  metadata: Record<string, any>;
  unlocked_at: string;
}

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  icon?: string;
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  'first_exoplanet': {
    id: 'first_exoplanet',
    name: 'First Contact',
    description: 'Discover your first exoplanet',
    category: 'exploration',
    rarity: 'common',
    points: 10
  },
  'colonize_first': {
    id: 'colonize_first',
    name: 'Pioneer',
    description: 'Establish your first colony',
    category: 'colonization',
    rarity: 'common',
    points: 25
  },
  'colonize_10': {
    id: 'colonize_10',
    name: 'Empire Builder',
    description: 'Colonize 10 planets',
    category: 'colonization',
    rarity: 'rare',
    points: 100
  },
  'first_trade': {
    id: 'first_trade',
    name: 'Merchant',
    description: 'Complete your first trade',
    category: 'economy',
    rarity: 'common',
    points: 15
  },
  'millionaire': {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Accumulate 1,000,000 credits',
    category: 'economy',
    rarity: 'rare',
    points: 75
  },
  'first_battle': {
    id: 'first_battle',
    name: 'Warrior',
    description: 'Win your first space battle',
    category: 'combat',
    rarity: 'common',
    points: 20
  },
  'conqueror': {
    id: 'conqueror',
    name: 'Conqueror',
    description: 'Conquer 5 enemy systems',
    category: 'combat',
    rarity: 'epic',
    points: 150
  },
  'research_100': {
    id: 'research_100',
    name: 'Scientist',
    description: 'Complete 100 research projects',
    category: 'science',
    rarity: 'rare',
    points: 80
  },
  'discover_all': {
    id: 'discover_all',
    name: 'Galactic Explorer',
    description: 'Discover all exoplanets in a sector',
    category: 'exploration',
    rarity: 'epic',
    points: 200
  },
  'legendary': {
    id: 'legendary',
    name: 'Galactic Legend',
    description: 'Unlock 50 achievements',
    category: 'special',
    rarity: 'legendary',
    points: 500
  }
};

// Get achievement progress for a player
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const achievementId = url.searchParams.get('achievement_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check cache
  const cacheKey = `achievements:${playerId}${achievementId ? `:${achievementId}` : ''}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  if (achievementId) {
    const result = await env.DB.prepare(
      'SELECT * FROM achievements WHERE player_id = ? AND achievement_id = ?'
    ).bind(playerId, achievementId).first();

    const response = JSON.stringify(result || { unlocked: false });
    await env.CACHE.put(cacheKey, response, { expirationTtl: 300 });
    
    return new Response(response, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  } else {
    const results = await env.DB.prepare(
      'SELECT * FROM achievements WHERE player_id = ? ORDER BY unlocked_at DESC'
    ).bind(playerId).all();

    // Calculate total points and progress
    const achievements = results.results || [];
    let totalPoints = 0;
    const progress: Record<string, any> = {};

    for (const achievement of achievements) {
      const definition = ACHIEVEMENT_DEFINITIONS[achievement.achievement_id];
      if (definition) {
        totalPoints += definition.points;
      }
      
      // Track progress by category
      const def = ACHIEVEMENT_DEFINITIONS[achievement.achievement_id];
      if (def) {
        if (!progress[def.category]) {
          progress[def.category] = { unlocked: 0, total: 0, points: 0 };
        }
        progress[def.category].unlocked++;
        progress[def.category].points += def.points;
      }
    }

    // Calculate total possible per category
    for (const def of Object.values(ACHIEVEMENT_DEFINITIONS)) {
      if (!progress[def.category]) {
        progress[def.category] = { unlocked: 0, total: 0, points: 0 };
      }
      progress[def.category].total++;
    }

    const response = JSON.stringify({
      achievements,
      total_points: totalPoints,
      total_unlocked: achievements.length,
      total_available: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
      progress_by_category: progress
    });
    
    await env.CACHE.put(cacheKey, response, { expirationTtl: 60 });
    
    return new Response(response, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  }
}

// Unlock an achievement
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, achievement_id, metadata = {} } = await request.json();

  if (!player_id || !achievement_id) {
    return new Response(JSON.stringify({ error: 'player_id and achievement_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate achievement exists
  if (!ACHIEVEMENT_DEFINITIONS[achievement_id]) {
    return new Response(JSON.stringify({ error: 'Invalid achievement_id' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = crypto.randomUUID();

  try {
    await env.DB.prepare(`
      INSERT INTO achievements (id, player_id, achievement_id, metadata, unlocked_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, player_id, achievement_id, JSON.stringify(metadata), new Date().toISOString()).run();

    // Invalidate cache
    await env.CACHE.delete(`achievements:${player_id}`);
    await env.CACHE.delete(`achievements:${player_id}:${achievement_id}`);

    // Check for legendary achievement unlock
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM achievements WHERE player_id = ?'
    ).bind(player_id).first();
    
    if (countResult && countResult.count >= 50) {
      try {
        await env.DB.prepare(`
          INSERT INTO achievements (id, player_id, achievement_id, metadata, unlocked_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), player_id, 'legendary', JSON.stringify({ auto_unlocked: true }), new Date().toISOString()).run();
      } catch (e) {
        // Already unlocked, ignore
      }
    }

    const definition = ACHIEVEMENT_DEFINITIONS[achievement_id];

    return new Response(JSON.stringify({ 
      success: true, 
      id, 
      achievement: definition,
      points_awarded: definition?.points || 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return new Response(JSON.stringify({ error: 'Achievement already unlocked' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.error('Achievement unlock error:', error);
    return new Response(JSON.stringify({ error: 'Failed to unlock achievement' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get achievement definitions
export async function onRequestOptions(context: { env: Env; request: Request }) {
  return new Response(JSON.stringify({
    achievements: Object.values(ACHIEVEMENT_DEFINITIONS),
    total: Object.keys(ACHIEVEMENT_DEFINITIONS).length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
