/**
 * Memory Leak Detection
 * Monitors and detects memory leaks
 */

class MemoryLeakDetection {
    constructor() {
        this.baseline = null;
        this.checkInterval = null;
        this.leakThreshold = 0.1; // 10% increase
        this.init();
    }
    
    init() {
        if (performance.memory) {
            this.startMonitoring();
        } else {
            console.warn('Performance.memory API not available');
        }
    }
    
    startMonitoring() {
        // Set baseline after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.baseline = this.getMemoryUsage();
                this.startPeriodicChecks();
            }, 5000);
        });
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
        }
        return null;
    }
    
    startPeriodicChecks() {
        // Check every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkForLeaks();
        }, 30000);
    }
    
    checkForLeaks() {
        const current = this.getMemoryUsage();
        if (!current || !this.baseline) return;
        
        const increase = (current.used - this.baseline.used) / this.baseline.used;
        
        if (increase > this.leakThreshold) {
            this.detectLeak(current, increase);
        }
    }
    
    detectLeak(current, increase) {
        console.warn('Potential memory leak detected:', {
            baseline: this.baseline.used,
            current: current.used,
            increase: (increase * 100).toFixed(2) + '%'
        });
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                `Memory usage increased by ${(increase * 100).toFixed(2)}%`,
                'warning'
            );
        }
        
        // Analyze potential causes
        this.analyzePotentialCauses();
    }
    
    analyzePotentialCauses() {
        const issues = [];
        
        // Check for event listeners
        const eventListeners = this.countEventListeners();
        if (eventListeners > 100) {
            issues.push(`High number of event listeners: ${eventListeners}`);
        }
        
        // Check for timers
        const timers = this.countTimers();
        if (timers > 50) {
            issues.push(`High number of timers: ${timers}`);
        }
        
        // Check DOM nodes
        const domNodes = document.querySelectorAll('*').length;
        if (domNodes > 5000) {
            issues.push(`High number of DOM nodes: ${domNodes}`);
        }
        
        if (issues.length > 0) {
            console.warn('Potential leak causes:', issues);
        }
    }
    
    countEventListeners() {
        // Approximate count - not exact
        let count = 0;
        document.querySelectorAll('*').forEach(el => {
            if (el.onclick || el.onmouseover || el.onchange) {
                count++;
            }
        });
        return count;
    }
    
    countTimers() {
        // This is an approximation
        return 0; // Would need to track setInterval/setTimeout calls
    }
    
    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
    
    forceGarbageCollection() {
        // Force GC if available (Chrome DevTools)
        if (window.gc) {
            window.gc();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.memoryLeakDetection = new MemoryLeakDetection(); });
} else {
    window.memoryLeakDetection = new MemoryLeakDetection();
}
