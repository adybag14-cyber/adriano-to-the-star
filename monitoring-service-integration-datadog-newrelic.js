/**
 * Monitoring Service Integration (Datadog, New Relic)
 * Integrates with monitoring services
 */

class MonitoringServiceIntegration {
    constructor() {
        this.providers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_on_it_or_in_gs_er_vi_ce_in_te_gr_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_on_it_or_in_gs_er_vi_ce_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    configureProvider(provider, config) {
        this.providers.set(provider, config);
    }

    async sendMetric(provider, metric, value, tags = {}) {
        const config = this.providers.get(provider);
        if (!config) {
            throw new Error(`${provider} not configured`);
        }

        if (provider === 'datadog') {
            return await this.sendToDatadog(metric, value, tags, config);
        } else if (provider === 'newrelic') {
            return await this.sendToNewRelic(metric, value, tags, config);
        }
    }

    async sendToDatadog(metric, value, tags, config) {
        const response = await fetch(`https://api.datadoghq.com/api/v1/series?api_key=${config.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                series: [{
                    metric,
                    points: [[Date.now() / 1000, value]],
                    tags: Object.entries(tags).map(([k, v]) => `${k}:${v}`)
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Datadog metric send failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async sendToNewRelic(metric, value, tags, config) {
        const response = await fetch('https://metric-api.newrelic.com/metric/v1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': config.apiKey
            },
            body: JSON.stringify([{
                name: metric,
                value,
                timestamp: Date.now(),
                attributes: tags
            }])
        });

        if (!response.ok) {
            throw new Error(`New Relic metric send failed: ${response.statusText}`);
        }

        return await response.json();
    }
}

// Auto-initialize
const monitoringService = new MonitoringServiceIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonitoringServiceIntegration;
}

