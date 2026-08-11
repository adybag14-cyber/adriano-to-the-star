/**
 * Core Web Vitals Alerts
 * Alerting system for Core Web Vitals thresholds
 */

class CoreWebVitalsAlerts {
    constructor() {
        this.thresholds = {
            LCP: { good: 2500, needsImprovement: 4000 },
            FID: { good: 100, needsImprovement: 300 },
            CLS: { good: 0.1, needsImprovement: 0.25 },
            FCP: { good: 1800, needsImprovement: 3000 },
            TTI: { good: 3800, needsImprovement: 7300 },
            TBT: { good: 200, needsImprovement: 600 }
        };
        this.alertHistory = [];
        this.init();
    }

    init() {
        this.setupAlerts();
        this.monitorMetrics();
        this.trackEvent('cwv_alerts_initialized');
    }

    setupAlerts() {
        // Setup alert listeners
        if (window.coreWebVitalsMonitoring) {
            window.coreWebVitalsMonitoring.addEventListener('metric', (event) => {
                this.checkAndAlert(event.detail);
            });
        }
    }

    monitorMetrics() {
        // Monitor metrics periodically
        setInterval(() => {
            if (window.coreWebVitalsMonitoring) {
                const metrics = window.coreWebVitalsMonitoring.getMetrics();
                Object.keys(metrics).forEach(metric => {
                    if (metrics[metric] && metrics[metric].value) {
                        this.checkAndAlert({
                            name: metric,
                            value: metrics[metric].value
                        });
                    }
                });
            }
        }, 30000); // Check every 30 seconds
    }

    checkAndAlert(metricData) {
        const { name, value } = metricData;
        const threshold = this.thresholds[name];

        if (!threshold || !value) return;

        let status = 'poor';
        if (value <= threshold.good) {
            status = 'good';
        } else if (value <= threshold.needsImprovement) {
            status = 'needs-improvement';
        }

        // Alert if not good
        if (status !== 'good') {
            this.triggerAlert(name, value, status, threshold);
        }
    }

    triggerAlert(metric, value, status, threshold) {
        // Check if we've already alerted recently
        const recentAlert = this.alertHistory.find(alert =>
            alert.metric === metric &&
            (Date.now() - alert.timestamp) < 60000 // 1 minute
        );

        if (recentAlert) return;

        const alert = {
            metric,
            value,
            status,
            threshold,
            timestamp: Date.now(),
            message: this.generateAlertMessage(metric, value, status, threshold)
        };

        this.alertHistory.push(alert);

        // Show alert
        this.showAlert(alert);

        // Send to monitoring service
        this.sendToMonitoring(alert);
    }

    generateAlertMessage(metric, value, status, threshold) {
        const unit = metric === 'CLS' ? '' : 'ms';
        const target = status === 'needs-improvement' ? threshold.good : threshold.needsImprovement;

        return `${metric} is ${status}: ${value.toFixed(2)}${unit}. Target: ${target}${unit}`;
    }

    showAlert(alert) {
        // Show browser notification
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                // Mobile support: Use ServiceWorkerRegistration if available
                if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('Web Vital Alert', {
                            body: alert.message,
                            icon: '/icon.png',
                            tag: `web-vital-${alert.metric}`
                        });
                    });
                } else {
                    // Desktop fallback
                    new Notification('Web Vital Alert', {
                        body: alert.message,
                        icon: '/icon.png',
                        tag: `web-vital-${alert.metric}`
                    });
                }
            } catch (e) {
                console.warn('Notification failed:', e);
            }
        }

        // Show toast notification
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                alert.message,
                alert.status === 'poor' ? 'error' : 'warning'
            );
        }

        // Log to console
        console.warn('Web Vital Alert:', alert);
    }

    sendToMonitoring(alert) {
        // Send to monitoring service
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Web Vital Alert', {
                ...alert,
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        }

        // Send to backend (optional, only if Supabase client is correctly initialised)
        if (window.supabase && typeof window.supabase.from === 'function') {
            try {
                const auth = window.supabase.auth;
                if (!auth || typeof auth.getSession !== 'function') {
                    return;
                }

                const sessionPromise = auth.getSession();
                if (!sessionPromise || typeof sessionPromise.then !== 'function') {
                    return;
                }

                sessionPromise
                    .then(({ data, error }) => {
                        if (error || !data || !data.session) {
                            return;
                        }

                        try {
                            const result = window.supabase
                                .from('web_vital_alerts')
                                .insert({
                                    metric: alert.metric,
                                    value: alert.value,
                                    status: alert.status,
                                    message: alert.message,
                                    timestamp: new Date(alert.timestamp).toISOString()
                                });

                            if (result && typeof result.then === 'function') {
                                if (typeof result.catch === 'function') {
                                    result.catch(() => { /* best-effort only */ });
                                } else {
                                    result.then(() => { }, () => { });
                                }
                            }
                        } catch (e) {
                        }
                    })
                    .catch(() => { /* best-effort only */ });
            } catch (e) {
                // Telemetry is best-effort; never break the app
            }
        }
    }

    getAlertHistory(limit = 10) {
        return this.alertHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cwv_alerts_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.coreWebVitalsAlerts = new CoreWebVitalsAlerts(); });
} else {
    window.coreWebVitalsAlerts = new CoreWebVitalsAlerts();
}

