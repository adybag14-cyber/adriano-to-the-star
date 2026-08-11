/**
 * Asset Minification
 * JavaScript and CSS asset minification
 */

class AssetMinification {
    constructor() {
        this.assets = new Map();
        this.minified = new Map();
        this.init();
    }

    init() {
        this.trackEvent('minification_initialized');
    }

    minifyAsset(assetId, assetData) {
        const asset = {
            id: assetId,
            ...assetData,
            type: assetData.type || 'js',
            original: assetData.content || '',
            size: assetData.size || 0,
            createdAt: new Date()
        };
        
        this.assets.set(assetId, asset);
        
        const minified = this.performMinification(asset);
        
        const minifiedAsset = {
            id: `minified_${Date.now()}`,
            assetId,
            content: minified.content,
            size: minified.size,
            reduction: asset.size > 0 ? ((asset.size - minified.size) / asset.size) * 100 : 0,
            createdAt: new Date()
        };
        
        this.minified.set(minifiedAsset.id, minifiedAsset);
        
        return minifiedAsset;
    }

    performMinification(asset) {
        let content = asset.original;
        
        if (asset.type === 'js' || asset.type === 'javascript') {
            content = this.minifyJavaScript(content);
        } else if (asset.type === 'css') {
            content = this.minifyCSS(content);
        }
        
        return {
            content,
            size: content.length
        };
    }

    minifyJavaScript(code) {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}();,=+\-*\/])\s*/g, '$1')
            .trim();
    }

    minifyCSS(code) {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,])\s*/g, '$1')
            .trim();
    }

    getAsset(assetId) {
        return this.assets.get(assetId);
    }

    getMinified(assetId) {
        return Array.from(this.minified.values())
            .find(m => m.assetId === assetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`minification_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.assetMinification = new AssetMinification();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetMinification;
}


