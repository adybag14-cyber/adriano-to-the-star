/**
 * TBT (Total Blocking Time) Optimization
 * Reduces total blocking time for better responsiveness
 */

class TBTOptimization {
    constructor() {
        this.init();
    }
    
    init() {
        this.splitLongTasks();
        this.optimizeJavaScriptExecution();
        this.useWebWorkers();
    }
    
    splitLongTasks() {
        // Break up tasks longer than 50ms
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(fn, delay, ...args) {
            if (delay === 0) {
                // Use MessageChannel for immediate tasks
                const channel = new MessageChannel();
                channel.port1.onmessage = () => fn(...args);
                channel.port2.postMessage(null);
                return channel.port1;
            }
            return originalSetTimeout(fn, delay, ...args);
        };
    }
    
    optimizeJavaScriptExecution() {
        // Defer non-critical JavaScript
        this.deferNonCriticalScripts();
        
        // Use async/defer attributes
        document.querySelectorAll('script:not([async]):not([defer])').forEach(script => {
            if (!script.hasAttribute('data-critical')) {
                script.defer = true;
            }
        });
    }
    
    deferNonCriticalScripts() {
        // Identify and defer non-critical scripts
        const nonCritical = document.querySelectorAll('script[data-non-critical]');
        nonCritical.forEach(script => {
            script.defer = true;
        });
    }
    
    useWebWorkers() {
        // Offload heavy computations to web workers
        if (window.Worker) {
            this.setupWorkerForHeavyTasks();
        }
    }
    
    setupWorkerForHeavyTasks() {
        // Setup web worker for data processing
        const worker = new Worker('/workers/data-processor.js');
        // Handle worker messages
    }
    
    async measureTBT() {
        // TBT is the sum of all blocking time between FCP and TTI
        if ('PerformanceObserver' in window) {
            let totalBlockingTime = 0;
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.duration > 50) {
                            // Blocking time is duration - 50ms
                            totalBlockingTime += (entry.duration - 50);
                        }
                    });
                    resolve({ value: totalBlockingTime });
                });
                observer.observe({ entryTypes: ['longtask'] });
            });
        }
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.tbtOptimization = new TBTOptimization(); });
} else {
    window.tbtOptimization = new TBTOptimization();
}

