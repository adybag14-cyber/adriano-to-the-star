/**
 * AI Planet Discovery Predictions
 * Uses AI to predict potential planet discoveries
 * 
 * Features:
 * - ML-based predictions
 * - Discovery probability scores
 * - Habitability predictions
 * - Timeline estimates
 */

class AIPlanetDiscoveryPredictions {
    constructor() {
        this.model = null;
        this.predictions = [];
        this.init();
    }

    init() {
        this.loadModel();
        this.trackEvent('discovery_predictions_initialized');
    }

    async loadModel() {
        // Load or initialize ML model
        // This would typically load a TensorFlow.js or similar model
        try {
            // Placeholder for model loading
            this.model = {
                predict: (data) => this.predictDiscovery(data)
            };
        } catch (e) {
            console.warn('Failed to load prediction model:', e);
        }
    }

    predictDiscovery(starData) {
        // Simplified prediction algorithm
        // In production, this would use a trained ML model
        const factors = {
            starType: starData.starType || 'G',
            distance: starData.distance || 100,
            age: starData.age || 5,
            metallicity: starData.metallicity || 0
        };

        // Calculate probability score
        let probability = 0.5;

        // G-type stars are more likely to have habitable planets
        if (factors.starType === 'G' || factors.starType === 'K') {
            probability += 0.2;
        }

        // Closer stars are easier to detect
        if (factors.distance < 50) {
            probability += 0.15;
        }

        // Older stars have had more time for planet formation
        if (factors.age > 3) {
            probability += 0.1;
        }

        // Higher metallicity increases planet formation probability
        if (factors.metallicity > 0) {
            probability += 0.05;
        }

        return {
            probability: Math.min(probability, 0.95),
            confidence: 0.7,
            estimatedDiscoveryYear: new Date().getFullYear() + Math.floor(Math.random() * 10),
            habitabilityScore: this.calculateHabitability(factors)
        };
    }

    calculateHabitability(factors) {
        // Simplified habitability calculation
        let score = 0.3;

        if (factors.starType === 'G') score += 0.3;
        if (factors.distance < 30) score += 0.2;
        if (factors.age > 4) score += 0.2;

        return Math.min(score, 1.0);
    }

    async predictForStar(starId) {
        try {
            // Fetch star data
            const starData = await this.fetchStarData(starId);
            if (!starData) return null;

            const prediction = this.model.predict(starData);
            this.predictions.push({
                starId,
                ...prediction,
                timestamp: new Date().toISOString()
            });

            this.trackEvent('prediction_made', { starId, probability: prediction.probability });
            return prediction;
        } catch (e) {
            console.error('Failed to predict for star:', e);
            return null;
        }
    }

    async fetchStarData(starId) {
        // Fetch star data from database or API
        // Placeholder implementation
        return {
            starType: 'G',
            distance: 25,
            age: 4.5,
            metallicity: 0.02
        };
    }

