CREATE TABLE IF NOT EXISTS device_status (
    device_id TEXT PRIMARY KEY,
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    battery INT,
    connection TEXT,
    mode TEXT,
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_history (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    battery INT,
    connection TEXT,
    mode TEXT,
    note TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

