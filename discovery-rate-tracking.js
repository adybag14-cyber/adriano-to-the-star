/**
 * Discovery Rate Tracking System
 * Tracks planet discovery rates and patterns
 * 
 * Features:
 * - Discovery timeline
 * - Rate calculations
 * - Predictions
 * - Historical data
 */

class DiscoveryRateTracking {
    constructor() {
        this.discoveries = [];
        this.rates = {
            daily: 0,
            weekly: 0,
            monthly: 0,
            yearly: 0
        };
        this.init();
    }
    
    init() {
        this.loadDiscoveries();
        this.calculateRates();
        this.startTracking();
        console.log('🔭 Discovery Rate Tracking initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_is_co_ve_ry_ra_te_tr_ac_ki_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    async loadDiscoveries() {
        try {
            // Load planet data with discovery dates
            // This would typically come from your planet database
            const sampleData = [
                { id: '1', discovery_date: '2024-01-15' },
                { id: '2', discovery_date: '2024-01-20' },
                { id: '3', discovery_date: '2024-02-01' }
            ];
            
            this.discoveries = sampleData.map(d => ({
                ...d,
                date: new Date(d.discovery_date)
            }));
        } catch (e) {
            console.warn('Failed to load discoveries:', e);
        }
    }
    
    calculateRates() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 86400000);
        const weekAgo = new Date(now.getTime() - 604800000);
        const monthAgo = new Date(now.getTime() - 2592000000);
        const yearAgo = new Date(now.getTime() - 31536000000);
        
        this.rates.daily = this.discoveries.filter(d => d.date >= dayAgo).length;
        this.rates.weekly = this.discoveries.filter(d => d.date >= weekAgo).length;
        this.rates.monthly = this.discoveries.filter(d => d.date >= monthAgo).length;
        this.rates.yearly = this.discoveries.filter(d => d.date >= yearAgo).length;
    }
    
    startTracking() {
        // Recalculate rates every hour
        setInterval(() => {
            this.calculateRates();
        }, 3600000);
    }
    
    getDiscoveryRate(period = 'monthly') {
        return this.rates[period] || 0;
    }
    
    predictFutureDiscoveries(days = 30) {
        const avgDaily = this.rates.daily;
        return Math.round(avgDaily * days);
    }
    
    getDiscoveryTimeline() {
        return this.discoveries
            .sort((a, b) => b.date - a.date)
            .slice(0, 100);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.discoveryRateTracking = new DiscoveryRateTracking();
    });
} else {
    window.discoveryRateTracking = new DiscoveryRateTracking();
}
