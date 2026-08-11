console.log('⚖️ LegalSystem script execution started');
class LegalSystem {
    constructor(game) {
        this.game = game;
        this.laws = [];
        this.incidents = [];
        this.init();
    }

    init() {
        console.log("⚖️ Legal System Initialized");
        // Roadmap Item 146: Default Colony Laws
        this.laws = [
            { id: 'law_1', name: 'Resource Rationing', active: false, desc: 'Reduces food consumption by 20% but lowers morale by 5% daily.' },
            { id: 'law_2', name: 'Mandatory Overtime', active: false, desc: 'Increases work speed by 25% but increases stress by 10% daily.' },
            { id: 'law_3', name: 'Curfew', active: false, desc: 'Reduces social interactions but decreases crime and incident chance.' }
        ];
    }

    toggleLaw(id) {
        const law = this.laws.find(l => l.id === id);
        if (law) {
            law.active = !law.active;
            this.game.notify(`⚖️ LAW UPDATED: ${law.name} is now ${law.active ? 'ACTIVE' : 'INACTIVE'}.`, "info");
            this.game.recordColonyEvent(`Colony law '${law.name}' was ${law.active ? 'ratified' : 'repealed'}.`, 0.6);
        }
    }

    reportIncident(npcId, type, severity) {
        // Roadmap Item 146: AI-driven incident handling
        const incident = {
            id: 'inc_' + Date.now(),
            npcId,
            type,
            severity,
            day: this.game.day,
            resolved: false
        };
        this.incidents.push(incident);
        this.game.notify(`⚠️ LEGAL INCIDENT: ${type} reported involving colonist.`, "warning");
        
        // Potential for "Trial" event (Item 146)
        if (severity > 0.8) {
            this.triggerTrial(incident);
        }
    }

    triggerTrial(incident) {
        const npc = this.game.npcSystem?.npcs[incident.npcId];
        const name = npc ? npc.name : "A colonist";
        this.game.notify(`👨‍⚖️ TRIBUNAL: ${name} is facing a colony hearing for ${incident.type}.`, "danger");
        // In a fuller implementation, this would open a modal for player choice
    }

    update(dt) {
        // Apply active law effects
        this.laws.forEach(law => {
            if (!law.active) return;
            
            if (law.id === 'law_1') { // Rationing
                // Managed in exoplanet-pioneer.js consumption logic if possible, 
                // or applied here as a modifier
            }
        });
    }
}

window.LegalSystem = LegalSystem;
