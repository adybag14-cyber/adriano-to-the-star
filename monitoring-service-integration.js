class MonitoringServiceIntegration {
    constructor() {
        this.services = new Map();
    }
    register(name, config) {
        this.services.set(name, { ...config, registeredAt: new Date() });
        return this.services.get(name);
    }
    async sendMetric(name, metric, value, tags = {}) {
        if (!this.services.has(name)) throw new Error('Service not registered');
        return { success: true, metric, value, tags, sentAt: new Date() };
    }
}
const monitoringIntegration = new MonitoringServiceIntegration();
if (typeof window !== 'undefined') {
    window.monitoringIntegration = monitoringIntegration;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonitoringServiceIntegration;
}
