# SpaceLoader API Documentation

## Overview

`SpaceLoader` is a feature-rich, accessible, and performant loading screen component with 3D space effects, internationalization support, theme customization, and comprehensive analytics.

## Installation

The loader is automatically initialized when `loader.js` is included in your page. No additional setup required.

## Basic Usage

```javascript
// Default initialization (automatic)
// The loader will initialize automatically when the script loads

// Manual initialization with options
const loader = new SpaceLoader({
    locale: 'en',                    // Language code
    theme: 'default',                // Theme name
    onStart: () => console.log('Started'),
    onProgress: (percent) => console.log(`${percent}%`),
    onComplete: () => console.log('Complete')
});
```

## Configuration

### Static Configuration

```javascript
// Access configuration
SpaceLoader.config.minLoadTime = 2000;
SpaceLoader.config.maxProgressTime = 2500;
SpaceLoader.config.particleCount = 30;
SpaceLoader.config.starCount = 100;

// Apply preset
SpaceLoader.applyPreset('fast');    // 'fast', 'normal', 'cinematic'
SpaceLoader.applyPreset('normal');
SpaceLoader.applyPreset('cinematic');
```

### Available Presets

- **fast**: 1s load time, 10 particles, 30 stars
- **normal**: 2.5s load time, 30 particles, 100 stars (default)
- **cinematic**: 5s load time, 50 particles, 200 stars

### Available Themes

- `default` - Standard space theme
- `nebula` - Nebula-themed colors
- `galaxy` - Galaxy-themed colors
- `solar` - Solar system theme
- `cosmic` - Cosmic theme

## API Reference

### Constructor

```javascript
new SpaceLoader(options)
```

**Parameters:**
- `options` (Object, optional)
  - `locale` (String): Language code (e.g., 'en', 'es', 'fr', 'de', 'pt')
  - `theme` (String): Theme name ('default', 'nebula', 'galaxy', 'solar', 'cosmic')
  - `onStart` (Function): Callback when loader starts
  - `onProgress` (Function): Callback on progress updates (receives percent: 0-100)
  - `onComplete` (Function): Callback when loader completes

**Example:**
```javascript
const loader = new SpaceLoader({
    locale: 'es',
    theme: 'nebula',
    onStart: () => console.log('Cargando...'),
    onProgress: (p) => console.log(`Progreso: ${p}%`),
    onComplete: () => console.log('Completado')
});
```

### Static Methods

#### `SpaceLoader.applyPreset(presetName)`

Applies a preset configuration.

**Parameters:**
- `presetName` (String): 'fast', 'normal', or 'cinematic'

**Example:**
```javascript
SpaceLoader.applyPreset('fast');
```

#### `SpaceLoader.getTranslations(locale)`

Gets translation strings for a locale.

**Parameters:**
- `locale` (String): Language code

**Returns:** Object with translation strings

**Example:**
```javascript
const translations = SpaceLoader.getTranslations('es');
console.log(translations.loading); // "CARGANDO"
```

#### `SpaceLoader.getAnalyticsSummary()`

Gets analytics summary from localStorage.

**Returns:** Object with analytics data
- `count` (Number): Total session count
- `averageLoadTime` (Number): Average load time in ms
- `averageFps` (Number): Average FPS
- `lastLoadTime` (Number): Last session load time

**Example:**
```javascript
const analytics = SpaceLoader.getAnalyticsSummary();
console.log(`Average load time: ${analytics.averageLoadTime}ms`);
```

### Instance Methods

#### `loader.setTheme(themeName)`

Changes the loader theme dynamically.

**Parameters:**
- `themeName` (String): Theme name

**Example:**
```javascript
loader.setTheme('nebula');
```

#### `loader.complete()`

Manually completes the loader.

**Example:**
```javascript
loader.complete();
```

## Internationalization

### Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)

### Translation Keys

- `loading` - "LOADING" text
- `renderingCosmos` - "RENDERING COSMOS" text
- `calculatingOrbits` - "CALCULATING ORBITS" text
- `finalizing` - "FINALIZING" text
- `welcome` - "WELCOME TO THE COSMOS" text
- `initializing` - "Initializing Cosmic Experience..." text
- `skipLoading` - "Skip Loading" button text

### Adding New Languages

