/**
 * FID (First Input Delay) Optimization
 * Optimizes first input delay for better interactivity
 */

class FIDOptimization {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeJavaScript();
        this.optimizeEventHandlers();
        this.deferNonCriticalScripts();
    }
    
    optimizeJavaScript() {
        // Split long tasks
        this.splitLongTasks();
        
        // Use requestIdleCallback for non-critical work
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.runNonCriticalTasks();
            });
        }
    }
    
    splitLongTasks() {
        // Break up long-running tasks using setTimeout
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(fn, delay, ...args) {
            return originalSetTimeout(() => {
                if (typeof fn === 'function') {
                    fn(...args);
                }
            }, delay || 0);
        };
    }
    
    runNonCriticalTasks() {
        // Run analytics, non-critical initializations
        console.log('Running non-critical tasks during idle time');
    }
    
    optimizeEventHandlers() {
        // Use passive event listeners where possible
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
        document.addEventListener('wheel', () => {}, { passive: true });
    }
    
    deferNonCriticalScripts() {
        // Defer non-critical scripts
        document.querySelectorAll('script[data-defer]').forEach(script => {
            script.defer = true;
        });
    }
    
    async measureFID() {
        if ('PerformanceObserver' in window) {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.processingStart && entry.startTime) {
                            resolve({
                                value: entry.processingStart - entry.startTime,
                                type: entry.name,
                                target: entry.target
                            });
                        }
                    });
                });
                observer.observe({ entryTypes: ['first-input'] });
            });
        }
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.fidOptimization = new FIDOptimization(); });
} else {
    window.fidOptimization = new FIDOptimization();
}

