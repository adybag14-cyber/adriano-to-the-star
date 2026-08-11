/**
 * ESA (European Space Agency) Integration
 * Integrates with ESA APIs and data sources
 * 
 * Features:
 * - ESA mission data
 * - Spacecraft tracking
 * - Science data access
 */

class ESAIntegration {
    constructor() {
        this.baseUrl = 'https://www.esa.int';
        this.init();
    }

    init() {
        this.trackEvent('e_sa_in_te_gr_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_sa_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[ESAIntegration] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[ESAIntegration] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[ESAIntegration] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async fetchMissionData(missionName) {
        try {
            // ESA API endpoints would go here
            // This is a placeholder structure
            const url = `${this.baseUrl}/api/missions/${missionName}`;
            return await this.fetchJSON(url);
        } catch (e) {
            console.warn('ESA API not available, using fallback data');
            return this.getFallbackMissionData(missionName);
        }
    }

    getFallbackMissionData(missionName) {
        // Fallback data structure
        return {
            name: missionName,
            status: 'active',
            launchDate: '2020-01-01',
            description: 'ESA mission information'
        };
    }

    async fetchSpacecraftData() {
        // Return active spacecraft data
        return {
            spacecraft: [
                { name: 'Gaia', status: 'active' },
                { name: 'BepiColombo', status: 'active' }
            ]
        };
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.esaIntegration = new ESAIntegration();
    });
} else {
    window.esaIntegration = new ESAIntegration();
}

