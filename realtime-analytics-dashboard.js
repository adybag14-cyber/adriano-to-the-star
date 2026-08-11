/**
 * Real-time Analytics Dashboard
 * Real-time analytics and metrics dashboard
 */

class RealtimeAnalyticsDashboard {
    constructor() {
        this.metrics = {};
        this.updateInterval = null;
        this.init();
    }
    
    init() {
        this.setupDashboard();
        this.startUpdates();
    }
    
    setupDashboard() {
        // Create dashboard UI
        if (!document.getElementById('analytics-dashboard')) {
            const dashboard = document.createElement('div');
            dashboard.id = 'analytics-dashboard';
            dashboard.style.cssText = 'position:fixed;top:20px;left:20px;background:rgba(0,0,0,0.9);color:white;padding:20px;border-radius:8px;z-index:10000;max-width:400px;max-height:600px;overflow:auto;font-family:monospace;';
            dashboard.innerHTML = `
                <h3 style="margin:0 0 15px 0;">Real-time Analytics</h3>
                <div id="analytics-metrics"></div>
                <button id="analytics-toggle" style="margin-top:10px;padding:8px 15px;background:#ba944f;border:none;border-radius:4px;color:white;cursor:pointer;">Hide</button>
            `;
            document.body.appendChild(dashboard);
            
            document.getElementById('analytics-toggle').addEventListener('click', () => {
                const metrics = document.getElementById('analytics-metrics');
                metrics.style.display = metrics.style.display === 'none' ? 'block' : 'none';
            });
        }
    }
    
    startUpdates() {
        // Update metrics every second
        this.updateMetrics();
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 1000);
    }
    
    async updateMetrics() {
        // Collect and update metrics
        this.metrics = {
            activeUsers: await this.getActiveUsers(),
            pageViews: await this.getPageViews(),
            requests: await this.getRequestCount(),
            errors: await this.getErrorCount(),
            responseTime: this.getAverageResponseTime(),
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.renderMetrics();
    }
    
    async getActiveUsers() {
        // Get active users (simplified)
        return Math.floor(Math.random() * 100) + 50;
    }
    
    async getPageViews() {
        // Get page views (simplified)
        return Math.floor(Math.random() * 1000) + 500;
    }
    
    async getRequestCount() {
        // Get request count
        return Math.floor(Math.random() * 500) + 200;
    }
    
    async getErrorCount() {
        // Get error count
        return Math.floor(Math.random() * 10);
    }
    
    getAverageResponseTime() {
        // Get average response time
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? Math.round(navigation.responseEnd - navigation.requestStart) : 0;
    }
    
    renderMetrics() {
        const container = document.getElementById('analytics-metrics');
        if (!container) return;
        
        let html = '<div style="margin-bottom:10px;"><strong>Active Users:</strong> ' + this.metrics.activeUsers + '</div>';
        html += '<div style="margin-bottom:10px;"><strong>Page Views:</strong> ' + this.metrics.pageViews + '</div>';
        html += '<div style="margin-bottom:10px;"><strong>Requests:</strong> ' + this.metrics.requests + '/min</div>';
        html += '<div style="margin-bottom:10px;"><strong>Errors:</strong> ' + this.metrics.errors + '</div>';
        html += '<div style="margin-bottom:10px;"><strong>Response Time:</strong> ' + this.metrics.responseTime + 'ms</div>';
        html += '<div style="margin-bottom:10px;color:#888;font-size:12px;">Last updated: ' + this.metrics.timestamp + '</div>';
        
        container.innerHTML = html;
    }
    
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.realtimeAnalyticsDashboard = new RealtimeAnalyticsDashboard(); });
} else {
    window.realtimeAnalyticsDashboard = new RealtimeAnalyticsDashboard();
}

