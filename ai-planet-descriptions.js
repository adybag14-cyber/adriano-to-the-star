/**
 * AI-Generated Planet Descriptions
 * Auto-generate detailed planet descriptions using AI
 */

class AIPlanetDescriptions {
    constructor() {
        this.cache = new Map();
        this.apiKey = window.GEMINI_API_KEY || null;
        this.init();
    }

    init() {
        // Load cache from localStorage
        this.loadCache();
        this.trackEvent('planet_descriptions_initialized');
    }

    /**
     * Load cache from localStorage
     */
    loadCache() {
        try {
            const cached = localStorage.getItem('ai-planet-descriptions');
            if (cached) {
                const parsed = JSON.parse(cached);
                this.cache = new Map(Object.entries(parsed));
            }
        } catch (e) {
            console.error('Error loading AI descriptions cache:', e);
        }
    }

    /**
     * Save cache to localStorage
     * Enhanced with size limit to prevent localStorage overflow
     */
    saveCache() {
        try {
            const obj = Object.fromEntries(this.cache);
            const json = JSON.stringify(obj);

            // Check size (localStorage limit is ~5-10MB)
            if (json.length > 4 * 1024 * 1024) { // 4MB limit
                // Remove oldest entries (keep last 100)
                const entries = Array.from(this.cache.entries());
                const toKeep = entries.slice(-100);
                this.cache = new Map(toKeep);
                const reducedObj = Object.fromEntries(this.cache);
                localStorage.setItem('ai-planet-descriptions', JSON.stringify(reducedObj));
                console.log('⚠️ Cache size limit reached, keeping only 100 most recent entries');
            } else {
                localStorage.setItem('ai-planet-descriptions', JSON.stringify(obj));
            }
        } catch (e) {
            console.error('Error saving AI descriptions cache:', e);
            // If quota exceeded, clear old entries
            if (e.name === 'QuotaExceededError') {
                const entries = Array.from(this.cache.entries());
                const toKeep = entries.slice(-50);
                this.cache = new Map(toKeep);
                try {
                    localStorage.setItem('ai-planet-descriptions', JSON.stringify(Object.fromEntries(this.cache)));
                } catch (e2) {
                    console.error('Failed to save reduced cache:', e2);
                }
            }
        }
    }

