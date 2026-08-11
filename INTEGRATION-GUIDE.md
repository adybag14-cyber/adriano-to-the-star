# Integration Guide

This guide explains how to integrate all the new systems into your existing codebase.

## Quick Start

### 1. Include System Scripts

Add the system scripts to your HTML files. For `database.html`:

```html
<!-- Core Systems -->
<script src="error-boundary-system.js" defer></script>
<script src="input-validation-system.js" defer></script>
<script src="loading-states-system.js" defer></script>
<script src="retry-logic-system.js" defer></script>

<!-- Performance Systems -->
<script src="api-cache-system.js" defer></script>
<script src="performance-optimization-loader.js" defer></script>
<script src="virtual-scrolling-system.js" defer></script>

<!-- User Experience -->
<script src="notification-system-multi-channel.js" defer></script>
<script src="user-preferences-sync.js" defer></script>
<script src="onboarding-flow-system.js" defer></script>
```

### 2. Initialize Systems

Most systems auto-initialize, but you can configure them:

```javascript
// Configure error boundary
window.errorBoundary.init({
    endpoint: '/api/errors',
    logLevel: 'error'
});

// Configure notifications
window.notifications.init({
    channels: ['toast', 'banner'],
    defaultPriority: 'info'
});

// Configure i18n
window.i18n.setLocale('en');
```

### 3. Use Systems in Your Code

```javascript
// Use input validation
const isValid = window.inputValidation.validate(input, {
    required: true,
    minLength: 3
});

// Use loading states
window.loadingStates.showLoading(element, 'spinner');

// Use notifications
window.notifications.notify('Success!', {
    channels: ['toast'],
    priority: 'success'
});

// Use data export
await window.dataExport.exportAllUserData('json');

// Use search
const results = window.fuzzySearch.search('planets', query, {
    limit: 10,
    threshold: 0.3
});
```

## System Dependencies

Some systems depend on others:

- **Notification System** → Works standalone, but integrates with Email/Push systems
- **Data Export** → Can use Export Multi-Format for additional formats
- **Backup System** → Uses Data Export system
- **Analytics Dashboard** → Uses Data Visualization system
- **User Profile** → Can integrate with OAuth system

## Integration Order

Recommended order for integration:

1. **Core Systems** (Error handling, validation, logging)
2. **Performance Systems** (Caching, optimization, lazy loading)
3. **User Experience** (Notifications, preferences, onboarding)
4. **Data Management** (Export/import, search, filtering)
5. **Advanced Features** (Collaboration, version control, admin)

## Configuration

### Environment-Specific Configuration

```javascript
// Development
if (window.location.hostname === 'localhost') {
    window.errorBoundary.init({ logLevel: 'debug' });
    window.apiCache.init({ ttl: 0 }); // No caching in dev
}

// Production
else {
    window.errorBoundary.init({ logLevel: 'error' });
    window.apiCache.init({ ttl: 3600000 }); // 1 hour cache
}
```

## Best Practices

1. **Load systems in order** - Core systems first, then dependent systems
2. **Use defer attribute** - All script tags should have `defer`
3. **Check initialization** - Verify systems are initialized before use
4. **Handle errors gracefully** - Use error boundary system
5. **Monitor performance** - Use performance monitoring system

## Troubleshooting

### System Not Initialized

```javascript
if (!window.errorBoundary || !window.errorBoundary.isInitialized) {
    console.warn('Error boundary not initialized');
    // Wait and retry
    setTimeout(() => {
        if (window.errorBoundary) {
            window.errorBoundary.init();
        }
    }, 1000);
}
```

### Conflicts with Existing Code

If you have existing code that conflicts:

1. Check for naming conflicts
2. Use namespaced access (e.g., `window.errorBoundary`)
3. Disable auto-initialization and initialize manually

## Testing Integration

After integrating systems:

1. Test each system individually
2. Test system interactions
3. Check for console errors
4. Verify performance impact
5. Test on multiple browsers

## Support

For issues or questions:
- Check individual system documentation
- Review COMPONENT-DOCUMENTATION.md
- Check console for error messages
- Use error boundary system for debugging

