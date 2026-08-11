-- Create planet_claims table with all columns, indexes, and RLS policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw/sql/new

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.planet_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    username TEXT,
    email TEXT,
    kepid BIGINT NOT NULL,
    planet_data JSONB,
    status TEXT NOT NULL DEFAULT 'active',
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    certificate_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add foreign key to auth.users
ALTER TABLE public.planet_claims
ADD CONSTRAINT planet_claims_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Enable Row Level Security
ALTER TABLE public.planet_claims ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Policy 1: Users can read their own claims
CREATE POLICY "Users can read own claims"
ON public.planet_claims
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own claims
CREATE POLICY "Users can insert own claims"
ON public.planet_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own claims
CREATE POLICY "Users can update own claims"
ON public.planet_claims
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own claims
CREATE POLICY "Users can delete own claims"
ON public.planet_claims
FOR DELETE
USING (auth.uid() = user_id);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_planet_claims_user_id ON public.planet_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_planet_claims_kepid ON public.planet_claims(kepid);
CREATE INDEX IF NOT EXISTS idx_planet_claims_status ON public.planet_claims(status);
CREATE INDEX IF NOT EXISTS idx_planet_claims_user_kepid ON public.planet_claims(user_id, kepid);

-- Step 6: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically update updated_at
CREATE TRIGGER update_planet_claims_updated_at
    BEFORE UPDATE ON public.planet_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ✅ Done! Your table is ready to use.

