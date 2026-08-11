-- Create newsletter_subscriptions table
-- Run this in Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT NOT NULL,
    categories TEXT[] DEFAULT ARRAY['features', 'discoveries'],
    frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'important')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add foreign key (optional - only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'newsletter_subscriptions_user_id_fkey'
    ) THEN
        ALTER TABLE public.newsletter_subscriptions
        ADD CONSTRAINT newsletter_subscriptions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Enable Row Level Security
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Policy 1: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
USING (auth.uid() = user_id OR true); -- Allow public viewing for email-based subscriptions

-- Policy 2: Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR true); -- Allow public subscriptions

-- Policy 3: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON public.newsletter_subscriptions
FOR UPDATE
USING (auth.uid() = user_id OR email = current_setting('request.jwt.claims', true)::json->>'email')
WITH CHECK (auth.uid() = user_id OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_user_id ON public.newsletter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_status ON public.newsletter_subscriptions(status);

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsletter_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS update_newsletter_subscriptions_updated_at ON public.newsletter_subscriptions;
CREATE TRIGGER update_newsletter_subscriptions_updated_at
    BEFORE UPDATE ON public.newsletter_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_subscriptions_updated_at();

-- Step 8: Test queries (optional - uncomment to test)
-- Test 1: Verify table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'newsletter_subscriptions';

-- Test 2: Check table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'newsletter_subscriptions'
-- ORDER BY ordinal_position;

-- Test 3: Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'newsletter_subscriptions';

-- Test 4: Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'newsletter_subscriptions';

-- Test 5: Verify policies
-- SELECT policyname, cmd, qual FROM pg_policies 
-- WHERE tablename = 'newsletter_subscriptions';

