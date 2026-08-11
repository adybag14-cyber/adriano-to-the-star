/**
 * Atmospheric Simulation System
 * Q1 2025 Feature: Dynamic Planetary Simulation
 * 
 * Handles:
 * - Variable atmospheric density/pressure
 * - Dynamic weather events (Dust storms, rain, aurora)
 * - Seasonal cycles based on orbital mechanics
 */
class AtmosphericSimulation {
    constructor(planetData) {
        this.data = planetData;
        this.pressure = this.calculatePressure(); // atm
        this.composition = this.determineComposition();
        this.weatherState = 'clear'; // clear, cloudy, storm, extreme
        this.season = 'spring'; // spring, summer, autumn, winter
        this.temperature = planetData.temp || 288; // Kelvin

        // Simulation params
        this.cloudCover = 0.2; // 0.0 to 1.0
        this.stormIntensity = 0.0; // 0.0 to 1.0
        this.lastUpdate = Date.now();
    }

    calculatePressure() {
        // Estimate pressure based on radius/mass (simplified)
        // Earth = 1 atm
        const radius = this.data.radius || 1;
        if (radius < 0.5) return 0.01; // Mars-like or Moon-like
        if (radius > 10) return 1000; // Gas Giant
        return Math.pow(radius, 2); // Rough approximation
    }

    determineComposition() {
        if (this.pressure > 100) return ['Hydrogen', 'Helium'];
        if (this.pressure < 0.1) return ['Carbon Dioxide'];
        return ['Nitrogen', 'Oxygen']; // Earth-like default
    }

    update(deltaTime) {
        // Simulate dynamic weather changes
        if (Math.random() < 0.001) {
            this.changeWeather();
        }

        // Rotate seasons (mock cycle)
        // In a real game, this would be tied to game time/orbit
        if (Math.random() < 0.0001) {
            this.nextSeason();
        }
    }

    changeWeather() {
        const types = ['clear', 'cloudy', 'storm'];
        // Weight probabilities based on pressure
        if (this.pressure < 0.1) {
            // Thin atmosphere = mostly clear, occasional dust
            this.weatherState = Math.random() > 0.9 ? 'storm' : 'clear';
        } else {
            this.weatherState = types[Math.floor(Math.random() * types.length)];
        }

        console.log(`[Atmos] Weather changed to ${this.weatherState} on ${this.data.kepler_name}`);
    }

    nextSeason() {
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        const currentIdx = seasons.indexOf(this.season);
        this.season = seasons[(currentIdx + 1) % 4];
        console.log(`[Atmos] Season changed to ${this.season}`);
    }

    getVisualParams() {
        // Return parameters for the renderer (Three.js)
        return {
            cloudOpacity: this.weatherState === 'clear' ? 0.1 : (this.weatherState === 'storm' ? 0.9 : 0.5),
            stormColor: this.pressure < 0.1 ? 0xc2b280 : 0x444444, // Dust vs Rain clouds
            atmosphereColor: this.getSkyColor()
        };
    }

    getSkyColor() {
        // Rayleigh scattering approximation
        if (this.composition.includes('Carbon Dioxide')) return 0xffccaa; // Red/Orange
        if (this.composition.includes('Hydrogen')) return 0xffeecc; // Pale yellow
        return 0x88ccff; // Blue
    }
}

// Export for usage
if (typeof window !== 'undefined') {
    window.AtmosphericSimulation = AtmosphericSimulation;
}
