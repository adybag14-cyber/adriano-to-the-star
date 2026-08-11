# ⚡ Quick Supabase Setup for Your Project

## ✅ Project URL Configured!

Your Project URL is already set: `https://sepesbfytkmbgjyfqriw.supabase.co`

## 🔑 Get Your Anon Public Key (1 Minute)

1. **Go to your Supabase Dashboard:**
   - Direct link: https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw/settings/api

2. **Find the "Project API keys" section**

3. **Copy the "anon public" key:**
   - It starts with `eyJhbGc...` (long string)
   - This is different from the `sbp_` key (which is for project management)
   - The anon key is safe to use in frontend code

4. **Update `supabase-config.js`:**
   - Replace `'your-anon-key-here'` with your anon public key
   - Set `enabled: true`

## 📝 Example

After you get your anon key, your config should look like:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://sepesbfytkmbgjyfqriw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcGVzYmZ5dGttYmdqeWZxcml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MT...', // ← Your anon key here
    enabled: true  // ← Set to true
};
```

## ⚠️ Important Notes

- ✅ **anon public key** = Safe for frontend, use this one
- ❌ **sbp_ key** = For project management API, NOT for frontend
- ✅ **service_role key** = Server-side only, NEVER use in frontend

## 🚀 Once Configured

1. Save `supabase-config.js`
2. Update HTML files to use `auth-supabase.js` (optional - it auto-detects)
3. Test registration/login - data will sync to Supabase cloud!

## 📍 Direct Links

- **API Settings:** https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw/settings/api
- **Project Dashboard:** https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw

