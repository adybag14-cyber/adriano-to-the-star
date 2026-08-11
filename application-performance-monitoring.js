/**
 * Application Performance Monitoring
 * APM system
 */

class ApplicationPerformanceMonitoring {
    constructor() {
        this.monitors = new Map();
        this.transactions = new Map();
        this.traces = new Map();
        this.init();
    }

    init() {
        this.trackEvent('apm_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`apm_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            name: monitorData.name || monitorId,
            applicationId: monitorData.applicationId || '',
            status: 'active',
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        return monitor;
    }

    async trackTransaction(transactionId, transactionData) {
        const transaction = {
            id: transactionId,
            ...transactionData,
            name: transactionData.name || transactionId,
            startTime: new Date(),
            status: 'running'
        };

        await this.completeTransaction(transaction);
        this.transactions.set(transactionId, transaction);
        return transaction;
    }

    async completeTransaction(transaction) {
        await new Promise(resolve => setTimeout(resolve, 100));
        transaction.endTime = new Date();
        transaction.duration = transaction.endTime - transaction.startTime;
        transaction.status = 'completed';
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }

    getAllMonitors() {
        return Array.from(this.monitors.values());
    }
}

module.exports = ApplicationPerformanceMonitoring;
