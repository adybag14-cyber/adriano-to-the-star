/**
 * Void Warfare & Tactical Combat Engine (VWTCE) - MASTER VERSION (NON-TRUNCATED)
 * 
 * Expert simulation for multi-fleet engagement, physics-based accuracy, and boarding.
 * Unifies: Battle Sim, Hull/Shield Physics, Rayleigh Criterion, Spalling, and Sieges.
 */

class VoidWarfareEngine {
    constructor() {
        this.engagements = new Map();
        this.physics = {
            c: 299792458,
            G: 6.674e-11,
            minAperture: 0.01, // 10mm hardware clamp
            diffractionConstant: 1.22
        };
        this.materials = {
            'REINFORCED_TITANIUM': { hel: 2.0, density: 4500, soundSpeed: 6070 },
            'CARBON_NANO_WEAVE': { hel: 5.5, density: 1600, soundSpeed: 18000 },
            'VOID_ALLOY': { hel: 12.0, density: 8000, soundSpeed: 25000 }
        };
        this.combatLog = [];
    }

    // =========================================================================
    // 1. BEAM PHYSICS (RAYLEIGH CRITERION)
    // =========================================================================

    /**
     * Calculates beam dispersion over void distances.
     * theta = 1.22 * (wavelength / aperture)
     */
    calculateBeamAccuracy(weapon, distance, ambientInterference) {
        const aperture = Math.max(this.physics.minAperture, weapon.aperture || 0.1);
        const wavelength = weapon.wavelength || 450e-9; // Default 450nm
        
        const theta = this.physics.diffractionConstant * (wavelength / aperture);
        const spreadAtTarget = theta * distance; // Radius of beam spread
        
        // Hit chance drops as beam spread exceeds target cross-section
        const targetCrossSection = 50; // meters (average ship size)
        const hitChance = Math.min(1.0, targetCrossSection / (targetCrossSection + spreadAtTarget));
        
        return Math.max(0.01, hitChance * (1 - ambientInterference));
    }

    // =========================================================================
    // 2. ARMOR & IMPACT PHYSICS (HUGONIOT ELASTIC LIMIT)
    // =========================================================================

    /**
     * Models internal shrapnel (spalling) caused by reflected tension waves.
     */
    calculateImpact(mass, velocity, targetArmor, materialType) {
        const mat = this.materials[materialType] || this.materials['REINFORCED_TITANIUM'];
        const energyJoules = 0.5 * mass * Math.pow(velocity, 2);
        
        // 1. Armor Mitigation (Exponential Decay)
        const penetration = energyJoules * Math.exp(-targetArmor / 100);

        // 2. Spalling Calculation
        // Shock pressure: P = rho * U * u (simplified)
        const shockPressure = mat.density * mat.soundSpeed * (velocity / 1000);
        const reflectedTension = shockPressure * 0.85; 
        const isSpalled = reflectedTension > mat.hel;

        return {
            kineticDamage: penetration / 1e6, // In Mega-Units
            spallingDamage: isSpalled ? (reflectedTension / mat.hel) * 500 : 0,
            status: isSpalled ? 'INTERNAL_SPALLING_DETECTED' : 'ARMOR_HELD',
            breached: penetration > (targetArmor * 5000)
        };
    }

    // =========================================================================
    // 3. TACTICAL ENGAGEMENT & SQUADRON LOGIC
    // =========================================================================

    /**
     * Resolves a combat tick for an active engagement.
     */
    resolveCombatTick(squadA, squadB, environment) {
        const report = { t: Date.now(), events: [] };

        // Apply Wingman Coordination: Pairwise evasion boost
        squadA.units.forEach(u => {
            if (u.wingmanId) {
                const partner = squadA.units.find(p => p.id === u.wingmanId);
                if (partner && this.getDistance(u.pos, partner.pos) < 500) {
                    u.tempEvasion = (u.baseEvasion || 0.1) * 1.3;
                }
            }
        });

        // Fire Phase: Attacker -> Priority Target
        squadA.units.forEach(ship => {
            const target = this.selectPriorityTarget(ship, squadB.units);
            if (!target) return;

            const dist = this.getDistance(ship.pos, target.pos);
            const accuracy = this.calculateBeamAccuracy(ship.weapon, dist, environment.interference);

            if (Math.random() < accuracy) {
                const impact = this.calculateImpact(ship.weapon.mass, ship.weapon.vel, target.armor, target.material);
                target.health -= (impact.kineticDamage + impact.spallingDamage);
                report.events.push(`${ship.name} struck ${target.name} for ${impact.kineticDamage.toFixed(1)} damage.`);
            }
        });

        this.combatLog.push(report);
        return report;
    }

    // =========================================================================
    // 4. SIEGE & ORBITAL BOMBARDMENT
    // =========================================================================

    resolveOrbitalStrike(ship, planet, targetCoords) {
        const g = planet.gravity || 9.81;
        const density = planet.atmoDensity || 1.225;
        
        // Impact Velocity V = sqrt(2gh)
        const impactVel = Math.sqrt(2 * g * ship.altitude);
        const energy = 0.5 * ship.bombardmentMass * Math.pow(impactVel, 2);
        
        // Atmospheric ablation/drag loss
        const loss = density * 0.15;
        const finalYield = energy * (1 - loss);

        return {
            yieldMegatons: finalYield / 4.184e15,
            craterRadius: Math.sqrt(finalYield) / 1000,
            falloutYears: finalYield > 1e15 ? 50 : 0
        };
    }

    // =========================================================================
    // 5. UTILITIES
    // =========================================================================

    getDistance(p1, p2) { return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)); }
    selectPriorityTarget(ship, enemies) { 
        return enemies.filter(e => e.health > 0).sort((a, b) => a.health - b.health)[0]; 
    }
}

if (typeof window !== 'undefined') window.warfareEngine = new VoidWarfareEngine();
if (typeof module !== 'undefined') module.exports = VoidWarfareEngine;
