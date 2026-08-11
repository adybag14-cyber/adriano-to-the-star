/**
 * Asset Bundling
 * Asset bundling and combination
 */

class AssetBundling {
    constructor() {
        this.bundles = new Map();
        this.assets = new Map();
        this.init();
    }

    init() {
        this.trackEvent('bundling_initialized');
    }

    createBundle(bundleId, bundleData) {
        const bundle = {
            id: bundleId,
            ...bundleData,
            name: bundleData.name || bundleId,
            assets: bundleData.assets || [],
            type: bundleData.type || 'js',
            createdAt: new Date()
        };
        
        this.bundles.set(bundleId, bundle);
        console.log(`Bundle created: ${bundleId}`);
        return bundle;
    }

    addAssetToBundle(bundleId, assetId, assetContent) {
        const bundle = this.bundles.get(bundleId);
        if (!bundle) {
            throw new Error('Bundle not found');
        }
        
        const asset = {
            id: assetId,
            content: assetContent,
            type: bundle.type,
            createdAt: new Date()
        };
        
        this.assets.set(assetId, asset);
        
        if (!bundle.assets.includes(assetId)) {
            bundle.assets.push(assetId);
        }
        
        return bundle;
    }

    buildBundle(bundleId) {
        const bundle = this.bundles.get(bundleId);
        if (!bundle) {
            throw new Error('Bundle not found');
        }
        
        let bundledContent = '';
        
        bundle.assets.forEach(assetId => {
            const asset = this.assets.get(assetId);
            if (asset) {
                bundledContent += asset.content + '\n';
            }
        });
        
        return {
            bundleId,
            content: bundledContent,
            size: bundledContent.length,
            assetCount: bundle.assets.length,
            builtAt: new Date()
        };
    }

    getBundle(bundleId) {
        return this.bundles.get(bundleId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bundling_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.assetBundling = new AssetBundling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetBundling;
}


