class MilitarySystem {
    constructor(game) {
        this.game = game;
        this.fleetPower = 100; // Starting fleet power
        this.groundForces = 50;
        this.threatLevel = 0; // Current system threat

        this.techs = {
            'plasma_weapons': { name: 'Plasma Weapons', cost: 100, desc: 'Fleet Power +50', effect: () => this.fleetPower += 50, unlocked: false, req: 'adv_mining', pos: { x: 300, y: 400 } },
            'orbital_shields': { name: 'Orbital Shields', cost: 150, desc: 'Reduces combat damage', effect: () => this.defenseRating += 20, unlocked: false, req: 'plasma_weapons', pos: { x: 500, y: 400 } },
            'mechs': { name: 'Titan Mechs', cost: 300, desc: 'Ground Forces +100', effect: () => this.groundForces += 100, unlocked: false, req: 'orbital_shields', pos: { x: 700, y: 400 } }
        };

        this.defenseRating = 0;
    }

    init() {
        console.log("Military System Initialized");
        this.tacticalState = 'DEFENSIVE'; // Roadmap Item 137: Tactical State
        this.activeThreats = [];
        this.drillActive = false; // Roadmap Item 199
    }

    updateTactics(dt) {
        // Roadmap Item 137: Tactical AI for ground defense units
        const baseThreat = this.game.systemSecurity[this.game.currentSystemId] || 1.0;
        const localThreat = (1.0 - baseThreat) * 100;
        
        if (localThreat > 50) {
            this.tacticalState = 'ALERT';
            this.groundForcesEfficiency = 1.2; // Defensive bonus
        } else if (localThreat > 80) {
            this.tacticalState = 'COMBAT';
            this.groundForcesEfficiency = 1.5;
        } else {
            this.tacticalState = 'DEFENSIVE';
            this.groundForcesEfficiency = 1.0;
        }

        // Roadmap Item 199: AI-driven colony defense drills
        if (!this.drillActive && Math.random() < 0.0001 * dt) {
            this.startDefenseDrill();
        }

        // Auto-redeploy forces based on tactical state
        if (this.tacticalState === 'ALERT' && Math.random() < 0.05) {
            this.game.notify("🛡️ TACTICAL AI: Ground units redeploying to high-risk zones.", "info");
        }
    }

    startDefenseDrill() {
        this.drillActive = true;
        this.game.notify("🚨 DEFENSE DRILL: All colonists to emergency stations! Training efficiency increased.", "warning");
        this.game.addChatterPost("SECURITY", "This is a drill. Repeat, this is a drill. Secure all sectors.", "#ef4444", 'news');
        
        setTimeout(() => {
            this.drillActive = false;
            this.groundForces += 5; // Permanent small gain from training
            this.game.notify("✅ DRILL COMPLETE: Ground forces efficiency improved.", "success");
        }, 30000);
    }

    getTechs() {
        return this.techs;
    }

    research(key) {
        const tech = this.techs[key];
        if (!tech) return false;
        if (tech.unlocked) return true;

        if (this.game.resources.data >= tech.cost) {
            this.game.resources.data -= tech.cost;
            tech.unlocked = true;
            if (tech.effect) tech.effect();
            this.game.notify(`${tech.name} Researched!`, "success");
            this.game.audio.playUnlock();
            return true;
        }
        return false;
    }

    assessThreat(systemId) {
        // Deterministic threat based on seed/ID
        // Simple hash
        return (systemId * 1337) % 500;
    }

    attemptInvasion(systemId) {
        const threat = this.assessThreat(systemId);
        const playerPower = this.fleetPower + this.groundForces;

        // Random factor
        const roll = Math.random() * 100;
        const successChance = (playerPower / (playerPower + threat)) * 100;

        const result = { success: false, damage: 0, loot: 0 };

        if (roll < successChance) {
            result.success = true;
            result.loot = Math.floor(threat * 2); // Loot proportional to threat
            result.damage = Math.floor(threat * 0.1);
        } else {
            result.success = false;
            result.damage = Math.floor(threat * 0.3);
        }

        // Apply damage
        this.fleetPower = Math.max(0, this.fleetPower - result.damage);

        return result;
    }
}

window.MilitarySystem = MilitarySystem;
