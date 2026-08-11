/**
 * Make (Integromat) Integration
 * Integrates with Make (formerly Integromat) automation platform
 */

class MakeIntegromatIntegration {
    constructor() {
        this.webhookUrl = null;
        this.apiKey = null;
        this.init();
    }

    init() {
        console.log('Make (Integromat) Integration initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_ak_ei_nt_eg_ro_ma_ti_nt_eg_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    configure(apiKey, webhookUrl) {
        this.apiKey = apiKey;
        this.webhookUrl = webhookUrl;
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[make-integration] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
            // Try AllOrigins first
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            } catch (proxyError) {
                console.warn('[make-integration] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[make-integration] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    async triggerScenario(data) {
        if (!this.webhookUrl) {
            throw new Error('Make webhook URL not configured');
        }

        return await this.fetchJSON(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }
}

// Auto-initialize
const makeIntegration = new MakeIntegromatIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MakeIntegromatIntegration;
}

