/**
 * Real User Monitoring (RUM)
 * Real user monitoring for performance insights
 */

class RealUserMonitoringRUM {
    constructor() {
        this.metrics = {};
        this.init();
    }
    
    init() {
        this.collectRUMData();
    }
    
    collectRUMData() {
        // Collect real user metrics
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectMetrics();
            }, 3000);
        });
    }
    
    collectMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        this.metrics = {
            pageLoad: navigation ? navigation.loadEventEnd - navigation.navigationStart : null,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || null,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null,
            connection: this.getConnectionInfo(),
            device: this.getDeviceInfo(),
            timestamp: Date.now()
        };
        
        this.sendRUMData();
    }
    
    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt
            };
        }
        return null;
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    }
    
    sendRUMData() {
        // Send RUM data to analytics
        if (window.analytics && window.analytics.track) {
            window.analytics.track('RUM Metrics', this.metrics);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.realUserMonitoringRUM = new RealUserMonitoringRUM(); });
} else {
    window.realUserMonitoringRUM = new RealUserMonitoringRUM();
}

