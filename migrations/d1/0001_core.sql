PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  full_name TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 120000,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS planet_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  email TEXT,
  kepid TEXT NOT NULL,
  planet_data TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  claimed_at TEXT NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, kepid)
);
CREATE INDEX IF NOT EXISTS idx_planet_claims_user_id ON planet_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_planet_claims_kepid ON planet_claims(kepid);
CREATE INDEX IF NOT EXISTS idx_planet_claims_status ON planet_claims(status);

CREATE TABLE IF NOT EXISTS planet_favorites (
  user_id TEXT NOT NULL,
  kepid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, kepid),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_planet_favorites_user_id ON planet_favorites(user_id);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  avatar_url TEXT,
  stats TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
