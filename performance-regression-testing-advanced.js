/**
 * Performance Regression Testing (Advanced)
 * Advanced performance regression detection
 */

class PerformanceRegressionTestingAdvanced {
    constructor() {
        this.baseline = null;
        this.init();
    }
    
    init() {
        this.loadBaseline();
        this.startMonitoring();
    }
    
    loadBaseline() {
        try {
            const stored = localStorage.getItem('perf_baseline');
            this.baseline = stored ? JSON.parse(stored) : null;
        } catch (e) {
            this.baseline = null;
        }
    }
    
    startMonitoring() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectMetrics();
                this.compareWithBaseline();
            }, 3000);
        });
    }
    
    collectMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
            loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : null,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
            firstPaint: this.getFirstPaint(),
            timestamp: Date.now()
        };
    }
    
    getFirstPaint() {
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(p => p.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }
    
    compareWithBaseline() {
        const current = this.collectMetrics();
        
        if (!this.baseline) {
            this.saveBaseline(current);
            return;
        }
        
        const regressions = [];
        
        Object.keys(current).forEach(metric => {
            if (current[metric] && this.baseline[metric]) {
                const change = ((current[metric] - this.baseline[metric]) / this.baseline[metric]) * 100;
                if (change > 20) {
                    regressions.push({
                        metric,
                        current: current[metric],
                        baseline: this.baseline[metric],
                        change: change.toFixed(2) + '%'
                    });
                }
            }
        });
        
        if (regressions.length > 0) {
            this.alertRegressions(regressions);
        } else {
            this.saveBaseline(current);
        }
    }
    
    saveBaseline(metrics) {
        try {
            localStorage.setItem('perf_baseline', JSON.stringify(metrics));
        } catch (e) {
            console.warn('Could not save baseline:', e);
        }
    }
    
    alertRegressions(regressions) {
        console.warn('Performance regressions detected:', regressions);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.performanceRegressionTestingAdvanced = new PerformanceRegressionTestingAdvanced(); });
} else {
    window.performanceRegressionTestingAdvanced = new PerformanceRegressionTestingAdvanced();
}

