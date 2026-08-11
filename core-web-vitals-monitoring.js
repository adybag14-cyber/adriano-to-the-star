/**
 * Core Web Vitals Monitoring
 * Comprehensive monitoring of all Core Web Vitals metrics
 */

class CoreWebVitalsMonitoring extends EventTarget {
    constructor() {
        super();
        this.metrics = {
            LCP: null,
            FID: null,
            CLS: null,
            FCP: null,
            TTI: null,
            TBT: null
        };
        this.lastAnalyticsSent = {};
        this.init();
    }
    
    init() {
        this.observeLCP();
        this.observeFID();
        this.observeCLS();
        this.observeFCP();
        this.calculateTTI();
        this.calculateTBT();
        this.trackEvent('cwv_monitoring_initialized');
    }
    
    observeLCP() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.LCP = {
                        value: lastEntry.renderTime || lastEntry.loadTime,
                        element: lastEntry.element?.tagName,
                        url: lastEntry.url
                    };
                    this.reportMetric('LCP', this.metrics.LCP);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP observation not supported:', e);
            }
        }
    }
    
    observeFID() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.processingStart && entry.startTime) {
                            this.metrics.FID = {
                                value: entry.processingStart - entry.startTime,
                                type: entry.name,
                                target: entry.target?.tagName
                            };
                            this.reportMetric('FID', this.metrics.FID);
                        }
                    });
                });
                observer.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID observation not supported:', e);
            }
        }
    }
    
    observeCLS() {
        if ('PerformanceObserver' in window) {
            try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    this.metrics.CLS = { value: clsValue };
                    this.reportMetric('CLS', this.metrics.CLS);
                });
                observer.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('CLS observation not supported:', e);
            }
        }
    }
    
    observeFCP() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            this.metrics.FCP = { value: entry.startTime };
                            this.reportMetric('FCP', this.metrics.FCP);
                        }
                    });
                });
                observer.observe({ entryTypes: ['paint'] });
            } catch (e) {
                console.warn('FCP observation not supported:', e);
            }
        }
    }
    
    calculateTTI() {
        // Calculate TTI (simplified)
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.TTI = {
                    value: navigation.domContentLoadedEventEnd + 5000,
                    domContentLoaded: navigation.domContentLoadedEventEnd
                };
                this.reportMetric('TTI', this.metrics.TTI);
            }
        });
    }
    
    calculateTBT() {
        // Calculate TBT from long tasks
        if ('PerformanceObserver' in window) {
            try {
                let totalBlockingTime = 0;
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.duration > 50) {
                            totalBlockingTime += (entry.duration - 50);
                        }
                    });
                    this.metrics.TBT = { value: totalBlockingTime };
                    this.reportMetric('TBT', this.metrics.TBT);
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.warn('TBT calculation not supported:', e);
            }
        }
    }
    
    reportMetric(name, data) {
        // Send to analytics
        if (window.analytics && window.analytics.track) {
            const now = Date.now();
            const lastSent = this.lastAnalyticsSent[name] || 0;
            if (now - lastSent >= 2000) {
                window.analytics.track('Web Vital', {
                    metric: name,
                    ...data,
                    timestamp: now
                });
                this.lastAnalyticsSent[name] = now;
            }
        }
        
        // Dispatch event for other systems (e.g. alerts)
        try {
            const value = typeof data === 'object' && data !== null && 'value' in data ? data.value : data;
            this.dispatchEvent(new CustomEvent('metric', {
                detail: {
                    name,
                    value
                }
            }));
        } catch (e) {
            console.warn('CoreWebVitalsMonitoring event dispatch failed:', e);
        }
        
        // Check thresholds
        this.checkThresholds(name, data.value);
    }
    
    checkThresholds(metric, value) {
        const thresholds = {
            LCP: { good: 2500, needsImprovement: 4000 },
            FID: { good: 100, needsImprovement: 300 },
            CLS: { good: 0.1, needsImprovement: 0.25 },
            FCP: { good: 1800, needsImprovement: 3000 },
            TTI: { good: 3800, needsImprovement: 7300 },
            TBT: { good: 200, needsImprovement: 600 }
        };
        
        const threshold = thresholds[metric];
        if (threshold && value) {
            let status = 'poor';
            if (value <= threshold.good) {
                status = 'good';
            } else if (value <= threshold.needsImprovement) {
                status = 'needs-improvement';
            }
            
            if (status !== 'good' && window.toastNotificationQueue) {
                window.toastNotificationQueue.show(
                    `${metric} is ${status}: ${value.toFixed(2)}`,
                    status === 'poor' ? 'error' : 'warning'
                );
            }
        }
    }
    
    getMetrics() {
        return { ...this.metrics };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cwv_monitoring_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

function initCoreWebVitalsMonitoring() {
    if (window.ENABLE_WEB_VITALS === false) {
        console.log('Core Web Vitals monitoring disabled via ENABLE_WEB_VITALS flag');
        return;
    }
    window.coreWebVitalsMonitoring = new CoreWebVitalsMonitoring();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoreWebVitalsMonitoring);
} else {
    initCoreWebVitalsMonitoring();
}

