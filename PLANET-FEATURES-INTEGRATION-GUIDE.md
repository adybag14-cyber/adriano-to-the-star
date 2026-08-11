# 🔧 Planet Features Integration Guide

**Last Updated:** January 2025  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Step-by-Step Integration](#step-by-step-integration)
3. [HTML Integration](#html-integration)
4. [JavaScript Integration](#javascript-integration)
5. [Supabase Setup](#supabase-setup)
6. [Testing](#testing)
7. [Common Issues](#common-issues)

---

## 🚀 Quick Start

### 1. Include Script Files

Add all feature scripts to your HTML page:

```html
<!-- Core Features -->
<script src="planet-trading-marketplace.js" defer></script>
<script src="planet-discovery-leaderboard.js" defer></script>
<script src="planet-collection-showcase.js" defer></script>
<script src="planet-rarity-calculator.js" defer></script>
<script src="customizable-dashboard-layouts.js" defer></script>
<script src="planet-wishlist-system.js" defer></script>
<script src="planet-bookmark-system.js" defer></script>
<script src="planet-discovery-achievements.js" defer></script>
<script src="planet-comparison-matrix.js" defer></script>
<script src="planet-discovery-timeline.js" defer></script>
<script src="planet-social-sharing.js" defer></script>
<script src="planet-discovery-feed.js" defer></script>
<script src="planet-discovery-search-history.js" defer></script>
<script src="planet-discovery-statistics-widget.js" defer></script>
<script src="planet-discovery-map-visualization.js" defer></script>
<script src="planet-discovery-notifications.js" defer></script>
<script src="planet-discovery-calendar.js" defer></script>
<script src="planet-discovery-export.js" defer></script>
<script src="planet-discovery-comparison-tool.js" defer></script>
<script src="planet-trading-notifications.js" defer></script>
<script src="planet-trading-analytics.js" defer></script>
```

### 2. Add Container Elements

```html
<!-- Marketplace -->
<div id="marketplace-container"></div>
<div id="trading-notifications-container"></div>
<div id="trading-analytics-container"></div>

<!-- Dashboard -->
<div id="leaderboard-container"></div>
<div id="collections-container"></div>
<div id="achievements-container"></div>
<div id="customizable-dashboard-container"></div>
<div id="export-container"></div>
<div id="discovery-calendar-container"></div>

<!-- Database -->
<div id="wishlist-container"></div>
<div id="bookmarks-container"></div>
<div id="rarity-calculator-container"></div>
<div id="comparison-tool-container"></div>
<div id="discovery-timeline-container"></div>
<div id="search-history-container"></div>
<div id="discovery-feed-container"></div>
<div id="discovery-statistics-container"></div>
<div id="discovery-map-container"></div>
<div id="discovery-notifications-container"></div>
<div id="discovery-comparison-methods-container"></div>
```

### 3. Initialize Features

```javascript
// Wait for DOM and dependencies
document.addEventListener('DOMContentLoaded', () => {
    initializePlanetFeatures();
});

async function initializePlanetFeatures() {
    // Wait for Supabase
    if (typeof supabase === 'undefined') {
        setTimeout(initializePlanetFeatures, 100);
        return;
    }
    
    // Initialize features
    await initializeMarketplace();
    await initializeDashboard();
    await initializeDatabase();
}

async function initializeMarketplace() {
    if (window.PlanetTradingMarketplace) {
        const marketplace = new PlanetTradingMarketplace();
        await marketplace.init();
        await marketplace.renderMarketplace('marketplace-container');
    }
    
    if (window.planetTradingNotifications) {
        window.planetTradingNotifications.renderNotifications('trading-notifications-container');
    }
    
    if (window.planetTradingAnalytics) {
        window.planetTradingAnalytics.renderAnalytics('trading-analytics-container');
    }
}
```

---

## 📝 Step-by-Step Integration

### Step 1: Marketplace Integration

#### File: `marketplace.html`

1. **Add scripts:**
```html
<script src="planet-trading-marketplace.js" defer></script>
<script src="planet-trading-notifications.js" defer></script>
<script src="planet-trading-analytics.js" defer></script>
```

2. **Add containers:**
```html
<div id="marketplace-container"></div>
<div id="trading-notifications-container" style="margin-top: 2rem;"></div>
<div id="trading-analytics-container" style="margin-top: 2rem;"></div>
```

3. **Initialize:**
```javascript
// In marketplace.html script section
async function initMarketplace() {
    if (typeof PlanetTradingMarketplace === 'undefined') {
        setTimeout(initMarketplace, 500);
        return;
    }
    
    const marketplace = new PlanetTradingMarketplace();
    await marketplace.init();
    await marketplace.renderMarketplace('marketplace-container');
    
    // Initialize notifications
    if (window.planetTradingNotifications) {
        window.planetTradingNotifications.renderNotifications('trading-notifications-container');
        window.planetTradingNotifications.requestPermission();
    }
    
    // Initialize analytics
    if (window.planetTradingAnalytics) {
        window.planetTradingAnalytics.renderAnalytics('trading-analytics-container');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initMarketplace, 1000));
} else {
    setTimeout(initMarketplace, 1000);
}
```

---

### Step 2: Dashboard Integration

#### File: `dashboard.html`

1. **Add scripts:**
```html
<script src="planet-discovery-leaderboard.js" defer></script>
<script src="planet-collection-showcase.js" defer></script>
<script src="planet-discovery-achievements.js" defer></script>
<script src="customizable-dashboard-layouts.js" defer></script>
<script src="planet-discovery-export.js" defer></script>
<script src="planet-discovery-calendar.js" defer></script>
```

2. **Add containers:**
```html
<!-- After stats grid -->
<div class="leaderboard-section" style="margin-top: 3rem;">
    <h2>🏆 Discovery Leaderboard</h2>
    <div id="leaderboard-container"></div>
</div>

<div class="collections-section" style="margin-top: 3rem;">
    <h2>📚 Your Collections</h2>
    <div id="collections-container"></div>
</div>

<div class="achievements-section" style="margin-top: 3rem;">
    <h2>🏅 Your Achievements</h2>
    <div id="achievements-container"></div>
</div>

<div class="customizable-dashboard-section" style="margin-top: 3rem;">
    <h2>🎨 Customize Dashboard</h2>
    <div id="customizable-dashboard-container"></div>
</div>

<div class="export-section" style="margin-top: 3rem;">
    <h2>📥 Export Your Data</h2>
    <div id="export-container"></div>
</div>

<div class="calendar-section" style="margin-top: 3rem;">
    <h2>📅 Discovery Calendar</h2>
    <div id="discovery-calendar-container"></div>
</div>
```

3. **Initialize in `loadDashboard()` function:**
```javascript
function initializeDashboardFeatures() {
    // Leaderboard
    if (window.planetDiscoveryLeaderboard) {
        window.planetDiscoveryLeaderboard.renderLeaderboard('leaderboard-container');
    }
    
    // Collections
    if (window.planetCollectionShowcase) {
        const user = authManager?.getCurrentUser();
        window.planetCollectionShowcase.renderShowcase('collections-container', user?.id);
    }
    
    // Achievements
    if (window.planetDiscoveryAchievements) {
        window.planetDiscoveryAchievements.renderAchievements('achievements-container');
    }
    
    // Customizable dashboard
    if (window.customizableDashboard) {
        window.customizableDashboard.renderDashboard('customizable-dashboard-container');
    }
    
    // Export
    if (window.planetDiscoveryExport) {
        window.planetDiscoveryExport.renderExport('export-container');
    }
    
    // Calendar
    if (window.planetDiscoveryCalendar) {
        window.planetDiscoveryCalendar.renderCalendar('discovery-calendar-container');
    }
}

// Call after loading dashboard data
await loadDashboard();
initializeDashboardFeatures();
```

---

### Step 3: Database Integration

#### File: `database.html`

1. **Add scripts:**
```html
<script src="planet-wishlist-system.js" defer></script>
<script src="planet-bookmark-system.js" defer></script>
<script src="planet-rarity-calculator.js" defer></script>
<script src="planet-comparison-matrix.js" defer></script>
<script src="planet-discovery-search-history.js" defer></script>
<script src="planet-discovery-feed.js" defer></script>
<script src="planet-discovery-statistics-widget.js" defer></script>
<script src="planet-social-sharing.js" defer></script>
<script src="planet-discovery-export.js" defer></script>
<script src="planet-discovery-map-visualization.js" defer></script>
<script src="planet-discovery-notifications.js" defer></script>
<script src="planet-discovery-calendar.js" defer></script>
<script src="planet-discovery-comparison-tool.js" defer></script>
```

2. **Add containers:**
```html
<!-- After nasa-data-container -->
<div id="wishlist-container" style="margin-top: 2rem;"></div>
<div id="bookmarks-container" style="margin-top: 2rem;"></div>
<div id="rarity-calculator-container" style="margin-top: 2rem;"></div>
<div id="comparison-tool-container" style="margin-top: 2rem;"></div>
<div id="discovery-timeline-container" style="margin-top: 2rem;"></div>
<div id="search-history-container" style="margin-top: 2rem;"></div>
<div id="discovery-feed-container" style="margin-top: 2rem;"></div>
<div id="discovery-statistics-container" style="margin-top: 2rem;"></div>
<div id="discovery-map-container" style="margin-top: 2rem;"></div>
<div id="discovery-notifications-container" style="margin-top: 2rem;"></div>
<div id="discovery-calendar-container" style="margin-top: 2rem;"></div>
<div id="discovery-comparison-methods-container" style="margin-top: 2rem;"></div>
```

3. **Initialize:**
```javascript
function initializeDatabaseFeatures() {
    // Wishlist
    if (window.planetWishlistSystem) {
        window.planetWishlistSystem.renderWishlist('wishlist-container');
    }
    
    // Bookmarks
    if (window.planetBookmarkSystem) {
        window.planetBookmarkSystem.renderBookmarks('bookmarks-container');
    }
    
    // Discovery feed
    if (window.planetDiscoveryFeed) {
        window.planetDiscoveryFeed.renderFeed('discovery-feed-container');
    }
    
    // Search history
    if (window.planetDiscoverySearchHistory) {
        window.planetDiscoverySearchHistory.renderHistory('search-history-container');
    }
    
    // Statistics
    if (window.planetDiscoveryStatisticsWidget) {
        window.planetDiscoveryStatisticsWidget.renderWidget('discovery-statistics-container');
    }
    
    // Map
    if (window.planetDiscoveryMapVisualization) {
        window.planetDiscoveryMapVisualization.renderMap('discovery-map-container');
    }
    
    // Notifications
    if (window.planetDiscoveryNotifications) {
        window.planetDiscoveryNotifications.renderNotifications('discovery-notifications-container');
        window.planetDiscoveryNotifications.requestPermission();
    }
    
    // Calendar
    if (window.planetDiscoveryCalendar) {
        window.planetDiscoveryCalendar.renderCalendar('discovery-calendar-container');
    }
    
    // Comparison tool
    if (window.planetDiscoveryComparisonTool) {
        window.planetDiscoveryComparisonTool.renderComparison('discovery-comparison-methods-container');
    }
}

// Call after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeDatabaseFeatures, 2000);
    });
} else {
    setTimeout(initializeDatabaseFeatures, 2000);
}
```

---

## 🗄️ Supabase Setup

### Required Tables

Create these tables in Supabase:

#### 1. `user_claims`
```sql
CREATE TABLE user_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    kepid INTEGER NOT NULL,
    kepler_name TEXT,
    claimed_at TIMESTAMP DEFAULT NOW(),
    status TEXT,
    UNIQUE(user_id, kepid)
);
```

#### 2. `planet_listings`
```sql
CREATE TABLE planet_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planet_id UUID,
    seller_id UUID REFERENCES auth.users(id),
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `planet_favorites`
```sql
CREATE TABLE planet_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    kepid INTEGER NOT NULL,
    kepler_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, kepid)
);
```

#### 4. `planet_bookmarks`
```sql
CREATE TABLE planet_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    kepid INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, kepid)
);
```

#### 5. `planet_wishlist`
```sql
CREATE TABLE planet_wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    kepid INTEGER NOT NULL,
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, kepid)
);
```

### Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE user_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE planet_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE planet_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE planet_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE planet_wishlist ENABLE ROW LEVEL SECURITY;

-- Policies for user_claims
CREATE POLICY "Users can view their own claims"
    ON user_claims FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims"
    ON user_claims FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Similar policies for other tables...
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Marketplace loads and displays listings
- [ ] Can create a listing
- [ ] Can buy a planet
- [ ] Notifications appear
- [ ] Analytics display correctly
- [ ] Leaderboard shows rankings
- [ ] Collections display
- [ ] Achievements unlock
- [ ] Can add to wishlist
- [ ] Can bookmark planets
- [ ] Rarity calculator works
- [ ] Comparison tool functions
- [ ] Timeline displays
- [ ] Search history saves
- [ ] Feed updates
- [ ] Statistics calculate
- [ ] Map renders
- [ ] Calendar shows events
- [ ] Export works
- [ ] Sharing functions

### Automated Testing

```javascript
// Example test
describe('Planet Features', () => {
    test('Marketplace initializes', async () => {
        const marketplace = new PlanetTradingMarketplace();
        await marketplace.init();
        expect(marketplace).toBeDefined();
    });
    
    test('Can add to wishlist', () => {
        const wishlist = new PlanetWishlistSystem();
        const result = wishlist.addToWishlist(mockPlanet);
        expect(result).toBe(true);
    });
});
```

---

## 🐛 Common Issues

### Issue 1: Features Not Loading

**Problem:** Features don't appear on page.

**Solutions:**
1. Check browser console for errors
2. Verify scripts are included with `defer`
3. Check if Supabase is initialized
4. Verify container IDs match

### Issue 2: Supabase Errors

**Problem:** "Unauthorized" or "Permission denied" errors.

**Solutions:**
1. Check authentication status
2. Verify RLS policies
3. Check API keys
4. Ensure user is logged in

### Issue 3: Performance Issues

**Problem:** Page loads slowly.

**Solutions:**
1. Enable lazy loading
2. Use pagination
3. Implement caching
4. Load features on demand

### Issue 4: Notifications Not Working

**Problem:** Browser notifications don't appear.

**Solutions:**
1. Request permission explicitly
2. Check browser settings
3. Verify HTTPS (required for notifications)
4. Check notification API support

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Planet Features Documentation](./PLANET-FEATURES-DOCUMENTATION.md)
- [Planet API Documentation](./PLANET-API-DOCUMENTATION.md)

---

**Integration Guide maintained by:** Adriano To The Star Development Team

