/**
 * Planet Discovery A/B Testing Framework
 * Framework for running A/B tests and experiments
 */

class PlanetDiscoveryABTesting {
    constructor() {
        this.experiments = new Map();
        this.variants = new Map();
        this.init();
    }

    init() {
        this.loadExperiments();
        console.log('🧪 A/B testing framework initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ab_te_st_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createExperiment(name, variants, options = {}) {
        const experiment = {
            name,
            variants: variants.map(v => v.name),
            trafficSplit: options.trafficSplit || this.equalSplit(variants.length),
            startDate: options.startDate || new Date().toISOString(),
            endDate: options.endDate || null,
            enabled: options.enabled !== false,
            metrics: options.metrics || []
        };

        this.experiments.set(name, experiment);
        this.saveExperiments();

        // Assign user to a variant
        const variant = this.assignVariant(name, variants);
        this.variants.set(name, variant);

        return variant;
    }

    equalSplit(count) {
        return Array(count).fill(1 / count);
    }

    assignVariant(experimentName, variants) {
        const experiment = this.experiments.get(experimentName);
        if (!experiment || !experiment.enabled) {
            return variants[0]; // Default to first variant
        }

        // Check if user already has a variant assigned
        const stored = localStorage.getItem(`ab_test_${experimentName}`);
        if (stored) {
            const storedVariant = variants.find(v => v.name === stored);
            if (storedVariant) {
                return storedVariant;
            }
        }

        // Assign based on traffic split
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < variants.length; i++) {
            cumulative += experiment.trafficSplit[i];
            if (random <= cumulative) {
                const selected = variants[i];
                localStorage.setItem(`ab_test_${experimentName}`, selected.name);
                this.variants.set(experimentName, selected);
                return selected;
            }
        }

        // Fallback to first variant
        return variants[0];
    }

    getVariant(experimentName) {
        return this.variants.get(experimentName) || null;
    }

    trackConversion(experimentName, conversionName, value = 1) {
        const variant = this.getVariant(experimentName);
        if (!variant) return;

        const conversion = {
            experiment: experimentName,
            variant: variant.name,
            conversion: conversionName,
            value: value,
            timestamp: new Date().toISOString()
        };

        // Store conversion
        this.saveConversion(conversion);

        // Send to analytics
        if (typeof planetDiscoveryAnalyticsTracking !== 'undefined') {
            planetDiscoveryAnalyticsTracking.track('ab_test_conversion', conversion);
        }
    }

    saveConversion(conversion) {
        try {
            const conversions = JSON.parse(localStorage.getItem('ab_test_conversions') || '[]');
            conversions.push(conversion);
            localStorage.setItem('ab_test_conversions', JSON.stringify(conversions));
        } catch (error) {
            console.error('Error saving conversion:', error);
        }
    }

    loadExperiments() {
        try {
            const saved = localStorage.getItem('ab_test_experiments');
            if (saved) {
                const experiments = JSON.parse(saved);
                experiments.forEach(exp => {
                    this.experiments.set(exp.name, exp);
                });
            }
        } catch (error) {
            console.error('Error loading experiments:', error);
        }
    }

    saveExperiments() {
        try {
            const experiments = Array.from(this.experiments.values());
            localStorage.setItem('ab_test_experiments', JSON.stringify(experiments));
        } catch (error) {
            console.error('Error saving experiments:', error);
        }
    }

    getExperimentResults(experimentName) {
        const experiment = this.experiments.get(experimentName);
        if (!experiment) return null;

        try {
            const conversions = JSON.parse(localStorage.getItem('ab_test_conversions') || '[]');
            const experimentConversions = conversions.filter(c => c.experiment === experimentName);

            const results = {};
            experiment.variants.forEach(variant => {
                const variantConversions = experimentConversions.filter(c => c.variant === variant);
                results[variant] = {
                    conversions: variantConversions.length,
                    totalValue: variantConversions.reduce((sum, c) => sum + (c.value || 1), 0)
                };
            });

            return results;
        } catch (error) {
            console.error('Error getting experiment results:', error);
            return null;
        }
    }

    renderExperimentResults(containerId, experimentName) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const results = this.getExperimentResults(experimentName);
        if (!results) {
            container.innerHTML = '<p>No results available</p>';
            return;
        }

        container.innerHTML = `
            <div class="ab-test-results" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">🧪 A/B Test Results: ${experimentName}</h3>
                <div style="display: grid; gap: 1rem;">
                    ${Object.entries(results).map(([variant, data]) => `
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 10px;">
                            <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${variant}</h4>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Conversions: ${data.conversions}</span>
                                <span>Total Value: ${data.totalValue}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryABTesting = new PlanetDiscoveryABTesting();
}

