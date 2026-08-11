/**
 * Performance Budgets
 * Sets and monitors performance budgets
 */

class PerformanceBudgetsSystem {
    constructor() {
        this.budgets = {
            fcp: 1800, // First Contentful Paint (ms)
            lcp: 2500, // Largest Contentful Paint (ms)
            fid: 100,  // First Input Delay (ms)
            cls: 0.1,  // Cumulative Layout Shift
            tti: 3800, // Time to Interactive (ms)
            bundleSize: 500 * 1024 // 500KB
        };
        this.lastBreaches = [];
        this.init();
    }
    
    init() {
        this.monitorPerformance();
    }
    
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.checkBudget(entry);
                }
            });
            
            observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
        }
    }
    
    checkBudget(entry) {
        let metricKey = null;
        let value = null;
        
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            metricKey = 'fcp';
            value = entry.startTime;
        } else if (entry.entryType === 'largest-contentful-paint') {
            metricKey = 'lcp';
            value = entry.renderTime || entry.loadTime || entry.startTime;
        } else if (entry.entryType === 'first-input') {
            metricKey = 'fid';
            if (entry.processingStart && entry.startTime) {
                value = entry.processingStart - entry.startTime;
            }
        } else if (entry.entryType === 'layout-shift') {
            if (!entry.hadRecentInput) {
                metricKey = 'cls';
                value = entry.value;
            }
        }
        
        const budget = metricKey ? this.budgets[metricKey] : null;
        if (!budget || value == null) {
            return;
        }
        
        if (value > budget) {
            console.warn(`Performance budget exceeded for ${metricKey}: ${value} (budget: ${budget})`);
            const breach = {
                metric: metricKey,
                value,
                budget,
                url: window.location.href,
                timestamp: Date.now()
            };
            this.lastBreaches.push(breach);
            if (this.lastBreaches.length > 20) {
                this.lastBreaches.shift();
            }
            window.performanceBudgetBreaches = window.performanceBudgetBreaches || [];
            window.performanceBudgetBreaches.push(breach);
            if (window.performanceBudgetBreaches.length > 50) {
                window.performanceBudgetBreaches.shift();
            }
            if (window.analytics && window.analytics.track) {
                window.analytics.track('Performance Budget Exceeded', breach);
            }
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.performanceBudgetsSystem = new PerformanceBudgetsSystem(); });
} else {
    window.performanceBudgetsSystem = new PerformanceBudgetsSystem();
}


