/**
 * The Soul Engine
 * Advanced Colonist Simulation System for "Exoplanet Pioneer"
 * Implements "Sims-like" autonomy with Traits, Needs, and Memories.
 */

class Personality {
    constructor() {
        // The Big Five (OCEAN)
        this.openness = Math.random();          // Inventiveness / Curiosity
        this.conscientiousness = Math.random(); // Efficient / Organized
        this.extraversion = Math.random();      // Outgoing / Energetic
        this.agreeableness = Math.random();     // Friendly / Compassionate
        this.neuroticism = Math.random();       // Sensitive / Nervous
    }
}

class Needs {
    constructor() {
        // 0.0 = Critical/Starving, 1.0 = Fulfilled
        this.physiological = 1.0;
        this.safety = 1.0;
        this.belonging = 1.0;
        this.esteem = 1.0;
        this.selfActualization = 0.5; // Starts mid-way
    }

    decay(deltaTimeSeconds) {
        const decayRate = 0.001 * deltaTimeSeconds;
        this.physiological = Math.max(0, this.physiological - decayRate * 2.0); // Hunger grows fastest
        this.safety = Math.max(0, this.safety - decayRate * 0.5);
        this.belonging = Math.max(0, this.belonging - decayRate);
        this.esteem = Math.max(0, this.esteem - decayRate * 0.2);
    }
}

class Memory {
    constructor(description, emotionalImpact, relatedIds = []) {
        this.id = 'mem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        this.timestamp = Date.now();
        this.description = description;
        this.emotionalImpact = emotionalImpact; // -1.0 (Trauma) to 1.0 (Joy)
        this.relatedIds = relatedIds;
    }
}

class Soul {
    constructor(name) {
        this.id = 'soul_' + Math.floor(Math.random() * 10000);
        this.name = name;
        this.personality = new Personality();
        this.needs = new Needs();
        this.memories = [];
        this.relationships = new Map(); // Map<SoulID, {trust: 0-1, romance: 0-1}>

        this.currentAction = { type: 'IDLE', duration: 0, startTime: Date.now() };
    }

    update(deltaTimeSeconds) {
        this.needs.decay(deltaTimeSeconds);

        if (this.currentAction.duration > 0) {
            this.currentAction.duration -= deltaTimeSeconds;
            if (this.currentAction.duration <= 0) {
                this.completeAction();
            }
        } else {
            this.decideNextAction();
        }
    }

    decideNextAction() {
        // Utility-based AI decision making
        const scores = [];

        // 1. Survival Check
        if (this.needs.physiological < 0.3) {
            scores.push({ type: 'EAT', score: (1.0 - this.needs.physiological) * 10 });
            scores.push({ type: 'SLEEP', score: (1.0 - this.needs.physiological) * 8 });
        }

        // 2. Social Check (influenced by Extraversion)
        if (this.needs.belonging < 0.5) {
            const socialBonus = this.personality.extraversion * 2;
            scores.push({ type: 'SOCIALIZE', score: (1.0 - this.needs.belonging) * 5 + socialBonus });
        }

        // 3. Work/Production (influenced by Conscientiousness)
        const workBonus = this.personality.conscientiousness * 3;
        scores.push({ type: 'WORK', score: 2 + workBonus });

        // Sort and pick best
        scores.sort((a, b) => b.score - a.score);

        const bestAction = scores[0] || { type: 'WANDER', score: 1 };

        this.startAction(bestAction.type);
    }

    startAction(actionType) {
        let duration = 5; // default

        switch (actionType) {
            case 'EAT':
                duration = 10;
                console.log(`🧍 ${this.name} is eating.`);
                break;
            case 'SLEEP':
                duration = 30;
                console.log(`🧍 ${this.name} is sleeping.`);
                break;
            case 'SOCIALIZE':
                duration = 15;
                console.log(`🧍 ${this.name} is looking for conversation.`);
                break;
            case 'WORK':
                duration = 20;
                console.log(`🧍 ${this.name} is working.`);
                break;
            case 'WANDER':
                duration = 5;
                console.log(`🧍 ${this.name} is wandering aimlessly.`);
                break;
        }

        this.currentAction = {
            type: actionType,
            duration: duration,
            startTime: Date.now()
        };
    }

    completeAction() {
        // Apply effects
        switch (this.currentAction.type) {
            case 'EAT':
                this.needs.physiological = Math.min(1, this.needs.physiological + 0.5);
                break;
            case 'SLEEP':
                this.needs.physiological = Math.min(1, this.needs.physiological + 0.3); // Energy boost
                break;
            case 'SOCIALIZE':
                this.needs.belonging = Math.min(1, this.needs.belonging + 0.4);
                this.addMemory('Had a conversation', 0.1);
                break;
            case 'WORK':
                this.needs.esteem = Math.min(1, this.needs.esteem + 0.2);
                this.needs.physiological -= 0.1; // Work tires you
                break;
        }
    }

    addMemory(description, impact, relatedIds = []) {
        const mem = new Memory(description, impact, relatedIds);
        this.memories.push(mem);
        // "The Soul" remembers...
        if (Math.abs(impact) > 0.5) {
            console.log(`🧠 ${this.name} formed a CORE MEMORY: ${description}`);
        }
    }
}

// Global Manager for Souls
class SoulEngine {
    constructor() {
        this.souls = [];
        this.isRunning = false;

        // Debug: Create Adam and Eve
        this.addSoul(new Soul("Adam"));
        this.addSoul(new Soul("Eve"));

        this.init();
    }

    init() {
        if (typeof window !== 'undefined') {
            setInterval(() => this.update(1.0), 1000); // 1 tick per second
            this.isRunning = true;
            console.log('👻 Soul Engine Initialized');
        }
    }

    addSoul(soul) {
        this.souls.push(soul);
    }

    update(deltaTime) {
        this.souls.forEach(soul => soul.update(deltaTime));
    }
}

if (typeof window !== 'undefined') {
    window.SoulEngine = SoulEngine;
    window.soulEngine = new SoulEngine();
}
