/**
 * Asset Versioning System
 * Manages asset versioning for cache busting
 */

class AssetVersioningSystem {
    constructor() {
        this.version = this.getVersion();
        this.manifest = new Map();
        this.init();
    }
    
    init() {
        this.loadManifest();
        this.trackEvent('versioning_initialized');
    }
    
    getVersion() {
        // Get version from build or generate timestamp
        return window.APP_VERSION || Date.now().toString(36);
    }
    
    loadManifest() {
        // Load asset manifest if available
        if (window.ASSET_MANIFEST) {
            Object.entries(window.ASSET_MANIFEST).forEach(([key, value]) => {
                this.manifest.set(key, value);
            });
        }
    }
    
    getVersionedUrl(assetPath) {
        // Check manifest first
        if (this.manifest.has(assetPath)) {
            return this.manifest.get(assetPath);
        }
        
        // Generate versioned URL
        const separator = assetPath.includes('?') ? '&' : '?';
        return `${assetPath}${separator}v=${this.version}`;
    }
    
    versionAsset(assetPath) {
        return this.getVersionedUrl(assetPath);
    }
    
    updateAssetReferences() {
        // Update all asset references in the page
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.href && !link.href.includes('v=')) {
                link.href = this.getVersionedUrl(link.href);
            }
        });
        
        document.querySelectorAll('script[src]').forEach(script => {
            if (script.src && !script.src.includes('v=')) {
                script.src = this.getVersionedUrl(script.src);
            }
        });
        
        document.querySelectorAll('img[src]').forEach(img => {
            if (img.src && !img.src.includes('v=') && !img.src.startsWith('data:')) {
                img.src = this.getVersionedUrl(img.src);
            }
        });
    }
    
    generateManifest(assets) {
        const manifest = {};
        assets.forEach(asset => {
            const versioned = this.getVersionedUrl(asset);
            manifest[asset] = versioned;
        });
        return manifest;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`asset_versioning_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { 
        window.assetVersioningSystem = new AssetVersioningSystem();
        window.assetVersioningSystem.updateAssetReferences();
    });
} else {
    window.assetVersioningSystem = new AssetVersioningSystem();
    window.assetVersioningSystem.updateAssetReferences();
}

