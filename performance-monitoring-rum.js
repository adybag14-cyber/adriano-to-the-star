/**
 * Performance Monitoring and Real User Monitoring (RUM)
 * 
 * Adds performance monitoring and real user monitoring (RUM).
 * 
 * @module PerformanceMonitoringRUM
 * @version 1.0.0
 * @author Adriano To The Star
 */

class PerformanceMonitoringRUM {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.endpoint = null;
        this.isInitialized = false;
        this.config = null;
        this.isDisabled = window.ENABLE_RUM === false;
    }

    /**
     * Initialize performance monitoring
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isDisabled) {
            console.log('PerformanceMonitoringRUM disabled via ENABLE_RUM flag');
            return;
        }
        if (this.isInitialized) {
            console.warn('PerformanceMonitoringRUM already initialized');
            return;
        }

        const globalConfig = window.PERFORMANCE_MONITORING_RUM_CONFIG || {};
        this.config = Object.assign({
            enableNavigation: true,
            enableResources: true,
            enablePaint: true,
            enableLongTasks: true,
            enableMemory: true,
            enableWebVitals: true,
            endpoint: null
        }, globalConfig, options);

        this.endpoint = this.config.endpoint;

        if (this.config.enableNavigation) {
            this.collectNavigationTiming();
        }
        if (this.config.enableResources) {
            this.collectResourceTiming();
        }
        if (this.config.enablePaint) {
            this.collectPaintTiming();
        }
        if (this.config.enableLongTasks) {
            this.collectLongTasks();
        }
        if (this.config.enableMemory) {
            this.collectMemoryUsage();
        }
        if (this.config.enableWebVitals && !window.coreWebVitalsMonitoring) {
            this.collectWebVitals();
        }
        this.setupPerformanceObserver();
        
        this.isInitialized = true;
        console.log('✅ Performance Monitoring RUM initialized');
    }

    /**
     * Collect navigation timing
     * @private
     */
    collectNavigationTiming() {
        if (!window.performance || !window.performance.timing) {
            return;
        }

        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = window.performance.timing;
                const navigation = {
                    dns: timing.domainLookupEnd - timing.domainLookupStart,
                    tcp: timing.connectEnd - timing.connectStart,
                    request: timing.responseStart - timing.requestStart,
                    response: timing.responseEnd - timing.responseStart,
                    domLoading: timing.domContentLoadedEventStart - timing.domLoading,
                    domInteractive: timing.domInteractive - timing.domLoading,
                    domComplete: timing.domComplete - timing.domLoading,
                    load: timing.loadEventEnd - timing.navigationStart
                };

                this.recordMetric('navigation_timing', navigation);
            }, 0);
        });
    }

    /**
     * Collect resource timing
     * @private
     */
    collectResourceTiming() {
        if (!window.performance || !window.performance.getEntriesByType) {
            return;
        }

        window.addEventListener('load', () => {
            setTimeout(() => {
                const resources = window.performance.getEntriesByType('resource');
                const resourceTiming = resources.map(resource => ({
                    name: resource.name,
                    type: resource.initiatorType,
                    duration: resource.duration,
                    size: resource.transferSize,
                    startTime: resource.startTime
                }));

                this.recordMetric('resource_timing', resourceTiming);
            }, 0);
        });
    }

    /**
     * Collect paint timing
     * @private
     */
    collectPaintTiming() {
        if (!window.performance || !window.performance.getEntriesByType) {
            return;
        }

        window.addEventListener('load', () => {
            setTimeout(() => {
                const paintEntries = window.performance.getEntriesByType('paint');
                const paintTiming = {};

                paintEntries.forEach(entry => {
                    paintTiming[entry.name] = entry.startTime;
                });

                this.recordMetric('paint_timing', paintTiming);
            }, 0);
        });
    }

    /**
     * Collect long tasks
     * @private
     */
    collectLongTasks() {
        if (!('PerformanceObserver' in window)) {
            return;
        }

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        this.recordMetric('long_task', {
                            duration: entry.duration,
                            startTime: entry.startTime,
                            name: entry.name
                        });
                    }
                });
            });

            observer.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', observer);
        } catch (e) {
            console.warn('Long task monitoring not supported:', e);
        }
    }

    /**
     * Collect memory usage
     * @private
     */
    collectMemoryUsage() {
        if (!performance.memory) {
            return;
        }

        setInterval(() => {
            const memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };

            this.recordMetric('memory_usage', memory);
        }, 30000); // Every 30 seconds
    }

    /**
     * Collect Web Vitals
     * @private
     */
    collectWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.recordMetric('lcp', lastEntry.renderTime || lastEntry.loadTime);
                });

                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.set('lcp', observer);
            } catch (e) {
                console.warn('LCP monitoring not supported:', e);
            }
        }

        // First Input Delay (FID)
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.recordMetric('fid', entry.processingStart - entry.startTime);
                    });
                });

                observer.observe({ entryTypes: ['first-input'] });
                this.observers.set('fid', observer);
            } catch (e) {
                console.warn('FID monitoring not supported:', e);
            }
        }

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    this.recordMetric('cls', clsValue);
                });

                observer.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('cls', observer);
            } catch (e) {
                console.warn('CLS monitoring not supported:', e);
            }
        }
    }

    /**
     * Set up performance observer
     * @private
     */
    setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) {
            return;
        }

        // Observe all performance entries
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    // Track slow resources
                    if (entry.entryType === 'resource' && entry.duration > 1000) {
                        this.recordMetric('slow_resource', {
                            name: entry.name,
                            duration: entry.duration
                        });
                    }
                });
            });

            observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] });
            this.observers.set('general', observer);
        } catch (e) {
            console.warn('Performance observer setup failed:', e);
        }
    }

    /**
     * Record metric
     * @private
     * @param {string} name - Metric name
     * @param {*} value - Metric value
     */
    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const metric = {
            name,
            value,
            timestamp: Date.now(),
            url: window.location.href
        };

        this.metrics.get(name).push(metric);

        // Send to endpoint if configured
        if (this.endpoint) {
            this.sendMetric(metric);
        }
    }

    /**
     * Send metric
     * @private
     * @param {Object} metric - Metric object
     */
    async sendMetric(metric) {
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metric)
            });
        } catch (error) {
            console.warn('Failed to send performance metric:', error);
        }
    }

    /**
     * Get metrics
     * @public
     * @param {string} name - Metric name (optional)
     * @returns {*} Metrics
     */
    getMetrics(name = null) {
        if (name) {
            return this.metrics.get(name) || [];
        }
        return Object.fromEntries(this.metrics);
    }
}

function initPerformanceMonitoringRUM() {
    if (window.ENABLE_RUM === false) {
        console.log('PerformanceMonitoringRUM disabled globally via ENABLE_RUM flag');
        return;
    }
    window.PerformanceMonitoringRUM = PerformanceMonitoringRUM;
    if (!window.performanceMonitor) {
        window.performanceMonitor = new PerformanceMonitoringRUM();
    }
    window.performanceMonitor.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformanceMonitoringRUM);
} else {
    initPerformanceMonitoringRUM();
}

