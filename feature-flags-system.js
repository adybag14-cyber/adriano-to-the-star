/**
 * Feature Flags System
 * 
 * Implements feature flags system for gradual feature rollouts.
 * 
 * @module FeatureFlagsSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class FeatureFlagsSystem {
    constructor() {
        this.flags = new Map();
        this.defaultFlags = {};
        this.isInitialized = false;
    }

    /**
     * Initialize feature flags system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('FeatureFlagsSystem already initialized');
            return;
        }

        this.defaultFlags = options.defaultFlags || {};
        this.loadFlags();
        this.setupRemoteFlags(options.remoteFlagsUrl);
        
        this.isInitialized = true;
        this.trackEvent('feature_flags_sys_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`feature_flags_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Load flags from storage
     * @private
     */
    loadFlags() {
        try {
            const saved = localStorage.getItem('feature-flags');
            if (saved) {
                const flags = JSON.parse(saved);
                Object.entries(flags).forEach(([key, value]) => {
                    this.flags.set(key, value);
                });
            } else {
                // Use defaults
                Object.entries(this.defaultFlags).forEach(([key, value]) => {
                    this.flags.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load feature flags:', e);
            // Use defaults
            Object.entries(this.defaultFlags).forEach(([key, value]) => {
                this.flags.set(key, value);
            });
        }
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[feature-flags] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
            // Try AllOrigins first
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            } catch (proxyError) {
                console.warn('[feature-flags] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[feature-flags] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    /**
     * Set up remote flags
     * @private
     * @param {string} url - Remote flags URL
     */
    async setupRemoteFlags(url) {
        if (!url) return;

        try {
            const flags = await this.fetchJSON(url);
            
            Object.entries(flags).forEach(([key, value]) => {
                this.setFlag(key, value, false); // Don't save to storage yet
            });
            
            this.saveFlags();
        } catch (e) {
            console.warn('Failed to load remote feature flags:', e);
        }
    }

    /**
     * Check if feature is enabled
     * @public
     * @param {string} flagName - Flag name
     * @returns {boolean} True if enabled
     */
    isEnabled(flagName) {
        return this.flags.get(flagName) === true;
    }

    /**
     * Set feature flag
     * @public
     * @param {string} flagName - Flag name
     * @param {boolean} value - Flag value
     * @param {boolean} persist - Whether to persist to storage
     */
    setFlag(flagName, value, persist = true) {
        this.flags.set(flagName, value);
        
        if (persist) {
            this.saveFlags();
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('feature-flag-changed', {
            detail: { flag: flagName, value }
        }));
    }

    /**
     * Get feature flag value
     * @public
     * @param {string} flagName - Flag name
     * @param {boolean} defaultValue - Default value
     * @returns {boolean} Flag value
     */
    getFlag(flagName, defaultValue = false) {
        return this.flags.has(flagName) ? this.flags.get(flagName) : defaultValue;
    }

    /**
     * Save flags to storage
     * @private
     */
    saveFlags() {
        try {
            const flags = Object.fromEntries(this.flags);
            localStorage.setItem('feature-flags', JSON.stringify(flags));
        } catch (e) {
            console.warn('Failed to save feature flags:', e);
        }
    }

    /**
     * Get all flags
     * @public
     * @returns {Object} All flags
     */
    getAllFlags() {
        return Object.fromEntries(this.flags);
    }

    /**
     * Reset flags to defaults
     * @public
     */
    reset() {
        this.flags.clear();
        Object.entries(this.defaultFlags).forEach(([key, value]) => {
            this.flags.set(key, value);
        });
        this.saveFlags();
    }
}

// Create global instance
window.FeatureFlagsSystem = FeatureFlagsSystem;
window.featureFlags = new FeatureFlagsSystem();
window.featureFlags.init();

