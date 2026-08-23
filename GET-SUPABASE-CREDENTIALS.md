# 🔑 How to Get Your Supabase Credentials

## Quick Steps

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Log in to your account

2. **Select Your Project:**
   - Click on your project (or create a new one if needed)

3. **Go to Settings:**
   - Click the **⚙️ Settings** icon (gear) in the left sidebar
   - Click **API** in the settings menu

4. **Copy Your Credentials:**
   You'll see two important values:

   ### Project URL
   - Format: `https://xxxxxxxxxxxxx.supabase.co`
   - Example: `https://abcdefghijklmnop.supabase.co`
   - Copy this entire URL

   ### anon public key
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
   - This is the **anon public** key (NOT the service_role key)
   - Copy this entire key

5. **Update `supabase-config.js`:**
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://YOUR-PROJECT-ID.supabase.co',  // ← Paste Project URL here
       anonKey: 'eyJhbGc...',                        // ← Paste anon key here
       enabled: true                                  // ← Set to true
   };
   ```

## Important Notes

- ✅ Use the **anon public** key (safe for frontend)
- ❌ Do NOT use the **service_role** key (server-side only)
- ✅ The Project URL is public and safe to use
- ✅ Both values are visible in your Supabase dashboard

## If You Don't Have a Project Yet

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up (free)
4. Create a new project
5. Wait 2-3 minutes for setup
6. Follow steps above to get credentials

## Your Project Reference

If you have: `sbp_ad568cd993429ffae18e1b6ecfc740e8c11af5dd`

This might be a project reference, but you still need:
- The Project URL (from Settings > API)
- The anon public key (from Settings > API)

Once you have both, update `supabase-config.js` and set `enabled: true`!

