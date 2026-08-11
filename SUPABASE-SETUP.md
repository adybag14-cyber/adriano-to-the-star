# 🚀 Supabase Authentication Setup Guide

## Overview

This project now supports **Supabase** for cloud-based user authentication and data storage. Supabase is an open-source Firebase alternative that provides:
- ✅ Cloud-based user authentication
- ✅ Real-time database (PostgreSQL)
- ✅ Automatic data sync across devices
- ✅ Free tier (perfect for personal projects)
- ✅ Works seamlessly with GitLab Pages

## Quick Setup (5 Minutes)

### Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** (free)
3. Sign up with GitHub, Google, or email
4. Create a new project:
   - **Name:** `adriano-to-the-star` (or any name)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest to you
   - Click **"Create new project"**

### Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click **API** in the sidebar
3. You'll see:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (long string)

### Step 3: Configure Your Project

1. Open `supabase-config.js` in your project
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',  // ← Your Project URL
    anonKey: 'your-anon-key-here',                 // ← Your anon public key
    enabled: true                                  // ← Set to true
};
```

3. Save the file

### Step 4: Update HTML Files

Replace `auth.js` with `auth-supabase.js` in your HTML files:

**Before:**
```html
<script src="auth.js" defer></script>
```

**After:**
```html
<script src="supabase-config.js"></script>
<script src="auth-supabase.js" defer></script>
```

### Step 5: Commit and Push

```bash
git add supabase-config.js auth-supabase.js SUPABASE-SETUP.md
git commit -m "Add Supabase authentication integration"
git push origin main
```

## How It Works

### Automatic Fallback

The system automatically:
1. **Tries Supabase first** (if configured)
2. **Falls back to localStorage** (if Supabase not configured or fails)
3. **Works on GitLab Pages** (no backend server needed)

### Features

- ✅ **User Registration:** `authManager.register(username, email, password, fullName)`
- ✅ **User Login:** `authManager.login(email, password)`
- ✅ **User Logout:** `authManager.logout()`
- ✅ **Session Management:** Automatic token refresh
- ✅ **Cross-Device Sync:** Data stored in Supabase cloud
- ✅ **Email Verification:** Optional (can be enabled in Supabase dashboard)

## Database Schema (Optional)

If you want to store additional user data in Supabase:

1. Go to **Table Editor** in Supabase dashboard
2. Create a new table `user_profiles`:

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

3. Enable Row Level Security (RLS):
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Testing

1. **Without Supabase (localStorage):**
   - Works immediately
   - Data stored in browser
   - No setup needed

2. **With Supabase:**
   - Configure `supabase-config.js`
   - Set `enabled: true`
   - Data stored in cloud
   - Syncs across devices

## Troubleshooting

### "Supabase not configured"
- ✅ This is normal if you haven't set up Supabase yet
- ✅ System automatically uses localStorage fallback
- ✅ Everything still works!

### "Failed to load Supabase library"
- Check internet connection
- Verify CDN is accessible
- System will fallback to localStorage

### "Invalid API key"
- Double-check your `supabase-config.js` values
- Make sure you're using the **anon public key** (not the service role key)
- Verify your project URL is correct

## Security Notes

- ✅ **anon key is safe** to use in frontend (it's public)
- ✅ **Row Level Security (RLS)** protects your data
- ✅ **Passwords are hashed** by Supabase automatically
- ✅ **Tokens are JWT** and expire automatically

## Free Tier Limits

Supabase free tier includes:
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

Perfect for personal projects and small communities!

## Migration from localStorage

If you already have users in localStorage:
1. Users can continue using their accounts
2. New registrations will use Supabase (if enabled)
3. Existing users can re-register with Supabase for cloud sync

## Next Steps

1. ✅ Set up Supabase account
2. ✅ Configure `supabase-config.js`
3. ✅ Update HTML files to use `auth-supabase.js`
4. ✅ Test registration and login
5. ✅ Enjoy cloud-based authentication! 🎉

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Auth Guide:** https://supabase.com/docs/guides/auth
- **JavaScript Client:** https://supabase.com/docs/reference/javascript

