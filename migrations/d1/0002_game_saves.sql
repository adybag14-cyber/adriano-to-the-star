-- Game-save persistence fallback for accounts without R2 enabled.
CREATE TABLE IF NOT EXISTS game_saves (
  user_id TEXT NOT NULL,
  save_id TEXT NOT NULL,
  game_data TEXT NOT NULL,
  password_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, save_id)
);

CREATE INDEX IF NOT EXISTS idx_game_saves_user_updated
  ON game_saves(user_id, updated_at DESC);
