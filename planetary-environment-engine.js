/**
 * Planetary Simulation & Environment Engine (PSEE) - FINAL MONOLITHIC VERSION
 * 
 * Unifies climate physics, orbital mechanics, spectroscopy, and population.
 */

class PlanetaryEnvironmentEngine {
    constructor(planet) {
        this.planet = { mass: planet.mass || 5.97e24, radius: planet.radius || 6371000, population: 0, health: 1.0, albedo: 0.3 };
        this.atmo = { composition: { n2: 0.78, o2: 0.21, co2: 0.0004 }, pressure: 1.0, opacity: 1.0, greenhouse: 1.0 };
        this.climate = { meanTemp: 288, solarFlux: 1361, thermalInertia: 0.85 };
    }

    /**
     * Radiative Forcing Climate Model (Stefan-Boltzmann).
     */
    tickClimate(deltaTime) {
        const ice = Math.max(0, (273 - this.climate.meanTemp) / 100);
        this.planet.albedo = 0.3 + (ice * 0.5);
        const extinction = Math.exp(-this.atmo.opacity * 1.5);
        const absorbed = (this.climate.solarFlux * (1 - this.planet.albedo) * extinction) / 4;
        const targetT = Math.pow((absorbed * this.atmo.greenhouse) / 5.67e-8, 0.25);
        this.climate.meanTemp += (targetT - this.climate.meanTemp) * (1 - this.climate.thermalInertia) * deltaTime;
        return this.climate.meanTemp;
    }

    /**
     * Irradiance Model (Lambert Cosine Law & Beer-Lambert).
     */
    getSurfaceIrradiance(latitude, time, period) {
        const angle = Math.sin(time / period * 2 * Math.PI);
        if (angle <= 0) return 0;
        const zenith = Math.acos(angle * Math.cos(latitude * Math.PI / 180));
        return this.climate.solarFlux * Math.cos(zenith) * Math.exp(-this.atmo.opacity / Math.cos(zenith));
    }

    /**
     * Spectroscopy & Biosignatures.
     */
    detectLife() {
        const prob = Math.min(1.0, this.atmo.composition.co2 * this.atmo.composition.o2 * 1000);
        return { probability: prob, status: prob > 0.7 ? 'BIOGENIC' : 'INERT' };
    }

    /**
     * Logistic Population Growth (Verhulst).
     */
    updatePopulation(deltaTime, food) {
        const K = 10e9 * this.planet.health * Math.min(1.0, food / 100);
        const growth = 0.02 * this.planet.population * (1 - this.planet.population / Math.max(1, K));
        this.planet.population += growth * deltaTime;
    }
}

if (typeof window !== 'undefined') window.environmentEngine = new PlanetaryEnvironmentEngine({ mass: 5.97e24 });
if (typeof module !== 'undefined') module.exports = PlanetaryEnvironmentEngine;