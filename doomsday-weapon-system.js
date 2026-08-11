/**
 * Doomsday Weapon System
 * "I am become Death, the destroyer of worlds."
 * Manages superweapons capable of sterilizing star systems.
 */

class DoomsdayWeaponSystem {
    constructor() {
        this.authorized = false;
        this.codes = ['ALPHA', 'OMEGA', 'ZERO'];
        this.cooldown = 0;
    }

    init() {
        console.log("☢️ Doomsday Protocol: ONLINE. Waiting for authorization.");
        this.createUI();
    }

    createUI() {
        const container = document.getElementById('visualization-features-container');
        if (container) {
            const btn = document.createElement('button');
            btn.className = 'feature-btn warning-btn';
            btn.style.cssText = "background: #f44336; color: white; border: 2px solid #b71c1c;";
            btn.innerHTML = "☢️ DOOMSDAY PROTOCOL";
            btn.onclick = () => this.showTargetingComputer();
            container.appendChild(btn);
        }
    }

    showTargetingComputer() {
        if (!this.authorized) {
            const code = prompt("☢️ DOOMSDAY PROTOCOL LOCKED. Enter Authorization Code:");
            if (this.codes.includes(code?.toUpperCase())) {
                this.authorized = true;
                this.game.notify("AUTHORIZATION GRANTED. Doomsday weapons HOT.", "danger");
            } else {
                this.game.notify("INVALID CODE. Security teams dispatched.", "danger");
                return;
            }
        }

        const planetName = this.game.planetData?.name || 'Unknown Planet';

        const choice = prompt(`⚠️ TARGET ACQUIRED: ${planetName}\n\nSelect Weapon Type:\n1. RKV (Relativistic Kill Vehicle) - Planetary Sterilization\n2. Stellar Beam - System-wide AOE\n3. Nicoll-Dyson Beam (Requires Dyson Swarm)`);

        if (choice === '1') {
            if (confirm(`INITIATE RKV LAUNCH AT ${planetName}?`)) this.launchRKV(planetName);
        } else if (choice === '2') {
            if (confirm(`INITIATE STELLAR BEAM FIRING?`)) this.fireStellarBeam(planetName);
        } else if (choice === '3') {
            this.fireNicollDysonBeam(planetName);
        }
    }

    launchRKV(target) {
        this.logEvent(`🚀 RKV LAUNCHED AT ${target}`);
        this.applyVisuals("#ff0000");

        setTimeout(() => {
            this.applyVisuals("#000", 0);
            this.logEvent(`💥 IMPACT CONFIRMED. ${target} sterilized.`);
            this.triggerConsequences(target, 'War Crime', -100);
            alert(`Target ${target} has been neutralized.`);
        }, 2000);
    }

    fireStellarBeam(target) {
        this.logEvent(`☀️ STELLAR BEAM FIRING... INCINERATING ORBIT OF ${target}`);
        this.applyVisuals("#ffff00");

        setTimeout(() => {
            this.applyVisuals("#000", 0);
            this.logEvent(`🔥 ALL ORBITAL ASSETS DESTROYED AROUND ${target}.`);
            this.triggerConsequences(target, 'Massive Collateral', -50);
        }, 3000);
    }

    fireNicollDysonBeam(target) {
        if (!this.game.megastructures || !this.game.megastructures.hasDysonSwarm()) {
            this.game.notify("FAILURE: No active Dyson Swarm detected in system.", "danger");
            return;
        }
        this.logEvent(`🌌 NICOLL-DYSON BEAM CHARGING... USING STELLAR POWER...`);
        this.applyVisuals("#ffffff");

        setTimeout(() => {
            this.applyVisuals("#000", 0);
            this.logEvent(`💫 SYSTEM REORGANIZED. ${target}'s sun has been extinguished.`);
            this.triggerConsequences(target, 'Existential Threat', -500);
        }, 5000);
    }

    logEvent(msg) {
        console.log(msg);
        if (this.game) this.game.notify(msg, 'danger');
    }

    applyVisuals(color, transition = 0.5) {
        document.body.style.transition = `background ${transition}s`;
        document.body.style.background = color;
        if (window.hapticFeedbackSystem) {
            window.hapticFeedbackSystem.triggerHaptic("explosion", 2000, 1.0);
        }
    }

    triggerConsequences(target, type, reputationChange) {
        if (window.diplomaticAISystem) {
            window.diplomaticAISystem.recordInteraction('Galactic Federation', type, reputationChange);
        }
        if (window.persistenceManager && window.persistenceManager.addCrater) {
            window.persistenceManager.addCrater(0, 0, 5000);
        }
        // Invalidate claims
        if (this.game && this.game.claims) {
            delete this.game.claims[target];
        }
    }
}

if (typeof window !== 'undefined') {
    window.DoomsdayWeaponSystem = DoomsdayWeaponSystem;
    window.doomsdayWeaponSystem = new DoomsdayWeaponSystem();
}
