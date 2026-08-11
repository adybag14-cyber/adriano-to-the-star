/**
 * 🌟 Era III: Citizen Science Integration - Cloudflare API
 * 
 * Handles citizen science contributions, leaderboards, and data synchronization
 */

import { Env } from '../types';

export interface CitizenScienceTask {
  id: string;
  player_id: string;
  task_type: string;
  difficulty: string;
  status: string;
  data: any;
  player_result?: any;
  accuracy?: number;
  reward: number;
  created_at: number;
  completed_at?: number;
}

export interface ScientificDiscovery {
  id: string;
  task_id: string;
  player_id: string;
  kepler_id: string;
  discovery_type: string;
  accuracy: number;
  scientific_value: number;
  discovered_at: number;
}

export interface ContributionStats {
  player_id: string;
  total_score: number;
  tasks_completed: number;
  discoveries: number;
  average_accuracy: number;
  scientific_impact: number;
  updated_at: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle different routes
    if (path === '/api/citizen-science/tasks') {
      return handleTasks(request, env);
    } else if (path === '/api/citizen-science/contributions') {
      return handleContributions(request, env);
    } else if (path === '/api/citizen-science/leaderboard') {
      return handleLeaderboard(request, env);
    } else if (path === '/api/citizen-science/discoveries') {
      return handleDiscoveries(request, env);
    } else if (path.startsWith('/api/citizen-science/tasks/')) {
      const taskId = path.split('/').pop();
      if (!taskId) {
        return new Response(JSON.stringify({ error: 'Task ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return handleTaskById(request, env, taskId);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleTasks(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  
  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (request.method === 'GET') {
    // Get player's active and completed tasks
    const tasks = await env.DB.prepare(
      'SELECT * FROM citizen_science_tasks WHERE player_id = ? ORDER BY created_at DESC'
    ).bind(playerId).all();
    
    return new Response(JSON.stringify({ tasks: tasks.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    // Create a new task
    const body = await request.json() as any;
    
    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player_id: playerId,
      task_type: body.task_type,
      difficulty: body.difficulty || 'medium',
      status: 'pending',
      data: body.data || null,
      reward: body.reward || 100,
      created_at: Date.now()
    };
    
    await env.DB.prepare(
      `INSERT INTO citizen_science_tasks (id, player_id, task_type, difficulty, status, data, reward, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      task.id,
      task.player_id,
      task.task_type,
      task.difficulty,
      task.status,
      JSON.stringify(task.data),
      task.reward,
      task.created_at
    ).run();
    
    return new Response(JSON.stringify({ task }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleTaskById(request: Request, env: Env, taskId: string): Promise<Response> {
  if (request.method === 'GET') {
    const task = await env.DB.prepare(
      'SELECT * FROM citizen_science_tasks WHERE id = ?'
    ).bind(taskId).first();
    
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ task }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'PUT') {
    // Update task (submit analysis)
    const body = await request.json() as any;
    
    const existingTask = await env.DB.prepare(
      'SELECT * FROM citizen_science_tasks WHERE id = ?'
    ).bind(taskId).first();
    
    if (!existingTask) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Calculate accuracy
    const accuracy = calculateAccuracy(existingTask as any, body.player_result);
    
    // Update task
    await env.DB.prepare(
      `UPDATE citizen_science_tasks
       SET status = ?, player_result = ?, accuracy = ?, completed_at = ?
       WHERE id = ?`
    ).bind(
      'completed',
      JSON.stringify(body.player_result),
      accuracy,
      Date.now(),
      taskId
    ).run();
    
    // Update player's contribution stats
    await updateContributionStats(env, existingTask.player_id as string, accuracy, existingTask.difficulty as string);
    
    // Check for discovery (high accuracy)
    if (accuracy > 0.95) {
      await recordDiscovery(env, taskId, existingTask as any, accuracy);
    }
    
    return new Response(JSON.stringify({
      success: true,
      accuracy: accuracy,
      reward: Math.floor((existingTask.reward as number) * accuracy)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleContributions(request: Request, env: Env): Promise<Response> {
  if (request.method === 'POST') {
    // Sync player's contributions
    const body = await request.json() as any;
    
    const stats = {
      player_id: body.playerId,
      total_score: body.stats.totalScore,
      tasks_completed: body.stats.tasksCompleted,
      discoveries: body.stats.discoveries,
      average_accuracy: body.stats.averageAccuracy,
      scientific_impact: body.stats.scientificImpact,
      updated_at: Date.now()
    };
    
    // Upsert contribution stats
    await env.DB.prepare(`
      INSERT INTO citizen_science_contributions (player_id, total_score, tasks_completed, discoveries, average_accuracy, scientific_impact, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        total_score = excluded.total_score,
        tasks_completed = excluded.tasks_completed,
        discoveries = excluded.discoveries,
        average_accuracy = excluded.average_accuracy,
        scientific_impact = excluded.scientific_impact,
        updated_at = excluded.updated_at
    `).bind(
      stats.player_id,
      stats.total_score,
      stats.tasks_completed,
      stats.discoveries,
      stats.average_accuracy,
      stats.scientific_impact,
      stats.updated_at
    ).run();
    
    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleLeaderboard(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100');
  
  const leaderboard = await env.DB.prepare(`
    SELECT player_id, total_score, tasks_completed, discoveries, scientific_impact
    FROM citizen_science_contributions
    ORDER BY total_score DESC
    LIMIT ?
  `).bind(limit).all();
  
  return new Response(JSON.stringify({ leaderboard: leaderboard.results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleDiscoveries(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  let query = 'SELECT * FROM scientific_discoveries ORDER BY discovered_at DESC LIMIT ?';
  let params: (string | number)[] = [limit];
  
  if (playerId) {
    query = 'SELECT * FROM scientific_discoveries WHERE player_id = ? ORDER BY discovered_at DESC LIMIT ?';
    params = [playerId, limit];
  }
  
  const discoveries = await env.DB.prepare(query).bind(...params).all();
  
  return new Response(JSON.stringify({ discoveries: discoveries.results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function calculateAccuracy(task: any, playerResult: any): number {
  let accuracy = 0;
  
  switch (task.task_type) {
    case 'transit_detection':
      const periodDiff = Math.abs(playerResult.period - task.data.expectedPeriod);
      accuracy = Math.max(0, 1 - (periodDiff / task.data.expectedPeriod));
      break;
      
    case 'period_validation':
      const validationDiff = Math.abs(playerResult.period - task.data.observedPeriod);
      accuracy = Math.max(0, 1 - (validationDiff / task.data.observedPeriod));
      break;
      
    case 'radius_estimation':
      const radiusDiff = Math.abs(playerResult.radius - task.data.expectedRadius);
      accuracy = Math.max(0, 1 - (radiusDiff / task.data.expectedRadius));
      break;
  }
  
  return accuracy;
}

async function updateContributionStats(env: Env, playerId: string, accuracy: number, difficulty: string): Promise<void> {
  const basePoints: Record<string, number> = {
    'easy': 10,
    'medium': 25,
    'hard': 50
  };
  
  const points = Math.floor((basePoints[difficulty] || 10) * accuracy);
  
  // Get current stats
  const currentStats = await env.DB.prepare(
    'SELECT * FROM citizen_science_contributions WHERE player_id = ?'
  ).bind(playerId).first();
  
  if (currentStats) {
    // Update existing stats
    await env.DB.prepare(`
      UPDATE citizen_science_contributions
      SET total_score = total_score + ?,
          tasks_completed = tasks_completed + 1,
          average_accuracy = (average_accuracy * tasks_completed + ?) / (tasks_completed + 1),
          updated_at = ?
      WHERE player_id = ?
    `).bind(points, accuracy, Date.now(), playerId).run();
  } else {
    // Create new stats
    await env.DB.prepare(`
      INSERT INTO citizen_science_contributions (player_id, total_score, tasks_completed, discoveries, average_accuracy, scientific_impact, updated_at)
      VALUES (?, ?, ?, 0, ?, 0, ?)
    `).bind(playerId, points, 1, accuracy, Date.now()).run();
  }
}

async function recordDiscovery(env: Env, taskId: string, task: any, accuracy: number): Promise<void> {
  const baseReward: Record<string, number> = {
    'easy': 100,
    'medium': 250,
    'hard': 500
  };
  
  const scientificValue = Math.floor(accuracy * (baseReward[task.difficulty] || 100) * 1.5);
  
  const discovery = {
    id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    task_id: taskId,
    player_id: task.player_id,
    kepler_id: task.data.keplerId,
    discovery_type: task.task_type,
    accuracy: accuracy,
    scientific_value: scientificValue,
    discovered_at: Date.now()
  };
  
  await env.DB.prepare(`
    INSERT INTO scientific_discoveries (id, task_id, player_id, kepler_id, discovery_type, accuracy, scientific_value, discovered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    discovery.id,
    discovery.task_id,
    discovery.player_id,
    discovery.kepler_id,
    discovery.discovery_type,
    discovery.accuracy,
    discovery.scientific_value,
    discovery.discovered_at
  ).run();
  
  // Update discovery count in contributions
  await env.DB.prepare(`
    UPDATE citizen_science_contributions
    SET discoveries = discoveries + 1,
        scientific_impact = scientific_impact + ?
    WHERE player_id = ?
  `).bind(scientificValue, task.player_id).run();
}
