/**
 * Diplomatic AI System
 * Manages long-term memory of alien factions and relationships.
 * "They will remember that."
 */

class DiplomaticAISystem {
    constructor() {
        this.factions = ['Alpha Centauri Hegemony', 'Sirius Traders', 'Galactic Federation'];
        this.memory = {}; // Map of FactionID -> { relationship: 0-100, events: [] }

        this.init();
    }

    init() {
        this.factions.forEach(f => {
            this.memory[f] = {
                relationship: 50, // Neutral
                events: []
            };
        });
        console.log("🤝 Diplomatic AI Initialized. Relationships neutral.");
    }

    recordInteraction(faction, eventType, impact) {
        if (!this.memory[faction]) return;

        const timestamp = new Date().toISOString();
        const entry = { timestamp, eventType, impact };

        this.memory[faction].events.push(entry);
        this.memory[faction].relationship += impact;

        // Clamp 0-100
        this.memory[faction].relationship = Math.max(0, Math.min(100, this.memory[faction].relationship));

        console.log(`📜 Faction '${faction}' recorded event: ${eventType}. Relationship: ${this.memory[faction].relationship}`);

        this.checkStatus(faction);
    }

    checkStatus(faction) {
        const score = this.memory[faction].relationship;
        let status = 'Neutral';
        if (score > 80) status = 'Ally';
        if (score < 20) status = 'Hostile';

        console.log(`🤝 Status update: ${faction} is now ${status}`);

        if (status === 'Hostile') {
            console.warn(`⚠️ WARNING: ${faction} is preparing embargo.`);
        }
    }

    getReport() {
        return this.memory;
    }
}

if (typeof window !== 'undefined') {
    window.DiplomaticAISystem = DiplomaticAISystem;
    window.diplomaticAISystem = new DiplomaticAISystem();
}
