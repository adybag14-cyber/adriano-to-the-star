/**
 * IFTTT Integration
 * Integrates with IFTTT (If This Then That) automation platform
 */

class IFTTTIntegration {
    constructor() {
        this.webhookKey = null;
        this.baseUrl = 'https://maker.ifttt.com/trigger';
        this.init();
    }

    init() {
        this.trackEvent('i_ft_tt_in_te_gr_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ft_tt_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    configure(webhookKey) {
        this.webhookKey = webhookKey;
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[ifttt-integration] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[ifttt-integration] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[ifttt-integration] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async triggerEvent(eventName, value1, value2, value3) {
        if (!this.webhookKey) {
            throw new Error('IFTTT webhook key not configured');
        }

        const url = `${this.baseUrl}/${eventName}/with/key/${this.webhookKey}`;
        
        try {
            return await this.fetchJSON(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    value1,
                    value2,
                    value3
                })
            });
        } catch (error) {
            console.error('IFTTT trigger error:', error);
            throw error;
        }
    }
}

// Auto-initialize
const iftttIntegration = new IFTTTIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IFTTTIntegration;
}

