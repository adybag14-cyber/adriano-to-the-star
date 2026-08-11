/**
 * SpaceX API Integration
 * Integrates with SpaceX API for launch and mission data
 * 
 * Features:
 * - Launch data
 * - Rocket information
 * - Mission updates
 * - Real-time tracking
 */

class SpaceXAPIIntegration {
    constructor() {
        this.baseUrl = 'https://api.spacexdata.com/v4';
        this.init();
    }
    
    init() {
        this.setupUpdates();
        console.log('🚀 SpaceX API Integration initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_pa_ce_xa_pi_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[spacex-api-integration] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
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
                console.warn('[spacex-api-integration] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[spacex-api-integration] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    async fetchUpcomingLaunches() {
        try {
            const url = `${this.baseUrl}/launches/upcoming`;
            return await this.fetchJSON(url);
        } catch (e) {
            console.error('Failed to fetch SpaceX launches:', e);
            return [];
        }
    }
    
    async fetchRocketInfo(rocketId) {
        try {
            const url = `${this.baseUrl}/rockets/${rocketId}`;
            return await this.fetchJSON(url);
        } catch (e) {
            console.error('Failed to fetch rocket info:', e);
            return null;
        }
    }
    
    async fetchLatestLaunch() {
        try {
            const url = `${this.baseUrl}/launches/latest`;
            return await this.fetchJSON(url);
        } catch (e) {
            console.error('Failed to fetch latest launch:', e);
            return null;
        }
    }
    
    setupUpdates() {
        // Fetch upcoming launches daily
        setInterval(async () => {
            const launches = await this.fetchUpcomingLaunches();
            if (launches.length > 0) {
                this.displayLaunchNotification(launches[0]);
            }
        }, 86400000); // Daily
        
        // Initial fetch
        this.fetchUpcomingLaunches().then(launches => {
            if (launches.length > 0) {
                this.displayLaunchNotification(launches[0]);
            }
        });
    }
    
    displayLaunchNotification(launch) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ba944f;
            border-radius: 12px;
            padding: 15px;
            z-index: 9999;
            color: white;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <h4 style="color: #ba944f; margin: 0 0 10px 0;">🚀 Upcoming Launch</h4>
            <p style="margin: 0;">${launch.name || 'SpaceX Launch'}</p>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #ccc;">${new Date(launch.date_local).toLocaleDateString()}</p>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.spacexAPIIntegration = new SpaceXAPIIntegration();
    });
} else {
    window.spacexAPIIntegration = new SpaceXAPIIntegration();
}
