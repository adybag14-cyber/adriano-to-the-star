-- Era IV: The Eternal Horizon - Database Schema
-- Multiverse Mechanics, Time Travel, Neural Link, Mind Upload, Recursive Simulation

-- Multiverse: Universes Table
CREATE TABLE IF NOT EXISTS universes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  origin INTEGER NOT NULL,
  divergence_points TEXT,
  constants TEXT NOT NULL,
  properties TEXT NOT NULL,
  accessibility TEXT NOT NULL,
  creator TEXT,
  population INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Multiverse: Universe Transitions Table
CREATE TABLE IF NOT EXISTS universe_transitions (
  id TEXT PRIMARY KEY,
  from_universe TEXT NOT NULL,
  to_universe TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  FOREIGN KEY (from_universe) REFERENCES universes(id),
  FOREIGN KEY (to_universe) REFERENCES universes(id)
);

-- Time Travel: Timelines Table
CREATE TABLE IF NOT EXISTS timelines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  origin INTEGER NOT NULL,
  divergence_points TEXT,
  stability REAL NOT NULL,
  paradox_risk REAL NOT NULL,
  parent_timeline TEXT,
  status TEXT NOT NULL,
  population INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (parent_timeline) REFERENCES timelines(id)
);

-- Time Travel: Timeline Branches Table
CREATE TABLE IF NOT EXISTS timeline_branches (
  id TEXT PRIMARY KEY,
  from_timeline TEXT NOT NULL,
  to_timeline TEXT NOT NULL,
  divergence_point TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (from_timeline) REFERENCES timelines(id),
  FOREIGN KEY (to_timeline) REFERENCES timelines(id)
);

-- Time Travel: Closed Timelike Curves (CTCs) Table
CREATE TABLE IF NOT EXISTS ctcs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  entry_point TEXT,
  exit_point TEXT,
  temporal_coordinates TEXT NOT NULL,
  spatial_coordinates TEXT NOT NULL,
  stability REAL NOT NULL,
  paradox_risk REAL NOT NULL,
  status TEXT NOT NULL,
  interceptors TEXT,
  created_at INTEGER NOT NULL
);

-- Time Travel: Fleet Interceptions Table
CREATE TABLE IF NOT EXISTS fleet_interceptions (
  id TEXT PRIMARY KEY,
  fleet_id TEXT NOT NULL,
  ctc_id TEXT NOT NULL,
  interceptor TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  temporal_coordinates TEXT NOT NULL,
  spatial_coordinates TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  paradoxes TEXT,
  FOREIGN KEY (ctc_id) REFERENCES ctcs(id)
);

-- Time Travel: Time Jumps Table
CREATE TABLE IF NOT EXISTS time_jumps (
  id TEXT PRIMARY KEY,
  origin_timeline TEXT NOT NULL,
  origin_time INTEGER NOT NULL,
  target_time INTEGER NOT NULL,
  method TEXT NOT NULL,
  ctc_id TEXT,
  traveler TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  paradoxes TEXT,
  created_at INTEGER NOT NULL
);

-- Time Travel: Timeline Switches Table
CREATE TABLE IF NOT EXISTS timeline_switches (
  id TEXT PRIMARY KEY,
  from_timeline TEXT NOT NULL,
  to_timeline TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  traveler TEXT NOT NULL,
  FOREIGN KEY (from_timeline) REFERENCES timelines(id),
  FOREIGN KEY (to_timeline) REFERENCES timelines(id)
);

-- Neural Link: Neural Commands Table
CREATE TABLE IF NOT EXISTS neural_commands (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  parameters TEXT,
  timestamp INTEGER NOT NULL,
  executed BOOLEAN NOT NULL,
  player_id TEXT NOT NULL
);

-- Neural Link: Brain Wave History Table
CREATE TABLE IF NOT EXISTS brain_wave_history (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  waves TEXT NOT NULL,
  patterns TEXT,
  intent TEXT,
  confidence REAL NOT NULL,
  timestamp INTEGER NOT NULL
);

-- Neural Link: Dream States Table
CREATE TABLE IF NOT EXISTS dream_states (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  active BOOLEAN NOT NULL,
  lucidity REAL NOT NULL,
  dream_level INTEGER NOT NULL,
  start_time INTEGER,
  end_time INTEGER,
  duration INTEGER
);

-- Mind Upload: Digital Twins Table
CREATE TABLE IF NOT EXISTS digital_twins (
  id TEXT PRIMARY KEY,
  original_player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  player_data TEXT NOT NULL,
  patterns TEXT NOT NULL,
  behavior_profile TEXT NOT NULL,
  skill_profile TEXT NOT NULL,
  preferences TEXT,
  personality_traits TEXT,
  play_style TEXT,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_active INTEGER,
  total_play_time INTEGER NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  achievements_unlocked INTEGER NOT NULL DEFAULT 0,
  statistics TEXT
);

