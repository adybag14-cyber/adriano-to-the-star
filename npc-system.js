class NPCSystem {
    constructor(game) {
        this.game = game;
        this.npcs = {}; // Map<ColonistID, NPC>
        this.memories = {}; // Map<NPCID, Array<String>>
        this.dialect = null; // Added dialect property
    }

    init() {
        console.log("🧠 NPC System: Initializing Intelligent Life Layer...");
        this.dialect = this.generateInitialDialect();
        this.legacies = {};
        this.traditions = [];
        this.traumaLog = {}; // Roadmap Item 255: Psychological Trauma
        this.collective = { // Roadmap Item 251: Collective Consciousness
            active: false,
            intensity: 0,
            linkedNPCs: new Set()
        };
        this.unions = {
            active: false,
            membership: [],
            demands: [],
            striking: false
        };
        this.politicalSystem = {
            currentGovernment: 'Technocracy',
            nextElectionDay: 50,
            candidates: [],
            votes: {}
        };
        if (this.game.colonists) {
            this.game.colonists.forEach(c => this.registerNPC(c));
        }
    }

    // Roadmap Item 251: Collective Consciousness Logic
    updateCollective(dt) {
        if (!this.collective.active) return;
        
        const npcs = Object.values(this.npcs).filter(n => this.collective.linkedNPCs.has(n.id));
        if (npcs.length === 0) return;

        // Sync happiness and stress across the collective
        const avgHappiness = npcs.reduce((sum, n) => sum + n.emotions.happiness, 0) / npcs.length;
        const avgStress = npcs.reduce((sum, n) => sum + n.emotions.stress, 0) / npcs.length;

        npcs.forEach(n => {
            n.emotions.happiness += (avgHappiness - n.emotions.happiness) * 0.1 * dt;
            n.emotions.stress += (avgStress - n.emotions.stress) * 0.1 * dt;
        });

        this.collective.intensity = Math.min(1.0, this.collective.intensity + 0.001 * dt);
    }

    // Roadmap Item 255: Psychological Trauma System
    recordTrauma(npcId, eventType, intensity) {
        if (!this.npcs[npcId]) return;
        const npc = this.npcs[npcId];
        
        if (!this.traumaLog[npcId]) this.traumaLog[npcId] = [];
        const trauma = {
            type: eventType,
            intensity,
            day: this.game.day,
            resolved: false
        };
        this.traumaLog[npcId].push(trauma);
        
        npc.emotions.stress = Math.min(100, npc.emotions.stress + intensity * 10);
        this.game.notify(`⚠️ TRAUMA: ${npc.name} was psychological scarred by ${eventType}.`, "danger");
    }

    processTraumaRecovery(npcId, dt) {
        const traumas = this.traumaLog[npcId];
        if (!traumas) return;

        traumas.forEach(t => {
            if (!t.resolved) {
                // Recovery based on colony morale and hobbies
                const recoveryRate = (this.game.morale / 100) * 0.01 * dt;
                t.intensity = Math.max(0, t.intensity - recoveryRate);
                if (t.intensity === 0) {
                    t.resolved = true;
                    this.game.notify(`🧘 RECOVERY: ${this.npcs[npcId].name} has overcome their trauma from ${t.type}.`, "success");
                }
            }
        });
    }

    // Roadmap Item 121: Colonial Traditions
    establishTradition(name, effect) {
        const tradition = { name, effect, dayEstablished: this.game.day };
        this.traditions.push(tradition);
        this.game.notify(`📜 TRADITION: The colony has established the tradition of "${name}"!`, "success");
        if (this.game.historian) {
            this.game.historian.logEvent(`The tradition of ${name} was formally recognized.`, 'major');
        }
    }

    // Roadmap Item 147: Colonist Legacy System
    generateLegacy(npcId) {
        const npc = this.npcs[npcId];
        if (!npc) return;

        const p = npc.personality;
        const legacy = { name: `${npc.name}'s Legacy`, buffs: {} };

        if (p.openness > 0.8) legacy.buffs.researchSpeed = 1.1;
        if (p.conscientiousness > 0.8) legacy.buffs.workSpeed = 1.1;
        if (p.agreeableness > 0.8) legacy.buffs.moraleGain = 1.1;
        
        this.legacies[npcId] = legacy;
        this.game.notify(`📜 LEGACY: ${npc.name} has left a lasting legacy for future generations!`, "success");
    }

    generateInitialDialect() {
        // Roadmap Item 140: Emergent Language Evolution
        const bases = ['Standard Earth', 'Neo-Mars', 'Belt-Creole', 'Proxima-Common'];
        return {
            base: bases[Math.floor(Math.random() * bases.length)],
            drift: 0,
            vocabulary: ['pioneer', 'vacuum', 'cycle', 'resource'],
            slang: []
        };
    }

    updateDialect() {
        // Language evolves over time based on population and isolation
        if (this.game.day % 10 === 0) {
            this.dialect.drift += 0.01 * (this.game.colonists.length / 100);
            if (Math.random() < 0.1) {
                const newWord = `term_${Math.random().toString(36).substr(2, 5)}`;
                this.dialect.slang.push(newWord);
                this.game.notify(`🗣️ LINGUISTIC DRIFT: New local slang "${newWord}" detected in colony chatter.`, "info");
            }
        }
    }

    registerNPC(colonist) {
        if (!colonist.id) colonist.id = "col_" + Math.random().toString(36).substr(2, 9);

        // Generate personality if missing
        if (!this.npcs[colonist.id]) {
            const personality = this.generatePersonality();
            const hobby = this.generateHobby(personality);
            const backstory = this.generateBackstory(personality);
            const style = this.generateArchitecturalStyle(personality); // Roadmap Item 165

            this.npcs[colonist.id] = {
                id: colonist.id,
                name: colonist.name,
                role: colonist.job || "Colonist",
                personality: personality,
                hobby: hobby,
                backstory: backstory,
                style: style, // Added architectural style
                relationship: 50, // Neutral to player (0-100)
                lastDream: null,
                religion: this.generateReligion(personality), // Roadmap Item 172
                archives: [], // Roadmap Item 174
                diet: this.generateDietaryPreference(personality), // Roadmap Item 178
                addictions: [], // Roadmap Item 180
                curiosity: 0.5 + Math.random() * 0.5, // Roadmap Item 184
                fashion: this.generateFashionPreference(personality), // Roadmap Item 181
                fitness: 50 + Math.random() * 50, // Roadmap Item 182
                health: 100,
                housingDesire: this.generateHousingDesire(personality), // Roadmap Item 186
                pets: [], // Roadmap Item 188
                robotAssistant: null, // Roadmap Item 189
                philosophy: this.generatePhilosophy(personality), // Roadmap Item 192
                artStyle: this.generateArtStyle(personality), // Roadmap Item 194
                loyalty: { player: 50, colony: 50 }, // Roadmap Item 196
                alienStance: Math.random() > 0.5 ? 'Xenophilia' : 'Fear', // Roadmap Item 198
                relationships: {}, // Roadmap Item 101: Friendships/Rivalries
                goals: this.generatePersonalGoals(personality), // Roadmap Item 106
                emotions: { happiness: 50, stress: 0, fear: 0, loneliness: 0, grief: 0 }, // Roadmap Item 105 & 109
                belongings: [], // Roadmap Item 112
                rank: 1, // Roadmap Item 110: Social Hierarchy
                secretAgenda: this.generateSecretAgenda(personality), // Roadmap Item 114
                fearTriggers: this.generateFearTriggers(personality), // Roadmap Item 116
                voicePitch: 0.8 + Math.random() * 0.4, // Roadmap Item 131
                currentExpression: 'neutral', // Roadmap Item 132
                outfitType: 'Standard', // Roadmap Item 133
                isTransdimensional: Math.random() < 0.01 // Roadmap Item 395: Trans-dimensional NPCs
            };
            this.memories[colonist.id] = [
                { role: 'system', content: `I arrived at the ${this.game.planetData.name} colony on Day 1.` },
                { role: 'system', content: `My job is ${colonist.job || 'Unemployed'}.` },
                { role: 'system', content: `My backstory: ${backstory}` }
            ];
        }
    }

    generateReligion(p) {
        // Roadmap Item 172: NPC "Religious Schisms"
        const religions = ['The Void Seekers', 'Binary Orthodoxy', 'Solaris Cult', 'Stellar Harmony', 'Materialist'];
        if (p.openness > 0.8) return 'The Void Seekers';
        if (p.neuroticism > 0.8) return 'Solaris Cult';
        if (p.conscientiousness > 0.8) return 'Binary Orthodoxy';
        return religions[Math.floor(Math.random() * religions.length)];
    }

    generateDietaryPreference(p) {
        // Roadmap Item 178: NPC "Dietary Preferences"
        const diets = ['Standard Paste', 'Synth-Meat', 'Organic Only', 'Nutrient Slurry'];
        if (p.agreeableness > 0.7) return 'Organic Only';
        return diets[Math.floor(Math.random() * diets.length)];
    }

    generateFashionPreference(p) {
        // Roadmap Item 181: AI-driven fashion trends
        const trends = ['Minimalist-Tech', 'Neo-Gothic', 'Retro-NASA', 'Bio-Organic', 'Utility-Heavy'];
        if (p.openness > 0.8) return 'Bio-Organic';
        if (p.conscientiousness > 0.8) return 'Utility-Heavy';
        return trends[Math.floor(Math.random() * trends.length)];
    }

    generateHousingDesire(p) {
        // Roadmap Item 186: NPC "Housing Desire"
        const desires = ['Secluded', 'Central', 'High-View', 'Near-Work', 'Communal'];
        if (p.extroversion > 0.7) return 'Communal';
        if (p.extroversion < 0.3) return 'Secluded';
        return desires[Math.floor(Math.random() * desires.length)];
    }

    generatePhilosophy(p) {
        // Roadmap Item 192: NPC "Philosophy of Space"
        const philosophies = ['Galactic Existentialism', 'Stellar Determinism', 'Void Nihilism', 'Universal Expansionism', 'Cosmic Unity'];
        if (p.openness > 0.8) return 'Stellar Determinism';
        return philosophies[Math.floor(Math.random() * philosophies.length)];
    }

    generateArtStyle(p) {
        // Roadmap Item 194: NPC "Artistic Style"
        const styles = ['Cyber-Impressionism', 'Void-Abstract', 'Digital-Brutalist', 'Solar-Folk', 'Neo-Minimalist'];
        if (p.openness > 0.7) return 'Void-Abstract';
        return styles[Math.floor(Math.random() * styles.length)];
    }

    generatePersonalGoals(p) {
        // Roadmap Item 106: NPC "Personal Goals"
        const goals = [
            { id: 'goal_1', text: 'Build a private greenhouse', progress: 0, target: 100 },
            { id: 'goal_2', text: 'Catalog every native plant', progress: 0, target: 100 },
            { id: 'goal_3', text: 'Master zero-G flight', progress: 0, target: 100 },
            { id: 'goal_4', text: 'Establish a colony tradition', progress: 0, target: 100 }
        ];
        return goals.sort(() => Math.random() - 0.5).slice(0, 2);
    }

    generateSecretAgenda(p) {
        // Roadmap Item 114: NPC "Secret Agendas"
        const agendas = ['Corporate Spy', 'AI Abolitionist', 'Void Cultist', 'Market Saboteur', 'Technological Purist'];
        if (p.agreeableness < 0.3 && p.openness > 0.7) return 'AI Abolitionist';
        if (p.neuroticism > 0.8) return 'Void Cultist';
        return 'None';
    }

    generateFearTriggers(p) {
        // Roadmap Item 116: NPC "Fear Triggers"
        const triggers = ['Darkness', 'Low Oxygen', 'Alien Life', 'Machine Rebellion', 'Isolation'];
        if (p.neuroticism > 0.6) return [triggers[Math.floor(Math.random() * triggers.length)]];
        return [];
    }

    updateNPCStates(dt) {
        // Roadmap Block 4: Genetic Drift & Cultural Evolution
        if (this.game.day % 100 === 0) {
            this.performGeneticDrift();
            this.updateColonyCulture();
        }

        Object.keys(this.npcs).forEach(id => {
            const npc = this.npcs[id];
            const colonist = this.game.colonists.find(c => c.id === id);
            if (!colonist) return;

            // Roadmap Item 228: Labor Union logic
            if (this.unions.active && !this.unions.membership.includes(id)) {
                if (colonist.morale < 30 && Math.random() < 0.01 * dt) {
                    this.unions.membership.push(id);
                    this.game.notify(`👷 UNION: ${npc.name} has joined the Pioneer Labor Union.`, "info");
                }
            }

            // Roadmap Item 118: Mental Health Mechanics
            this.updateMentalHealth(id, dt);

            // Roadmap Item 119: Space Madness
            this.updateSpaceMadness(id, dt);

            // Roadmap Item 120: AI Art & Music creation
            if (this.game.day % 15 === 0 && Math.random() < 0.05) {
                this.generateAIArt(id);
            }

            // Roadmap Item 123: NPC Betrayal
            if (npc.secretAgenda !== 'None' && Math.random() < 0.0001 * dt) {
                this.triggerBetrayal(id);
            }

            // Roadmap Item 117: NPC Mentorship/Tutoring
            if (this.game.day % 7 === 0 && Math.random() < 0.05) {
                this.performMentorship(id);
            }

            // Roadmap Item 101: Social Relationships (Friendships/Rivalries)
            if (Math.random() < 0.01 * dt) {
                this.updateSocialRelationships(id);
            }

            // Roadmap Item 112: Belongings (Acquisition)
            if (Math.random() < 0.005 * dt) {
                this.updateBelongings(id);
            }

            // Roadmap Item 119/198: Alien Stance Impact
            this.applyAlienStanceImpact(id, dt);

            // Roadmap Item 115: Altruism (Chance to help others)
            if (npc.personality.agreeableness > 0.8 && Math.random() < 0.01 * dt) {
                this.performAltruisticAction(id);
            }

            // Roadmap Item 113: Conflict Resolution
            if (npc.emotions.stress > 70 && Math.random() < 0.02 * dt) {
                this.resolveConflict(id);
            }

            // Roadmap Item 110: Social Hierarchy (Rank update)
            if (this.game.day % 10 === 0 && colonist.career.level > 5) {
                npc.rank = Math.min(10, npc.rank + 1);
            }

            // Roadmap Item 132: Update Expressions
            this.updateFacialExpression(id);

            // Roadmap Item 133: Clothing shifts
            if (npc.rank > 5 && npc.outfitType === 'Standard') {
                npc.outfitType = 'Elite';
                this.game.notify(`👗 STYLE: ${npc.name} has upgraded their attire to match their social standing.`, "info");
            }

            // Roadmap Item 191: AI-driven historical reenactments
            if (this.game.day % 20 === 0 && Math.random() < 0.05) {
                this.triggerHistoricalReenactment(id);
            }

            // Roadmap Item 130: NPC Burnout
            if (colonist.job !== 'unemployed' && colonist.morale < 15 && Math.random() < 0.01 * dt) {
                this.triggerBurnout(id);
            }

            // Roadmap Item 182: Fitness decay/recovery
            if (npc.job === 'unemployed') {
                npc.fitness = Math.max(0, npc.fitness - 0.01 * dt);
            } else {
                npc.fitness = Math.min(100, npc.fitness + 0.005 * dt);
            }

            // Roadmap Item 128: NPC Relic discovery
            if (colonist.job === 'miner' && Math.random() < 0.0005 * dt) {
                this.triggerRelicDiscovery(id);
            }

            // Roadmap Item 183: AI-driven medical diagnosis
            if (npc.health < 50 && Math.random() < 0.01 * dt) {
                this.performMedicalDiagnosis(id);
            }

            // Roadmap Item 190: NPC "Memory Loss"
            const radiation = this.game.terraforming?.stats.magnetism < 30 ? 0.1 : 0;
            if (radiation > 0 && Math.random() < 0.0001 * radiation * dt) {
                this.triggerMemoryLoss(id);
            }

            // Roadmap Item 180: Addiction mechanics
            if (colonist.morale < 30 && Math.random() < 0.001 * dt) {
                this.triggerAddiction(id);
            }

            // Roadmap Item 172: Religious Schisms (Conflict chance)
            if (Math.random() < 0.0005 * dt) {
                this.triggerReligiousSchism(id);
            }

            // Roadmap Item 174: Personal Archives (Periodic logging)
            if (this.game.day % 5 === 0 && Math.random() < 0.1) {
                this.addToArchive(id, `Day ${this.game.day}: Thoughts on ${npc.role}. Morale is ${Math.floor(colonist.morale)}%. Philosophy: ${npc.philosophy}.`);
            }

            // Roadmap Item 242 & 243: Economic Status & Luxury Goods
            this.updateEconomicStatus(id, dt);

            // Roadmap Item 395: Trans-dimensional NPC behavior
            if (npc.isTransdimensional) {
                this.updateTransdimensionalNPC(id, dt);
            }
        });

        // Roadmap Item 126: Election Cycle
        if (this.game.day >= this.politicalSystem.nextElectionDay) {
            this.runElection();
        }

        // Roadmap Item 228: Union Strikes
        this.updateUnionStrikes(dt);
    }

    updateUnionStrikes(dt) {
        if (this.unions.membership.length > this.game.colonists.length * 0.4) {
            if (!this.unions.active) {
                this.unions.active = true;
                this.game.notify("📢 LABOR UNION: A formal labor union has been established!", "warning");
            }

            if (!this.unions.striking && Math.random() < 0.005 * dt) {
                this.triggerStrike();
            }
        }
    }

    triggerStrike() {
        this.unions.striking = true;
        this.game.notify("🚨 STRIKE: Union members have walked off the job demanding better conditions!", "danger");
        this.game.addChatterPost("UNION_REP", "We will not return to work until our voices are heard! Fair rations and safer domes now!", "#ef4444", 'news');
        
        // Impact: striking NPCs have their work speed set to 0 (handled via simulation loop)
        this.unions.demands = ['Higher Rations', 'Bonus Credits'];
    }

    resolveStrike(concession) {
        if (!this.unions.striking) return;
        this.unions.striking = false;
        this.game.notify(`✅ STRIKE RESOLVED: Pioneers return to work after ${concession} were granted.`, "success");
        this.unions.demands = [];
        this.game.colonists.forEach(c => c.morale = Math.min(100, c.morale + 20));
    }

    updateEconomicStatus(npcId, dt) {
        // Roadmap Item 242: Poverty and wealth inequality impacts
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        if (!npc || !colonist) return;

        const avgCredits = Object.values(this.npcs).reduce((sum, n) => sum + (n.credits || 0), 0) / this.game.colonists.length;
        const myCredits = npc.credits || 0;

        // Poverty impact
        if (myCredits < 5) {
            colonist.morale = Math.max(0, colonist.morale - 0.05 * dt);
            npc.emotions.stress = Math.min(100, npc.emotions.stress + 0.1 * dt);
        }

        // Inequality impact (relative deprivation)
        if (myCredits < avgCredits * 0.5) {
            npc.emotions.loneliness = Math.min(100, npc.emotions.loneliness + 0.05 * dt);
            if (Math.random() < 0.001 * dt) {
                this.game.addChatterPost(npc.name, "Everyone else seems to be doing so much better than me...", "#94a3b8", 'npc');
            }
        }

        // Roadmap Item 243: Luxury goods acquisition
        if (myCredits > 50 && Math.random() < 0.01 * dt) {
            const luxuries = ['Premium Coffee', 'Silk Bedding', 'Digital Art Piece', 'Vintage Wine', 'Holographic E-Reader'];
            const item = luxuries[Math.floor(Math.random() * luxuries.length)];
            const cost = 30 + Math.floor(Math.random() * 20);
            
            if (npc.credits >= cost) {
                npc.credits -= cost;
                npc.belongings.push(item);
                colonist.morale = Math.min(100, colonist.morale + 15);
                this.game.notify(`💎 LUXURY: ${npc.name} purchased ${item} for their quarters.`, "success");
            }
        }
    }

    updateTransdimensionalNPC(npcId, dt) {
        // Roadmap Item 395: NPCs from other timelines
        const npc = this.npcs[npcId];
        if (Math.random() < 0.005 * dt) {
            const messages = [
                "I remember a version of this colony where the sky was purple.",
                "In my original timeline, we never found the Omega Seed.",
                "Wait, weren't you wearing a different uniform a second ago?",
                "The stars look... slightly out of position today."
            ];
            this.game.addChatterPost(npc.name, messages[Math.floor(Math.random() * messages.length)], "#38bdf8", 'npc');
            
            // Trans-dimensional NPCs provide a science bonus
            this.game.resources.data += 1 * dt;
        }
    }

    updateMentalHealth(npcId, dt) {
        // Roadmap Item 118: Stress and Anxiety simulation
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        
        // Stress increases with low morale or high work pressure
        if (colonist.morale < 40) npc.emotions.stress = Math.min(100, npc.emotions.stress + 0.2 * dt);
        else npc.emotions.stress = Math.max(0, npc.emotions.stress - 0.1 * dt);

        // Potential for therapy if stress is high
        if (npc.emotions.stress > 80 && Math.random() < 0.01 * dt) {
            this.game.notify(`🧘 THERAPY: ${npc.name} is attending a mindfulness session to manage critical stress.`, "info");
            npc.emotions.stress -= 30;
        }
    }

    performMentorship(npcId) {
        // Roadmap Item 117: Senior NPCs tutoring juniors
        const mentor = this.npcs[npcId];
        const mentorCol = this.game.colonists.find(c => c.id === npcId);
        if (!mentorCol || mentorCol.career.level < 10) return;

        const mentee = Object.values(this.npcs).find(n => {
            const c = this.game.colonists.find(col => col.id === n.id);
            return c && c.id !== npcId && c.job === mentorCol.job && c.career.level < 5;
        });

        if (mentee) {
            const menteeCol = this.game.colonists.find(c => c.id === mentee.id);
            menteeCol.career.exp += 50;
            this.game.notify(`🎓 MENTORSHIP: ${mentor.name} is tutoring ${mentee.name} in ${mentorCol.job} protocols.`, "success");
        }
    }

    performAltruisticAction(npcId) {
        // Roadmap Item 115: Altruism
        const others = Object.values(this.npcs).filter(n => n.id !== npcId);
        const lowMorale = others.find(n => {
            const c = this.game.colonists.find(col => col.id === n.id);
            return c && c.morale < 40;
        });

        if (lowMorale) {
            const col = this.game.colonists.find(c => c.id === lowMorale.id);
            col.morale = Math.min(100, col.morale + 10);
            this.game.notify(`❤️ ALTRUISM: ${this.npcs[npcId].name} spent time cheering up ${lowMorale.name}.`, "success");
        }
    }

    resolveConflict(npcId) {
        // Roadmap Item 113: Conflict Resolution
        const npc = this.npcs[npcId];
        npc.emotions.stress = Math.max(0, npc.emotions.stress - 20);
        this.game.notify(`🕊️ CONFLICT RESOLVED: ${npc.name} has settled a workplace dispute peacefully.`, "success");
    }

    updateSocialRelationships(npcId) {
        // Roadmap Item 101: Friendships and Rivalries
        const npc = this.npcs[npcId];
        const otherIds = Object.keys(this.npcs).filter(id => id !== npcId);
        if (otherIds.length === 0) return;

        const targetId = otherIds[Math.floor(Math.random() * otherIds.length)];
        const target = this.npcs[targetId];
        
        if (!npc.relationships[targetId]) npc.relationships[targetId] = 50;
        
        // Relationship shift based on personality compatibility
        const compatibility = 1.0 - Math.abs(npc.personality.openness - target.personality.openness);
        const shift = (compatibility > 0.7 ? 1 : -1) * (Math.random() * 2);
        
        npc.relationships[targetId] = Math.max(0, Math.min(100, npc.relationships[targetId] + shift));
        
        if (npc.relationships[targetId] > 80 && Math.random() < 0.05) {
            this.game.addChatterPost(npc.name, `Had a great time discussing ${npc.hobby?.name || 'space'} with ${target.name}.`, "#4ade80", 'npc');
        } else if (npc.relationships[targetId] < 20 && Math.random() < 0.05) {
            this.game.addChatterPost(npc.name, `I really can't stand the way ${target.name} handles their duties.`, "#f87171", 'npc');
        }
    }

    updateBelongings(npcId) {
        // Roadmap Item 112: Personal Belongings
        const npc = this.npcs[npcId];
        const items = ['Lucky Charm', 'Old Earth Photo', 'Custom Tool', 'Alien Pebble', 'Digital Journal'];
        if (npc.belongings.length < 5) {
            const newItem = items[Math.floor(Math.random() * items.length)];
            if (!npc.belongings.includes(newItem)) {
                npc.belongings.push(newItem);
                // Potential small morale boost
                const colonist = this.game.colonists.find(c => c.id === npcId);
                if (colonist) colonist.morale = Math.min(100, colonist.morale + 2);
            }
        }
    }

    applyAlienStanceImpact(npcId, dt) {
        // Roadmap Item 119/198: Alien Stance Impact (Xenophilia vs Fear)
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        
        const alienPresence = this.game.alienSignals?.activeSignals.length > 0;
        
        if (alienPresence) {
            if (npc.alienStance === 'Fear') {
                npc.emotions.fear = Math.min(100, npc.emotions.fear + 0.1 * dt);
                colonist.morale = Math.max(0, colonist.morale - 0.05 * dt);
            } else if (npc.alienStance === 'Xenophilia') {
                npc.emotions.happiness = Math.min(100, npc.emotions.happiness + 0.1 * dt);
                colonist.morale = Math.min(100, colonist.morale + 0.05 * dt);
            }
        }
    }

    updateFacialExpression(npcId) {
        // Roadmap Item 132: Procedural facial expressions logic
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        if (colonist.morale > 80) npc.currentExpression = 'beaming';
        else if (colonist.morale > 60) npc.currentExpression = 'smiling';
        else if (colonist.morale < 20) npc.currentExpression = 'distressed';
        else if (colonist.morale < 40) npc.currentExpression = 'frowning';
        else npc.currentExpression = 'neutral';
    }

    suggestJob(npc) {
        const p = npc.personality;
        if (p.openness > 0.7) return 'researcher';
        if (p.conscientiousness > 0.7) return 'engineer';
        if (p.extroversion > 0.7) return 'botanist';
        return 'miner';
    }

    applyHerdMentality(npcId) {
        // Roadmap Item 111: Herd Mentality
        const npc = this.npcs[npcId];
        const others = Object.values(this.npcs).filter(n => n.id !== npcId);
        if (others.length === 0) return;

        const neighbor = others[Math.floor(Math.random() * others.length)];
        // Sync emotions slightly
        npc.emotions.fear = (npc.emotions.fear + neighbor.emotions.fear) / 2;
    }

    triggerBurnout(npcId) {
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        if (npc && colonist) {
            colonist.job = 'unemployed';
            this.game.notify(`😫 BURNOUT: ${npc.name} has reached critical stress levels and quit their job.`, "danger");
            this.game.addChatterPost(npc.name, "I can't take this anymore. I need a break from the routine.", "#f87171", 'npc');
        }
    }

    triggerRelicDiscovery(npcId) {
        const npc = this.npcs[npcId];
        const relics = ['Ancient Circuitry', 'Encoded Datapad', 'Strange Fossil', 'Glowing Shard'];
        const relic = relics[Math.floor(Math.random() * relics.length)];
        this.game.notify(`🏺 DISCOVERY: ${npc.name} found a ${relic} while working!`, "success");
        this.game.resources.data += 25;
        this.game.recordColonyEvent(`${npc.name} discovered a relic from a past era.`, 0.7);
    }

    runElection() {
        // Roadmap Item 126: NPC voting and election cycles
        const candidates = Object.values(this.npcs).sort(() => 0.5 - Math.random()).slice(0, 2);
        if (candidates.length < 2) return;

        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        const systems = ['Democracy', 'Technocracy', 'Meritocracy', 'Autocracy'];
        const newSystem = systems[Math.floor(Math.random() * systems.length)];
        
        this.politicalSystem.currentGovernment = newSystem;
        this.politicalSystem.nextElectionDay += 50;
        
        this.game.notify(`🗳️ ELECTION: ${winner.name} has been elected! Government shifted to ${newSystem}.`, "info");
        this.game.addChatterPost("GOVERNANCE", `Election results certified. New cycle begins under ${winner.name}.`, "#38bdf8", 'news');
    }

    triggerHistoricalReenactment(npcId) {
        const npc = this.npcs[npcId];
        const events = ['The Earth Departure', 'The First Warp Jump', 'The Oxygen Crisis of Day 12'];
        const event = events[Math.floor(Math.random() * events.length)];
        this.game.notify(`🎭 CULTURE: ${npc.name} is organizing a reenactment of "${event}".`, "info");
        this.game.addChatterPost(npc.name, `Remembering our roots with a performance of ${event} tonight!`, "#a855f7", 'npc');
    }

    // Roadmap Item 200: Mind Uploading
    uploadMind(npcId) {
        const npc = this.npcs[npcId];
        if (!this.game.resources.data || this.game.resources.data < 1000) {
            this.game.notify("Need 1000 Data for Neural Upload!", "warning");
            return false;
        }
        this.game.resources.data -= 1000;
        npc.role = 'Digital Consciousness';
        this.game.notify(`🌌 ASCENSION: ${npc.name}'s consciousness has been uploaded to the colony core!`, "success");
        return true;
    }

    performMedicalDiagnosis(npcId) {
        const npc = this.npcs[npcId];
        const conditions = ['Low Oxygen Stress', 'Mineral Dust Lung', 'Neural Fatigue'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        this.game.notify(`🏥 MEDICAL AI: Diagnosed ${npc.name} with ${condition}. Treatment initiated.`, "info");
        npc.health = Math.min(100, npc.health + 20);
    }

    triggerMemoryLoss(npcId) {
        const npc = this.npcs[npcId];
        if (this.memories[npcId] && this.memories[npcId].length > 5) {
            this.memories[npcId].splice(1, 1); // Remove an old memory
            this.game.notify(`🧠 MEMORY LOSS: ${npc.name} is experiencing cognitive gaps due to radiation.`, "warning");
        }
    }

    // Roadmap Item 188: NPC Pet System
    assignPet(npcId) {
        const npc = this.npcs[npcId];
        if (npc.pets.length > 0) return;
        const petTypes = ['Alien Spore-Pup', 'Glow-Lizard', 'Dust-Cat'];
        const pet = petTypes[Math.floor(Math.random() * petTypes.length)];
        npc.pets.push(pet);
        this.game.notify(`🐾 PET: ${npc.name} has adopted a ${pet}!`, "success");
    }

    // Roadmap Item 189: AI-driven robotic assistant
    assignRobotAssistant(npcId) {
        const npc = this.npcs[npcId];
        if (npc.robotAssistant) return;
        npc.robotAssistant = { type: 'Helper Bot', efficiency: 1.2 };
        this.game.notify(`🤖 ROBOT: ${npc.name} now has a robotic assistant for work.`, "info");
    }

    triggerAddiction(npcId) {
        const npc = this.npcs[npcId];
        if (npc.addictions.length > 0) return;
        const types = ['Stim-Injections', 'Virtual Reality', 'Deep-Space Contemplation'];
        const type = types[Math.floor(Math.random() * types.length)];
        npc.addictions.push({ type, severity: 0.1, dayStarted: this.game.day });
        this.game.notify(`⚠️ ADDICTION: ${npc.name} has developed a dependency on ${type} to cope with stress.`, "warning");
    }

    triggerReligiousSchism(npcId) {
        const npc = this.npcs[npcId];
        const otherNPCs = Object.values(this.npcs).filter(n => n.id !== npcId && n.religion !== npc.religion);
        if (otherNPCs.length === 0) return;
        
        const target = otherNPCs[Math.floor(Math.random() * otherNPCs.length)];
        this.game.notify(`⚖️ RELIGIOUS SCHISM: ${npc.name} (${npc.religion}) is in a heated theological debate with ${target.name} (${target.religion}).`, "info");
        this.game.addChatterPost(npc.name, `Your beliefs in ${target.religion} are fundamentally flawed for life on ${this.game.planetData.name}!`, "#fbbf24", 'npc');
    }

    addToArchive(npcId, text) {
        const npc = this.npcs[npcId];
        npc.archives.push({ day: this.game.day, text });
        if (npc.archives.length > 10) npc.archives.shift();
    }

    generateArchitecturalStyle(p) {
        // Roadmap Item 165: AI-driven architectural styles
        const styles = ['Brutalist', 'Biophilic', 'High-Tech', 'Gothic-Industrial', 'Nomadic'];
        if (p.openness > 0.8) return 'Biophilic';
        if (p.conscientiousness > 0.8) return 'Brutalist';
        if (p.extroversion > 0.8) return 'High-Tech';
        return styles[Math.floor(Math.random() * styles.length)];
    }

    handleFearOfTheDark(npcId) {
        // Roadmap Item 168: NPC "Fear of the Dark"
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        if (!npc || !colonist) return;

        const isNight = this.game.timeOfDay < 6 || this.game.timeOfDay > 20;
        if (isNight && npc.personality.neuroticism > 0.7) {
            // High neuroticism NPCs lose morale faster at night if lights are low (simulation simplified)
            colonist.morale = Math.max(0, colonist.morale - 0.1);
            if (Math.random() < 0.01) {
                this.game.addChatterPost(npc.name, "It's too quiet out there in the dark. I don't like the way the shadows move.", "#94a3b8", 'npc');
            }
        }
    }

    generateHobby(p) {
        const hobbies = [
            { name: 'Hydroponic Gardening', trait: 'conscientiousness', bonus: 'food' },
            { name: 'Retro Gaming', trait: 'openness', bonus: 'data' },
            { name: 'Alien Archaeology', trait: 'openness', bonus: 'data' },
            { name: 'Zero-G Dance', trait: 'extroversion', bonus: 'morale' },
            { name: 'Circuit Repair', trait: 'conscientiousness', bonus: 'energy' },
            { name: 'Xeno-Poetry', trait: 'openness', bonus: 'morale' },
            { name: 'Mineral Polishing', trait: 'neuroticism', bonus: 'minerals' }
        ];
        
        // Find hobbies matching personality
        const potential = hobbies.filter(h => p[h.trait] > 0.5);
        if (potential.length > 0) return potential[Math.floor(Math.random() * potential.length)];
        return hobbies[Math.floor(Math.random() * hobbies.length)];
    }

    generateBackstory(p) {
        // Roadmap Item 134: Procedural Backstory Engine
        const origins = ["Earth's crowded megacities", "a orbital habitat near Jupiter", "the Martian red-dust plains", "a strictly religious lunar sect", "a corporate laboratory on Titan"];
        const reasons = ["seeking adventure", "escaping corporate debt", "following a scientific calling", "looking for a fresh start", "sent by a secret sub-faction"];
        const events = ["once survived a hull breach", "discovered a minor relic as a child", "lost a relative in the Great Flare", "was a champion in local robotics leagues"];

        const origin = origins[Math.floor(Math.random() * origins.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        const event = events[Math.floor(Math.random() * events.length)];

        return `Born in ${origin}, ${this.npcs[Object.keys(this.npcs)[0]]?.name || 'this pioneer'} came to the colony ${reason}. They ${event}.`;
    }

    simulateDream(npcId) {
        // Roadmap Item 145: Dream Simulation
        const npc = this.npcs[npcId];
        if (!npc) return;

        const p = npc.personality;
        const roll = Math.random();
        let dream = { type: 'neutral', text: "A blur of shifting stars.", impact: 0 };

        if (roll < 0.2 + (p.neuroticism * 0.2)) {
            dream = { type: 'nightmare', text: "A cold void where the atmosphere is gone.", impact: -5 };
        } else if (roll > 0.8 - (p.openness * 0.2)) {
            dream = { type: 'vision', text: "A thriving green world under a dual sun.", impact: 5 };
        } else if (roll > 0.5 && p.extroversion > 0.6) {
            dream = { type: 'social', text: "A grand banquet back on Earth with family.", impact: 3 };
        }

        npc.lastDream = dream;
        return dream;
    }

    generateRecruitPool() {
        // Roadmap Item 148: AI recruitment of specialized NPCs
        const pool = [];
        const names = ['Aura', 'Blythe', 'Cade', 'Dax', 'Elara', 'Finn', 'Gia', 'Hale'];
        const jobs = ['engineer', 'scientist', 'miner', 'farmer', 'pilot'];

        for (let i = 0; i < 3; i++) {
            const name = names[Math.floor(Math.random() * names.length)] + " " + (i + 1);
            const job = jobs[Math.floor(Math.random() * jobs.length)];
            const personality = this.generatePersonality();
            const cost = 200 + Math.floor(Math.random() * 300);
            
            pool.push({
                id: 'recruit_' + Math.random().toString(36).substr(2, 5),
                name,
                job,
                personality,
                cost,
                traits: this.getPersonalityDescriptionFromData(personality)
            });
        }
        return pool;
    }

    getPersonalityDescriptionFromData(p) {
        const desc = [];
        if (p.openness > 0.7) desc.push("Creative");
        if (p.conscientiousness > 0.7) desc.push("Disciplined");
        if (p.extroversion > 0.7) desc.push("Outgoing");
        if (p.agreeableness > 0.7) desc.push("Friendly");
        if (p.neuroticism > 0.7) desc.push("Anxious");
        return desc.join(", ") || "Balanced";
    }

    recruitNPC(recruit) {
        if (this.game.resources.credits < recruit.cost) {
            this.game.notify("Not enough credits to recruit!", "warning");
            return false;
        }

        this.game.resources.credits -= recruit.cost;
        const colonist = {
            id: recruit.id,
            name: recruit.name,
            job: recruit.job,
            morale: 100,
            health: 100,
            needs: { food: 100, energy: 100, social: 100 }
        };
        
        this.game.colonists.push(this.game.normalizeColonist(colonist));
        this.registerNPC(colonist);
        
        // Ensure the NPC data we just registered has the personality from the recruit pool
        this.npcs[recruit.id].personality = recruit.personality;
        
        this.game.notify(`Recruited ${recruit.name} as ${recruit.job}!`, "success");
        this.game.updateResourceUI();
        return true;
    }

    generateGossip(npcId) {
        // Roadmap Item 152: NPC "Gossip" mechanic
        const npc = this.npcs[npcId];
        if (!npc) return null;

        const otherNPCs = Object.values(this.npcs).filter(n => n.id !== npcId);
        if (otherNPCs.length === 0) return null;

        const target = otherNPCs[Math.floor(Math.random() * otherNPCs.length)];
        const topics = [
            `Did you hear that ${target.name} spent all night ${target.hobby?.name || 'doing nothing'}?`,
            `I think ${target.name} is planning something big for the colony.`,
            `${target.name}'s backstory about ${target.backstory?.split(' ').slice(-3).join(' ') || 'the past'} sounds suspicious...`,
            `Someone told me ${target.name} has a secret stash of ${['credits', 'minerals', 'food'][Math.floor(Math.random() * 3)]}.`
        ];

        const gossip = topics[Math.floor(Math.random() * topics.length)];
        return { author: npc.name, content: gossip, targetId: target.id };
    }

    handleTraitMutation(npcId, radiationLevel) {
        // Roadmap Item 149: NPC "Trait Mutation" in high-radiation zones
        const npc = this.npcs[npcId];
        if (!npc || radiationLevel < 0.5) return;

        if (Math.random() < 0.05 * radiationLevel) {
            const traits = Object.keys(npc.personality);
            const traitToMutate = traits[Math.floor(Math.random() * traits.length)];
            const oldVal = npc.personality[traitToMutate];
            npc.personality[traitToMutate] = Math.max(0, Math.min(1, npc.personality[traitToMutate] + (Math.random() - 0.5) * 0.4));
            
            this.game.notify(`🧬 MUTATION: ${npc.name}'s ${traitToMutate} trait has shifted due to radiation exposure!`, "warning");
            this.game.recordColonyEvent(`${npc.name} underwent a personality shift from radiation.`, 0.3);
        }
    }

    getPersonalityDescription(npcId) {
        const p = this.npcs[npcId].personality;
        const desc = [];
        if (p.openness > 0.7) desc.push("Creative and curious");
        if (p.conscientiousness > 0.7) desc.push("Disciplined and organized");
        if (p.extroversion > 0.7) desc.push("Outgoing and energetic");
        if (p.agreeableness > 0.7) desc.push("Friendly and cooperative");
        if (p.neuroticism > 0.7) desc.push("Anxious and sensitive");
        if (p.neuroticism < 0.3) desc.push("Calm and confident");

        return desc.join(", ") || "Average and balanced";
    }

    async talkTo(npcId, userMessage) {
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        if (!npc || !colonist) return "Who are you talking to?";

        // Roadmap Item 153: Procedural Insults and Compliments
        if (Math.random() < 0.2) {
            const flavor = this.generateInteractionFlavor(npc);
            userMessage = `(Mood: ${flavor}) ${userMessage}`;
        }

        // Roadmap Item 103: Integrate memories from the colonist object
        const memories = colonist.memory || [];
        const memoryContext = memories.length > 0 
            ? `\nRecent Memories: ${memories.map(m => m.event).join(". ")}` 
            : "";

        // Roadmap Item 105: Integrate emotional states
        const emotions = colonist.emotions || { happiness: 50, stress: 0, fear: 0, loneliness: 0 };
        const emotionalState = `Happiness: ${emotions.happiness}%, Stress: ${emotions.stress}%, Fear: ${emotions.fear}%, Loneliness: ${emotions.loneliness}%`;

        // Build Context
        const recentMemories = this.memories[npcId]
            .slice(-4)
            .map(m => `[${m.role}]: ${m.content}`)
            .join("\n");

        const context = `
Role: ${npc.role}
Personality: ${this.getPersonalityDescription(npcId)}
Emotional State: ${emotionalState}
Colony Morale: ${this.game.morale}/100
Colony Status: Day ${this.game.day}, Weather: ${this.game.terraforming?.currentWeather || 'Clear'}${memoryContext}
Recent Conversation:
${recentMemories}
        `.trim();

        const response = await window.aiCore.chat(npc.name, this.getPersonalityDescription(npcId), context, userMessage);

        // Save interaction to memory
        if (response) {
            this.memories[npcId].push({ role: 'user', content: userMessage });
            this.memories[npcId].push({ role: 'assistant', content: response });
            
            // Item 103: Record this interaction in the colonist's memory too
            this.game.recordColonyEvent(`Had a conversation with the Captain.`, 0.4);
        }

        return response;
    }
    generateInteractionFlavor(npc) {
        const p = npc.personality;
        if (p.agreeableness > 0.8) return "Complimentary and helpful";
        if (p.agreeableness < 0.2) return "Insulting and dismissive";
        if (p.neuroticism > 0.8) return "Anxious and frantic";
        return "Neutral and professional";
    }

    updateScientificBreakthroughs() {
        // Roadmap Item 156: AI-driven scientific breakthroughs
        const highIntelNPCs = Object.values(this.npcs).filter(n => n.personality.openness > 0.9);
        if (highIntelNPCs.length > 0 && Math.random() < 0.01 * highIntelNPCs.length) {
            const bonusData = 50 + Math.floor(Math.random() * 50);
            this.game.resources.data += bonusData;
            this.game.notify(`🔬 BREAKTHROUGH: ${highIntelNPCs[0].name} has published a revolutionary paper! +${bonusData} Data`, "success");
            this.game.updateResourceUI();
        }
    }

    handleSuccession(npcId) {
        // Roadmap Item 155: NPC "Succession" planning
        const npc = this.npcs[npcId];
        if (npc && npc.role === 'Leader' && Math.random() < 0.05) {
            const successor = Object.values(this.npcs).find(n => n.id !== npcId && n.personality.conscientiousness > 0.7);
            if (successor) {
                this.game.notify(`🏛️ SUCCESSION: ${successor.name} is being groomed to succeed ${npc.name} as colony leader.`, "info");
            }
        }
    }

    handleRetirement(npcId) {
        // Roadmap Item 158: NPC "Retirement"
        const npc = this.npcs[npcId];
        if (!npc) return;

        // Retired NPCs stop working but stay in the colony as "Elders"
        if (this.game.day > 100 && Math.random() < 0.001) {
            npc.role = 'Retired';
            npc.job = 'Elder';
            this.game.notify(`👴 RETIREMENT: ${npc.name} has officially retired after years of service.`, "info");
            this.generateLegacy(npcId); // Leaves a legacy upon retirement
        }
    }

    updatePopulationGrowth() {
        // Roadmap Item 159: AI-driven population growth models
        // New colonists join based on colony morale and habitability
        const moraleMult = this.game.morale / 100;
        const habitability = this.game.terraforming?.habitability || 0.2;
        
        if (this.game.day % 30 === 0 && Math.random() < moraleMult * habitability) {
            const recruitPool = this.generateRecruitPool();
            const automaticRecruit = recruitPool[0];
            
            // Automatic arrival if morale is high
            if (this.game.morale > 80 && this.game.colonists.length < this.game.basePopulationCap) {
                this.recruitNPC({ ...automaticRecruit, cost: 0 }); // Free arrival
                this.game.notify(`🚀 ARRIVAL: A new pioneer, ${automaticRecruit.name}, has joined the colony!`, "success");
            }
        }
    }

    handleProtest(npcId) {
        // Roadmap Item 162: NPC "Protest" and "Strike" mechanics
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        if (!npc || !colonist) return;

        if (colonist.morale < 20 || colonist.needs.social < 10) {
            if (Math.random() < 0.05) {
                this.game.notify(`📢 PROTEST: ${npc.name} is on strike due to poor conditions!`, "danger");
                this.game.addChatterPost(npc.name, "I'm not working until things improve around here!", "#ef4444", 'npc');
                // Could disable their job output in exoplanet-pioneer.js
                npc.onStrike = true;
            }
        } else if (npc.onStrike && colonist.morale > 50) {
            npc.onStrike = false;
            this.game.notify(`✅ RESOLVED: ${npc.name} has returned to work.`, "success");
        }
    }

    handleExpertiseSharing() {
        // Roadmap Item 164: NPC "Expertise" sharing
        const npcs = Object.values(this.npcs);
        if (npcs.length < 2) return;

        const expert = npcs.find(n => n.personality.conscientiousness > 0.8);
        const learner = npcs.find(n => n.id !== expert?.id && n.personality.openness > 0.6);

        if (expert && learner && Math.random() < 0.02) {
            this.game.notify(`🎓 EXPERTISE: ${expert.name} is teaching ${learner.name} advanced techniques.`, "info");
            // Could add temporary efficiency buffs
        }
    }

    updateSpaceMadness(npcId, dt) {
        // Roadmap Item 119: Space Madness
        const npc = this.npcs[npcId];
        const colonist = this.game.colonists.find(c => c.id === npcId);
        
        if (colonist.morale < 10 && npc.emotions.stress > 90) {
            if (Math.random() < 0.01 * dt) {
                this.game.notify(`🌀 SPACE MADNESS: ${npc.name} is babbling about the "Void Beyond". Efficiency critical.`, "danger");
                this.game.addChatterPost(npc.name, "THE STARS ARE EYES. THEY ARE WATCHING US. DON'T LOOK AT THE LIGHTS!", "#ef4444", 'npc');
                npc.madnessLevel = (npc.madnessLevel || 0) + 1;
            }
        }
    }

    generateAIArt(npcId) {
        // Roadmap Item 120: AI-driven art and music
        const npc = this.npcs[npcId];
        const types = ['Digital Mural', 'Symphony of the Spheres', 'Neural Sculpture', 'Vacuum Poetry'];
        const art = types[Math.floor(Math.random() * types.length)];
        this.game.notify(`🎨 CREATIVITY: ${npc.name} has completed a ${art} based on ${npc.artStyle}.`, "success");
        this.game.addChatterPost(npc.name, `I've finished my new work: "${art}". It captures the spirit of ${this.game.planetData.name}.`, "#f472b6", 'npc');
        this.game.resources.data += 10;
    }

    triggerBetrayal(npcId) {
        // Roadmap Item 123: NPCs can betray the player
        const npc = this.npcs[npcId];
        this.game.notify(`🚨 BETRAYAL: ${npc.name} was caught acting as a ${npc.secretAgenda}!`, "danger");
        this.game.addChatterPost("SECURITY", `${npc.name} has been detained for questioning regarding ${npc.secretAgenda} activities.`, "#ef4444", 'news');
        this.game.recordColonyEvent(`A colonial betrayal involving ${npc.name} was uncovered.`, 0.9);
        // Penalty: resource loss
        const res = ['energy', 'minerals', 'credits'][Math.floor(Math.random() * 3)];
        this.game.resources[res] = Math.max(0, (this.game.resources[res] || 0) - 100);
        npc.secretAgenda = 'None'; // Exposed
    }

    handleNPCDeath(npcId) {
        // Roadmap Item 121: NPC funeral rites and memorialization
        const npc = this.npcs[npcId];
        if (!npc) return;
        this.game.notify(`🪦 MEMORIAL: The colony gathers to honor the life of ${npc.name}.`, "warning");
        this.game.addChatterPost("GOVERNANCE", `A day of mourning has been declared for ${npc.name}. Their legacy: ${this.legacies[npcId]?.name || 'Pioneer of the Stars'}.`, "#94a3b8", 'news');
        // Delete NPC data after memorial
        delete this.npcs[npcId];
    }

    // Roadmap Item 1876: Genetic Drift Simulation
    performGeneticDrift() {
        const npcs = Object.values(this.npcs);
        if (npcs.length < 2) return;

        npcs.forEach(n => {
            // Random mutation of traits based on isolation
            const driftRate = 0.05;
            Object.keys(n.personality).forEach(trait => {
                n.personality[trait] += (Math.random() - 0.5) * driftRate;
                n.personality[trait] = Math.max(0, Math.min(1, n.personality[trait]));
            });
        });
        this.game.notify("🧬 GENETIC DRIFT: Colonial isolation is causing subtle personality shifts.", "info");
    }

    // Roadmap Item 1878: Cultural Evolution
    updateColonyCulture() {
        const currentReligions = Object.values(this.npcs).map(n => n.religion);
        const dominant = this.getMostFrequent(currentReligions);
        
        if (dominant && this.game.colonyCulture !== dominant) {
            this.game.colonyCulture = dominant;
            this.game.notify(`🎭 CULTURAL EVOLUTION: "${dominant}" has become the dominant colonial ideology.`, "success");
        }
    }

    getMostFrequent(arr) {
        const hashmap = arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(hashmap).reduce((a, b) => hashmap[a] > hashmap[b] ? a : b);
    }

    exportState() {
        return {
            npcs: this.npcs,
            memories: this.memories
        };
    }

    importState(data) {
        if (!data) return;
        if (data.npcs) this.npcs = data.npcs;
        if (data.memories) this.memories = data.memories;
    }
}

// Global Access
window.NPCSystem = NPCSystem;
