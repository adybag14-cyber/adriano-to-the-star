/**
 * 📜 Era III: AI Historians - Cloudflare API
 * 
 * Handles galactic events, news generation, and historical archives
 */

import { Env } from '../types';

export interface GalacticEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  participants: string;
  factions: string;
  location: string;
  timestamp: number;
  impact_score: number;
  verified: boolean;
}

export interface GalacticNews {
  id: string;
  event_id: string;
  headline: string;
  article_body: string;
  author: string;
  published_at: number;
  views: number;
  likes: number;
}

export interface HistoricalArchive {
  id: string;
  era: string;
  category: string;
  title: string;
  content: string;
  tags: string;
  archived_at: number;
  importance_score: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle different routes
    if (path === '/api/historians/events') {
      return handleEvents(request, env);
    } else if (path.startsWith('/api/historians/events/')) {
      const eventId = path.split('/').pop();
      if (!eventId) {
        return new Response(JSON.stringify({ error: 'Event ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return handleEventById(request, env, eventId);
    } else if (path === '/api/historians/news') {
      return handleNews(request, env);
    } else if (path === '/api/historians/archives') {
      return handleArchives(request, env);
    } else if (path === '/api/historians/verify') {
      return handleVerifyEvent(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleEvents(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  
  if (request.method === 'GET') {
    let query = 'SELECT * FROM galactic_events ORDER BY timestamp DESC LIMIT ?';
    let params: (string | number)[] = [limit];
    
    if (since) {
      query = 'SELECT * FROM galactic_events WHERE timestamp > ? ORDER BY timestamp DESC LIMIT ?';
      params = [parseInt(since), limit];
    }
    
    const events = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({ events: events.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    // Create new event
    const body = await request.json() as any;
    
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: body.event_type,
      title: body.title,
      description: body.description,
      participants: body.participants,
      factions: body.factions,
      location: body.location,
      timestamp: body.timestamp || Date.now(),
      impact_score: body.impact_score || 50,
      verified: false
    };
    
    await env.DB.prepare(`
      INSERT INTO galactic_events (id, event_type, title, description, participants, factions, location, timestamp, impact_score, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id,
      event.event_type,
      event.title,
      event.description,
      event.participants,
      event.factions,
      event.location,
      event.timestamp,
      event.impact_score,
      event.verified
    ).run();
    
    return new Response(JSON.stringify({ event }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleEventById(request: Request, env: Env, eventId: string): Promise<Response> {
  if (request.method === 'GET') {
    const event = await env.DB.prepare(
      'SELECT * FROM galactic_events WHERE id = ?'
    ).bind(eventId).first();
    
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ event }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'PUT') {
    // Update event
    const body = await request.json() as any;
    
    await env.DB.prepare(`
      UPDATE galactic_events
      SET title = ?, description = ?, impact_score = ?
      WHERE id = ?
    `).bind(body.title, body.description, body.impact_score, eventId).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleNews(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  if (request.method === 'GET') {
    const news = await env.DB.prepare(`
      SELECT * FROM galactic_news ORDER BY published_at DESC LIMIT ?
    `).bind(limit).all();
    
    return new Response(JSON.stringify({ news: news.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    // Create new news article
    const body = await request.json() as any;
    
    const article = {
      id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_id: body.event_id,
      headline: body.headline,
      article_body: body.article_body,
      author: body.author || 'AI Historian',
      published_at: body.published_at || Date.now(),
      views: 0,
      likes: 0
    };
    
    await env.DB.prepare(`
      INSERT INTO galactic_news (id, event_id, headline, article_body, author, published_at, views, likes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      article.id,
      article.event_id,
      article.headline,
      article.article_body,
      article.author,
      article.published_at,
      article.views,
      article.likes
    ).run();
    
    return new Response(JSON.stringify({ article }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleArchives(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const era = url.searchParams.get('era');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  if (request.method === 'GET') {
    let query = 'SELECT * FROM historical_archives ORDER BY archived_at DESC LIMIT ?';
    let params: (string | number)[] = [limit];
    
    if (era) {
      query = 'SELECT * FROM historical_archives WHERE era = ? ORDER BY archived_at DESC LIMIT ?';
      params = [era, limit];
    }
    
    const archives = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({ archives: archives.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    // Create new archive entry
    const body = await request.json() as any;
    
    const archive = {
      id: `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      era: body.era,
      category: body.category,
      title: body.title,
      content: body.content,
      tags: body.tags,
      archived_at: Date.now(),
      importance_score: body.importance_score || 50
    };
    
    await env.DB.prepare(`
      INSERT INTO historical_archives (id, era, category, title, content, tags, archived_at, importance_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      archive.id,
      archive.era,
      archive.category,
      archive.title,
      archive.content,
      archive.tags,
      archive.archived_at,
      archive.importance_score
    ).run();
    
    return new Response(JSON.stringify({ archive }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleVerifyEvent(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  const body = await request.json() as any;
  const { event_id, verified } = body;
  
  await env.DB.prepare(
    'UPDATE galactic_events SET verified = ? WHERE id = ?'
  ).bind(verified, event_id).run();
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
