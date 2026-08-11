/**
 * Planet Weather Simulation
 * Simulate atmospheric conditions on exoplanets
 */

class PlanetWeatherSimulation {
    constructor() {
        this.simulations = [];
        this.currentSimulation = null;
        this.isInitialized = false;

        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('🌦️ Planet Weather Simulation initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tw_ea_th_er_si_mu_la_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Simulate weather for a planet
     */
    simulateWeather(planetData) {
        const season = this.calculateSeason(planetData);
        const temperature = this.calculateTemperature(planetData, season);

        const simulation = {
            planetId: planetData.kepid,
            planetName: planetData.kepler_name || planetData.kepoi_name,
            season: season,
            seasonName: this.getSeasonName(season),
            temperature: temperature,
            pressure: this.calculatePressure(planetData),
            windSpeed: this.calculateWindSpeed(planetData),
            atmosphericComposition: this.estimateAtmosphericComposition(planetData),
            weatherConditions: this.generateWeatherConditions(planetData, temperature),
            timestamp: new Date().toISOString()
        };

        this.currentSimulation = simulation;
        return simulation;
    }

    /**
     * Calculate current season based on orbital period and simulated time
     * Returns 0-1 (0=Spring, 0.25=Summer, 0.5=Autumn, 0.75=Winter)
     */
    calculateSeason(planetData) {
        // Use current time and orbital period to determine position in orbit
        const period = parseFloat(planetData.koi_period) || 365;
        const now = Date.now() / (1000 * 60 * 60 * 24); // Days since epoch
        return (now % period) / period;
    }

    getSeasonName(seasonProgress) {
        if (seasonProgress < 0.25) return "Spring";
        if (seasonProgress < 0.50) return "Summer";
        if (seasonProgress < 0.75) return "Autumn";
        return "Winter";
    }

    /**
     * Calculate surface temperature with seasonal variation
     */
    calculateTemperature(planetData, seasonProgress = 0) {
        const equilibriumTemp = parseFloat(planetData.koi_teq) || 300;
        const radius = parseFloat(planetData.radius) || 1;

        // Adjust for greenhouse effect (rough estimate)
        let surfaceTemp = equilibriumTemp;

        // Larger planets might have thicker atmospheres
        if (radius > 2) {
            surfaceTemp += 50; // Greenhouse effect
        }

        // Seasonal Variation based on orbital eccentricity (simulated)
        // Assume some axial tilt for all planets for gameplay interest
        // Summer (0.25-0.5) is hottest, Winter (0.75-1.0) is coldest
        const seasonalVariation = Math.sin(seasonProgress * Math.PI * 2) * 20; // +/- 20K swing
        surfaceTemp += seasonalVariation;

        return {
            kelvin: surfaceTemp,
            celsius: surfaceTemp - 273.15,
            fahrenheit: (surfaceTemp - 273.15) * 9 / 5 + 32
        };
    }

    /**
     * Calculate atmospheric pressure
     */
    calculatePressure(planetData) {
        const radius = parseFloat(planetData.radius) || 1;
        const mass = parseFloat(planetData.mass) || 1;

        // Rough estimate based on size and mass
        let pressure = 1; // Earth = 1 atm

        if (radius < 0.5) {
            pressure = 0.1; // Small planets, thin atmosphere
        } else if (radius > 2) {
            pressure = 5 + (radius - 2) * 2; // Larger planets, thicker atmosphere
        }

        return {
            atm: pressure,
            bar: pressure * 1.01325,
            psi: pressure * 14.696
        };
    }

    /**
     * Calculate wind speed
     */
    calculateWindSpeed(planetData) {
        const period = parseFloat(planetData.koi_period) || 365;
        const radius = parseFloat(planetData.radius) || 1;

        // Faster rotation = stronger winds (rough estimate)
        let windSpeed = 10; // Base 10 m/s

        if (period < 10) {
            windSpeed = 50; // Tidally locked, extreme winds
        } else if (period < 50) {
            windSpeed = 30; // Fast rotation
        }

        // Larger planets might have stronger winds
        if (radius > 2) {
            windSpeed *= 1.5;
        }

        return {
            ms: windSpeed,
            kmh: windSpeed * 3.6,
            mph: windSpeed * 2.237
        };
    }

    /**
     * Estimate atmospheric composition
     */
    estimateAtmosphericComposition(planetData) {
        const type = (planetData.type || '').toLowerCase();
        const radius = parseFloat(planetData.radius) || 1;

        if (type.includes('gas') || type.includes('giant')) {
            return {
                hydrogen: 85,
                helium: 13,
                methane: 1,
                ammonia: 1
            };
        } else if (radius >= 0.8 && radius <= 1.5) {
            // Earth-like
            return {
                nitrogen: 78,
                oxygen: 21,
                argon: 0.9,
                carbonDioxide: 0.04,
                other: 0.06
            };
        } else {
            // Unknown/rocky
            return {
                carbonDioxide: 60,
                nitrogen: 30,
                methane: 5,
                other: 5
            };
        }
    }

    /**
     * Generate weather conditions
     */
    generateWeatherConditions(planetData, tempObj) {
        const temp = tempObj || this.calculateTemperature(planetData);
        const pressure = this.calculatePressure(planetData);
        const wind = this.calculateWindSpeed(planetData);

        const conditions = [];

        if (temp.kelvin < 273) {
            conditions.push('Freezing');
            conditions.push('Ice Storms');
        } else if (temp.kelvin > 373) {
            conditions.push('Scorching');
            conditions.push('Extreme Heat');
        } else {
            conditions.push('Moderate');
        }

        if (wind.ms > 30) {
            conditions.push('High Winds');
        }

        if (pressure.atm > 5) {
            conditions.push('High Pressure');
        }

        return conditions;
    }

    /**
     * Render weather simulation UI
     */
    renderWeatherSimulation(containerId, planetData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const simulation = this.simulateWeather(planetData);

        const seasonIcon = {
            'Spring': '🌱',
            'Summer': '☀️',
            'Autumn': '🍂',
            'Winter': '❄️'
        }[simulation.seasonName] || '🌍';

        container.innerHTML = `
            <div class="weather-simulation" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">🌦️ Weather Simulation: ${simulation.planetName}</h3>
                    <div class="season-badge" style="background: rgba(186, 148, 79, 0.2); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; font-weight: bold;">
                        ${seasonIcon} ${simulation.seasonName}
                    </div>
                </div>
                
                <div class="weather-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="weather-card" style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Temperature</div>
                        <div style="color: #e0e0e0; font-size: 1.5rem; font-weight: 600;">${simulation.temperature.celsius.toFixed(1)}°C</div>
                        <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; margin-top: 0.25rem;">${simulation.temperature.fahrenheit.toFixed(1)}°F</div>
                    </div>

                    <div class="weather-card" style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Pressure</div>
                        <div style="color: #e0e0e0; font-size: 1.5rem; font-weight: 600;">${simulation.pressure.atm.toFixed(2)} atm</div>
                        <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; margin-top: 0.25rem;">${simulation.pressure.bar.toFixed(2)} bar</div>
                    </div>

                    <div class="weather-card" style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.5rem;">Wind Speed</div>
                        <div style="color: #e0e0e0; font-size: 1.5rem; font-weight: 600;">${simulation.windSpeed.ms.toFixed(1)} m/s</div>
                        <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; margin-top: 0.25rem;">${simulation.windSpeed.kmh.toFixed(1)} km/h</div>
                    </div>
                </div>

                <div class="atmospheric-composition" style="margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Atmospheric Composition</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                        ${Object.entries(simulation.atmosphericComposition).map(([gas, percentage]) => `
                            <div style="padding: 1rem; background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 8px; text-align: center;">
                                <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.25rem;">${gas}</div>
                                <div style="color: #e0e0e0; font-size: 1.2rem;">${percentage}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="weather-conditions">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Weather Conditions</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${simulation.weatherConditions.map(condition => `
                            <span style="padding: 0.5rem 1rem; background: rgba(74, 144, 226, 0.2); border: 1px solid rgba(74, 144, 226, 0.5); border-radius: 6px; color: #4a90e2;">
                                ${condition}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.PlanetWeatherSimulation = PlanetWeatherSimulation;
    window.planetWeatherSimulation = new PlanetWeatherSimulation();
}
