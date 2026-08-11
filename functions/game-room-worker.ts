export interface PlayerState {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
  isReady: boolean;
  data?: any;
}

export interface RoomConfig {
  room_id: string;
  name: string;
  max_players: number;
  game_mode: string;
  host_id: string;
  created_at: number;
}

export interface GameState {
  status: 'waiting' | 'in_progress' | 'paused' | 'completed';
  started_at?: number;
  ended_at?: number;
  current_turn?: number;
  data?: any;
}

export interface DurableObjectState {
  storage: any;
}

export class GameRoom {
  #state: DurableObjectState;
  #env: any;
  #config: RoomConfig | null = null;
  #players: Map<string, PlayerState> = new Map();
  #gameState: GameState = { status: 'waiting' };
  #messages: any[] = [];
  #lastUpdate: number = Date.now();

  constructor(state: DurableObjectState, env: any) {
    this.#state = state;
    this.#env = env;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Handle GET requests
      if (request.method === 'GET') {
        return this.handleGetState();
      }

      // Handle POST requests
      const body = await request.json().catch(() => ({}));
      const action = body.action || 'unknown';

      switch (action) {
        case 'create':
          return this.handleCreate(body);
        case 'join':
          return this.handleJoin(body);
        case 'leave':
          return this.handleLeave(body);
        case 'ready':
          return this.handleReady(body);
        case 'start':
          return this.handleStart(body);
        case 'broadcast':
          return this.handleBroadcast(body);
        case 'update_game':
          return this.handleUpdateGame(body);
        case 'end':
          return this.handleEnd(body);
        default:
          return new Response(JSON.stringify({ error: 'Unknown action' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    } catch (error: any) {
      console.error('GameRoom error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCreate(body: any): Promise<Response> {
    const { player_id, room_id, name, max_players, game_mode } = body;

    if (!player_id || !room_id || !name) {
      return new Response(JSON.stringify({ error: 'player_id, room_id, and name required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (this.#config) {
      return new Response(JSON.stringify({ error: 'Room already created' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    this.#config = {
      room_id,
      name: name.trim(),
      max_players: Math.min(Math.max(max_players || 4, 2), 10),
      game_mode: game_mode || 'standard',
      host_id: player_id,
      created_at: Date.now()
    };

    // Add host as first player
    await this.addPlayer(player_id, 'Host', true);

    await this.saveState();

    return new Response(JSON.stringify({ 
      success: true, 
      room: this.#config,
      players: Array.from(this.#players.values())
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleJoin(body: any): Promise<Response> {
    const { player_id, player_name } = body;

    if (!player_id) {
      return new Response(JSON.stringify({ error: 'player_id required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!this.#config) {
      return new Response(JSON.stringify({ error: 'Room not created' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (this.#players.has(player_id)) {
      return new Response(JSON.stringify({ error: 'Player already in room' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (this.#players.size >= this.#config.max_players) {
      return new Response(JSON.stringify({ error: 'Room is full' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await this.addPlayer(player_id, player_name || `Player ${this.#players.size + 1}`, false);

    await this.broadcast({
      type: 'player_joined',
      player: this.#players.get(player_id)
    });

    await this.saveState();

    return new Response(JSON.stringify({ 
      success: true, 
      players: Array.from(this.#players.values()),
      game_state: this.#gameState
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleLeave(body: any): Promise<Response> {
    const { player_id } = body;

    if (!player_id) {
      return new Response(JSON.stringify({ error: 'player_id required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!this.#players.has(player_id)) {
      return new Response(JSON.stringify({ error: 'Player not in room' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const wasHost = this.#config?.host_id === player_id;
    this.#players.delete(player_id);

    // If host left and there are other players, transfer host
    if (wasHost && this.#players.size > 0) {
      const newHost = this.#players.keys().next().value;
      if (newHost && this.#config) {
        this.#config.host_id = newHost;
      }
    }

    await this.broadcast({
      type: 'player_left',
      player_id,
      new_host: this.#config?.host_id
    });

    // End game if no players left
    if (this.#players.size === 0) {
      await this.handleEnd({ reason: 'no_players' });
    }

    await this.saveState();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleReady(body: any): Promise<Response> {
    const { player_id, is_ready } = body;

    if (!player_id) {
      return new Response(JSON.stringify({ error: 'player_id required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const player = this.#players.get(player_id);
    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not in room' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    player.isReady = is_ready !== undefined ? is_ready : true;
    player.lastSeen = Date.now();

    await this.broadcast({
      type: 'player_ready',
      player_id,
      is_ready: player.isReady
    });

    await this.saveState();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleStart(body: any): Promise<Response> {
    const { player_id } = body;

    if (!player_id) {
      return new Response(JSON.stringify({ error: 'player_id required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!this.#config || this.#config.host_id !== player_id) {
      return new Response(JSON.stringify({ error: 'Only host can start game' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (this.#gameState.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Game already started' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (this.#players.size < 2) {
      return new Response(JSON.stringify({ error: 'Need at least 2 players to start' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    this.#gameState = {
      status: 'in_progress',
      started_at: Date.now(),
      current_turn: 0,
      data: body.game_data || {}
    };

    await this.broadcast({
      type: 'game_started',
      game_state: this.#gameState
    });

    await this.saveState();

    return new Response(JSON.stringify({ 
      success: true, 
      game_state: this.#gameState 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleBroadcast(body: any): Promise<Response> {
    const { player_id, data } = body;

    if (!player_id || !data) {
      return new Response(JSON.stringify({ error: 'player_id and data required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!this.#players.has(player_id)) {
      return new Response(JSON.stringify({ error: 'Player not in room' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await this.broadcast({
      type: 'message',
      player_id,
      data,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleUpdateGame(body: any): Promise<Response> {
    const { player_id, game_data } = body;

    if (!player_id) {
      return new Response(JSON.stringify({ error: 'player_id required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!this.#players.has(player_id)) {
      return new Response(JSON.stringify({ error: 'Player not in room' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (this.#gameState.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: 'Game not in progress' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    this.#gameState.data = { ...this.#gameState.data, ...game_data };
    this.#gameState.current_turn = (this.#gameState.current_turn || 0) + 1;

    await this.broadcast({
      type: 'game_updated',
      player_id,
      game_state: this.#gameState
    });

    await this.saveState();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleEnd(body: any): Promise<Response> {
    const { player_id, reason, winner_id } = body;

    if (player_id && this.#config && this.#config.host_id !== player_id) {
      return new Response(JSON.stringify({ error: 'Only host can end game' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    this.#gameState.status = 'completed';
    this.#gameState.ended_at = Date.now();

    await this.broadcast({
      type: 'game_ended',
      reason: reason || 'manual',
      winner_id,
      game_state: this.#gameState
    });

    await this.saveState();

    return new Response(JSON.stringify({ 
      success: true, 
      game_state: this.#gameState 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetState(): Promise<Response> {
    return new Response(JSON.stringify({
      config: this.#config,
      players: Array.from(this.#players.values()),
      game_state: this.#gameState,
      messages: this.#messages.slice(-50),
      last_update: this.#lastUpdate
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async addPlayer(playerId: string, playerName: string, isHost: boolean): Promise<void> {
    this.#players.set(playerId, {
      id: playerId,
      name: playerName,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isReady: isHost
    });
  }

  private async broadcast(message: any): Promise<void> {
    message.timestamp = Date.now();
    this.#messages.push(message);

    // Keep only last 100 messages
    if (this.#messages.length > 100) {
      this.#messages = this.#messages.slice(-100);
    }

    this.#lastUpdate = Date.now();
  }

  private async saveState(): Promise<void> {
    await this.#state.storage.put({
      config: this.#config,
      players: Array.from(this.#players.entries()),
      gameState: this.#gameState,
      messages: this.#messages,
      lastUpdate: this.#lastUpdate
    });
  }
}
