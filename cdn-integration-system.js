/**
 * CDN Integration System
 * Content Delivery Network integration for static assets
 * 
 * Features:
 * - CDN URL management
 * - Fallback to local assets
 * - Asset versioning
 * - Multiple CDN support
 * - Performance monitoring
 */

class CDNIntegrationSystem {
    constructor() {
        this.cdnConfig = {
            primary: 'https://cdn.adrianotothestar.com',
            secondary: 'https://cdn2.adrianotothestar.com',
            fallback: '/', // Local fallback
            enabled: true
        };
        this.assetMap = new Map();
        this.failedCDN = new Set();
        this.init();
    }
    
    init() {
        this.loadConfig();
        this.setupAssetMapping();
        this.setupFallback();
        this.trackEvent('cdn_int_sys_initialized');
    }
    
    loadConfig() {
        try {
            const saved = localStorage.getItem('cdn-config');
            if (saved) {
                this.cdnConfig = { ...this.cdnConfig, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load CDN config:', e);
        }
    }
    
    setupAssetMapping() {
        // Map local assets to CDN URLs
        document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]').forEach(element => {
            const src = element.href || element.src;
            if (src && !src.startsWith('http') && !src.startsWith('//')) {
                const cdnUrl = this.getCDNUrl(src);
                if (cdnUrl && this.cdnConfig.enabled) {
                    this.assetMap.set(src, cdnUrl);
                }
            }
        });
    }
    
    getCDNUrl(localPath) {
        // Remove leading slash
        const path = localPath.startsWith('/') ? localPath.substring(1) : localPath;
        
        // Use primary CDN
        if (!this.failedCDN.has(this.cdnConfig.primary)) {
            return `${this.cdnConfig.primary}/${path}`;
        }
        
        // Fallback to secondary
        if (this.cdnConfig.secondary && !this.failedCDN.has(this.cdnConfig.secondary)) {
            return `${this.cdnConfig.secondary}/${path}`;
        }
        
        // Fallback to local
        return localPath;
    }
    
    setupFallback() {
        // Intercept resource loading
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if ((tagName === 'link' || tagName === 'script' || tagName === 'img') && element.src) {
                const originalSrc = element.src;
                const cdnUrl = window.cdnIntegrationSystem?.getCDNUrl(originalSrc);
                
                if (cdnUrl && cdnUrl !== originalSrc) {
                    element.src = cdnUrl;
                    
                    // Fallback on error
                    element.addEventListener('error', () => {
                        if (element.src !== originalSrc) {
                            window.cdnIntegrationSystem?.handleCDNFailure(cdnUrl);
                            element.src = originalSrc;
                        }
                    });
                }
            }
            
            return element;
        };
    }
    
    handleCDNFailure(cdnUrl) {
        const cdn = cdnUrl.split('/')[2];
        this.failedCDN.add(cdn);
        console.warn(`CDN failure detected: ${cdn}, using fallback`);
    }
    
    // Prefetch CDN assets
    prefetchAsset(path) {
        const cdnUrl = this.getCDNUrl(path);
        if (cdnUrl && cdnUrl !== path) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = cdnUrl;
            document.head.appendChild(link);
        }
    }
    
    // Check CDN health
    async checkCDNHealth() {
        const testUrl = `${this.cdnConfig.primary}/health-check.txt`;
        try {
            const response = await fetch(testUrl, { method: 'HEAD', cache: 'no-cache' });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
    
    // Get asset with CDN URL
    getAssetUrl(localPath) {
        if (!this.cdnConfig.enabled) {
            return localPath;
        }
        return this.getCDNUrl(localPath);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cdn_int_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cdnIntegrationSystem = new CDNIntegrationSystem();
    });
} else {
    window.cdnIntegrationSystem = new CDNIntegrationSystem();
}

