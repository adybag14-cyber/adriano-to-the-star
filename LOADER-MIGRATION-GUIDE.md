# Loader Migration Guide

## Overview

This guide helps you migrate from the old monolithic `loader.js` to the new modular loader system (`loader-core.js`, `loader-animations.js`, `loader-features.js`).

## Why Migrate?

The new modular system offers:
- **Guaranteed page unblocking** - 6 independent fallback mechanisms
- **Better performance** - Smaller, focused modules
- **Easier maintenance** - Clear separation of concerns
- **Optional features** - Load only what you need
- **Better error handling** - Graceful degradation

## Migration Steps

### Step 1: Update CSS Reference

**Before:**
```html
<link rel="stylesheet" href="loader.css">
```

**After:**
```html
<link rel="stylesheet" href="loader-minimal.css">
```

### Step 2: Replace JavaScript

**Before:**
```html
<script src="loader.js"></script>
```

**After (Minimal Setup):**
```html
<script src="loader-core.js"></script>
```

**After (Full Setup with Features):**
```html
<script src="loader-core.js"></script>
<script src="loader-animations.js"></script>
<script src="loader-features.js"></script>
```

### Step 3: Update Custom Code

If you have custom code that interacts with the loader:

**Before:**
```javascript
// Old API (if it existed)
window.SpaceLoader.complete();
```

**After:**
```javascript
// New API
window.SpaceLoaderCore.complete();
window.SpaceLoaderCore.guaranteeUnblock();
```

### Step 4: Update Theme/Feature Code

If you use themes or features:

**Before:**
```javascript
// Old API (if it existed)
window.SpaceLoader.setTheme('nebula');
```

**After:**
```javascript
// New API
window.SpaceLoaderFeatures.applyTheme('nebula');
window.SpaceLoaderFeatures.applyTranslations('es');
```

## Complete Example

### Before (Old System)
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="loader.css">
</head>
<body>
    <!-- Your content -->
    
    <script src="loader.js"></script>
</body>
</html>
```

### After (New System - Minimal)
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="loader-minimal.css">
</head>
<body>
    <!-- Your content -->
    
    <script src="loader-core.js"></script>
</body>
</html>
```

### After (New System - Full Features)
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="loader-minimal.css">
</head>
<body>
    <!-- Your content -->
    
    <script src="loader-core.js"></script>
    <script src="loader-animations.js"></script>
    <script src="loader-features.js"></script>
</body>
</html>
```

## API Changes

### Core Module API

**Available Methods:**
```javascript
// Complete the loader manually
window.SpaceLoaderCore.complete();

// Activate guaranteed unblock (already done automatically)
window.SpaceLoaderCore.guaranteeUnblock();
```

### Features Module API

**Available Methods:**
```javascript
// Apply a theme
window.SpaceLoaderFeatures.applyTheme('nebula'); // 'default', 'nebula', 'galaxy'

// Apply translations
window.SpaceLoaderFeatures.applyTranslations('es'); // 'en', 'es', 'fr'
```

## Configuration Changes

### Old System
The old system may have had configuration in `loader.js` directly.

### New System
Configuration is in each module:

**loader-core.js:**
```javascript
const CONFIG = {
    maxLoadTime: 5000,        // Maximum 5 seconds
    progressUpdateInterval: 20, // Update every 20ms
    minProgressTime: 2000      // Show at least 2 seconds
};
```

**loader-animations.js:**
```javascript
const CONFIG = {
    particleCount: 20,
    starCount: 50,
    useWebWorker: false
};
```

To change configuration, edit the files directly or use feature flags.

## Testing Checklist

After migration, test the following:

- [ ] Page loads correctly
- [ ] Loader appears on page load
- [ ] Loader disappears after page loads
- [ ] Page is never permanently blocked
- [ ] Animations work (if using animations module)
- [ ] Themes work (if using features module)
- [ ] Translations work (if using features module)
- [ ] No console errors
- [ ] Works on slow connections
- [ ] Works with JavaScript disabled (CSS fallback)

## Troubleshooting

### Page Not Loading
1. Check browser console for errors
2. Verify `loader-minimal.css` is loaded
3. Verify `loader-core.js` is loaded
4. The core module has 6 fallback mechanisms - if all fail, check for JavaScript errors

### Loader Not Showing
1. Check if `loader-core.js` is loaded
2. Check browser console for errors
3. Verify CSS is not hiding the loader too aggressively

### Animations Not Working
1. Check if `loader-animations.js` is loaded
2. Check if user has `prefers-reduced-motion` enabled
3. Check browser console for errors (non-critical, won't break page)

### Features Not Working
1. Check if `loader-features.js` is loaded
2. Check if `localStorage` is available
3. Check browser console for errors (non-critical, won't break page)

## Rollback Plan

If you need to rollback:

1. **Restore old CSS:**
   ```html
   <link rel="stylesheet" href="loader.css">
   ```

2. **Restore old JavaScript:**
   ```html
   <script src="loader.js"></script>
   ```

3. **Remove new modules:**
   - Remove `loader-core.js`
   - Remove `loader-animations.js`
   - Remove `loader-features.js`

## Benefits of New System

1. **Reliability** - 6 independent unblock mechanisms
2. **Performance** - Smaller, focused modules
3. **Maintainability** - Clear separation of concerns
4. **Flexibility** - Load only what you need
5. **Error Handling** - Graceful degradation

## Support

For issues or questions:
- Check `LOADER-README.md` for detailed documentation
- Check browser console for error messages
- Verify all files are loaded correctly
- Test with minimal setup first, then add optional modules

## Notes

- The new system is backward compatible where possible
- Optional features fail gracefully without breaking the page
- All modules are designed to never permanently block the page
- The core module is the only required component

