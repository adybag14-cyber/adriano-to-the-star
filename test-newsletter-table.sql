-- Test queries for newsletter_subscriptions table
-- Run these AFTER running create_newsletter_table.sql to verify everything works

-- Test 1: Verify table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'newsletter_subscriptions';

-- Test 2: Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'newsletter_subscriptions'
ORDER BY ordinal_position;

-- Test 3: Verify indexes exist
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'newsletter_subscriptions'
ORDER BY indexname;

-- Test 4: Verify RLS is enabled
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'newsletter_subscriptions';

-- Test 5: Verify policies exist
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'newsletter_subscriptions'
ORDER BY policyname;

-- Test 6: Test insert (should work)
INSERT INTO public.newsletter_subscriptions (email, categories, frequency)
VALUES ('test@example.com', ARRAY['features', 'discoveries'], 'weekly')
RETURNING id, email, categories, frequency, status, subscribed_at;

-- Test 7: Test select (should return the test record)
SELECT * FROM public.newsletter_subscriptions WHERE email = 'test@example.com';

-- Test 8: Test update (should work)
UPDATE public.newsletter_subscriptions
SET frequency = 'daily', updated_at = now()
WHERE email = 'test@example.com'
RETURNING id, email, frequency, updated_at;

-- Test 9: Clean up test data (optional)
-- DELETE FROM public.newsletter_subscriptions WHERE email = 'test@example.com';

