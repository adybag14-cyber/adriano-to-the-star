/**
 * SentientNPC.js
 * Represents a single "AI Agent" with unique personality traits and memory.
 */

class SentientAgent {
    constructor(name, fabric, traits = {}) {
        this.name = name;
        this.fabric = fabric;
        this.traits = {
            aggression: traits.aggression || 0.5,
            curiosity: traits.curiosity || 0.5,
            empathy: traits.empathy || 0.5,
            efficiency: traits.efficiency || 0.5
        };
        this.memory = []; // Vector-like memory

        this.fabric.registerAgent(this);
    }

    getMood() {
        // Determine mood based on game state (mocked for now)
        if (this.traits.aggression > 0.6) {
            return { greeting: "Reporting for duty.", status: "OPTIMAL" };
        } else if (this.traits.empathy > 0.6) {
            return { greeting: "Hello friend.", status: "stable" };
        }
        return { greeting: "System online.", status: "functional" };
    }

    react(eventText) {
        // "Think" about the event
        if (eventText.includes("War") && this.traits.aggression < 0.3) {
            console.log(`${this.name} is fearful of: ${eventText}`);
        }
        this.memory.push(eventText);
    }

    async chat(userMessage) {
        return await this.fabric.generateResponse(this, userMessage);
    }
}

window.SentientAgent = SentientAgent;
