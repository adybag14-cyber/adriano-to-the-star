/**
 * Automated Data Quality Monitoring
 * Monitor data quality automatically
 */
(function() {
    'use strict';

    class AutomatedDataQualityMonitoring {
        constructor() {
            this.monitors = [];
            this.alerts = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.startMonitoring();
            this.trackEvent('quality_mon_initialized');
        }

        setupUI() {
            if (!document.getElementById('quality-monitoring')) {
                const monitoring = document.createElement('div');
                monitoring.id = 'quality-monitoring';
                monitoring.className = 'quality-monitoring';
                monitoring.innerHTML = `
                    <div class="monitoring-header">
                        <h2>Data Quality Monitoring</h2>
                    </div>
                    <div class="quality-metrics" id="quality-metrics"></div>
                    <div class="alerts-list" id="alerts-list"></div>
                `;
                document.body.appendChild(monitoring);
            }
        }

        addMonitor(config) {
            const monitor = {
                id: this.generateId(),
                field: config.field,
                rules: config.rules,
                enabled: config.enabled !== false
            };
            this.monitors.push(monitor);
            return monitor;
        }

        startMonitoring() {
            setInterval(() => {
                this.checkQuality();
            }, 60000);
        }

        checkQuality() {
            const data = this.getData();
            this.monitors.forEach(monitor => {
                if (monitor.enabled) {
                    const issues = this.checkRules(data, monitor);
                    if (issues.length > 0) {
                        this.createAlert(monitor, issues);
                    }
                }
            });
        }

        checkRules(data, monitor) {
            const issues = [];
            monitor.rules.forEach(rule => {
                const violations = data.filter(item => !this.evaluateRule(item[monitor.field], rule));
                if (violations.length > 0) {
                    issues.push({
                        rule: rule,
                        count: violations.length
                    });
                }
            });
            return issues;
        }

        evaluateRule(value, rule) {
            switch (rule.type) {
                case 'notNull':
                    return value !== null && value !== undefined;
                case 'range':
                    return value >= rule.min && value <= rule.max;
                case 'pattern':
                    return new RegExp(rule.pattern).test(value);
                default:
                    return true;
            }
        }

        createAlert(monitor, issues) {
            const alert = {
                id: this.generateId(),
                monitorId: monitor.id,
                issues: issues,
                timestamp: new Date().toISOString(),
                severity: 'warning'
            };
            this.alerts.push(alert);
            this.renderAlerts();
        }

        renderAlerts() {
            const list = document.getElementById('alerts-list');
            if (!list) return;

            list.innerHTML = this.alerts.slice(-10).map(alert => `
                <div class="alert-item ${alert.severity}">
                    <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
                    <div class="alert-issues">${alert.issues.length} quality issues detected</div>
                </div>
            `).join('');
        }

        getData() {
            if (window.database?.getAll) {
                return window.database.getAll();
            }
            return [];
        }

        generateId() {
            return 'monitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`quality_mon_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.qualityMonitoring = new AutomatedDataQualityMonitoring();
        });
    } else {
        window.qualityMonitoring = new AutomatedDataQualityMonitoring();
    }
})();

