/**
 * Asset Tracking
 * IoT asset tracking system
 */

class AssetTracking {
    constructor() {
        this.assets = new Map();
        this.trackers = new Map();
        this.locations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('asset_tracking_initialized');
    }

    registerAsset(assetId, assetData) {
        const asset = {
            id: assetId,
            ...assetData,
            name: assetData.name || assetId,
            type: assetData.type || 'equipment',
            trackerId: assetData.trackerId || null,
            currentLocation: null,
            status: 'active',
            createdAt: new Date()
        };
        
        this.assets.set(assetId, asset);
        console.log(`Asset registered: ${assetId}`);
        return asset;
    }

    registerTracker(trackerId, trackerData) {
        const tracker = {
            id: trackerId,
            ...trackerData,
            name: trackerData.name || trackerId,
            type: trackerData.type || 'gps',
            assetId: trackerData.assetId || null,
            batteryLevel: trackerData.batteryLevel || 100,
            status: 'active',
            createdAt: new Date()
        };
        
        this.trackers.set(trackerId, tracker);
        console.log(`Tracker registered: ${trackerId}`);
        return tracker;
    }

    async updateLocation(trackerId, locationData) {
        const tracker = this.trackers.get(trackerId);
        if (!tracker) {
            throw new Error('Tracker not found');
        }
        
        const location = {
            id: `location_${Date.now()}`,
            trackerId,
            assetId: tracker.assetId,
            ...locationData,
            latitude: locationData.latitude || 0,
            longitude: locationData.longitude || 0,
            altitude: locationData.altitude || 0,
            accuracy: locationData.accuracy || 10,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.locations.set(location.id, location);
        
        if (tracker.assetId) {
            const asset = this.assets.get(tracker.assetId);
            if (asset) {
                asset.currentLocation = location;
            }
        }
        
        return location;
    }

    getAssetLocation(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }
        
        return asset.currentLocation;
    }

    getLocationHistory(assetId, startDate = null, endDate = null) {
        let locations = Array.from(this.locations.values())
            .filter(l => l.assetId === assetId);
        
        if (startDate) {
            locations = locations.filter(l => l.timestamp >= startDate);
        }
        
        if (endDate) {
            locations = locations.filter(l => l.timestamp <= endDate);
        }
        
        return locations.sort((a, b) => a.timestamp - b.timestamp);
    }

    getAsset(assetId) {
        return this.assets.get(assetId);
    }

    getTracker(trackerId) {
        return this.trackers.get(trackerId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`asset_tracking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.assetTracking = new AssetTracking();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetTracking;
}