    /**
     * Track event
     */
    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`planet_descriptions_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_planet_descriptions', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Generate planet description using AI
     */
    async generateDescription(planetData) {
        const kepid = planetData.kepid || planetData.kepoi_name;
        if (!kepid) return null;

        // Check cache first
        if (this.cache.has(kepid)) {
            return this.cache.get(kepid);
        }

        // Check if API key or Helper is available
        const helperAvailable = typeof window !== 'undefined'
            && window.geminiLiveHelper
            && typeof window.geminiLiveHelper === 'function';

        if (!this.apiKey && !helperAvailable) {
            return this.getFallbackDescription(planetData);
        }

        try {
            const description = await this.callGeminiAPI(planetData);

            // Cache the description
            this.cache.set(kepid, description);
            this.saveCache();

            if (window.aiUsageLogger && typeof window.aiUsageLogger.log === 'function') {
                window.aiUsageLogger.log({
                    feature: 'ai-planet-descriptions',
                    model: 'gemini-2.5-flash-live',
                    context: {
                        kepid,
                        name: planetData.kepler_name || planetData.kepoi_name || null
                    }
                });
            }

            this.trackEvent('description_generated', { kepid });
            return description;
        } catch (error) {
            console.error('Error generating AI description:', error);
            return this.getFallbackDescription(planetData);
        }
    }

    /**
     * Call Gemini API to generate description
     * Uses gemini-2.5-flash-live model (free tier has unlimited requests)
     */
    async callGeminiAPI(planetData) {
        const prompt = this.buildPrompt(planetData);

        try {
            // Prefer the shared GeminiLiveHelper, which routes through the Supabase Edge Function proxy
            const helper = (typeof window !== 'undefined' && window.geminiLiveHelper)
                ? window.geminiLiveHelper()
                : null;

            if (helper && typeof helper.callWithFallback === 'function') {
                const text = await helper.callWithFallback(prompt, {
                    modelName: 'gemini-2.5-flash',
                    temperature: 0.7,
                    maxOutputTokens: 16384
                });

                if (text && typeof text === 'string') {
                    console.log('✅ AI description generated via Gemini proxy');
                    return text.trim();
                }
            } else {
                console.warn('⚠️ Gemini helper not available. Using fallback description.');
                return this.getFallbackDescription(planetData);
            }
        } catch (error) {
            console.error('Error generating AI planet description via Gemini:', error);
            return this.getFallbackDescription(planetData);
        }
    }

    /**
     * Build prompt for AI
     */
    buildPrompt(planetData) {
        // Use available data fields (handle both kepler_data_parsed.js format and NASA API format)
        // Helper to format values or return null
        const fmt = (val, suffix = '', fallback = null) =>
            (val && val !== 'null' && val !== 'undefined' && val !== 'Unknown') ? `${val} ${suffix}` : fallback;

        const radius = fmt(planetData.radius || planetData.koi_prad, 'Earth radii', 'not available');
        const mass = fmt(planetData.mass || planetData.koi_mass, 'Earth masses', 'not available');
        const distance = fmt(planetData.distance || planetData.koi_dor, 'light-years', 'not available');
        const period = fmt(planetData.period || planetData.koi_period, 'days', 'not available');
        const temp = fmt(planetData.temp || planetData.koi_teq, 'K', 'not available');
        const status = planetData.status || planetData.koi_pdisposition || 'Candidate';
        const planetName = planetData.kepler_name || planetData.kepoi_name || `KOI-${planetData.kepid}`;
        const planetType = planetData.type || this.inferType(planetData);

        return `Generate a detailed, engaging description for an exoplanet with the following characteristics:

Planet Name: ${planetName}
Type: ${planetType}
Radius: ${radius}
Mass: ${mass}
Distance: ${distance}
Orbital Period: ${period}
Equilibrium Temperature: ${temp}
Status: ${status}

Instructions:
1. Write a 2-3 paragraph description suitable for a space enthusiast.
2. If specific data points (Radius, Mass, etc.) are marked "not available", DO NOT mention them directly or say "unknown". Instead, focus on the planet's status, potential classification based on available data, or general scientific context of such discoveries.
3. If the planet type is known (e.g. Gas Giant), describe what that generally means even if exact mass is missing.
4. If temperature is available, speculate on habitability. If not, don't mention it.
5. Make it sound scientific yet accessible (NASA style). Avoid repetitive phrases like "based on the data".`;
    }

    /**
     * Infer planet type from data
     */
    inferType(planetData) {
        const radius = parseFloat(planetData.radius || planetData.koi_prad);
        if (isNaN(radius)) return 'Exoplanet Candidate';
        if (radius > 10) return 'Gas Giant';
        if (radius > 6) return 'Ice Giant';
        if (radius > 1.5) return 'Super-Earth';
        if (radius > 0.8) return 'Earth-like';
        return 'Terrestrial';
    }

    /**
     * Get fallback description if AI is unavailable
     */
    getFallbackDescription(planetData) {
        const getName = () => planetData.kepler_name || planetData.kepoi_name || `KOI-${planetData.kepid}`;
        const val = (v) => (v && v !== 'null' && v !== 'undefined' && v !== 'Unknown') ? v : null;

        const name = getName();
        const dist = val(planetData.distance || planetData.koi_dor);
        const rad = val(planetData.radius || planetData.koi_prad);
        const period = val(planetData.period || planetData.koi_period);
        const temp = val(planetData.temp || planetData.koi_teq);
        const disp = planetData.koi_pdisposition || 'CANDIDATE';
        const isConfirmed = disp === 'CONFIRMED';

        let desc = `<strong>${name}</strong> is an exoplanet ${isConfirmed ? 'confirmed' : 'candidate'}`;

        if (dist) desc += ` located approximately ${dist} light-years from Earth.`;
        else desc += ` located at an undetermined distance from our solar system.`;

        desc += `\n\n`;

        if (rad && period) {
            desc += `Observations indicate it has a radius of ${rad} Earth radii and orbits its host star every ${period} days.`;
        } else if (rad) {
            desc += `It has an estimated radius of ${rad} Earth radii.`
        } else if (period) {
            desc += `It completes an orbit around its star every ${period} days.`;
        } else {
            desc += `Specific orbital and physical parameters are currently being refined through further observation.`;
        }

        if (temp) {
            desc += ` With an equilibrium temperature of approximately ${temp} K, it resides in a thermal zone that likely influences its composition.`;
        }

        desc += `\n\n`;

        if (isConfirmed) {
            desc += `As a confirmed world, it adds to our growing catalog of planets beyond our solar system, offering further insight into planetary formation.`;
        } else {
            desc += `As a planetary candidate, further analysis and follow-up observations are required to fully confirm its nature and composition.`;
        }

        return desc;
    }

    /**
     * Get cached description
     */
    getCachedDescription(kepid) {
        return this.cache.get(kepid) || null;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        localStorage.removeItem('ai-planet-descriptions');
    }

    /**
     * Render description in UI
     */
    renderDescription(container, planetData) {
        if (!container) return;

        const kepid = planetData.kepid || planetData.kepoi_name;
        const cached = this.getCachedDescription(kepid);

        if (cached) {
            container.innerHTML = `
                <div class="ai-description">
                    <div class="ai-description-header">
                        <span class="ai-badge">🤖 AI Generated</span>
                        <button class="regenerate-btn" onclick="aiPlanetDescriptions.regenerateDescription('${kepid}')">
                            🔄 Regenerate
                        </button>
                    </div>
                    <div class="ai-description-content">
                        ${cached}
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="ai-description-loading">
                    <button class="generate-description-btn" onclick="aiPlanetDescriptions.generateAndRender('${kepid}', this)">
                        🤖 Generate AI Description
                    </button>
                </div>
            `;
        }
    }

    /**
     * Generate and render description
     */
    async generateAndRender(kepid, button) {
        if (!button) return;

        button.disabled = true;
        button.textContent = '🔄 Generating...';

        // Get planet data
        let planetData = { kepid };

        // Try to fetch full data from database
        if (window.databaseInstance && window.databaseInstance.allData) {
            const fullData = window.databaseInstance.allData.find(p =>
                String(p.kepid) === String(kepid) ||
                String(p.kepoi_name) === String(kepid) ||
                String(p.kepler_name) === String(kepid)
            );
            if (fullData) {
                planetData = fullData;
            }
        }

        try {
            const description = await this.generateDescription(planetData);

            if (description) {
                const container = button.closest('.ai-description-loading, .ai-description');
                if (container) {
                    this.renderDescription(container.parentElement, planetData);
                }
            }
        } catch (error) {
            console.error('Error generating description:', error);
            button.textContent = '❌ Error - Try Again';
            button.disabled = false;
        }
    }

    /**
     * Regenerate description
     */
    async regenerateDescription(kepid) {
        // Remove from cache
        this.cache.delete(kepid);
        this.saveCache();

        // Regenerate
        const planetData = { kepid };
        await this.generateDescription(planetData);

        // Re-render
        const container = document.querySelector(`[data-kepid="${kepid}"] .ai-description-container`);
        if (container) {
            this.renderDescription(container, planetData);
        }
    }
}

// Initialize AI planet descriptions
let aiPlanetDescriptionsInstance = null;

function initAIPlanetDescriptions() {
    if (!aiPlanetDescriptionsInstance) {
        aiPlanetDescriptionsInstance = new AIPlanetDescriptions();
        window.aiPlanetDescriptions = aiPlanetDescriptionsInstance;
    }
    return aiPlanetDescriptionsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIPlanetDescriptions);
} else {
    initAIPlanetDescriptions();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPlanetDescriptions;
}

// Make available globally
// Make available globally
window.AIPlanetDescriptions = AIPlanetDescriptions;
// Assign the instance directly when initialized
window.initAIPlanetDescriptions = initAIPlanetDescriptions;



