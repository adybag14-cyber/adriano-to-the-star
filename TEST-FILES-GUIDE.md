# Test Files Guide

## Purpose
Each test file has ONE script enabled to isolate which script is causing the page to break.

## Test Files Created

1. **test-navigation.html** - Tests `navigation.js`
   - URL: `http://localhost:8000/test-navigation.html`
   - Expected: Navigation menu should appear

2. **test-i18n.html** - Tests `i18n.js`
   - URL: `http://localhost:8000/test-i18n.html`
   - Expected: Language switcher should work

3. **test-music-player.html** - Tests `cosmic-music-player.js`
   - URL: `http://localhost:8000/test-music-player.html`
   - Expected: Music player widget should appear

4. **test-theme-toggle.html** - Tests `theme-toggle.js`
   - URL: `http://localhost:8000/test-theme-toggle.html`
   - Expected: Theme toggle should work

5. **test-supabase.html** - Tests Supabase scripts
   - URL: `http://localhost:8000/test-supabase.html`
   - Expected: Supabase scripts should load

## How to Test

1. Open each test file in browser
2. Check if page loads and is clickable
3. Check debug overlay for errors
4. Note which file breaks the page
5. That script is the problem!

## Status

- ✅ `loader.js` - **WORKING** (confirmed)
- ⏳ `navigation.js` - Test with test-navigation.html
- ⏳ `i18n.js` - Test with test-i18n.html
- ⏳ `cosmic-music-player.js` - Test with test-music-player.html
- ⏳ `theme-toggle.js` - Test with test-theme-toggle.html
- ⏳ `supabase-config.js` / `auth-supabase.js` - Test with test-supabase.html

## Next Steps

After testing, we'll know which script breaks the page and can fix it!

