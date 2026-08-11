# Testing the Newsletter SQL Script

## Step-by-Step Testing Guide

### Step 1: Run the Main SQL Script

1. Open Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Open `create_newsletter_table.sql` and copy all contents
4. Paste into SQL Editor
5. Click **Run** (or `Ctrl+Enter`)

**Expected Result:** 
- ✅ Should see "Success. No rows returned" or similar success message
- ❌ If you see errors, check the error message

### Step 2: Run Test Queries

1. Open `test-newsletter-table.sql` 
2. Copy the test queries
3. Run them one by one in Supabase SQL Editor

**Expected Results:**

#### Test 1: Table Exists
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'newsletter_subscriptions';
```
**Expected:** Should return 1 row with `newsletter_subscriptions`

#### Test 2: Table Structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'newsletter_subscriptions'
ORDER BY ordinal_position;
```
**Expected:** Should return 10 rows (columns: id, user_id, email, categories, frequency, status, subscribed_at, unsubscribed_at, created_at, updated_at)

#### Test 3: Indexes
```sql
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'newsletter_subscriptions';
```
**Expected:** Should return 3-4 indexes (email, user_id, status, plus primary key)

#### Test 4: RLS Enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'newsletter_subscriptions';
```
**Expected:** Should return 1 row with `rowsecurity = true`

#### Test 5: Policies
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'newsletter_subscriptions';
```
**Expected:** Should return 3 policies (SELECT, INSERT, UPDATE)

#### Test 6: Insert Test
```sql
INSERT INTO public.newsletter_subscriptions (email, categories, frequency)
VALUES ('test@example.com', ARRAY['features', 'discoveries'], 'weekly')
RETURNING id, email, categories, frequency, status;
```
**Expected:** Should insert successfully and return the new record

#### Test 7: Select Test
```sql
SELECT * FROM public.newsletter_subscriptions WHERE email = 'test@example.com';
```
**Expected:** Should return the test record

#### Test 8: Update Test
```sql
UPDATE public.newsletter_subscriptions
SET frequency = 'daily', updated_at = now()
WHERE email = 'test@example.com'
RETURNING id, email, frequency, updated_at;
```
**Expected:** Should update successfully and return updated record

#### Test 9: Cleanup (Optional)
```sql
DELETE FROM public.newsletter_subscriptions WHERE email = 'test@example.com';
```
**Expected:** Should delete the test record

## Common Issues & Solutions

### Issue 1: "relation already exists"
**Solution:** The table already exists. You can either:
- Drop it first: `DROP TABLE IF EXISTS public.newsletter_subscriptions CASCADE;`
- Or skip table creation (the script uses `IF NOT EXISTS`)

### Issue 2: "constraint already exists"
**Solution:** The foreign key already exists. The updated script now checks for this.

### Issue 3: "permission denied"
**Solution:** Make sure you're logged in as project owner/admin in Supabase

### Issue 4: "function does not exist"
**Solution:** The trigger function might not have been created. Re-run Step 6 of the script.

### Issue 5: RLS blocking queries
**Solution:** Check that policies are created correctly. The policies allow public access for email-based subscriptions.

## Verification Checklist

After running all tests, verify:

- [ ] Table `newsletter_subscriptions` exists
- [ ] All 10 columns are present
- [ ] 3-4 indexes are created
- [ ] RLS is enabled (`rowsecurity = true`)
- [ ] 3 policies exist (SELECT, INSERT, UPDATE)
- [ ] Can insert a test record
- [ ] Can select the test record
- [ ] Can update the test record
- [ ] `updated_at` automatically updates on UPDATE

## Next Steps

Once all tests pass:

1. ✅ Table is ready for use
2. ✅ Newsletter feature will use database instead of localStorage
3. ✅ Test the newsletter subscription form in the app
4. ✅ Verify subscriptions persist after page refresh

---

**Note:** If any test fails, check the error message and refer to the "Common Issues" section above.

