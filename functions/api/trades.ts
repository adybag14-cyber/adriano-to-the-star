import { Env } from '../types/index.js';

interface TradeOffer {
  id: string;
  player_id: string;
  from_player_id: string;
  to_player_id: string;
  items_offered: any[];
  items_requested: any[];
  credits_offered: number;
  credits_requested: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  expires_at: string;
}

const TRADE_EXPIRY_HOURS = 24;

// Create a new trade offer
export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { 
    player_id, 
    from_player_id, 
    to_player_id, 
    items_offered = [], 
    items_requested = [], 
    credits_offered = 0, 
    credits_requested = 0 
  } = await request.json();

  // Validation
  if (!player_id || !from_player_id || !to_player_id) {
    return new Response(JSON.stringify({ error: 'player_id, from_player_id, and to_player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (from_player_id === to_player_id) {
    return new Response(JSON.stringify({ error: 'Cannot trade with yourself' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (items_offered.length === 0 && credits_offered === 0) {
    return new Response(JSON.stringify({ error: 'Must offer at least one item or credits' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (items_requested.length === 0 && credits_requested === 0) {
    return new Response(JSON.stringify({ error: 'Must request at least one item or credits' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + TRADE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO trades (id, player_id, trade_data, status, created_at, updated_at, expires_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?)
    `).bind(
      id, 
      player_id, 
      JSON.stringify({
        from_player_id,
        to_player_id,
        items_offered,
        items_requested,
        credits_offered,
        credits_requested
      }), 
      now, 
      now, 
      expiresAt
    ).run();

    // Invalidate cache for both players
    await env.CACHE.delete(`trades:${from_player_id}`);
    await env.CACHE.delete(`trades:${to_player_id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      id, 
      status: 'pending',
      expires_at: expiresAt
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Trade creation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create trade' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get trades for a player
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type'); // 'sent' or 'received'

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check cache
  const cacheKey = `trades:${playerId}${status ? `:${status}` : ''}${type ? `:${type}` : ''}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  let query = 'SELECT * FROM trades WHERE player_id = ?';
  const params = [playerId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const results = await env.DB.prepare(query).bind(...params).all();
  
  // Parse and filter trades
  const trades = (results.results || []).map((trade: any) => {
    const tradeData = JSON.parse(trade.trade_data);
    return {
      ...trade,
      ...tradeData
    };
  });

  // Filter by type if specified
  let filteredTrades = trades;
  if (type === 'sent') {
    filteredTrades = trades.filter((t: any) => t.from_player_id === playerId);
  } else if (type === 'received') {
    filteredTrades = trades.filter((t: any) => t.to_player_id === playerId);
  }

  const response = JSON.stringify(filteredTrades);
  await env.CACHE.put(cacheKey, response, { expirationTtl: 30 });
  
  return new Response(response, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
  });
}

// Update trade status (accept/reject/cancel)
export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { trade_id, player_id, status } = await request.json();

  if (!trade_id || !player_id || !status) {
    return new Response(JSON.stringify({ error: 'trade_id, player_id, and status required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const validStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get the trade
  const trade = await env.DB.prepare(
    'SELECT * FROM trades WHERE id = ?'
  ).bind(trade_id).first();

  if (!trade) {
    return new Response(JSON.stringify({ error: 'Trade not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const tradeData = JSON.parse(trade.trade_data);

  // Verify player is involved in the trade
  if (tradeData.from_player_id !== player_id && tradeData.to_player_id !== player_id) {
    return new Response(JSON.stringify({ error: 'You are not authorized to update this trade' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if trade is already completed
  if (trade.status === 'completed' || trade.status === 'cancelled') {
    return new Response(JSON.stringify({ error: 'Trade is already finalized' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Only the receiving player can accept/reject
  if ((status === 'accepted' || status === 'rejected') && tradeData.to_player_id !== player_id) {
    return new Response(JSON.stringify({ error: 'Only the receiving player can accept or reject' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Either player can cancel
  if (status === 'cancelled' && tradeData.from_player_id !== player_id && tradeData.to_player_id !== player_id) {
    return new Response(JSON.stringify({ error: 'Only trade participants can cancel' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();

  try {
    await env.DB.prepare(`
      UPDATE trades 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, now, trade_id).run();

    // Invalidate cache for both players
    await env.CACHE.delete(`trades:${tradeData.from_player_id}`);
    await env.CACHE.delete(`trades:${tradeData.to_player_id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      status,
      updated_at: now
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Trade update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update trade' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete a trade (only if cancelled or rejected)
export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const tradeId = url.searchParams.get('trade_id');

  if (!playerId || !tradeId) {
    return new Response(JSON.stringify({ error: 'player_id and trade_id required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get the trade
  const trade = await env.DB.prepare(
    'SELECT * FROM trades WHERE id = ?'
  ).bind(tradeId).first();

  if (!trade) {
    return new Response(JSON.stringify({ error: 'Trade not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const tradeData = JSON.parse(trade.trade_data);

  // Only allow deletion of cancelled or rejected trades
  if (trade.status !== 'cancelled' && trade.status !== 'rejected') {
    return new Response(JSON.stringify({ error: 'Can only delete cancelled or rejected trades' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify ownership
  if (tradeData.from_player_id !== playerId && tradeData.to_player_id !== playerId) {
    return new Response(JSON.stringify({ error: 'Not authorized to delete this trade' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(
    'DELETE FROM trades WHERE id = ?'
  ).bind(tradeId).run();

  // Invalidate cache
  await env.CACHE.delete(`trades:${tradeData.from_player_id}`);
  await env.CACHE.delete(`trades:${tradeData.to_player_id}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