    getPredictions() {
        return this.predictions.sort((a, b) => b.probability - a.probability);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`discovery_predictions_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_planet_discovery_predictions', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Global helper used by ai-predictions.html
if (typeof window !== 'undefined') {
    window.aiPredictions = window.aiPredictions || (function () {
        /**
         * Ensure we have a single shared instance
         */
        const core = window.aiPlanetDiscoveryPredictions || new AIPlanetDiscoveryPredictions();
        window.aiPlanetDiscoveryPredictions = core;

        const SAMPLE_SYSTEMS = [
            { name: 'Kepler-452 b', discoveryYear: 2015, distance: 1400, method: 'Transit' },
            { name: 'TRAPPIST-1 e', discoveryYear: 2017, distance: 39, method: 'Transit' },
            { name: 'Proxima Centauri b', discoveryYear: 2016, distance: 4.2, method: 'Radial Velocity' },
            { name: 'Kepler-186 f', discoveryYear: 2014, distance: 580, method: 'Transit' },
            { name: 'Kepler-62 f', discoveryYear: 2013, distance: 1200, method: 'Transit' },
            { name: 'HD 40307 g', discoveryYear: 2012, distance: 42, method: 'Radial Velocity' }
        ];

        /**
         * Fetch recent confirmed exoplanets from NASA Exoplanet Archive.
         * Uses the same public endpoint as the space dashboard.
         */
        async function fetchRecentExoplanets(limit = 12) {
            const baseUrl = 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI';
            const url = `${baseUrl}?table=exoplanets&format=json&where=pl_confirmed=1&order=pl_disc+desc&limit=${limit}`;

            const data = await (window.epFetchJSON ? window.epFetchJSON(url) : fetch(url).then(r => r.json()));
            return data.map(planet => ({
                name: planet.pl_name || planet.pl_hostname || 'Unknown system',
                discoveryYear: planet.pl_disc || null,
                distance: typeof planet.st_dist === 'number' ? planet.st_dist : null,
                method: planet.pl_discmethod || null
            }));
        }

        /**
         * Render prediction cards into the given container ID.
         */
        async function displayPredictions(containerId) {
            const container = document.getElementById(containerId);
            if (!container) {
                return;
            }

            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.8);">
                    Loading live AI predictions...
                </div>
            `;

            let systems = [];
            let usedFallback = false;
            try {
                systems = await fetchRecentExoplanets(12);
            } catch (error) {
                console.warn('Failed to load live exoplanet data for AI predictions:', error);
                if (Array.isArray(SAMPLE_SYSTEMS) && SAMPLE_SYSTEMS.length > 0) {
                    systems = SAMPLE_SYSTEMS.slice(0, 12);
                    usedFallback = true;
                }
            }

            if (!systems || systems.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.7);">
                        <p style="margin-bottom:0.75rem;">⚠️ Live exoplanet data is currently unavailable.</p>
                        <p style="font-size:0.9rem; opacity:0.8;">Please check your internet connection or try again later.</p>
                    </div>
                `;
                return;
            }

            const predictions = systems.map(system => {
                const distance = typeof system.distance === 'number' ? system.distance : 100;
                const prediction = core.predictDiscovery({ distance });
                return { system, prediction };
            });

            const cardsHtml = predictions.map(({ system, prediction }) => {
                const probability = (prediction.probability * 100).toFixed(1);
                const habitability = (prediction.habitabilityScore * 100).toFixed(0);
                const year = prediction.estimatedDiscoveryYear;

                return `
                    <div style="
                        background: rgba(0, 0, 0, 0.6);
                        border-radius: 14px;
                        border: 1px solid rgba(186, 148, 79, 0.4);
                        padding: 1.25rem 1.5rem;
                        display: flex;
                        flex-direction: column;
                        gap: 0.6rem;
                        box-shadow: 0 12px 30px rgba(0,0,0,0.6);
                    ">
                        <div style="font-size:1.05rem; color:#ba944f; font-weight:600;">
                            ${system.name}
                        </div>
                        <div style="font-size:0.85rem; color:rgba(255,255,255,0.75);">
                            ${system.method ? system.method : 'Detection method: N/A'}
                            ${system.discoveryYear ? ` • Discovered: ${system.discoveryYear}` : ''}
                            ${typeof system.distance === 'number' ? ` • ~${system.distance.toFixed(1)} ly away` : ''}
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.25rem;">
                            <div style="
                                background: rgba(56, 189, 248, 0.18);
                                border-radius: 999px;
                                padding: 0.35rem 0.75rem;
                                font-size:0.85rem;
                                color:#38bdf8;
                            ">
                                Discovery probability: <strong>${probability}%</strong>
                            </div>
                            <div style="
                                background: rgba(52, 211, 153, 0.18);
                                border-radius: 999px;
                                padding: 0.35rem 0.75rem;
                                font-size:0.85rem;
                                color:#4ade80;
                            ">
                                Habitability score: <strong>${habitability}/100</strong>
                            </div>
                        </div>
                        <div style="font-size:0.85rem; color:rgba(255,255,255,0.7); margin-top:0.3rem;">
                            Estimated detection window: <strong>${year}</strong>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:1.25rem;">
                    ${cardsHtml}
                </div>
                ${usedFallback ? '<p style="margin-top:1.5rem; font-size:0.85rem; opacity:0.7; text-align:center;">Using sample exoplanet systems while live NASA exoplanet data is unavailable.</p>' : ''}
            `;
        }

        return {
            displayPredictions
        };
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.aiPlanetDiscoveryPredictions) {
            window.aiPlanetDiscoveryPredictions = new AIPlanetDiscoveryPredictions();
        }
    });
} else {
    if (!window.aiPlanetDiscoveryPredictions) {
        window.aiPlanetDiscoveryPredictions = new AIPlanetDiscoveryPredictions();
    }
}
