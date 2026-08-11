/**
 * Performance Profiling Dashboard
 * Real-time performance metrics dashboard
 */

class PerformanceProfilingDashboard {
    constructor() {
        this.metrics = {
            timing: {},
            navigation: {},
            resources: [],
            paint: {}
        };
        this.init();
    }
    
    init() {
        this.collectMetrics();
        this.setupDashboard();
    }
    
    collectMetrics() {
        // Navigation timing
        if (performance.getEntriesByType) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.timing = {
                    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcp: navigation.connectEnd - navigation.connectStart,
                    request: navigation.responseStart - navigation.requestStart,
                    response: navigation.responseEnd - navigation.responseStart,
                    dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    load: navigation.loadEventEnd - navigation.loadEventStart,
                    total: navigation.loadEventEnd - navigation.navigationStart
                };
            }
            
            // Resource timing
            this.metrics.resources = performance.getEntriesByType('resource').map(entry => ({
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: this.getResourceType(entry.name)
            }));
            
            // Paint timing
            const paint = performance.getEntriesByType('paint');
            paint.forEach(entry => {
                this.metrics.paint[entry.name] = entry.startTime;
            });
        }
    }
    
    getResourceType(url) {
        if (/\.(css)$/i.test(url)) return 'stylesheet';
        if (/\.(js)$/i.test(url)) return 'script';
        if (/\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url)) return 'image';
        if (/\.(woff|woff2|ttf|otf)$/i.test(url)) return 'font';
        if (/\/api\//.test(url)) return 'api';
        return 'other';
    }
    
    setupDashboard() {
        // Create dashboard UI
        if (!document.getElementById('perf-dashboard')) {
            const dashboard = document.createElement('div');
            dashboard.id = 'perf-dashboard';
            dashboard.style.cssText = 'position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.9);color:white;padding:15px;border-radius:8px;font-family:monospace;font-size:12px;z-index:10000;max-width:400px;max-height:500px;overflow:auto;';
            dashboard.innerHTML = '<h3 style="margin:0 0 10px 0;">Performance Metrics</h3><div id="perf-metrics"></div>';
            document.body.appendChild(dashboard);
            
            this.updateDashboard();
        }
    }
    
    updateDashboard() {
        const container = document.getElementById('perf-metrics');
        if (!container) return;
        
        let html = '<div style="margin-bottom:10px;"><strong>Page Load:</strong><br>';
        html += `DNS: ${this.metrics.timing.dns?.toFixed(2)}ms<br>`;
        html += `TCP: ${this.metrics.timing.tcp?.toFixed(2)}ms<br>`;
        html += `Request: ${this.metrics.timing.request?.toFixed(2)}ms<br>`;
        html += `Response: ${this.metrics.timing.response?.toFixed(2)}ms<br>`;
        html += `DOM: ${this.metrics.timing.dom?.toFixed(2)}ms<br>`;
        html += `Total: ${this.metrics.timing.total?.toFixed(2)}ms</div>`;
        
        html += '<div style="margin-bottom:10px;"><strong>Paint:</strong><br>';
        html += `FCP: ${this.metrics.paint['first-contentful-paint']?.toFixed(2)}ms<br>`;
        html += `FMP: ${this.metrics.paint['first-meaningful-paint']?.toFixed(2)}ms</div>`;
        
        html += '<div><strong>Resources:</strong> ' + this.metrics.resources.length + '</div>';
        
        container.innerHTML = html;
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now()
        };
    }
    
    exportMetrics() {
        const data = this.getMetrics();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-metrics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.performanceProfilingDashboard = new PerformanceProfilingDashboard(); });
} else {
    window.performanceProfilingDashboard = new PerformanceProfilingDashboard();
}

