/**
 * Planet Discovery Performance Monitoring Enhanced
 * Enhanced performance monitoring with detailed metrics
 */

class PlanetDiscoveryPerformanceMonitoringEnhanced {
    constructor() {
        this.metrics = {
            pageLoad: null,
            domContentLoaded: null,
            firstPaint: null,
            firstContentfulPaint: null,
            largestContentfulPaint: null,
            firstInputDelay: null,
            cumulativeLayoutShift: null,
            totalBlockingTime: null,
            timeToInteractive: null
        };
        this.observers = [];
        this.init();
    }

    init() {
        this.measurePageLoad();
        this.observeWebVitals();
        this.observeResourceTiming();
        this.observeLongTasks();
        console.log('⚡ Enhanced performance monitoring initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_pe_rf_or_ma_nc_em_on_it_or_in_ge_nh_an_ce_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    measurePageLoad() {
        window.addEventListener('load', () => {
            this.metrics.pageLoad = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.metrics.domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
            
            // First Paint
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                if (entry.name === 'first-paint') {
                    this.metrics.firstPaint = entry.startTime;
                }
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                }
            });

            this.reportMetrics();
        });
    }

    observeWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(lcpObserver);
            } catch (e) {
                console.warn('LCP observer not supported:', e);
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.processingStart - entry.startTime > 0) {
                            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.push(fidObserver);
            } catch (e) {
                console.warn('FID observer not supported:', e);
            }

            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    this.metrics.cumulativeLayoutShift = clsValue;
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(clsObserver);
            } catch (e) {
                console.warn('CLS observer not supported:', e);
            }
        }
    }

    observeResourceTiming() {
        if ('PerformanceObserver' in window) {
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.duration > 1000) { // Log slow resources (>1s)
                            console.warn('Slow resource:', {
                                name: entry.name,
                                duration: entry.duration,
                                size: entry.transferSize
                            });
                        }
                    });
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (e) {
                console.warn('Resource observer not supported:', e);
            }
        }
    }

    observeLongTasks() {
        if ('PerformanceObserver' in window) {
            try {
                const blockingTime = 0;
                const longTaskObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        const blockingTime = entry.duration - 50; // Tasks >50ms are blocking
                        if (blockingTime > 0) {
                            blockingTime += blockingTime;
                        }
                    });
                    this.metrics.totalBlockingTime = blockingTime;
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.push(longTaskObserver);
            } catch (e) {
                console.warn('Long task observer not supported:', e);
            }
        }
    }

    calculateTimeToInteractive() {
        // Estimate TTI as when both DOM and resources are loaded
        const domReady = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        const resourcesLoaded = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.metrics.timeToInteractive = Math.max(domReady, resourcesLoaded);
    }

    getMetrics() {
        return { ...this.metrics };
    }

    reportMetrics() {
        this.calculateTimeToInteractive();
        
        const metrics = this.getMetrics();
        
        // Log metrics
        console.log('Performance Metrics:', metrics);

        // Send to analytics
        if (typeof planetDiscoveryAnalyticsTracking !== 'undefined') {
            planetDiscoveryAnalyticsTracking.track('performance_metrics', metrics);
        }

        // Send to Supabase
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                supabase
                    .from('performance_metrics')
                    .insert({
                        metrics: metrics,
                        url: window.location.href,
                        user_agent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    });
            } catch (error) {
                console.error('Error reporting performance metrics:', error);
            }
        }
    }

    renderPerformanceDashboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const metrics = this.getMetrics();

        container.innerHTML = `
            <div class="performance-dashboard" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">⚡ Performance Metrics</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    ${this.renderMetric('Page Load', metrics.pageLoad, 'ms', 3000)}
                    ${this.renderMetric('DOM Content Loaded', metrics.domContentLoaded, 'ms', 2000)}
                    ${this.renderMetric('First Paint', metrics.firstPaint, 'ms', 2000)}
                    ${this.renderMetric('First Contentful Paint', metrics.firstContentfulPaint, 'ms', 2000)}
                    ${this.renderMetric('Largest Contentful Paint', metrics.largestContentfulPaint, 'ms', 2500)}
                    ${this.renderMetric('First Input Delay', metrics.firstInputDelay, 'ms', 100)}
                    ${this.renderMetric('Cumulative Layout Shift', metrics.cumulativeLayoutShift, '', 0.1)}
                    ${this.renderMetric('Total Blocking Time', metrics.totalBlockingTime, 'ms', 300)}
                    ${this.renderMetric('Time to Interactive', metrics.timeToInteractive, 'ms', 5000)}
                </div>
            </div>
        `;
    }

    renderMetric(name, value, unit, threshold) {
        if (value === null || value === undefined) {
            value = 'N/A';
            unit = '';
        } else {
            value = Math.round(value);
        }

        const isGood = value === 'N/A' || value <= threshold;
        const color = isGood ? '#4ade80' : '#ef4444';

        return `
            <div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 10px; border-left: 4px solid ${color};">
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.25rem;">${name}</div>
                <div style="color: ${color}; font-size: 1.5rem; font-weight: bold;">
                    ${value}${unit}
                </div>
            </div>
        `;
    }

    cleanup() {
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (e) {
                console.warn('Error disconnecting observer:', e);
            }
        });
        this.observers = [];
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryPerformanceMonitoringEnhanced = new PlanetDiscoveryPerformanceMonitoringEnhanced();
}