-- Mind Upload: Player Data History Table
CREATE TABLE IF NOT EXISTS player_data_history (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

-- Mind Upload: Digital Twin Sessions Table
CREATE TABLE IF NOT EXISTS digital_twin_sessions (
  id TEXT PRIMARY KEY,
  twin_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration INTEGER,
  actions_performed INTEGER NOT NULL DEFAULT 0,
  resources_gathered TEXT,
  FOREIGN KEY (twin_id) REFERENCES digital_twins(id)
);

-- Recursive Simulation: Simulations Table
CREATE TABLE IF NOT EXISTS simulations (
  id TEXT PRIMARY KEY,
  depth INTEGER NOT NULL,
  parent_id TEXT,
  state TEXT NOT NULL,
  parameters TEXT,
  context TEXT,
  status TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 0,
  max_iterations INTEGER NOT NULL,
  self_aware BOOLEAN NOT NULL DEFAULT 0,
  self_awareness_score REAL,
  recursive BOOLEAN NOT NULL DEFAULT 0,
  recursion_depth INTEGER,
  child_simulation TEXT,
  created_at INTEGER NOT NULL,
  terminated_at INTEGER,
  termination_reason TEXT,
  FOREIGN KEY (parent_id) REFERENCES simulations(id),
  FOREIGN KEY (child_simulation) REFERENCES simulations(id)
);

-- Recursive Simulation: Simulation Events Table
CREATE TABLE IF NOT EXISTS simulation_events (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id)
);

-- Recursive Simulation: Simulation Collisions Table
CREATE TABLE IF NOT EXISTS simulation_collisions (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  entity1 TEXT NOT NULL,
  entity2 TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  response TEXT,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id)
);

-- Recursive Simulation: Simulation State History Table
CREATE TABLE IF NOT EXISTS simulation_state_history (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  state TEXT NOT NULL,
  iteration INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_universes_creator ON universes(creator);
CREATE INDEX IF NOT EXISTS idx_universes_accessibility ON universes(accessibility);
CREATE INDEX IF NOT EXISTS idx_universe_transitions_player ON universe_transitions(player_id);
CREATE INDEX IF NOT EXISTS idx_universe_transitions_timestamp ON universe_transitions(timestamp);
CREATE INDEX IF NOT EXISTS idx_timelines_status ON timelines(status);
CREATE INDEX IF NOT EXISTS idx_timelines_parent ON timelines(parent_timeline);
CREATE INDEX IF NOT EXISTS idx_ctcs_status ON ctcs(status);
CREATE INDEX IF NOT EXISTS idx_ctcs_origin ON ctcs(origin);
CREATE INDEX IF NOT EXISTS idx_fleet_interceptions_fleet ON fleet_interceptions(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_interceptions_ctc ON fleet_interceptions(ctc_id);
CREATE INDEX IF NOT EXISTS idx_time_jumps_traveler ON time_jumps(traveler);
CREATE INDEX IF NOT EXISTS idx_time_jumps_timeline ON time_jumps(origin_timeline);
CREATE INDEX IF NOT EXISTS idx_timeline_switches_traveler ON timeline_switches(traveler);
CREATE INDEX IF NOT EXISTS idx_neural_commands_player ON neural_commands(player_id);
CREATE INDEX IF NOT EXISTS idx_neural_commands_timestamp ON neural_commands(timestamp);
CREATE INDEX IF NOT EXISTS idx_brain_wave_history_player ON brain_wave_history(player_id);
CREATE INDEX IF NOT EXISTS idx_brain_wave_history_timestamp ON brain_wave_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_dream_states_player ON dream_states(player_id);
CREATE INDEX IF NOT EXISTS idx_dream_states_active ON dream_states(active);
CREATE INDEX IF NOT EXISTS idx_digital_twins_player ON digital_twins(original_player_id);
CREATE INDEX IF NOT EXISTS idx_digital_twins_status ON digital_twins(status);
CREATE INDEX IF NOT EXISTS idx_player_data_history_player ON player_data_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_data_history_timestamp ON player_data_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_twin_sessions_twin ON digital_twin_sessions(twin_id);
CREATE INDEX IF NOT EXISTS idx_simulations_depth ON simulations(depth);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_simulations_parent ON simulations(parent_id);
CREATE INDEX IF NOT EXISTS idx_simulations_self_aware ON simulations(self_aware);
CREATE INDEX IF NOT EXISTS idx_simulation_events_simulation ON simulation_events(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_events_timestamp ON simulation_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_simulation_collisions_simulation ON simulation_collisions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_state_history_simulation ON simulation_state_history(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_state_history_iteration ON simulation_state_history(iteration);

-- Insert default universe for Era IV
INSERT OR IGNORE INTO universes (
  id, name, description, origin, divergence_points, constants, properties, accessibility, creator, population, created_at
) VALUES (
  'prime', 'Prime Universe', 'Baseline physics matching our reality', 
  strftime('%s', 'now'), '[]', 
  '{"G": 1.0, "c": 1.0, "h": 1.0, "alpha": 0.0073}',
  '{"gravity": 1.0, "lightSpeed": 1.0, "quantumScale": 1.0, "timeFlow": 1.0, "entropy": 1.0}',
  'public', NULL, 0, strftime('%s', 'now')
);

-- Insert default timeline for Era IV
INSERT OR IGNORE INTO timelines (
  id, name, description, origin, divergence_points, stability, paradox_risk, status, population, created_at
) VALUES (
  'prime', 'Prime Timeline', 'Baseline causality without temporal interventions',
  strftime('%s', 'now'), '[]', 1.0, 0.0, 'active', 0, strftime('%s', 'now')
);
