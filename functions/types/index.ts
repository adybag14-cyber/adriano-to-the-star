export interface Env {
  DB: D1Database;
  CACHE: any;
  GAME_ROOM: DurableObjectNamespace;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(sql: string): Promise<D1Result>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    last_row_id: number;
    changes: number;
    served_by: string;
  };
}

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectId {
  toString(): string;
}

export interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

export interface Player {
  id: string;
  username: string;
  email?: string;
  created_at: string;
  last_login?: string;
  stats: Record<string, any>;
  settings: Record<string, any>;
}

export interface SaveData {
  resources: Record<string, number>;
  buildings: any[];
  colonists: any[];
  day: number;
  planet_data: any;
  [key: string]: any;
}

export interface Save {
  id: string;
  player_id: string;
  save_name: string;
  save_data: SaveData;
  is_autosave: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  player_id: string;
  achievement_id: string;
  unlocked_at: string;
  metadata: Record<string, any>;
}

export interface Trade {
  id: string;
  player_id: string;
  trade_data: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface LeaderboardEntry {
  id: string;
  player_id: string;
  category: string;
  score: number;
  metadata: Record<string, any>;
  updated_at: string;
}

export interface GameSession {
  id: string;
  player_id: string;
  session_start: string;
  session_end?: string;
  duration_seconds?: number;
  metadata: Record<string, any>;
}
