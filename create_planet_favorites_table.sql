-- Create planet_favorites table for Supabase
-- This table stores user's favorite planets

CREATE TABLE IF NOT EXISTS planet_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kepid BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, kepid)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_planet_favorites_user_id ON planet_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_planet_favorites_kepid ON planet_favorites(kepid);

-- Enable Row Level Security
ALTER TABLE planet_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites"
    ON planet_favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
    ON planet_favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
    ON planet_favorites
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON planet_favorites TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE planet_favorites_id_seq TO authenticated;

