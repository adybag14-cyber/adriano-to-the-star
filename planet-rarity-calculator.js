/**
 * Planet Rarity Calculator
 * Determine planet rarity scores
 */

class PlanetRarityCalculator {
    constructor() {
        this.rarityFactors = {
            radius: { weight: 0.2, rareRange: [0.5, 0.8, 1.2, 1.5] },
            temperature: { weight: 0.25, rareRange: [200, 250, 300, 350] },
            period: { weight: 0.15, rareRange: [50, 100, 200, 365] },
            status: { weight: 0.2, confirmed: 1.5 },
            discoveryMethod: { weight: 0.2, rareMethods: ['transit', 'radial velocity'] }
        };
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('💎 Planet Rarity Calculator initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tr_ar_it_yc_al_cu_la_to_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    calculateRarity(planetData) {
        let rarityScore = 0;
        const factors = {};

        // Radius factor
        const radiusRaw = planetData?.radius ?? planetData?.koi_prad ?? planetData?.radius_earth ?? planetData?.radiusEarth;
        const radius = parseFloat(radiusRaw);
        if (Number.isFinite(radius)) {
            if (radius >= 0.8 && radius <= 1.2) {
                rarityScore += 30 * this.rarityFactors.radius.weight;
                factors.radius = 'Earth-like (Rare)';
            } else if (radius < 0.5 || radius > 2) {
                rarityScore += 20 * this.rarityFactors.radius.weight;
                factors.radius = 'Extreme size (Rare)';
            } else {
                factors.radius = 'Common size';
            }
        } else {
            factors.radius = 'Radius unknown';
        }

        // Temperature factor (habitable zone)
        const tempRaw = planetData?.koi_teq ?? planetData?.temp ?? planetData?.temperature ?? planetData?.temperature_k ?? planetData?.teq;
        const temp = parseFloat(tempRaw);
        if (Number.isFinite(temp)) {
            if (temp >= 250 && temp <= 300) {
                rarityScore += 40 * this.rarityFactors.temperature.weight;
                factors.temperature = 'Habitable zone (Very Rare)';
            } else if (temp >= 200 && temp <= 350) {
                rarityScore += 25 * this.rarityFactors.temperature.weight;
                factors.temperature = 'Near habitable (Rare)';
            } else {
                factors.temperature = 'Outside habitable zone';
            }
        } else {
            factors.temperature = 'Temperature unknown';
        }

        // Period factor
        const periodRaw = planetData?.koi_period ?? planetData?.period ?? planetData?.period_days ?? planetData?.orbital_period;
        const period = parseFloat(periodRaw);
        if (Number.isFinite(period)) {
            if (period >= 200 && period <= 400) {
                rarityScore += 20 * this.rarityFactors.period.weight;
                factors.period = 'Earth-like orbit (Rare)';
            } else {
                factors.period = 'Common orbit';
            }
        } else {
            factors.period = 'Orbital period unknown';
        }

        // Status factor
        if (planetData.status === 'CONFIRMED' || planetData.status === 'Confirmed Planet') {
            rarityScore += 30 * this.rarityFactors.status.weight;
            factors.status = 'Confirmed (Rare)';
        } else {
            factors.status = 'Candidate';
        }

        // Discovery method factor
        const methodRaw = planetData?.discovery_method ?? planetData?.method ?? planetData?.discoveryMethod;
        const method = (methodRaw || '').toLowerCase();
        if (!method) {
            factors.method = 'Discovery method unknown';
        } else if (this.rarityFactors.discoveryMethod.rareMethods.includes(method)) {
            rarityScore += 15 * this.rarityFactors.discoveryMethod.weight;
            factors.method = 'Rare discovery method';
        } else {
            factors.method = 'Common method';
        }

        // Determine rarity tier
        let tier = 'Common';
        let tierColor = '#6b7280';
        if (rarityScore >= 80) {
            tier = 'Legendary';
            tierColor = '#fbbf24';
        } else if (rarityScore >= 60) {
            tier = 'Epic';
            tierColor = '#a855f7';
        } else if (rarityScore >= 40) {
            tier = 'Rare';
            tierColor = '#4a90e2';
        } else if (rarityScore >= 20) {
            tier = 'Uncommon';
            tierColor = '#4ade80';
        }

        return {
            score: Math.round(rarityScore),
            tier: tier,
            tierColor: tierColor,
            factors: factors
        };
    }

    renderRarity(containerId, planetData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const rarity = this.calculateRarity(planetData);

        container.innerHTML = `
            <div class="rarity-calculator" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">💎 Rarity Calculator</h3>
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; color: ${rarity.tierColor}; font-weight: bold; margin-bottom: 0.5rem;">${rarity.score}</div>
                    <div style="padding: 0.75rem 1.5rem; background: ${rarity.tierColor}20; border: 2px solid ${rarity.tierColor}50; border-radius: 10px; color: ${rarity.tierColor}; font-weight: 600; display: inline-block;">
                        ${rarity.tier}
                    </div>
                </div>
                <div class="rarity-factors">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Rarity Factors</h4>
                    ${Object.entries(rarity.factors).map(([key, value]) => `
                        <div style="padding: 0.75rem; background: rgba(0, 0, 0, 0.4); border-radius: 8px; margin-bottom: 0.5rem;">
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; text-transform: capitalize;">${key}</div>
                            <div style="color: #e0e0e0; font-weight: 600;">${value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetRarityCalculator = PlanetRarityCalculator;
    window.planetRarityCalculator = new PlanetRarityCalculator();
}

