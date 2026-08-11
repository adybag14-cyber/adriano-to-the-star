-- Era III: The Singularity - Database Schema
-- Citizen Science Integration and Server Meshing

-- Citizen Science Tasks Table
CREATE TABLE IF NOT EXISTS citizen_science_tasks (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  status TEXT NOT NULL,
  data TEXT,
  player_result TEXT,
  accuracy REAL,
  reward INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- Citizen Science Contributions Table
CREATE TABLE IF NOT EXISTS citizen_science_contributions (
  player_id TEXT PRIMARY KEY,
  total_score INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  discoveries INTEGER NOT NULL DEFAULT 0,
  average_accuracy REAL NOT NULL DEFAULT 0,
  scientific_impact INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Scientific Discoveries Table
CREATE TABLE IF NOT EXISTS scientific_discoveries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  kepler_id TEXT,
  discovery_type TEXT NOT NULL,
  accuracy REAL NOT NULL,
  scientific_value INTEGER NOT NULL,
  discovered_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES citizen_science_tasks(id),
  FOREIGN KEY (player_id) REFERENCES citizen_science_contributions(player_id)
);

-- Biological Puzzles Table
CREATE TABLE IF NOT EXISTS biological_puzzles (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  protein_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  status TEXT NOT NULL,
  structure TEXT NOT NULL,
  target_energy REAL NOT NULL,
  current_energy REAL NOT NULL,
  moves INTEGER NOT NULL DEFAULT 0,
  max_moves INTEGER NOT NULL,
  reward INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  score REAL
);

-- Folding Contributions Table
CREATE TABLE IF NOT EXISTS folding_contributions (
  player_id TEXT PRIMARY KEY,
  total_score INTEGER NOT NULL DEFAULT 0,
  proteins_folded INTEGER NOT NULL DEFAULT 0,
  puzzles_completed INTEGER NOT NULL DEFAULT 0,
  average_score REAL NOT NULL DEFAULT 0,
  scientific_impact INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Server Meshing: Shards Table
CREATE TABLE IF NOT EXISTS server_shards (
  id TEXT PRIMARY KEY,
  shard_name TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  current_players INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  coordinates_x REAL NOT NULL,
  coordinates_y REAL NOT NULL,
  coordinates_z REAL NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Server Meshing: Player Shard Assignment
CREATE TABLE IF NOT EXISTS player_shard_assignments (
  player_id TEXT PRIMARY KEY,
  shard_id TEXT NOT NULL,
  assigned_at INTEGER NOT NULL,
  last_active INTEGER NOT NULL,
  FOREIGN KEY (shard_id) REFERENCES server_shards(id)
);

-- AI Historians: Galactic Events Table
CREATE TABLE IF NOT EXISTS galactic_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  participants TEXT NOT NULL,
  factions TEXT,
  location TEXT,
  timestamp INTEGER NOT NULL,
  impact_score INTEGER NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT 0
);

-- AI Historians: Published News Table
CREATE TABLE IF NOT EXISTS galactic_news (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  headline TEXT NOT NULL,
  article_body TEXT NOT NULL,
  author TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES galactic_events(id)
);

-- AI Historians: Historical Archives
CREATE TABLE IF NOT EXISTS historical_archives (
  id TEXT PRIMARY KEY,
  era TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  archived_at INTEGER NOT NULL,
  importance_score INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_citizen_tasks_player ON citizen_science_tasks(player_id);
CREATE INDEX IF NOT EXISTS idx_citizen_tasks_status ON citizen_science_tasks(status);
CREATE INDEX IF NOT EXISTS idx_discoveries_player ON scientific_discoveries(player_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_time ON scientific_discoveries(discovered_at);
CREATE INDEX IF NOT EXISTS idx_biological_puzzles_player ON biological_puzzles(player_id);
CREATE INDEX IF NOT EXISTS idx_biological_puzzles_status ON biological_puzzles(status);
CREATE INDEX IF NOT EXISTS idx_shards_status ON server_shards(status);
CREATE INDEX IF NOT EXISTS idx_shards_players ON server_shards(current_players);
CREATE INDEX IF NOT EXISTS idx_player_shards ON player_shard_assignments(shard_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON galactic_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_type ON galactic_events(event_type);
CREATE INDEX IF NOT EXISTS idx_news_published ON galactic_news(published_at);
CREATE INDEX IF NOT EXISTS idx_archives_era ON historical_archives(era);
CREATE INDEX IF NOT EXISTS idx_archives_importance ON historical_archives(importance_score);

-- Insert default shard for initial deployment
INSERT OR IGNORE INTO server_shards (
  id, shard_name, region, capacity, current_players, status,
  coordinates_x, coordinates_y, coordinates_z, created_at, updated_at
) VALUES (
  'shard_alpha', 'Alpha Shard', 'us-east', 10000, 0, 'active',
  0.0, 0.0, 0.0, strftime('%s', 'now'), strftime('%s', 'now')
);