```javascript
SpaceLoader.translations['ja'] = {
    loading: '読み込み中',
    renderingCosmos: 'コスモスをレンダリング中',
    calculatingOrbits: '軌道を計算中',
    finalizing: '最終処理中',
    welcome: 'コスモスへようこそ',
    initializing: 'コスミック体験を初期化中...',
    skipLoading: '読み込みをスキップ'
};
```

## Event Callbacks

### onStart

Called when the loader starts.

```javascript
const loader = new SpaceLoader({
    onStart: () => {
        console.log('Loader started');
        // Your code here
    }
});
```

### onProgress

Called on each progress update.

```javascript
const loader = new SpaceLoader({
    onProgress: (percent) => {
        console.log(`Progress: ${percent}%`);
        // Update your UI
    }
});
```

### onComplete

Called when the loader completes.

```javascript
const loader = new SpaceLoader({
    onComplete: () => {
        console.log('Loader completed');
        // Initialize your app
    }
});
```

## Accessibility

The loader includes full accessibility support:

- ARIA labels for screen readers
- Progress bar with `role="progressbar"` and `aria-valuenow`
- Live regions for dynamic text updates
- Keyboard support (Escape to skip)
- Reduced motion support

## Performance Features

### Mobile Optimization

Automatically detects mobile/low-end devices and reduces:
- Particle count (30 → 15)
- Star count (100 → 50)
- Animation complexity

### Performance Metrics

The loader tracks:
- Load time
- FPS (frames per second)
- Frame count
- Device information

Access metrics:
```javascript
const analytics = SpaceLoader.getAnalyticsSummary();
```

## State Persistence

The loader automatically saves progress to localStorage and can resume on page refresh (within 5 seconds).

```javascript
// State is automatically saved and restored
// No manual intervention needed
```

## Theme Customization

### Setting Theme

```javascript
// On initialization
const loader = new SpaceLoader({ theme: 'nebula' });

// Dynamically
loader.setTheme('galaxy');
```

### CSS Theme Classes

The loader applies theme classes to the container:
- `.theme-default`
- `.theme-nebula`
- `.theme-galaxy`
- `.theme-solar`
- `.theme-cosmic`

You can style these in your CSS:

```css
.space-loader.theme-nebula {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.space-loader.theme-galaxy {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
```

## Advanced Usage

### Custom Configuration

```javascript
// Modify config before initialization
SpaceLoader.config.particleCount = 50;
SpaceLoader.config.starCount = 200;
SpaceLoader.config.maxProgressTime = 3000;

const loader = new SpaceLoader();
```

### Skip Functionality

Users can skip the loader:
- Press `Escape` key
- Click "Skip Loading" button (appears after 1 second)

### Error Handling

The loader includes comprehensive error handling:

```javascript
// Errors are automatically caught and reported
// If errorTracker is available, errors are sent there
if (window.errorTracker) {
    window.errorTracker.report(error, { context: 'loader' });
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Examples

### Basic Example

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="loader.css">
</head>
<body>
    <script src="loader.js"></script>
    <!-- Your content -->
</body>
</html>
```

### Advanced Example

```javascript
// Custom loader with all features
const loader = new SpaceLoader({
    locale: 'es',
    theme: 'nebula',
    onStart: () => {
        console.log('Iniciando carga...');
    },
    onProgress: (percent) => {
        // Update custom progress indicator
        document.getElementById('custom-progress').style.width = percent + '%';
    },
    onComplete: () => {
        console.log('Carga completada');
        // Initialize your application
        initApp();
    }
});

// Change theme after 2 seconds
setTimeout(() => {
    loader.setTheme('galaxy');
}, 2000);
```

### Analytics Example

```javascript
// Get analytics after page load
window.addEventListener('load', () => {
    setTimeout(() => {
        const analytics = SpaceLoader.getAnalyticsSummary();
        console.log('Analytics:', analytics);
        
        // Send to your analytics service
        if (window.analytics) {
            window.analytics.track('loader_stats', analytics);
        }
    }, 1000);
});
```

## Troubleshooting

### Loader Not Appearing

- Check that `loader.css` is included
- Verify `document.body` exists when script runs
- Check browser console for errors

### Performance Issues

- Use `fast` preset for slower devices
- Reduce `particleCount` and `starCount` in config
- Enable mobile optimization (automatic)

### Theme Not Applying

- Ensure CSS includes theme styles
- Check that theme name matches available themes
- Verify localStorage is enabled

## License

Part of the Adriano To The Star project.

