-- Create user_2fa table for Two-Factor Authentication
-- Run this in Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.user_2fa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    secret TEXT NOT NULL, -- TOTP secret (should be encrypted in production)
    backup_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add foreign key
ALTER TABLE public.user_2fa
ADD CONSTRAINT user_2fa_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Enable Row Level Security
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Policy 1: Users can only view their own 2FA data
CREATE POLICY "Users can view own 2FA"
ON public.user_2fa
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can create their own 2FA
CREATE POLICY "Users can create own 2FA"
ON public.user_2fa
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own 2FA
CREATE POLICY "Users can update own 2FA"
ON public.user_2fa
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own 2FA
CREATE POLICY "Users can delete own 2FA"
ON public.user_2fa
FOR DELETE
USING (auth.uid() = user_id);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON public.user_2fa(enabled);

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_2fa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON public.user_2fa;
CREATE TRIGGER update_user_2fa_updated_at
    BEFORE UPDATE ON public.user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION update_user_2fa_updated_at();

-- Note: In production, encrypt the 'secret' field and hash the 'backup_codes'
-- Consider using Supabase Vault or encryption at the application level

