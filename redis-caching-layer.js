/**
 * Redis Caching Layer
 * Client-side interface for Redis caching operations
 */

class RedisCachingLayer {
    constructor() {
        this.cache = new Map(); // Fallback to in-memory cache
        this.ttl = 3600; // Default TTL: 1 hour
        this.init();
    }
    
    init() {
        // Initialize Redis connection if available
        // For client-side, we use localStorage as fallback
        this.setupFallbackCache();
    }
    
    setupFallbackCache() {
        // Use localStorage for client-side caching
        this.cache = {
            get: (key) => {
                try {
                    const item = localStorage.getItem(`cache_${key}`);
                    if (!item) return null;
                    
                    const { value, expires } = JSON.parse(item);
                    if (expires && Date.now() > expires) {
                        localStorage.removeItem(`cache_${key}`);
                        return null;
                    }
                    return value;
                } catch (e) {
                    return null;
                }
            },
            set: (key, value, ttl = this.ttl) => {
                try {
                    const expires = Date.now() + (ttl * 1000);
                    localStorage.setItem(`cache_${key}`, JSON.stringify({ value, expires }));
                } catch (e) {
                    console.warn('Cache set failed:', e);
                }
            },
            delete: (key) => {
                try {
                    localStorage.removeItem(`cache_${key}`);
                } catch (e) {
                    // Ignore
                }
            },
            clear: () => {
                try {
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('cache_')) {
                            localStorage.removeItem(key);
                        }
                    });
                } catch (e) {
                    // Ignore
                }
            }
        };
    }
    
    async get(key) {
        // Try Redis first, fallback to local cache
        if (window.redisClient) {
            try {
                return await window.redisClient.get(key);
            } catch (e) {
                console.warn('Redis get failed, using fallback:', e);
            }
        }
        
        return this.cache.get(key);
    }
    
    async set(key, value, ttl = this.ttl) {
        // Set in Redis if available
        if (window.redisClient) {
            try {
                await window.redisClient.set(key, value, 'EX', ttl);
                return true;
            } catch (e) {
                console.warn('Redis set failed, using fallback:', e);
            }
        }
        
        this.cache.set(key, value, ttl);
        return true;
    }
    
    async delete(key) {
        if (window.redisClient) {
            try {
                await window.redisClient.del(key);
            } catch (e) {
                console.warn('Redis delete failed:', e);
            }
        }
        
        this.cache.delete(key);
    }
    
    async clear() {
        if (window.redisClient) {
            try {
                await window.redisClient.flushdb();
            } catch (e) {
                console.warn('Redis clear failed:', e);
            }
        }
        
        this.cache.clear();
    }
    
    async getOrSet(key, fetchFn, ttl = this.ttl) {
        // Get from cache, or fetch and cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        const value = await fetchFn();
        await this.set(key, value, ttl);
        return value;
    }
    
    async invalidate(pattern) {
        // Invalidate keys matching pattern
        if (window.redisClient) {
            try {
                const keys = await window.redisClient.keys(pattern);
                if (keys.length > 0) {
                    await window.redisClient.del(...keys);
                }
            } catch (e) {
                console.warn('Redis invalidate failed:', e);
            }
        }
        
        // Fallback: clear all (pattern matching not supported in localStorage)
        if (pattern === '*') {
            this.cache.clear();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.redisCachingLayer = new RedisCachingLayer(); });
} else {
    window.redisCachingLayer = new RedisCachingLayer();
}

