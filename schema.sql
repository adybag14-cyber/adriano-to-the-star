-- Exoplanet Pioneer D1 Database Schema
-- Run with: wrangler d1 execute exoplanet-pioneer-db --file=schema.sql

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT,
  stats TEXT NOT NULL DEFAULT '{}',
  settings TEXT NOT NULL DEFAULT '{}'
);

-- Saves table
CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  save_name TEXT NOT NULL,
  save_data TEXT NOT NULL,
  is_autosave INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(player_id, achievement_id)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  trade_data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  category TEXT NOT NULL,
  score REAL NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Game sessions for analytics
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  session_start TEXT DEFAULT CURRENT_TIMESTAMP,
  session_end TEXT,
  duration_seconds INTEGER,
  metadata TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saves_player_id ON saves(player_id);
CREATE INDEX IF NOT EXISTS idx_saves_updated_at ON saves(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_player_id ON achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_trades_player_id ON trades(player_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_category_score ON leaderboard(category, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_player_id ON leaderboard(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_players_last_login ON players(last_login DESC);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_saves_timestamp
AFTER UPDATE ON saves
BEGIN
  UPDATE saves SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_leaderboard_timestamp
AFTER UPDATE ON leaderboard
BEGIN
  UPDATE leaderboard SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
