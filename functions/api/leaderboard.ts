import { Env } from '../types/index.js';

interface LeaderboardEntry {
  rank: number;
  player_id: string;
  username: string;
  score: number;
  stats: Record<string, any>;
  updated_at: string;
}

interface PlayerStats {
  total_score: number;
  planets_colonized: number;
  battles_won: number;
  credits_earned: number;
  research_completed: number;
  exoplanets_discovered: number;
  achievements_unlocked: number;
  playtime_hours: number;
}

const LEADERBOARD_CATEGORIES = [
  'total_score',
  'planets_colonized',
  'battles_won',
  'credits_earned',
  'research_completed',
  'exoplanets_discovered',
  'achievements_unlocked',
  'playtime_hours'
] as const;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const CACHE_TTL = 300; // 5 minutes

// Get leaderboard
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'total_score';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT)), MAX_LIMIT);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const playerId = url.searchParams.get('player_id');

  // Validate category
  if (!LEADERBOARD_CATEGORIES.includes(category as any)) {
    return new Response(JSON.stringify({ 
      error: `Invalid category. Must be one of: ${LEADERBOARD_CATEGORIES.join(', ')}` 
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check cache
  const cacheKey = `leaderboard:${category}:${limit}:${offset}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    
    // If player_id is provided, find their rank
    if (playerId) {
      const playerEntry = data.entries.find((e: LeaderboardEntry) => e.player_id === playerId);
      return new Response(JSON.stringify({
        ...data,
        player_rank: playerEntry?.rank || null
      }), {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      });
    }
    
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  // Get leaderboard entries
  const results = await env.DB.prepare(`
    SELECT 
      p.id as player_id,
      p.username,
      p.stats,
      p.updated_at
    FROM players p
    WHERE json_extract(p.stats, '$.${category}') IS NOT NULL
    ORDER BY json_extract(p.stats, '$.${category}') DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  // Get total count for pagination
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as total
    FROM players p
    WHERE json_extract(p.stats, '$.${category}') IS NOT NULL
  `).first();

  // Format leaderboard entries
  const leaderboard: LeaderboardEntry[] = (results.results || []).map((player: any, index: number) => {
    const stats = JSON.parse(player.stats || '{}');
    return {
      rank: offset + index + 1,
      player_id: player.player_id,
      username: player.username || 'Anonymous',
      score: stats[category] || 0,
      stats,
      updated_at: player.updated_at
    };
  });

  const response: any = {
    category,
    entries: leaderboard,
    pagination: {
      limit,
      offset,
      total: countResult?.total || 0,
      has_more: (offset + limit) < (countResult?.total || 0)
    }
  };

  // Cache the response
  await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: CACHE_TTL });

  // If player_id is provided, find their rank
  if (playerId) {
    const playerRankResult = await env.DB.prepare(`
      SELECT COUNT(*) as rank
      FROM players p
      WHERE json_extract(p.stats, '$.${category}') > (
        SELECT json_extract(stats, '$.${category}')
        FROM players
        WHERE id = ?
      )
    `).bind(playerId).first();

    response.player_rank = (playerRankResult?.rank || 0) + 1;
  }

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
  });
}

// Update player stats (POST)
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, stats } = await request.json();

  if (!player_id || !stats) {
    return new Response(JSON.stringify({ error: 'player_id and stats required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate stats object
  if (typeof stats !== 'object' || stats === null) {
    return new Response(JSON.stringify({ error: 'stats must be an object' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get current player stats
  const player = await env.DB.prepare(
    'SELECT stats FROM players WHERE id = ?'
  ).bind(player_id).first();

  if (!player) {
    return new Response(JSON.stringify({ error: 'Player not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const currentStats = JSON.parse(player.stats || '{}');
  const updatedStats = { ...currentStats };

  // Update stats with new values
  for (const [key, value] of Object.entries(stats)) {
    if (typeof value === 'number') {
      updatedStats[key] = (updatedStats[key] || 0) + value;
    } else {
      updatedStats[key] = value;
    }
  }

  // Calculate total score
  updatedStats.total_score = 
    (updatedStats.planets_colonized || 0) * 100 +
    (updatedStats.battles_won || 0) * 50 +
    (updatedStats.credits_earned || 0) / 1000 +
    (updatedStats.research_completed || 0) * 25 +
    (updatedStats.exoplanets_discovered || 0) * 10 +
    (updatedStats.achievements_unlocked || 0) * 20;

  const now = new Date().toISOString();

  try {
    await env.DB.prepare(`
      UPDATE players
      SET stats = ?, updated_at = ?
      WHERE id = ?
    `).bind(JSON.stringify(updatedStats), now, player_id).run();

    // Invalidate all leaderboard caches
    for (const category of LEADERBOARD_CATEGORIES) {
      await env.CACHE.delete(`leaderboard:${category}:*`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      stats: updatedStats,
      updated_at: now
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Stats update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update stats' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get available categories
export async function onRequestOptions(context: { env: Env; request: Request }) {
  return new Response(JSON.stringify({
    categories: LEADERBOARD_CATEGORIES,
    description: 'Available leaderboard categories'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
