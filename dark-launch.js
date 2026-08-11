/**
 * Dark Launch
 * Dark launch capability
 */

class DarkLaunch {
    constructor() {
        this.launches = new Map();
        this.features = new Map();
        this.init();
    }

    init() {
        this.trackEvent('dark_launch_initialized');
    }

    createFeature(featureId, featureData) {
        const feature = {
            id: featureId,
            ...featureData,
            name: featureData.name || featureId,
            status: 'dark',
            trafficPercentage: 0,
            createdAt: new Date()
        };
        
        this.features.set(featureId, feature);
        console.log(`Feature created: ${featureId}`);
        return feature;
    }

    async launch(featureId, launchData) {
        const feature = this.features.get(featureId);
        if (!feature) {
            throw new Error('Feature not found');
        }
        
        const launch = {
            id: `launch_${Date.now()}`,
            featureId,
            ...launchData,
            trafficPercentage: launchData.trafficPercentage || 0,
            status: 'dark',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.launches.set(launch.id, launch);
        
        feature.status = 'dark';
        feature.trafficPercentage = launch.trafficPercentage;
        
        return launch;
    }

    async increaseTraffic(featureId, percentage) {
        const feature = this.features.get(featureId);
        if (!feature) {
            throw new Error('Feature not found');
        }
        
        feature.trafficPercentage = Math.min(100, feature.trafficPercentage + percentage);
        
        if (feature.trafficPercentage >= 100) {
            feature.status = 'live';
        } else if (feature.trafficPercentage > 0) {
            feature.status = 'gradual';
        }
        
        return feature;
    }

    shouldShowFeature(featureId, userId) {
        const feature = this.features.get(featureId);
        if (!feature) {
            return false;
        }
        
        if (feature.status === 'live') {
            return true;
        }
        
        if (feature.status === 'dark') {
            return false;
        }
        
        const hash = this.hashUserId(userId);
        return (hash % 100) < feature.trafficPercentage;
    }

    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    getFeature(featureId) {
        return this.features.get(featureId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dark_launch_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.darkLaunch = new DarkLaunch();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkLaunch;
}

