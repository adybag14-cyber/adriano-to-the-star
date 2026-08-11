-- Era II Database Schema for Exoplanet Pioneer
-- This schema extends the existing database with new tables for Era II features

-- Terrain System Tables
CREATE TABLE IF NOT EXISTS terrain_chunks (
  chunk_id TEXT PRIMARY KEY,
  chunk_x INTEGER NOT NULL,
  chunk_z INTEGER NOT NULL,
  voxel_data TEXT NOT NULL, -- JSON array of voxel data
  player_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_terrain_player ON terrain_chunks(player_id);
CREATE INDEX IF NOT EXISTS idx_terrain_position ON terrain_chunks(chunk_x, chunk_z);

-- Biosphere System Tables
CREATE TABLE IF NOT EXISTS species (
  species_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- plant, herbivore, carnivore, omnivore, decomposer
  generation INTEGER NOT NULL DEFAULT 0,
  parent_species_id TEXT,
  size REAL NOT NULL,
  mass REAL NOT NULL,
  color TEXT NOT NULL, -- Hex color
  shape TEXT NOT NULL,
  adaptations TEXT NOT NULL, -- JSON array
  tolerances TEXT NOT NULL, -- JSON object
  population INTEGER NOT NULL,
  carrying_capacity INTEGER NOT NULL,
  birth_rate REAL NOT NULL,
  death_rate REAL NOT NULL,
  diet TEXT NOT NULL, -- JSON object
  behavior TEXT NOT NULL, -- JSON object
  genetic_diversity REAL NOT NULL,
  fitness REAL NOT NULL,
  player_id TEXT NOT NULL,
  planet_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_species_player ON species(player_id);
CREATE INDEX IF NOT EXISTS idx_species_planet ON species(planet_id);
CREATE INDEX IF NOT EXISTS idx_species_type ON species(type);

CREATE TABLE IF NOT EXISTS ecosystems (
  ecosystem_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- forest, grassland, desert, aquatic, cave, tundra
  location_x REAL NOT NULL,
  location_y REAL NOT NULL,
  location_z REAL NOT NULL,
  size REAL NOT NULL,
  species TEXT NOT NULL, -- JSON array of species data
  biomass REAL NOT NULL,
  biodiversity REAL NOT NULL,
  stability REAL NOT NULL,
  productivity REAL NOT NULL,
  environmental_conditions TEXT NOT NULL, -- JSON object
  player_id TEXT NOT NULL,
  planet_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ecosystems_player ON ecosystems(player_id);
CREATE INDEX IF NOT EXISTS idx_ecosystems_planet ON ecosystems(planet_id);

CREATE TABLE IF NOT EXISTS evolution_history (
  history_id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  species_count INTEGER NOT NULL,
  ecosystem_count INTEGER NOT NULL,
  total_biomass REAL NOT NULL,
  avg_fitness REAL NOT NULL,
  biodiversity REAL NOT NULL,
  player_id TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evolution_player ON evolution_history(player_id);
CREATE INDEX IF NOT EXISTS idx_evolution_timestamp ON evolution_history(timestamp);

-- Diplomatic AI System Tables
CREATE TABLE IF NOT EXISTS factions (
  faction_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- empire, republic, federation, kingdom, corporation, religious_order
  ideology TEXT NOT NULL, -- expansionist, isolationist, pacifist, militarist, trade_focused, scientific
  leader TEXT NOT NULL,
  territory REAL NOT NULL,
  population INTEGER NOT NULL,
  economy REAL NOT NULL,
  military REAL NOT NULL,
  technology REAL NOT NULL,
  aggressiveness REAL NOT NULL,
  trustworthiness REAL NOT NULL,
  generosity REAL NOT NULL,
  pride REAL NOT NULL,
  primary_goal TEXT NOT NULL,
  secondary_goals TEXT NOT NULL, -- JSON array
  allies TEXT NOT NULL, -- JSON array
  enemies TEXT NOT NULL, -- JSON array
  neutral TEXT NOT NULL, -- JSON array
  long_term_memory TEXT NOT NULL, -- JSON array
  short_term_memory TEXT NOT NULL, -- JSON array
  generation INTEGER NOT NULL DEFAULT 0,
  ancestral_memory TEXT NOT NULL, -- JSON array
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_factions_player ON factions(player_id);
CREATE INDEX IF NOT EXISTS idx_factions_ideology ON factions(ideology);

CREATE TABLE IF NOT EXISTS diplomatic_relations (
  relation_id TEXT PRIMARY KEY,
  faction1_id TEXT NOT NULL,
  faction2_id TEXT NOT NULL,
  value REAL NOT NULL, -- -1 to 1
  trust REAL NOT NULL,
  respect REAL NOT NULL,
  fear REAL NOT NULL,
  history TEXT NOT NULL, -- JSON array
  treaties TEXT NOT NULL, -- JSON array
  wars TEXT NOT NULL, -- JSON array
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (faction1_id) REFERENCES factions(faction_id) ON DELETE CASCADE,
  FOREIGN KEY (faction2_id) REFERENCES factions(faction_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_relations_player ON diplomatic_relations(player_id);
CREATE INDEX IF NOT EXISTS idx_relations_factions ON diplomatic_relations(faction1_id, faction2_id);

CREATE TABLE IF NOT EXISTS treaties (
  treaty_id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- alliance, trade, peace, non_aggression
  parties TEXT NOT NULL, -- JSON array of faction IDs
  terms TEXT NOT NULL, -- JSON object
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT NOT NULL, -- active, expired, terminated
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_treaties_player ON treaties(player_id);
CREATE INDEX IF NOT EXISTS idx_treaties_status ON treaties(status);

CREATE TABLE IF NOT EXISTS wars (
  war_id TEXT PRIMARY KEY,
  aggressor_id TEXT NOT NULL,
  defender_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT NOT NULL, -- active, ended, stalemate
  battles TEXT NOT NULL, -- JSON array
  casualties TEXT NOT NULL, -- JSON object
  territory_changes TEXT NOT NULL, -- JSON array
  player_id TEXT NOT NULL,
  FOREIGN KEY (aggressor_id) REFERENCES factions(faction_id) ON DELETE CASCADE,
  FOREIGN KEY (defender_id) REFERENCES factions(faction_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wars_player ON wars(player_id);
CREATE INDEX IF NOT EXISTS idx_wars_status ON wars(status);

CREATE TABLE IF NOT EXISTS diplomatic_history (
  history_id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reaction TEXT NOT NULL,
  relation_change REAL NOT NULL,
  generation INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_diplo_history_player ON diplomatic_history(player_id);
CREATE INDEX IF NOT EXISTS idx_diplo_history_timestamp ON diplomatic_history(timestamp);

-- Soul Engine (NPCs) Tables
CREATE TABLE IF NOT EXISTS npcs (
  npc_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  role TEXT NOT NULL,
  faction_id TEXT,
  personality TEXT NOT NULL, -- JSON object
  emotional_state TEXT NOT NULL, -- JSON object
  mood REAL NOT NULL,
  short_term_memory TEXT NOT NULL, -- JSON array
  long_term_memory TEXT NOT NULL, -- JSON array
  working_memory TEXT NOT NULL, -- JSON array
  relationships TEXT NOT NULL, -- JSON object
  goals TEXT NOT NULL, -- JSON array
  motivations TEXT NOT NULL, -- JSON array
  capabilities TEXT NOT NULL, -- JSON object
  current_activity TEXT NOT NULL,
  current_location TEXT NOT NULL, -- JSON object
  health INTEGER NOT NULL,
  inventory TEXT NOT NULL, -- JSON array
  learning_rate REAL NOT NULL,
  adaptation_level REAL NOT NULL,
  social_needs TEXT NOT NULL, -- JSON object
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (faction_id) REFERENCES factions(faction_id) ON DELETE SET NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_npcs_player ON npcs(player_id);
CREATE INDEX IF NOT EXISTS idx_npcs_faction ON npcs(faction_id);

CREATE TABLE IF NOT EXISTS npc_memories (
  memory_id TEXT PRIMARY KEY,
  npc_id TEXT NOT NULL,
  type TEXT NOT NULL, -- interaction, observation, event, knowledge
  content TEXT NOT NULL,
  importance REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  decay REAL NOT NULL,
  associated_entities TEXT NOT NULL, -- JSON array
  emotions TEXT NOT NULL, -- JSON object
  context TEXT NOT NULL, -- JSON object
  player_id TEXT NOT NULL,
  FOREIGN KEY (npc_id) REFERENCES npcs(npc_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_npc_memories_npc ON npc_memories(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_memories_type ON npc_memories(type);
CREATE INDEX IF NOT EXISTS idx_npc_memories_timestamp ON npc_memories(timestamp);

CREATE TABLE IF NOT EXISTS npc_relationships (
  relationship_id TEXT PRIMARY KEY,
  npc1_id TEXT NOT NULL,
  npc2_id TEXT NOT NULL,
  value REAL NOT NULL, -- -1 to 1
  trust REAL NOT NULL,
  respect REAL NOT NULL,
  fear REAL NOT NULL,
  love REAL NOT NULL,
  hatred REAL NOT NULL,
  history TEXT NOT NULL, -- JSON array
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (npc1_id) REFERENCES npcs(npc_id) ON DELETE CASCADE,
  FOREIGN KEY (npc2_id) REFERENCES npcs(npc_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_npc_relationships_npc1 ON npc_relationships(npc1_id);
CREATE INDEX IF NOT EXISTS idx_npc_relationships_npc2 ON npc_relationships(npc2_id);

CREATE TABLE IF NOT EXISTS npc_conversations (
  conversation_id TEXT PRIMARY KEY,
  npc_id TEXT NOT NULL,
  input TEXT NOT NULL,
  response TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  context TEXT NOT NULL, -- JSON object
  player_id TEXT NOT NULL,
  FOREIGN KEY (npc_id) REFERENCES npcs(npc_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_npc_conversations_npc ON npc_conversations(npc_id);
CREATE INDEX IF NOT EXISTS idx_npc_conversations_timestamp ON npc_conversations(timestamp);

-- Combat System Tables
CREATE TABLE IF NOT EXISTS combat_ships (
  ship_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  velocity_x REAL NOT NULL,
  velocity_y REAL NOT NULL,
  velocity_z REAL NOT NULL,
  rotation_x REAL NOT NULL,
  rotation_y REAL NOT NULL,
  rotation_z REAL NOT NULL,
  rotation_w REAL NOT NULL,
  mass REAL NOT NULL,
  thrust REAL NOT NULL,
  max_speed REAL NOT NULL,
  turn_rate REAL NOT NULL,
  health INTEGER NOT NULL,
  max_health INTEGER NOT NULL,
  shields INTEGER NOT NULL,
  max_shields INTEGER NOT NULL,
  weapons TEXT NOT NULL, -- JSON array
  owner TEXT NOT NULL,
  target_id TEXT,
  combat_state TEXT NOT NULL,
  last_fired TEXT NOT NULL, -- JSON object
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_combat_ships_player ON combat_ships(player_id);
CREATE INDEX IF NOT EXISTS idx_combat_ships_owner ON combat_ships(owner);

CREATE TABLE IF NOT EXISTS combat_projectiles (
  projectile_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  velocity_x REAL NOT NULL,
  velocity_y REAL NOT NULL,
  velocity_z REAL NOT NULL,
  damage INTEGER NOT NULL,
  range REAL NOT NULL,
  lifetime REAL NOT NULL,
  owner TEXT NOT NULL,
  source_ship_id TEXT NOT NULL,
  target_position_x REAL,
  target_position_y REAL,
  target_position_z REAL,
  trail TEXT NOT NULL, -- JSON array
  creation_time REAL NOT NULL,
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_ship_id) REFERENCES combat_ships(ship_id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_combat_projectiles_player ON combat_projectiles(player_id);
CREATE INDEX IF NOT EXISTS idx_combat_projectiles_owner ON combat_projectiles(owner);

CREATE TABLE IF NOT EXISTS combat_gravity_wells (
  well_id TEXT PRIMARY KEY,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  mass REAL NOT NULL,
  radius REAL NOT NULL,
  type TEXT NOT NULL, -- planet, star, black_hole
  event_horizon REAL NOT NULL,
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gravity_wells_player ON combat_gravity_wells(player_id);

CREATE TABLE IF NOT EXISTS combat_log (
  log_id TEXT PRIMARY KEY,
  timestamp REAL NOT NULL,
  type TEXT NOT NULL, -- hit, destroyed, fired, etc.
  source TEXT NOT NULL,
  target TEXT,
  damage INTEGER,
  position_x REAL,
  position_y REAL,
  position_z REAL,
  details TEXT NOT NULL, -- JSON object
  player_id TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_combat_log_player ON combat_log(player_id);
CREATE INDEX IF NOT EXISTS idx_combat_log_timestamp ON combat_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_combat_log_type ON combat_log(type);

CREATE TABLE IF NOT EXISTS combat_zones (
  zone_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  radius REAL NOT NULL,
  max_players INTEGER NOT NULL,
  current_players INTEGER NOT NULL,
  game_mode TEXT NOT NULL,
  status TEXT NOT NULL, -- waiting, in_progress, completed
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_combat_zones_player ON combat_zones(player_id);
CREATE INDEX IF NOT EXISTS idx_combat_zones_status ON combat_zones(status);

-- Weather/Fluid Dynamics Tables
CREATE TABLE IF NOT EXISTS weather_states (
  state_id TEXT PRIMARY KEY,
  position_x REAL NOT NULL,
  position_z REAL NOT NULL,
  temperature REAL NOT NULL,
  humidity REAL NOT NULL,
  wind_speed REAL NOT NULL,
  wind_direction_x REAL NOT NULL,
  wind_direction_z REAL NOT NULL,
  precipitation REAL NOT NULL,
  cloud_cover REAL NOT NULL,
  pressure REAL NOT NULL,
  player_id TEXT NOT NULL,
  planet_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weather_player ON weather_states(player_id);
CREATE INDEX IF NOT EXISTS idx_weather_planet ON weather_states(planet_id);
CREATE INDEX IF NOT EXISTS idx_weather_position ON weather_states(position_x, position_z);
