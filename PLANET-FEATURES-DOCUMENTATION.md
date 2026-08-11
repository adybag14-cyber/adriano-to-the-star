# 🌍 Planet Features Documentation

**Last Updated:** January 2025  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Feature List](#feature-list)
3. [Integration Guide](#integration-guide)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This document provides comprehensive documentation for all planet-related features in the Adriano To The Star platform. These features enhance the exoplanet database experience with trading, analytics, social features, and more.

### Key Features
- **Planet Trading Marketplace**: Buy, sell, and trade exoplanet claims
- **Discovery Analytics**: Track discoveries, leaderboards, and statistics
- **Social Features**: Share, bookmark, wishlist planets
- **Visualization Tools**: Maps, timelines, calendars
- **Export & Import**: Export planet data in multiple formats

---

## 📦 Feature List

### 1. Planet Trading Marketplace

**File:** `planet-trading-marketplace.js`  
**Page:** `marketplace.html`

#### Features
- List planets for sale
- Buy planets from other users
- Make offers on listed planets
- View trading history
- Real-time notifications

#### Usage
```javascript
// Initialize marketplace
const marketplace = new PlanetTradingMarketplace();
await marketplace.init();
await marketplace.renderMarketplace('marketplace-container');

// Create a listing
await marketplace.createListing({
    planetId: 'kepid-12345',
    price: 100,
    currency: 'USD'
});

// Buy a planet
await marketplace.buyPlanet(listingId);
```

---

### 2. Planet Discovery Leaderboard

**File:** `planet-discovery-leaderboard.js`  
**Page:** `dashboard.html`

#### Features
- Rank users by discoveries
- Show top discoverers
- Display discovery counts
- Track achievements

#### Usage
```javascript
// Initialize leaderboard
const leaderboard = new PlanetDiscoveryLeaderboard();
leaderboard.renderLeaderboard('leaderboard-container');
```

---

### 3. Planet Collection Showcase

**File:** `planet-collection-showcase.js`  
**Page:** `dashboard.html`

#### Features
- Display user's planet collections
- Organize planets by category
- Share collections
- Export collection data

#### Usage
```javascript
// Initialize showcase
const showcase = new PlanetCollectionShowcase();
showcase.renderShowcase('collections-container', userId);
```

---

### 4. Planet Rarity Calculator

**File:** `planet-rarity-calculator.js`  
**Page:** `database.html` (integrated in planet cards)

#### Features
- Calculate planet rarity scores
- Display rarity metrics
- Compare planet rarity
- Show rarity distribution

#### Usage
```javascript
// Calculate rarity
const calculator = new PlanetRarityCalculator();
const rarity = calculator.calculateRarity(planetData);
calculator.renderRarity('rarity-container', planetData);
```

---

### 5. Customizable Dashboard Layouts

**File:** `customizable-dashboard-layouts.js`  
**Page:** `dashboard.html`

#### Features
- Drag-and-drop widget arrangement
- Save custom layouts
- Multiple layout presets
- Sync to Supabase

#### Usage
```javascript
// Initialize dashboard
const dashboard = new DashboardWidgets();
dashboard.renderDashboard('dashboard-container');
dashboard.setupEditMode();
```

---

### 6. Planet Wishlist System

**File:** `planet-wishlist-system.js`  
**Page:** `database.html`

#### Features
- Add planets to wishlist
- Remove from wishlist
- View wishlist
- Share wishlist

#### Usage
```javascript
// Initialize wishlist
const wishlist = new PlanetWishlistSystem();
wishlist.addToWishlist(planetData);
wishlist.renderWishlist('wishlist-container');
```

---

### 7. Planet Bookmark System

**File:** `planet-bookmark-system.js`  
**Page:** `database.html`

#### Features
- Bookmark planets
- Organize bookmarks
- Quick access to bookmarked planets
- Export bookmarks

#### Usage
```javascript
// Initialize bookmarks
const bookmarks = new PlanetBookmarkSystem();
bookmarks.addBookmark(planetData);
bookmarks.renderBookmarks('bookmarks-container');
```

---

### 8. Planet Discovery Achievements

**File:** `planet-discovery-achievements.js`  
**Page:** `dashboard.html`

#### Features
- Unlock achievements
- Track progress
- Display badges
- Achievement notifications

#### Usage
```javascript
// Initialize achievements
const achievements = new PlanetDiscoveryAchievements();
achievements.renderAchievements('achievements-container');
achievements.checkAchievements(userId);
```

---

### 9. Planet Comparison Matrix

**File:** `planet-comparison-matrix.js`  
**Page:** `database.html`

#### Features
- Compare up to 5 planets
- Side-by-side comparison
- Visual charts
- Export comparison

#### Usage
```javascript
// Initialize comparison
const comparison = new PlanetComparisonMatrix();
comparison.addPlanet(planetData);
comparison.renderMatrix('comparison-container');
```

---

### 10. Planet Discovery Timeline

**File:** `planet-discovery-timeline.js`  
**Page:** `database.html`

#### Features
- Visual timeline of discoveries
- Filter by date range
- Show discovery methods
- Interactive timeline

#### Usage
```javascript
// Initialize timeline
const timeline = new PlanetDiscoveryTimeline();
timeline.renderTimeline('timeline-container');
```

---

### 11. Planet Social Sharing

**File:** `planet-social-sharing.js`  
**Page:** `database.html` (integrated in planet cards)

#### Features
- Share to social media
- Generate share links
- Custom share messages
- Web Share API support

#### Usage
```javascript
// Initialize sharing
const sharing = new PlanetSocialSharing();
sharing.sharePlanet(planetData, 'web');
```

---

### 12. Planet Discovery Feed

**File:** `planet-discovery-feed.js`  
**Page:** `database.html`

#### Features
- Real-time discovery updates
- Filter by type
- Sort by date
- Infinite scroll

#### Usage
```javascript
// Initialize feed
const feed = new PlanetDiscoveryFeed();
feed.renderFeed('feed-container');
```

---

### 13. Planet Discovery Search History

**File:** `planet-discovery-search-history.js`  
**Page:** `database.html`

#### Features
- Track search queries
- Quick access to recent searches
- Clear history
- Export history

#### Usage
```javascript
// Initialize search history
const history = new PlanetDiscoverySearchHistory();
history.addSearch(query);
history.renderHistory('history-container');
```

---

### 14. Planet Discovery Statistics Widget

**File:** `planet-discovery-statistics-widget.js`  
**Page:** `analytics-dashboard.html`, `database.html`

#### Features
- Display key statistics
- Real-time updates
- Visual charts
- Export statistics

#### Usage
```javascript
// Initialize statistics
const stats = new PlanetDiscoveryStatisticsWidget();
stats.renderWidget('stats-container');
```

---

### 15. Planet Discovery Map Visualization

**File:** `planet-discovery-map-visualization.js`  
**Page:** `analytics-dashboard.html`, `database.html`

#### Features
- Interactive map of discoveries
- Filter by region
- Show discovery density
- Zoom and pan

#### Usage
```javascript
// Initialize map
const map = new PlanetDiscoveryMapVisualization();
map.renderMap('map-container');
```

---

### 16. Planet Discovery Notifications

**File:** `planet-discovery-notifications.js`  
**Page:** `database.html`

#### Features
- Real-time notifications
- Browser push notifications
- Notification preferences
- Notification history

#### Usage
```javascript
// Initialize notifications
const notifications = new PlanetDiscoveryNotifications();
notifications.requestPermission();
notifications.renderNotifications('notifications-container');
```

---

### 17. Planet Discovery Calendar

**File:** `planet-discovery-calendar.js`  
**Page:** `dashboard.html`, `database.html`

#### Features
- Calendar view of discoveries
- Filter by month/year
- Show discovery events
- Export calendar

#### Usage
```javascript
// Initialize calendar
const calendar = new PlanetDiscoveryCalendar();
calendar.renderCalendar('calendar-container');
```

---

### 18. Planet Discovery Export

**File:** `planet-discovery-export.js`  
**Page:** `dashboard.html`

#### Features
- Export to CSV
- Export to JSON
- Export to TXT
- Custom export formats

#### Usage
```javascript
// Initialize export
const exporter = new PlanetDiscoveryExport();
exporter.exportData(planets, 'csv');
```

---

### 19. Planet Discovery Comparison Tool (Methods)

**File:** `planet-discovery-comparison-tool.js`  
**Page:** `database.html`

#### Features
- Compare discovery methods
- Show method statistics
- Visual comparisons
- Method effectiveness analysis

#### Usage
```javascript
// Initialize comparison tool
const tool = new PlanetDiscoveryComparisonTool();
tool.renderComparison('comparison-container');
```

---

### 20. Planet Trading Notifications

**File:** `planet-trading-notifications.js`  
**Page:** `marketplace.html`

#### Features
- Trading activity notifications
- Price alerts
- Offer notifications
- Sale confirmations

#### Usage
```javascript
// Initialize trading notifications
const notifications = new PlanetTradingNotifications();
notifications.renderNotifications('notifications-container');
notifications.requestPermission();
```

---

### 21. Planet Trading Analytics

**File:** `planet-trading-analytics.js`  
**Page:** `marketplace.html`

#### Features
- Trading volume statistics
- Price trends
- Popular planets
- Market insights

#### Usage
```javascript
// Initialize analytics
const analytics = new PlanetTradingAnalytics();
analytics.renderAnalytics('analytics-container');
```

---

## 🔧 Integration Guide

### Basic Integration

1. **Include the script file:**
```html
<script src="planet-feature-name.js" defer></script>
```

2. **Add container element:**
```html
<div id="feature-container"></div>
```

3. **Initialize the feature:**
```javascript
if (window.FeatureName) {
    const feature = new FeatureName();
    feature.renderFeature('feature-container');
}
```

### Advanced Integration

For features that require Supabase:

```javascript
// Wait for Supabase to load
if (window.supabase && window.FeatureName) {
    const feature = new FeatureName();
    await feature.init();
    await feature.renderFeature('feature-container');
}
```

### Error Handling

Always wrap initialization in try-catch:

```javascript
try {
    if (window.FeatureName) {
        const feature = new FeatureName();
        await feature.init();
    }
} catch (error) {
    console.error('Feature initialization failed:', error);
}
```

---

## 💡 Usage Examples

### Example 1: Adding a Planet to Wishlist

```javascript
// From planet card button
function toggleWishlist(kepid, planetData) {
    if (window.planetWishlistSystem) {
        const added = window.planetWishlistSystem.addToWishlist(planetData);
        if (added) {
            alert('Added to wishlist!');
        } else {
            alert('Already in wishlist!');
        }
    }
}
```

### Example 2: Sharing a Planet

```javascript
// From planet card button
function sharePlanet(planetData) {
    if (window.planetSocialSharing) {
        window.planetSocialSharing.sharePlanet(planetData, 'web');
    }
}
```

### Example 3: Comparing Planets

```javascript
// Add planet to comparison
function addToComparison(kepid, planetData) {
    if (window.planetComparisonMatrix) {
        const added = window.planetComparisonMatrix.addPlanet(planetData);
        if (added) {
            alert('Added to comparison!');
            // Show comparison if we have 2+ planets
            if (window.planetComparisonMatrix.selectedPlanets.length >= 2) {
                window.planetComparisonMatrix.renderMatrix('comparison-container');
            }
        }
    }
}
```

---

## 🔌 API Reference

### Planet Data Structure

```javascript
{
    kepid: number,              // Kepler ID
    kepler_name: string,        // Kepler name
    kepoi_name: string,         // KOI name
    status: string,             // 'CONFIRMED' or 'CANDIDATE'
    type: string,               // 'Earth-like', 'Super-Earth', etc.
    radius: number,             // Earth radii
    mass: number,               // Earth masses
    distance: number,           // Light years
    disc_year: number,          // Discovery year
    score: number,              // Confidence score (0-1)
    availability: string        // 'available' or 'claimed'
}
```

### Common Methods

#### `init()`
Initialize the feature.

```javascript
await feature.init();
```

#### `renderFeature(containerId)`
Render the feature UI.

```javascript
feature.renderFeature('container-id');
```

#### `destroy()`
Clean up the feature.

```javascript
feature.destroy();
```

---

## ⚙️ Configuration

### Supabase Configuration

Most features require Supabase. Configure in `supabase-config.js`:

```javascript
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-supabase-key';
```

### API Keys

Some features require API keys:

```javascript
// Gemini API (for AI features)
window.GEMINI_API_KEY = 'your-gemini-api-key';

// Stripe (for payments)
window.STRIPE_PUBLIC_KEY = 'your-stripe-key';
```

---

## 🐛 Troubleshooting

### Feature Not Loading

1. Check if script is included:
```html
<script src="feature-name.js" defer></script>
```

2. Check browser console for errors

3. Verify dependencies are loaded:
```javascript
console.log(window.FeatureName); // Should not be undefined
```

### Supabase Errors

1. Verify Supabase configuration
2. Check authentication status
3. Verify table permissions

### Performance Issues

1. Enable lazy loading
2. Use pagination
3. Implement caching

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

## 📝 Changelog

### Version 1.0.0 (January 2025)
- Initial release
- 21 planet features integrated
- Full documentation

---

## 🤝 Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check feature-specific files for inline comments

---

**Documentation maintained by:** Adriano To The Star Development Team

