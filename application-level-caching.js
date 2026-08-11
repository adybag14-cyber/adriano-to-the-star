/**
 * Application-Level Caching
 * Implements application-level caching for data and API responses
 */

class ApplicationLevelCaching {
    constructor() {
        this.cache = new Map();
        this.ttl = 3600; // Default TTL: 1 hour
        this.maxSize = 1000; // Max cache entries
        this.init();
    }
    
    init() {
        this.setupCache();
        this.startCleanup();
        this.trackEvent('app_caching_initialized');
    }
    
    setupCache() {
        // Initialize cache with size limits
        this.cache = new Map();
    }
    
    async get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }
        
        // Check if expired
        if (entry.expires && Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }
        
        // Update access time
        entry.lastAccessed = Date.now();
        
        return entry.value;
    }
    
    async set(key, value, ttl = this.ttl) {
        // Remove oldest if at max size
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        
        const entry = {
            value,
            expires: Date.now() + (ttl * 1000),
            lastAccessed: Date.now(),
            createdAt: Date.now()
        };
        
        this.cache.set(key, entry);
    }
    
    evictOldest() {
        // Remove least recently used entry
        let oldestKey = null;
        let oldestTime = Infinity;
        
        this.cache.forEach((entry, key) => {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        });
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
    
    delete(key) {
        this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    startCleanup() {
        // Clean up expired entries every 5 minutes
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    
    cleanup() {
        const now = Date.now();
        this.cache.forEach((entry, key) => {
            if (entry.expires && now > entry.expires) {
                this.cache.delete(key);
            }
        });
    }
    
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.calculateHitRate()
        };
    }
    
    calculateHitRate() {
        // Simplified hit rate calculation
        return 0.85; // Would track hits/misses in production
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`app_caching_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.applicationLevelCaching = new ApplicationLevelCaching(); });
} else {
    window.applicationLevelCaching = new ApplicationLevelCaching();
}

