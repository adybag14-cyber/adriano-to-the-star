# Setup Newsletter Subscriptions Table

## Quick Setup Guide

The newsletter feature requires a database table in Supabase. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the SQL Script

1. Open the file `create_newsletter_table.sql` in this repository
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)

### Step 3: Verify Table Creation

After running the script, verify the table was created:

```sql
SELECT * FROM newsletter_subscriptions LIMIT 1;
```

If you see an empty result (no error), the table was created successfully!

## What the Script Does

The SQL script creates:

1. **Table**: `newsletter_subscriptions` with columns:
   - `id` (UUID, primary key)
   - `user_id` (UUID, optional - links to auth.users)
   - `email` (TEXT, required)
   - `categories` (TEXT array - e.g., ['features', 'discoveries'])
   - `frequency` (TEXT - 'daily', 'weekly', 'monthly', 'important')
   - `status` (TEXT - 'active', 'unsubscribed', 'bounced')
   - Timestamps: `subscribed_at`, `unsubscribed_at`, `created_at`, `updated_at`

2. **Row Level Security (RLS)**: Policies that allow:
   - Users to view their own subscriptions
   - Public email-based subscriptions
   - Users to create/update their own subscriptions

3. **Indexes**: For fast queries on `email`, `user_id`, and `status`

4. **Trigger**: Automatically updates `updated_at` timestamp

## Fallback Behavior

If the table doesn't exist, the newsletter feature will:
- Save subscriptions to **localStorage** (browser storage)
- Display a message asking you to run the SQL script
- Continue working, but data won't persist across devices

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the entire SQL script
- Check that you're in the correct Supabase project
- Verify the table name is `newsletter_subscriptions`

### Error: "permission denied"
- Make sure you're logged in as a project owner/admin
- Check that RLS policies are correctly set up

### Subscriptions not saving
- Check browser console for errors
- Verify Supabase connection in `supabase-config.js`
- Ensure RLS policies allow your user to insert/update

## Next Steps

After setting up the table:
1. Test subscribing with your email
2. Check the table in Supabase to see the subscription
3. Test unsubscribing
4. Verify subscriptions persist after page refresh

---

**Note**: The newsletter feature works with localStorage as a fallback, but database storage is recommended for production use.

