/**
 * Performance Regression Testing
 * Monitors and alerts on performance regressions
 */

class PerformanceRegressionTesting {
    constructor() {
        this.baseline = this.loadBaseline();
        this.currentMetrics = {};
        this.thresholds = {
            LCP: 2500, // 2.5s
            FID: 100,  // 100ms
            CLS: 0.1,  // 0.1
            FCP: 1800, // 1.8s
            TTFB: 800  // 800ms
        };
        this.init();
    }
    
    init() {
        this.startMonitoring();
    }
    
    loadBaseline() {
        try {
            const stored = localStorage.getItem('perf_baseline');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }
    
    saveBaseline(metrics) {
        try {
            localStorage.setItem('perf_baseline', JSON.stringify(metrics));
        } catch (e) {
            console.warn('Could not save baseline:', e);
        }
    }
    
    startMonitoring() {
        // Wait for page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectMetrics();
                this.compareWithBaseline();
            }, 3000);
        });
    }
    
    collectMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        this.currentMetrics = {
            TTFB: navigation ? navigation.responseStart - navigation.requestStart : null,
            FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null,
            LCP: this.getLCP(),
            FID: this.getFID(),
            CLS: this.getCLS(),
            DOMContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
            Load: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null
        };
    }
    
    getLCP() {
        // Simplified LCP - would use PerformanceObserver in production
        const images = document.querySelectorAll('img');
        let maxTime = 0;
        images.forEach(img => {
            if (img.complete) {
                const rect = img.getBoundingClientRect();
                if (rect.width * rect.height > maxTime) {
                    maxTime = performance.now();
                }
            }
        });
        return maxTime;
    }
    
    getFID() {
        // Would use PerformanceObserver in production
        return null;
    }
    
    getCLS() {
        // Would use PerformanceObserver in production
        return null;
    }
    
    compareWithBaseline() {
        if (!this.baseline) {
            this.saveBaseline(this.currentMetrics);
            return;
        }
        
        const regressions = [];
        
        Object.keys(this.currentMetrics).forEach(metric => {
            if (this.currentMetrics[metric] && this.baseline[metric]) {
                const change = ((this.currentMetrics[metric] - this.baseline[metric]) / this.baseline[metric]) * 100;
                const threshold = this.thresholds[metric];
                
                if (change > 20 || (threshold && this.currentMetrics[metric] > threshold)) {
                    regressions.push({
                        metric,
                        current: this.currentMetrics[metric],
                        baseline: this.baseline[metric],
                        change: change.toFixed(2) + '%',
                        threshold: threshold
                    });
                }
            }
        });
        
        if (regressions.length > 0) {
            this.alertRegressions(regressions);
        } else {
            // Update baseline if no regressions
            this.saveBaseline(this.currentMetrics);
        }
    }
    
    alertRegressions(regressions) {
        console.warn('Performance regressions detected:', regressions);
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                `Performance regression detected: ${regressions.length} metric(s)`,
                'warning'
            );
        }
        
        // Send to monitoring service
        if (window.analytics) {
            window.analytics.track('Performance Regression', {
                regressions: regressions,
                timestamp: Date.now()
            });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.performanceRegressionTesting = new PerformanceRegressionTesting(); });
} else {
    window.performanceRegressionTesting = new PerformanceRegressionTesting();
}

