/**
 * Planet Data Validation System
 * Validate planet information
 */

class PlanetDataValidation {
    constructor() {
        this.validationRules = {
            radius: { min: 0.1, max: 50, required: false },
            mass: { min: 0.01, max: 1000, required: false },
            temperature: { min: 0, max: 5000, required: false },
            period: { min: 0.1, max: 10000, required: false }
        };
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('✅ Planet Data Validation initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_at_av_al_id_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    validatePlanet(planetData) {
        const errors = [];
        const warnings = [];

        // Radius validation
        const radius = parseFloat(planetData.radius);
        if (radius !== undefined && !isNaN(radius)) {
            if (radius < this.validationRules.radius.min || radius > this.validationRules.radius.max) {
                errors.push(`Radius ${radius} is outside valid range (${this.validationRules.radius.min}-${this.validationRules.radius.max})`);
            }
        }

        // Temperature validation
        const temp = parseFloat(planetData.koi_teq);
        if (temp !== undefined && !isNaN(temp)) {
            if (temp < this.validationRules.temperature.min || temp > this.validationRules.temperature.max) {
                warnings.push(`Temperature ${temp}K seems unusual`);
            }
        }

        // Period validation
        const period = parseFloat(planetData.koi_period);
        if (period !== undefined && !isNaN(period)) {
            if (period < this.validationRules.period.min || period > this.validationRules.period.max) {
                warnings.push(`Orbital period ${period} days seems unusual`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    validateBatch(planets) {
        const results = {
            valid: 0,
            invalid: 0,
            warnings: 0
        };

        planets.forEach(planet => {
            const validation = this.validatePlanet(planet);
            if (validation.valid) {
                results.valid++;
            } else {
                results.invalid++;
            }
            results.warnings += validation.warnings.length;
        });

        return results;
    }

    renderValidation(containerId, planetData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const validation = this.validatePlanet(planetData);

        container.innerHTML = `
            <div class="data-validation" style="background: rgba(0, 0, 0, 0.6); border: 2px solid ${validation.valid ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: ${validation.valid ? '#4ade80' : '#ef4444'}; margin: 0 0 1.5rem 0;">
                    ${validation.valid ? '✅ Valid Data' : '❌ Validation Errors'}
                </h3>
                ${validation.errors.length > 0 ? `
                    <div style="margin-bottom: 1rem;">
                        <h4 style="color: #ef4444; margin: 0 0 0.5rem 0;">Errors:</h4>
                        ${validation.errors.map(err => `
                            <div style="padding: 0.75rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 8px; margin-bottom: 0.5rem; color: #ef4444;">
                                ${err}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${validation.warnings.length > 0 ? `
                    <div>
                        <h4 style="color: #fbbf24; margin: 0 0 0.5rem 0;">Warnings:</h4>
                        ${validation.warnings.map(warn => `
                            <div style="padding: 0.75rem; background: rgba(251, 191, 36, 0.2); border: 1px solid rgba(251, 191, 36, 0.5); border-radius: 8px; margin-bottom: 0.5rem; color: #fbbf24;">
                                ${warn}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDataValidation = PlanetDataValidation;
    window.planetDataValidation = new PlanetDataValidation();
}

