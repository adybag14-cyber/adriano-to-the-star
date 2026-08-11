/**
 * Planet Discovery SDK for Developers
 * JavaScript SDK for integrating planet discovery features
 */

class PlanetDiscoverySDK {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.baseUrl = window.location.origin;
        this.version = '1.0.0';
        this.init();
    }

    init() {
        this.trackEvent('p_la_ne_td_is_co_ve_ry_sd_k_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_sd_k_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Search for planets
     */
    async searchPlanets(query, options = {}) {
        const params = new URLSearchParams({
            q: query,
            ...options
        });

        try {
            const response = await fetch(`${this.baseUrl}/api/planets/search?${params}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error searching planets:', error);
            throw error;
        }
    }

    /**
     * Get planet details
     */
    async getPlanet(planetId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/planets/${planetId}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting planet:', error);
            throw error;
        }
    }

    /**
     * Claim a planet
     */
    async claimPlanet(planetId, userId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/planets/${planetId}/claim`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ userId })
            });
            return await response.json();
        } catch (error) {
            console.error('Error claiming planet:', error);
            throw error;
        }
    }

    /**
     * Get user's claimed planets
     */
    async getUserPlanets(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/users/${userId}/planets`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting user planets:', error);
            throw error;
        }
    }

    /**
     * Get planet predictions
     */
    async getPredictions(starSystemId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/predictions/${starSystemId}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting predictions:', error);
            throw error;
        }
    }

    /**
     * Analyze habitability
     */
    async analyzeHabitability(planetId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/planets/${planetId}/habitability`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error analyzing habitability:', error);
            throw error;
        }
    }

    /**
     * Get headers for API requests
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-SDK-Version': this.version
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        return headers;
    }

    /**
     * Render SDK documentation
     */
    renderSDKDocs(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="sdk-docs-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📦 Planet Discovery SDK</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Integrate planet discovery features into your application with our JavaScript SDK.
                    </p>
                    <div style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem; margin-bottom: 1rem;">
                        <code style="color: #4ade80;">npm install planet-discovery-sdk</code>
                    </div>
                    <button id="get-api-key-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        🔑 Get API Key
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Quick Start</h4>
                    <pre style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 8px; overflow-x: auto; color: #4ade80; font-size: 0.85rem;"><code>// Initialize SDK
const sdk = new PlanetDiscoverySDK('your-api-key');

// Search for planets
const planets = await sdk.searchPlanets('Kepler-186');

// Get planet details
const planet = await sdk.getPlanet('kepoi_name_123');

// Claim a planet
const claim = await sdk.claimPlanet('kepoi_name_123', 'user-id');

// Get predictions
const predictions = await sdk.getPredictions('star-system-id');

// Analyze habitability
const analysis = await sdk.analyzeHabitability('kepoi_name_123');</code></pre>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">API Methods</h4>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">searchPlanets(query, options)</div>
                            <div style="opacity: 0.8; font-size: 0.9rem;">Search for planets by name or criteria</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">getPlanet(planetId)</div>
                            <div style="opacity: 0.8; font-size: 0.9rem;">Get detailed information about a planet</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">claimPlanet(planetId, userId)</div>
                            <div style="opacity: 0.8; font-size: 0.9rem;">Claim ownership of a planet</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">getUserPlanets(userId)</div>
                            <div style="opacity: 0.8; font-size: 0.9rem;">Get all planets claimed by a user</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">getPredictions(starSystemId)</div>
                            <div style="opacity: 0.8; font-size: 0.9rem;">Get AI predictions for planet discoveries</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">analyzeHabitability(planetId)</div>
                            <div style="opacity: 0.8; font-size: 0.9rem;">Analyze planet habitability potential</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('get-api-key-btn')?.addEventListener('click', () => {
            this.showAPIKeyForm();
        });
    }

    showAPIKeyForm() {
        alert('API key generation form coming soon!');
    }
}

// Make SDK available globally
if (typeof window !== 'undefined') {
    window.PlanetDiscoverySDK = PlanetDiscoverySDK;
    window.planetDiscoverySDK = new PlanetDiscoverySDK();
}

