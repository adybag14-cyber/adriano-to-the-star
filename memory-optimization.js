/**
 * Memory Optimization
 * Memory usage optimization and management
 */

class MemoryOptimization {
    constructor() {
        this.monitors = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_em_or_yo_pt_im_iz_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_em_or_yo_pt_im_iz_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    startMonitoring(monitorId, target) {
        const monitor = {
            id: monitorId,
            target,
            measurements: [],
            status: 'active',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        console.log(`Memory monitoring started: ${monitorId}`);
        return monitor;
    }

    recordMeasurement(monitorId, measurement) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }
        
        const measurementData = {
            timestamp: new Date(),
            heapUsed: measurement.heapUsed || 0,
            heapTotal: measurement.heapTotal || 0,
            external: measurement.external || 0,
            rss: measurement.rss || 0
        };
        
        monitor.measurements.push(measurementData);
        
        return measurementData;
    }

    analyzeMemoryUsage(monitorId) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }
        
        if (monitor.measurements.length === 0) {
            return { analysis: 'insufficient_data' };
        }
        
        const measurements = monitor.measurements;
        const avgHeapUsed = measurements.reduce((sum, m) => sum + m.heapUsed, 0) / measurements.length;
        const maxHeapUsed = Math.max(...measurements.map(m => m.heapUsed));
        const minHeapUsed = Math.min(...measurements.map(m => m.heapUsed));
        
        const trend = this.calculateTrend(measurements.map(m => m.heapUsed));
        
        const analysis = {
            id: `analysis_${Date.now()}`,
            monitorId,
            avgHeapUsed,
            maxHeapUsed,
            minHeapUsed,
            trend,
            recommendations: this.generateRecommendations(avgHeapUsed, maxHeapUsed),
            analyzedAt: new Date(),
            createdAt: new Date()
        };
        
        this.analyses.set(analysis.id, analysis);
        
        return analysis;
    }

    calculateTrend(values) {
        if (values.length < 2) return 'insufficient_data';
        
        const first = values[0];
        const last = values[values.length - 1];
        const change = last - first;
        const percentChange = first > 0 ? (change / first) * 100 : 0;
        
        if (percentChange > 10) return 'increasing';
        if (percentChange < -10) return 'decreasing';
        return 'stable';
    }

    generateRecommendations(avgHeapUsed, maxHeapUsed) {
        const recommendations = [];
        
        if (maxHeapUsed > 100 * 1024 * 1024) {
            recommendations.push('Consider implementing object pooling');
        }
        
        if (avgHeapUsed > 50 * 1024 * 1024) {
            recommendations.push('Review memory-intensive operations');
        }
        
        return recommendations;
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.memoryOptimization = new MemoryOptimization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryOptimization;
}


