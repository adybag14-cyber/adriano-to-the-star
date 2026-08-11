# SpaceLoader Module System

## Overview

SpaceLoader is a modular, bulletproof page loader system designed to never block the main page. It consists of three independent modules that can be loaded separately or together.

## Architecture

The loader system is split into three modules:

1. **`loader-core.js`** - Essential loader that ALWAYS unblocks the page
2. **`loader-animations.js`** - Optional visual effects (particles, star field)
3. **`loader-features.js`** - Optional features (themes, i18n, analytics)

## Core Module (`loader-core.js`)

### Purpose
The core module is the **only required** component. It provides:
- Simple progress bar
- Guaranteed page unblock (multiple fallback mechanisms)
- Error-resistant design
- Fast and lightweight

### Features

#### Guaranteed Unblock System
The core module implements **6 independent mechanisms** to ensure the page is never permanently blocked:

1. **Time-based guarantee** - Maximum load time (default: 5 seconds)
2. **Window load event** - Triggers when all resources are loaded
3. **DOMContentLoaded backup** - Triggers when DOM is ready
4. **Error handler backup** - Triggers on JavaScript errors
5. **Unhandled promise rejection backup** - Triggers on promise errors
6. **Visibility change backup** - Triggers when user returns to tab

#### Configuration
```javascript
const CONFIG = {
    maxLoadTime: 5000,        // Maximum 5 seconds
    progressUpdateInterval: 20, // Update every 20ms
    minProgressTime: 2000      // Show at least 2 seconds
};
```

#### API
```javascript
window.SpaceLoaderCore = {
    complete: complete,           // Manually complete loader
    guaranteeUnblock: guaranteeUnblock  // Activate unblock guarantee
};
```

### Usage
```html
<!-- Required: Core loader -->
<link rel="stylesheet" href="loader-minimal.css">
<script src="loader-core.js"></script>
```

## Animations Module (`loader-animations.js`)

### Purpose
Adds optional visual effects to enhance the loader experience.

### Features
- **Particles** - Animated particles floating in the background
- **Star Field** - Canvas-based animated star field
- **Reduced Motion Support** - Automatically disables animations if user prefers reduced motion

### Configuration
```javascript
const CONFIG = {
    particleCount: 20,
    starCount: 50,
    useWebWorker: false  // Disabled by default for reliability
};
```

### Usage
```html
<!-- After core loader -->
<script src="loader-animations.js"></script>
```

### Notes
- **Non-critical** - Failures are caught and logged without breaking the page
- **Performance** - Uses `requestAnimationFrame` for smooth animations
- **Accessibility** - Respects `prefers-reduced-motion` media query

## Features Module (`loader-features.js`)

### Purpose
Adds optional features like themes, internationalization, and analytics.

### Features

#### Themes
Available themes:
- `default` - Black background
- `nebula` - Purple gradient
- `galaxy` - Pink gradient

#### Internationalization
Supported languages:
- English (en) - Default
- Spanish (es)
- French (fr)

#### Analytics
Tracks loader completion times and stores them in localStorage (last 100 entries).

### API
```javascript
window.SpaceLoaderFeatures = {
    applyTheme: applyTheme,              // Apply a theme
    applyTranslations: applyTranslations  // Apply translations
};
```

### Usage
```html
<!-- After core loader -->
<script src="loader-features.js"></script>
```

### Example: Apply Theme
```javascript
// Apply nebula theme
window.SpaceLoaderFeatures.applyTheme('nebula');

// Save theme preference
localStorage.setItem('loaderTheme', 'nebula');
```

### Example: Apply Translations
```javascript
// Apply Spanish translations
window.SpaceLoaderFeatures.applyTranslations('es');
```

### Notes
- **Non-critical** - Failures are caught and logged without breaking the page
- **localStorage** - Uses localStorage for theme persistence and analytics

## CSS File (`loader-minimal.css`)

### Purpose
Minimal CSS file that ensures loader elements are hidden and page is always clickable.

### Key Features
- **Aggressive hiding** - Uses `!important` rules to hide all loader elements
- **Pointer events** - Ensures `body` and `html` are always clickable
- **No overlays** - Designed to never create blocking overlays

### Usage
```html
<link rel="stylesheet" href="loader-minimal.css">
```

## Complete Setup

### Minimal Setup (Recommended)
```html
<!-- Minimal, bulletproof setup -->
<link rel="stylesheet" href="loader-minimal.css">
<script src="loader-core.js"></script>
```

### Full Setup (With All Features)
```html
<!-- Full setup with animations and features -->
<link rel="stylesheet" href="loader-minimal.css">
<script src="loader-core.js"></script>
<script src="loader-animations.js"></script>
<script src="loader-features.js"></script>
```

## Migration from Old Loader

If you're using the old monolithic `loader.js`, follow these steps:

1. **Replace CSS reference:**
   ```html
   <!-- Old -->
   <link rel="stylesheet" href="loader.css">
   
   <!-- New -->
   <link rel="stylesheet" href="loader-minimal.css">
   ```

2. **Replace JavaScript:**
   ```html
   <!-- Old -->
   <script src="loader.js"></script>
   
   <!-- New -->
   <script src="loader-core.js"></script>
   <!-- Optional -->
   <script src="loader-animations.js"></script>
   <script src="loader-features.js"></script>
   ```

3. **Update any custom code:**
   - Old: `window.SpaceLoader`
   - New: `window.SpaceLoaderCore` (core), `window.SpaceLoaderFeatures` (features)

## Troubleshooting

### Page Not Loading
If the page is blocked:
1. Check browser console for errors
2. Verify `loader-minimal.css` is loaded
3. Verify `loader-core.js` is loaded
4. The core module has 6 fallback mechanisms - if all fail, check for JavaScript errors blocking execution

### Loader Not Showing
If the loader doesn't appear:
1. Check if `loader-core.js` is loaded
2. Check browser console for errors
3. Verify CSS is not hiding the loader too aggressively

### Animations Not Working
If animations don't appear:
1. Check if `loader-animations.js` is loaded
2. Check if user has `prefers-reduced-motion` enabled
3. Check browser console for errors (non-critical, won't break page)

### Features Not Working
If features don't work:
1. Check if `loader-features.js` is loaded
2. Check if `localStorage` is available
3. Check browser console for errors (non-critical, won't break page)

## Best Practices

1. **Always use `loader-minimal.css`** - It's designed to never block the page
2. **Load core module first** - It's the only required component
3. **Load optional modules after core** - They depend on `window.SpaceLoaderCore`
4. **Test with JavaScript disabled** - The page should still be accessible
5. **Test with slow connections** - The loader should unblock within 5 seconds maximum

## Browser Support

- **Modern browsers** - Full support (Chrome, Firefox, Safari, Edge)
- **Older browsers** - Core module works, animations may be limited
- **JavaScript disabled** - Page should still be accessible (CSS-only fallback)

## Performance

- **Core module** - ~2KB minified
- **Animations module** - ~1KB minified
- **Features module** - ~1KB minified
- **Total** - ~4KB minified (all modules)

## License

Part of the Interstellar Travel Agency (I.T.A.) project.

## Support

For issues or questions, check the main project documentation or create an issue in the repository.

