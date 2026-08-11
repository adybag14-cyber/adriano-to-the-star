/**
 * Mirror Universe System
 * Phase 7: The Multiverse Breach
 * Generates "Evil" variants of factions and inverts diplomatic memory.
 */

class MirrorUniverseSystem {
    constructor() {
        this.isMirrorMode = false;
        this.originalDiplomacy = null;
    }

    toggleMirrorMode() {
        this.isMirrorMode = !this.isMirrorMode;

        if (this.isMirrorMode) {
            console.log("😈 Entering the Mirror Universe...");
            this.invertDiplomacy();
            this.invertFactions();
        } else {
            console.log("😇 Returning to Prime Universe...");
            this.restoreDiplomacy();
        }
    }

    invertDiplomacy() {
        if (!window.diplomaticAISystem) return;

        // Save state
        this.originalDiplomacy = JSON.parse(JSON.stringify(window.diplomaticAISystem.memory));

        // Invert
        const factions = Object.keys(window.diplomaticAISystem.memory);
        factions.forEach(f => {
            const rel = window.diplomaticAISystem.memory[f].relationship;
            // 100 -> 0, 0 -> 100 (Friend becomes Enemy)
            window.diplomaticAISystem.memory[f].relationship = 100 - rel;
            console.log(`😈 ${f}: Relations inverted (${rel} -> ${100 - rel})`);
        });
    }

    restoreDiplomacy() {
        if (!window.diplomaticAISystem || !this.originalDiplomacy) return;
        window.diplomaticAISystem.memory = this.originalDiplomacy;
    }

    invertFactions() {
        // Just fun log output for now
        const evilNames = {
            'Galactic Federation': 'Terran Empire',
            'Sirius Traders': 'Sirius Pirates',
            'Alpha Centauri Hegemony': 'Alpha Resistance'
        };
        console.table(evilNames);
    }
}

if (typeof window !== 'undefined') {
    window.MirrorUniverseSystem = MirrorUniverseSystem;
    window.mirrorUniverseSystem = new MirrorUniverseSystem();
}
