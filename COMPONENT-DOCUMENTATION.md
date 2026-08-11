# Component Documentation

This document provides comprehensive documentation for all components and features in the Adriano To The Star application.

## Table of Contents

1. [Core Systems](#core-systems)
2. [User Interface Components](#user-interface-components)
3. [Data Management](#data-management)
4. [Communication Systems](#communication-systems)
5. [Security & Performance](#security--performance)
6. [Integration Systems](#integration-systems)

## Core Systems

### Error Boundary System
**File:** `error-boundary-system.js`

Centralized error handling and error boundaries for JavaScript modules.

**Usage:**
```javascript
window.errorBoundary.wrapFunction(myFunction, 'MyFunction');
window.errorBoundary.wrapModule(myModule, 'MyModule');
```

**Features:**
- Global error handling
- Error logging
- User-friendly error messages
- Error recovery strategies

### Input Validation System
**File:** `input-validation-system.js`

Comprehensive client-side input validation with real-time feedback.

**Usage:**
```javascript
window.inputValidation.validate(input, {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9]+$/
});
```

**Features:**
- Real-time validation
- Custom validation rules
- Error messages
- Form validation

### Loading States System
**File:** `loading-states-system.js`

Manages loading states and displays skeleton screens for asynchronous operations.

**Usage:**
```javascript
window.loadingStates.showLoading(element, 'spinner');
window.loadingStates.showSkeleton(element, { rows: 5 });
```

**Features:**
- Multiple loading types
- Skeleton screens
- Automatic cleanup

## User Interface Components

### Theme Toggle Enhanced
**File:** `theme-toggle-enhanced.js`

Enhanced dark mode with persistence across sessions.

**Usage:**
```javascript
window.themeToggle.toggle();
window.themeToggle.setTheme('dark');
```

### Keyboard Navigation System
**File:** `keyboard-navigation-system.js`

Keyboard navigation support for all interactive elements.

**Features:**
- Tab navigation
- Arrow key navigation
- Keyboard shortcuts
- Focus management

### Virtual Scrolling System
**File:** `virtual-scrolling-system.js`

Virtual scrolling for large lists to improve performance.

**Usage:**
```javascript
const virtualScroll = new VirtualScrollingSystem(container, 50, dataProvider);
```

## Data Management

### Data Export System
**File:** `data-export-system.js`

Comprehensive data export functionality for all user data.

**Usage:**
```javascript
await window.dataExport.exportAllUserData('json');
await window.dataExport.export(data, 'csv', 'filename.csv');
```

**Supported Formats:**
- JSON
- CSV
- Text

### Data Import System
**File:** `data-import-system.js`

Data import functionality with validation.

**Usage:**
```javascript
await window.dataImport.importFromFile(file, {
    schema: mySchema,
    process: (data) => { /* process data */ }
});
```

### Filter Presets System
**File:** `filter-presets-system.js`

Filtering system with saved filter presets.

**Usage:**
```javascript
window.filterPresets.savePreset('My Preset', filters, 'planets');
window.filterPresets.applyPreset('My Preset', 'planets');
```

### Sorting System
**File:** `sorting-system.js`

Comprehensive sorting options for all data tables.

**Usage:**
```javascript
const sorted = window.sortingSystem.sort(data, {
    field: 'name',
    order: 'asc',
    type: 'string'
});
```

### Pagination Enhanced
**File:** `pagination-enhanced.js`

Enhanced pagination with customizable page sizes.

**Usage:**
```javascript
const pagination = window.paginationEnhanced.create(container, data, {
    itemsPerPage: 25,
    pageSizes: [10, 25, 50, 100]
});
```

## Communication Systems

### Notification System
**File:** `notification-system-multi-channel.js`

Multi-channel notification system.

**Usage:**
```javascript
window.notifications.notify('Title', {
    body: 'Message',
    channels: ['toast', 'banner'],
    priority: 'info'
});
```

**Channels:**
- Toast notifications
- Banner notifications
- Desktop notifications
- Email (via email system)

### Email Notification System
**File:** `email-notification-system.js`

Email notification system with templates.

**Usage:**
```javascript
await window.emailNotifications.sendEmail('user@example.com', 'welcome', {
    name: 'User Name'
});
```

### Push Notification System
**File:** `push-notification-system.js`

Push notification system for browser notifications.

**Usage:**
```javascript
await window.pushNotifications.subscribe();
await window.pushNotifications.unsubscribe();
```

## Security & Performance

### API Cache System
**File:** `api-cache-system.js`

Caching strategy for API responses with cache invalidation.

**Usage:**
```javascript
const cached = await window.apiCache.fetchAndCache(url, options);
window.apiCache.invalidate(url);
```

### Rate Limiting System
**File:** `client-rate-limiting-system.js`

Client-side rate limiting with user-friendly error messages.

**Usage:**
```javascript
if (window.rateLimiting.canProceed('api-call')) {
    // Make API call
    window.rateLimiting.recordAction('api-call');
}
```

### Memory Leak Detection
**File:** `memory-leak-detection.js`

Memory leak detection and prevention.

**Usage:**
```javascript
window.memoryLeakDetection.startMonitoring();
window.memoryLeakDetection.detectLeaks();
```

## Integration Systems

### OAuth Integration
**File:** `oauth-integration-system.js`

OAuth integration with third-party services.

**Usage:**
```javascript
window.oauthIntegration.configureProvider('google', clientId);
await window.oauthIntegration.initiateAuth('google');
```

**Supported Providers:**
- Google
- GitHub
- Facebook

### Webhook System
**File:** `webhook-system.js`

Webhook system for external integrations.

**Usage:**
```javascript
window.webhookSystem.registerWebhook('user-created', 'https://example.com/webhook');
await window.webhookSystem.triggerWebhook('user-created', data);
```

### API Rate Limiting
**File:** `api-rate-limiting-quota.js`

API rate limiting and quota management.

**Usage:**
```javascript
const check = window.apiRateLimiting.checkRateLimit(userId, endpoint);
if (check.allowed) {
    // Make request
    window.apiRateLimiting.recordRequest(userId, endpoint, dataSize);
}
```

## Additional Systems

For complete documentation on all systems, see individual file headers with JSDoc comments.

## Integration Guide

To integrate these systems into your application:

1. Include the script files in your HTML
2. Initialize systems (most auto-initialize)
3. Use the global instances (e.g., `window.errorBoundary`)
4. Configure as needed

Example:
```html
<script src="error-boundary-system.js"></script>
<script src="input-validation-system.js"></script>
<script src="loading-states-system.js"></script>
```

## Best Practices

1. Always check if a system is initialized before use
2. Handle errors gracefully
3. Use the provided validation and error handling
4. Follow the documented API patterns
5. Test integrations thoroughly

## Support

For issues or questions, refer to the individual system documentation or check the code comments.

