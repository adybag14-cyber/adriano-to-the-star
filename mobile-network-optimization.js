class MobileNetworkOptimization {
    constructor() {
        this.connection = null;
        this.init();
    }

    init() {
        if (typeof navigator !== 'undefined' && navigator.connection) {
            this.connection = navigator.connection;
            this.monitorConnection();
            console.log('Mobile Network Optimization initialized');
        }
    }

    monitorConnection() {
        this.connection.addEventListener('change', () => {
            const info = {
                type: this.connection.type,
                effectiveType: this.connection.effectiveType,
                downlink: this.connection.downlink,
                rtt: this.connection.rtt,
                saveData: this.connection.saveData
            };
            console.log('Network change detected:', info);
            this.trackEvent('network_change', info);
        });
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`network:${eventName}`, 1, {
                    source: 'mobile-network-optimization',
                    ...data
                });
            } catch (e) {
                // Ignore
            }
        }
    }
}
window.MobileNetworkOptimization = MobileNetworkOptimization;
if (typeof window !== 'undefined') {
    window.mobileNetworkOptimization = new MobileNetworkOptimization();
}
