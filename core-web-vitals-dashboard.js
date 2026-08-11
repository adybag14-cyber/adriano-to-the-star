/**
 * Core Web Vitals Dashboard
 * Visual dashboard for Core Web Vitals metrics
 */

class CoreWebVitalsDashboard {
    constructor() {
        this.metrics = {};
        this.init();
    }
    
    init() {
        this.createDashboard();
        this.startUpdates();
        this.trackEvent('cwv_dashboard_initialized');
    }
    
    createDashboard() {
        if (document.getElementById('web-vitals-dashboard')) return;
        
        const dashboard = document.createElement('div');
        dashboard.id = 'web-vitals-dashboard';
        dashboard.style.cssText = 'position:fixed;top:20px;right:20px;background:rgba(0,0,0,0.95);color:white;padding:20px;border-radius:8px;z-index:10000;min-width:350px;font-family:monospace;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        
        dashboard.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:10px;">
                <h3 style="margin:0;color:#ba944f;">Core Web Vitals</h3>
                <button id="web-vitals-close" style="background:none;border:none;color:white;cursor:pointer;font-size:20px;">×</button>
            </div>
            <div id="web-vitals-metrics"></div>
            <div id="web-vitals-budgets" style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.2);"></div>
            <div style="margin-top:10px;font-size:12px;color:#888;">
                <div>🟢 Good | 🟡 Needs Improvement | 🔴 Poor</div>
            </div>
        `;
        
        document.body.appendChild(dashboard);
        
        document.getElementById('web-vitals-close').addEventListener('click', () => {
            dashboard.style.display = 'none';
        });
        
        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'web-vitals-toggle';
        toggleBtn.style.cssText = 'position:fixed;top:20px;right:20px;width:50px;height:50px;background:#ba944f;color:white;border:none;border-radius:50%;cursor:pointer;font-size:20px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        toggleBtn.textContent = '📊';
        toggleBtn.title = 'Web Vitals Dashboard';
        toggleBtn.addEventListener('click', () => {
            dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
        });
        document.body.appendChild(toggleBtn);
    }
    
    startUpdates() {
        // Update every 5 seconds
        setInterval(() => {
            this.updateMetrics();
        }, 5000);
        
        // Initial update
        this.updateMetrics();
    }
    
    updateMetrics() {
        if (!window.coreWebVitalsMonitoring) return;
        
        this.metrics = window.coreWebVitalsMonitoring.getMetrics();
        this.renderMetrics();
        this.renderBudgets();
    }
    
    renderMetrics() {
        const container = document.getElementById('web-vitals-metrics');
        if (!container) return;
        
        const metrics = [
            { name: 'LCP', label: 'Largest Contentful Paint', unit: 'ms', good: 2500 },
            { name: 'FID', label: 'First Input Delay', unit: 'ms', good: 100 },
            { name: 'CLS', label: 'Cumulative Layout Shift', unit: '', good: 0.1 },
            { name: 'FCP', label: 'First Contentful Paint', unit: 'ms', good: 1800 },
            { name: 'TTI', label: 'Time to Interactive', unit: 'ms', good: 3800 },
            { name: 'TBT', label: 'Total Blocking Time', unit: 'ms', good: 200 }
        ];
        
        let html = '';
        metrics.forEach(metric => {
            const data = this.metrics[metric.name];
            const value = data?.value || null;
            const status = this.getStatus(value, metric.good);
            const statusIcon = this.getStatusIcon(status);
            const displayValue = value !== null ? value.toFixed(2) + metric.unit : 'N/A';
            
            html += `
                <div style="margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.05);border-radius:4px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                        <span style="font-weight:bold;">${statusIcon} ${metric.label}</span>
                        <span style="color:${this.getStatusColor(status)};font-weight:bold;">${displayValue}</span>
                    </div>
                    <div style="font-size:12px;color:#888;">
                        Target: ${metric.good}${metric.unit}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html || '<div style="color:#888;">No metrics available yet...</div>';
    }

    renderBudgets() {
        const container = document.getElementById('web-vitals-budgets');
        if (!container) return;
        const breaches = window.performanceBudgetBreaches || [];
        if (!breaches.length) {
            container.innerHTML = '<div style="font-size:12px;color:#888;">No recent performance budget breaches.</div>';
            return;
        }
        const recent = breaches.slice(-5).reverse();
        let html = '<div style="font-size:12px;margin-bottom:6px;color:#ba944f;">Recent Budget Breaches</div>';
        html += '<ul style="list-style:none;padding:0;margin:0;font-size:11px;max-height:120px;overflow-y:auto;">';
        recent.forEach(breach => {
            const time = new Date(breach.timestamp).toLocaleTimeString();
            html += `
                <li style="margin-bottom:4px;">
                    <span style="color:#f87171;font-weight:bold;">${breach.metric.toUpperCase()}</span>
                    <span> ${Math.round(breach.value)} &gt; ${Math.round(breach.budget)}</span>
                    <span style="opacity:0.7;"> (${time})</span>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML = html;
    }
    
    getStatus(value, threshold) {
        if (value === null) return 'unknown';
        if (value <= threshold) return 'good';
        if (value <= threshold * 1.6) return 'needs-improvement';
        return 'poor';
    }
    
    getStatusIcon(status) {
        const icons = {
            good: '🟢',
            'needs-improvement': '🟡',
            poor: '🔴',
            unknown: '⚪'
        };
        return icons[status] || '⚪';
    }
    
    getStatusColor(status) {
        const colors = {
            good: '#4ade80',
            'needs-improvement': '#fbbf24',
            poor: '#f87171',
            unknown: '#888'
        };
        return colors[status] || '#888';
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cwv_dashboard_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.coreWebVitalsDashboard = new CoreWebVitalsDashboard(); });
} else {
    window.coreWebVitalsDashboard = new CoreWebVitalsDashboard();
}

