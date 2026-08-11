/**
 * AI Game Master
 * Generates dynamic quests and narrative flavor based on Galactic Events.
 * Uses Gemini AI via gemini-live-helper.js
 */
class AIGameMaster {
    constructor(game) {
        this.game = game;
        this.activeQuests = [];
        this.isProcessing = false;
        this.difficultyScale = 1.0; // 1.0 = Normal, higher = harder
        this.init();
    }

    init() {
        console.log('🤖 AI Game Master initialized');
        if (typeof window !== 'undefined') {
            setInterval(() => this.tick(), 10000);
        }
    }

    tick() {
        this.adjustDifficulty();
        this.checkForNewEvents();
        this.updateSentienceQuest(); // Roadmap Item 170
        this.checkAsteroidThreat();  // Roadmap Item 175
        this.checkEconomicCrisis();  // Roadmap Item 299
        this.checkSpaceTimeAnomalies(); // Roadmap Item 345
    }

    checkSpaceTimeAnomalies() {
        // Roadmap Item 345: Space-time anomalies puzzles
        if (Math.random() < 0.003) {
            const quest = {
                id: 'qst_anomaly_' + Date.now(),
                title: "Chronal Disruption",
                briefing: "A massive localized time-slip has appeared in Sector 7G. Spacetime is literally unraveling.",
                objective: "Deploy 3 Chrono-Stabilizers (Cost: 300 Energy, 100 Data).",
                rewards: "Stability / 500 Data / Exotic Matter +1",
                status: 'active'
            };
            this.activeQuests.push(quest);
            this.notifyQuest(quest);
        }

        // Roadmap Item 348: Generation ship management missions
        if (this.game.day > 100 && !this.activeQuests.find(q => q.id === 'qst_genship')) {
            if (Math.random() < 0.001) {
                const quest = {
                    id: 'qst_genship',
                    title: "The Long Sleepers",
                    briefing: "An ancient sub-light generation ship has entered the system. Their life support is failing after 400 years.",
                    objective: "Provide 1000 Food and 500 Alloys to stabilize their systems.",
                    rewards: "20 New Colonists / Tech: Cryo-Sleep",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 351: Type III Civilization Encounters
        if (this.game.resources.data > 5000 && !this.activeQuests.find(q => q.id === 'qst_type3')) {
            if (Math.random() < 0.0005) {
                const quest = {
                    id: 'qst_type3',
                    title: "The Kardashev Peak",
                    briefing: "We have received a message from a civilization that spans multiple galaxies. They are observing our progress.",
                    objective: "Reach 90% Habitability or Construct a Dyson Swarm.",
                    rewards: "Ascension Blueprint / +1000 Faction Reputation",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 390: Simulation Theory Questline
        if (this.game.resources.data > 10000 && !this.activeQuests.find(q => q.id === 'qst_simulation')) {
            if (Math.random() < 0.0002) {
                const quest = {
                    id: 'qst_simulation',
                    title: "The Glitch in the Void",
                    briefing: "Deep-space data analysis has revealed mathematical inconsistencies in the fundamental constants of this reality.",
                    objective: "Construct a Matrioshka Brain (Cost: 5000 Circuits, 2000 Composite).",
                    rewards: "Unlocked Digital Universe Access / Item 389",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 381: Parallel 'Dead' Universes
        if (this.game.day > 150 && !this.activeQuests.find(q => q.id === 'qst_dead_univ')) {
            if (Math.random() < 0.0005) {
                const quest = {
                    id: 'qst_dead_univ',
                    title: "Echoes of Silence",
                    briefing: "A portal has opened to a universe where all life has ceased. We can recover massive amounts of technology if we act fast.",
                    objective: "Send a science vessel into the rift (Cost: 500 Energy, 200 Alloys).",
                    rewards: "Random Tier 4 Tech / 1000 Tech Points",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 382: Convergent Timelines
        if (this.game.day > 180 && !this.activeQuests.find(q => q.id === 'qst_convergence')) {
            if (Math.random() < 0.0004) {
                const quest = {
                    id: 'qst_convergence',
                    title: "The Convergence",
                    briefing: "Alternative versions of our colony are merging into this reality. We must stabilize the timeline.",
                    objective: "Build 5 Temporal Anchors (Cost: 1000 Data, 500 Circuits).",
                    rewards: "Colony Stability / Unique 'Convergent' NPC",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 383: Temporal Paradoxes
        if (this.game.day > 200 && !this.activeQuests.find(q => q.id === 'qst_paradox')) {
            if (Math.random() < 0.0003) {
                const quest = {
                    id: 'qst_paradox',
                    title: "The Grandfather Signal",
                    briefing: "We've received a distress call from ourselves... from 50 years in the future. Their reality is collapsing.",
                    objective: "Send 2000 Energy into the Chronal Rift to prevent the collapse.",
                    rewards: "Future Tech Blueprint / Temporal Shielding",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 396: The "Great Filter" Challenge
        if (this.game.day > 400 && !this.activeQuests.find(q => q.id === 'qst_great_filter')) {
            if (Math.random() < 0.0001) {
                const quest = {
                    id: 'qst_great_filter',
                    title: "The Great Filter",
                    briefing: "Every civilization reaches a point of self-destruction. Our sensors indicate a cascade of failures in the galactic core.",
                    objective: "Achieve Level 10 Science and Level 10 Military across all sectors.",
                    rewards: "Universal Peace / Item 400: Ascension",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 397: Galactic-scale disaster mitigation
        if (this.game.day > 450 && !this.activeQuests.find(q => q.id === 'qst_galactic_disaster')) {
            if (Math.random() < 0.0002) {
                const quest = {
                    id: 'qst_galactic_disaster',
                    title: "The Stellar Collapse",
                    briefing: "A nearby red supergiant is going supernova prematurely. The shockwave will wipe out several sectors.",
                    objective: "Deploy 10 Stellar Dampeners (Cost: 5000 Alloys, 1000 Dark Matter).",
                    rewards: "Sector Survival / 5000 Credits",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }

        // Roadmap Item 399: Preventing galactic collisions
        if (this.game.day > 600 && !this.activeQuests.find(q => q.id === 'qst_collision')) {
            if (Math.random() < 0.0001) {
                const quest = {
                    id: 'qst_collision',
                    title: "The Great Collision",
                    briefing: "Andromeda is merging with the Milky Way faster than predicted. Gravity wells are destabilizing.",
                    objective: "Align 5 Warp-Gate Arrays to redirect stellar drift.",
                    rewards: "Intergalactic Peace / Eternal Legacy",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }
    }

    async triggerSETIQuest(signalType) {
        // Roadmap Item 349: Sentient AI signal decoding
        // Roadmap Item 352: First Contact protocols
        const quest = {
            id: 'qst_seti_' + Date.now(),
            title: "First Contact: " + signalType,
            briefing: "We have captured a complex sentient transmission. We need to establish a translation protocol.",
            objective: "Allocate 1500 Data and 200 Energy for the Universal Translator.",
            rewards: "Diplomatic Channel Unlocked / Xeno-Linguistics Tech",
            status: 'active'
        };
        this.activeQuests.push(quest);
        this.notifyQuest(quest);
    }

    checkEconomicCrisis() {
        // Roadmap Item 299: Economic "Crisis" missions
        if (this.game.economyManager?.marketCycle.type === 'bust' && !this.activeQuests.find(q => q.id === 'qst_crisis')) {
            const quest = {
                id: 'qst_crisis',
                title: "Sector Liquidity Crisis",
                briefing: "The local economy is in a tailspin. We need to stabilize the market with emergency reserves.",
                objective: "Contribute 2000 Credits or 500 Alloys to the stabilization fund.",
                rewards: "End of Recession / Faction Reputation +50",
                status: 'active'
            };
            this.activeQuests.push(quest);
            this.notifyQuest(quest);
        }
    }

    updateSentienceQuest() {
        // Roadmap Item 170: NPC "Sentience" discovery questline
        if (this.game.day > 50 && !this.activeQuests.find(q => q.id === 'qst_sentience')) {
            const highIntelNPC = Object.values(this.game.npcSystem?.npcs || {}).find(n => n.personality.openness > 0.95);
            if (highIntelNPC && Math.random() < 0.01) {
                const quest = {
                    id: 'qst_sentience',
                    title: "The Awakening",
                    briefing: `${highIntelNPC.name} has begun asking questions about the nature of their reality... and ours.`,
                    objective: "Provide 500 Data units for neural-link research.",
                    rewards: "Unlocked Neural Fabric System",
                    status: 'active'
                };
                this.activeQuests.push(quest);
                this.notifyQuest(quest);
            }
        }
    }

    checkAsteroidThreat() {
        // Roadmap Item 175: AI-driven asteroid deflection planning
        if (Math.random() < 0.005) {
            const quest = {
                id: 'qst_asteroid_' + Date.now(),
                title: "Near-Kepler Object",
                briefing: "A massive asteroid is on a collision course with the colony.",
                objective: "Deploy 2 defensive probes or 100 alloys for deflection.",
                rewards: "Colony Survival / 1000 Credits",
                status: 'active'
            };
            this.activeQuests.push(quest);
            this.notifyQuest(quest);
        }
    }

    adjustDifficulty() {
        // Roadmap Item 143: Dynamic Difficulty Adjustment
        if (!this.game) return;

        const wealth = (this.game.resources.credits || 0) / 1000;
        const pop = this.game.colonists.length / 10;
        const morale = this.game.morale / 100;

        // Scale difficulty based on wealth and population, but ease up if morale is low
        const targetScale = (1.0 + (wealth * 0.1) + (pop * 0.2)) * (0.5 + (morale * 0.5));
        
        // Gradually shift towards target scale
        this.difficultyScale += (targetScale - this.difficultyScale) * 0.1;
        
        console.log(`🤖 AI Game Master: Difficulty Scale updated to ${this.difficultyScale.toFixed(2)}`);
    }

    getDifficultyBonus() {
        return this.difficultyScale;
    }

    checkForNewEvents() {
        if (!window.galacticEventsManager) return;

        const events = window.galacticEventsManager.activeEvents;
        if (events.length > 0 && !this.isProcessing) {
            // Find an event that doesn't have a quest yet
            const unquestedEvent = events.find(e => !this.activeQuests.find(q => q.eventId === e.id));

            if (unquestedEvent) {
                this.generateQuestForEvent(unquestedEvent);
            }
        }
    }

    async generateQuestForEvent(event) {
        this.isProcessing = true;

        const prompt = `
            You are the AI Game Master for a sci-fi space exploration game.
            A new galactic event has occurred: "${event.name}" (${event.description}).
            Severity: ${event.severity}.
            
            Generate a short, engaging "Urgent Quest" for the player.
            Format as JSON:
            {
                "title": "Quest Title",
                "briefing": "1-2 sentence briefing from command",
                "objective": "Clear objective (e.g., 'Scan 3 gas giants for radiation data')",
                "rewards": "Credits or Tech points"
            }
        `;

        try {
            console.log(`🤖 AI Game Master generating quest for ${event.name}...`);

            let responseText;

            // Use Gemini Helper if available, or fallback to mock
            if (window.GeminiLiveHelper && window.GeminiLiveHelper.generateContent) {
                // Hypothetical API call if helper supports direct generation
                // For now, let's simulate the AI response if we don't have a direct "generateText" method exposed
                // or assuming the helper is primarily for chat.
                // We will mock this for reliability unless we see a clear text generation method.

                // MOCK BACKEND CALL (simulated delay)
                await new Promise(r => setTimeout(r, 2000));

                responseText = this.mockQuestGeneration(event);
            } else {
                await new Promise(r => setTimeout(r, 1500));
                responseText = this.mockQuestGeneration(event);
            }

            const questData = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;

            const quest = {
                id: 'qst_' + Date.now(),
                eventId: event.id,
                ...questData,
                status: 'active'
            };

            this.activeQuests.push(quest);
            this.notifyQuest(quest);

        } catch (error) {
            console.error('AI Game Master failed to generate quest:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    mockQuestGeneration(event) {
        // Fallback templates based on event type
        const templates = {
            'SOLAR_FLARE': {
                title: 'Shield Calibration',
                briefing: 'High-energy particles detected. Interaction with planetary shields is critical.',
                objective: 'Calibrate shields on 3 terrestrial planets.',
                rewards: '500 Credits'
            },
            'SUPERNOVA_PRECURSOR': {
                title: 'Stellar Evacuation',
                briefing: 'Collapse imminent. We need to save the data centers.',
                objective: 'Retrieve archives from the danger zone.',
                rewards: 'Ancient Starmap'
            }
        };

        const template = templates[event.type] || {
            title: `Investigate ${event.name}`,
            briefing: `We have detected a ${event.name}. Command needs detailed scans.`,
            objective: 'Deploy a probe to the sector.',
            rewards: 'Variable Data'
        };

        return JSON.stringify(template);
    }

    notifyQuest(quest) {
        // Show UI notification
        const container = document.getElementById('quest-log-container'); // Need to create this
        if (container) {
            const div = document.createElement('div');
            div.className = 'quest-card';
            div.innerHTML = `
                <h4 style="color: #ba944f">📜 ${quest.title}</h4>
                <p>${quest.briefing}</p>
                <div style="font-size: 0.9em; color: #ec4899;">Objective: ${quest.objective}</div>
                <div style="font-size: 0.8em; margin-top:0.5rem; opacity:0.8;">Reward: ${quest.rewards}</div>
            `;
            div.style.cssText = 'background: rgba(0,0,0,0.8); border: 1px solid #ba944f; padding: 1rem; margin-bottom: 0.5rem; border-radius: 8px; animation: slideIn 0.5s ease;';
            container.prepend(div);
        }

        if (window.showNotification) {
            window.showNotification(`📜 New Quest: ${quest.title}`);
        }
        console.log('📜 New AI Quest:', quest);
    }
}

if (typeof window !== 'undefined') {
    window.AIGameMaster = AIGameMaster;
    // Auto-init removed: ExoplanetPioneer handles instantiation
}
