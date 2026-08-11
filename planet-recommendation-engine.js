/**
 * Planet Recommendation Engine
 * AI suggests planets based on user preferences
 */

class PlanetRecommendationEngine {
    constructor() {
        this.preferences = {};
        this.recommendations = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadPreferences();
        this.isInitialized = true;
        console.log('🤖 Planet Recommendation Engine initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tr_ec_om_me_nd_at_io_ne_ng_in_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadPreferences() {
        try {
            const stored = localStorage.getItem('planet-preferences');
            if (stored) this.preferences = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('planet-preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    setPreferences(prefs) {
        this.preferences = { ...this.preferences, ...prefs };
        this.savePreferences();
    }

    recommendPlanets(allPlanets, limit = 10) {
        const scored = allPlanets.map(planet => ({
            planet,
            score: this.calculateScore(planet)
        }));
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.planet);
    }

    calculateScore(planet) {
        let score = 0;
        const radius = parseFloat(planet.radius) || 1;
        const temp = parseFloat(planet.koi_teq) || 300;

        if (this.preferences.earthLike && radius >= 0.8 && radius <= 1.5) score += 50;
        if (this.preferences.habitable && temp >= 200 && temp <= 350) score += 30;
        if (this.preferences.confirmed && (planet.status === 'CONFIRMED' || planet.status === 'Confirmed Planet')) score += 20;

        return score;
    }

    renderRecommendations(containerId, allPlanets) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const recommendations = this.recommendPlanets(allPlanets);
        container.innerHTML = `
            <div class="recommendations" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🤖 Recommended Planets</h3>
                <div class="recommendations-list">${recommendations.map(p => `
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem;">
                        <div style="color: #ba944f; font-weight: 600;">${p.kepler_name || p.kepoi_name}</div>
                    </div>
                `).join('')}</div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetRecommendationEngine = PlanetRecommendationEngine;
    window.planetRecommendationEngine = new PlanetRecommendationEngine();
}

