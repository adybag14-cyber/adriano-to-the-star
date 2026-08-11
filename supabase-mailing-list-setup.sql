-- Mailing List Subscribers Table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mailing_list_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    interests TEXT[], -- Array of selected interests
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    confirmed BOOLEAN DEFAULT FALSE,
    unsubscribed BOOLEAN DEFAULT FALSE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster email lookups
CREATE INDEX idx_mailing_list_email ON mailing_list_subscribers(email);
CREATE INDEX idx_mailing_list_subscribed_at ON mailing_list_subscribers(subscribed_at);

-- Enable Row Level Security
ALTER TABLE mailing_list_subscribers ENABLE ROW LEVEL SECURITY;

-- Admin-only read access (replace email as needed)
DROP POLICY IF EXISTS "ml_admin_read" ON mailing_list_subscribers;
CREATE POLICY "ml_admin_read"
ON mailing_list_subscribers
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'adybag11@gmail.com');

-- Remove direct write access from anon/auth roles (all writes go through the RPC)
REVOKE INSERT, UPDATE, DELETE ON mailing_list_subscribers FROM anon, authenticated;

-- RPC to handle subscriptions with elevated privileges
CREATE OR REPLACE FUNCTION subscribe_to_mailing_list(
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_interests TEXT[] DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_subscribed_at TIMESTAMPTZ DEFAULT timezone('utc', now())
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO mailing_list_subscribers (email, name, interests, source, subscribed_at)
    VALUES (p_email, p_name, COALESCE(p_interests, ARRAY[]::TEXT[]), p_source, COALESCE(p_subscribed_at, timezone('utc', now())))
    ON CONFLICT (email) DO UPDATE
        SET
            name = EXCLUDED.name,
            interests = EXCLUDED.interests,
            source = EXCLUDED.source,
            subscribed_at = EXCLUDED.subscribed_at;
END;
$$;

GRANT EXECUTE ON FUNCTION subscribe_to_mailing_list(TEXT, TEXT, TEXT[], TEXT, TIMESTAMPTZ) TO anon, authenticated;

-- View of active subscribers (optional)
CREATE OR REPLACE VIEW active_subscribers AS
SELECT 
    id,
    email,
    name,
    interests,
    subscribed_at
FROM mailing_list_subscribers
WHERE unsubscribed = FALSE
ORDER BY subscribed_at DESC;

COMMENT ON TABLE mailing_list_subscribers IS 'Stores email addresses for the mailing list with subscription preferences';
