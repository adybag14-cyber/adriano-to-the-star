/**
 * Core Web Vitals Tracking
 * Tracks LCP, FID, CLS, and other Web Vitals metrics
 */

class CoreWebVitalsTracking {
    constructor() {
        this.metrics = {
            LCP: null,
            FID: null,
            CLS: null,
            FCP: null,
            TTFB: null
        };
        this.init();
    }
    
    init() {
        if ('PerformanceObserver' in window) {
            this.observeLCP();
            this.observeFID();
            this.observeCLS();
            this.observeFCP();
            this.observeTTFB();
        }
        this.trackEvent('cwv_tracking_initialized');
    }
    
    observeLCP() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
                this.reportMetric('LCP', this.metrics.LCP);
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            console.warn('LCP observation not supported:', e);
        }
    }
    
    observeFID() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.processingStart && entry.startTime) {
                        this.metrics.FID = entry.processingStart - entry.startTime;
                        this.reportMetric('FID', this.metrics.FID);
                    }
                });
            });
            observer.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.warn('FID observation not supported:', e);
        }
    }
    
    observeCLS() {
        try {
            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.metrics.CLS = clsValue;
                this.reportMetric('CLS', this.metrics.CLS);
            });
            observer.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
            console.warn('CLS observation not supported:', e);
        }
    }
    
    observeFCP() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.FCP = entry.startTime;
                        this.reportMetric('FCP', this.metrics.FCP);
                    }
                });
            });
            observer.observe({ entryTypes: ['paint'] });
        } catch (e) {
            console.warn('FCP observation not supported:', e);
        }
    }
    
    observeTTFB() {
        try {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.TTFB = navigation.responseStart - navigation.requestStart;
                this.reportMetric('TTFB', this.metrics.TTFB);
            }
        } catch (e) {
            console.warn('TTFB observation not supported:', e);
        }
    }
    
    reportMetric(name, value) {
        // Send to analytics
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Web Vital', {
                metric: name,
                value: value,
                timestamp: Date.now()
            });
        }
        
        // Log for debugging
        console.log(`Web Vital ${name}:`, value);
    }
    
    getMetrics() {
        return { ...this.metrics };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cwv_tracking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.coreWebVitalsTracking = new CoreWebVitalsTracking(); });
} else {
    window.coreWebVitalsTracking = new CoreWebVitalsTracking();
}

