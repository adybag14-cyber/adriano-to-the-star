-- Create user_reputation table for tracking user points, ratings, and activity
-- Run this in Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.user_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    username TEXT,
    email TEXT,
    total_points INTEGER NOT NULL DEFAULT 0,
    reputation_level TEXT NOT NULL DEFAULT 'novice' CHECK (reputation_level IN ('novice', 'explorer', 'astronomer', 'cosmologist', 'master')),
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5.00),
    total_ratings INTEGER DEFAULT 0,
    planets_claimed INTEGER DEFAULT 0,
    listings_created INTEGER DEFAULT 0,
    transactions_completed INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add foreign key
ALTER TABLE public.user_reputation
ADD CONSTRAINT user_reputation_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Enable Row Level Security
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Policy 1: Anyone can view reputation (public data)
CREATE POLICY "Anyone can view reputation"
ON public.user_reputation
FOR SELECT
USING (true);

-- Policy 2: Users can update their own reputation
CREATE POLICY "Users can update own reputation"
ON public.user_reputation
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: System can insert reputation (via service role)
-- Note: This requires service role key, users will create via trigger

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_reputation_user_id ON public.user_reputation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reputation_points ON public.user_reputation(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_level ON public.user_reputation(reputation_level);
CREATE INDEX IF NOT EXISTS idx_user_reputation_rating ON public.user_reputation(rating DESC);

-- Step 6: Create function to calculate reputation level
CREATE OR REPLACE FUNCTION calculate_reputation_level(points INTEGER)
RETURNS TEXT AS $$
BEGIN
    CASE
        WHEN points >= 10000 THEN RETURN 'master';
        WHEN points >= 5000 THEN RETURN 'cosmologist';
        WHEN points >= 2000 THEN RETURN 'astronomer';
        WHEN points >= 500 THEN RETURN 'explorer';
        ELSE RETURN 'novice';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to update reputation level
CREATE OR REPLACE FUNCTION update_reputation_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reputation_level = calculate_reputation_level(NEW.total_points);
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger
CREATE TRIGGER update_reputation_level_trigger
    BEFORE UPDATE ON public.user_reputation
    FOR EACH ROW
    EXECUTE FUNCTION update_reputation_level();

-- Step 9: Create function to initialize reputation for new users
CREATE OR REPLACE FUNCTION initialize_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_reputation (user_id, username, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger on auth.users (if you have access)
-- Note: This may require database admin access
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION initialize_user_reputation();

