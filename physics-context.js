/**
 * PhysicsContext.js
 * Defines the physical laws for a specific universe.
 * Allows for "Variable Physics" where G, c, and other constants can change.
 */

class PhysicsContext {
    constructor(config = {}) {
        // Default to "Earth-like" / "Prime Universe" physics
        this.name = config.name || 'Prime Physics';
        this.gravity = config.gravity !== undefined ? config.gravity : 9.81; // m/s^2
        this.timeScale = config.timeScale !== undefined ? config.timeScale : 1.0; // 1.0 = normal
        this.speedOfLight = config.speedOfLight !== undefined ? config.speedOfLight : 299792.458; // km/s (affects comms delay)
        this.entropyRate = config.entropyRate !== undefined ? config.entropyRate : 1.0; // Decay rate of structures/resources
        this.fluidViscosity = config.fluidViscosity !== undefined ? config.fluidViscosity : 1.0; // Affects movement/drag

        // Visual properties
        this.skyColor = config.skyColor || 0x020617;
        this.starDensity = config.starDensity !== undefined ? config.starDensity : 1.0;
        this.fogDensity = config.fogDensity !== undefined ? config.fogDensity : 0.0015;
    }

    /**
     * Presets for different universe types
     */
    static get PRESETS() {
        return {
            PRIME: new PhysicsContext({
                name: 'Prime Universe',
                gravity: 9.81,
                timeScale: 1.0,
                speedOfLight: 299792,
                entropyRate: 1.0,
                fluidViscosity: 1.0,
                skyColor: 0x020617
            }),
            HIGH_GRAVITY: new PhysicsContext({
                name: 'Heavy World',
                gravity: 24.79, // Jupiter-like
                timeScale: 0.8, // Time moves slower near massive objects (simplified relativity)
                speedOfLight: 299792,
                entropyRate: 1.5, // things crush/break faster
                fluidViscosity: 2.0,
                skyColor: 0x1a0f00,
                fogDensity: 0.005
            }),
            TIME_DILATED: new PhysicsContext({
                name: 'Chronos Rift',
                gravity: 5.0,
                timeScale: 5.0, // Time moves extremely fast
                speedOfLight: 100000, // Slower light = noticeable delays
                entropyRate: 5.0, // Rapid decay
                fluidViscosity: 0.5,
                skyColor: 0x0f001a,
                starDensity: 0.1 // Stars have burnt out or moved
            }),
            FLUIDIC: new PhysicsContext({
                name: 'The Void',
                gravity: 0.1, // Microgravity
                timeScale: 1.0,
                speedOfLight: 200000,
                entropyRate: 0.5, // Slow decay, suspended animation feel
                fluidViscosity: 50.0, // Moving through "soup"
                skyColor: 0x001a1a,
                fogDensity: 0.02 // Very thick fog (liquid)
            }),
            MIRROR: new PhysicsContext({
                name: 'Mirror Verse',
                gravity: 9.81,
                timeScale: 1.0,
                speedOfLight: 299792,
                entropyRate: 1.0,
                fluidViscosity: 1.0,
                skyColor: 0x2a0000 // Red tinted sky
            })
        };
    }
}

window.PhysicsContext = PhysicsContext;
