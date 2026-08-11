/**
 * 🤝 DIPLOMATIC AI SYSTEM
 * Era II: The Living Cosmos - The Intelligence Explosion
 * 
 * Faction memory spanning generations of interaction with
 * historical tracking, relationship dynamics, and strategic decision-making.
 */

class DiplomaticAISystem {
    constructor(game) {
        this.game = game;
        this.factions = new Map();
        this.diplomaticRelations = new Map();
        this.treaties = new Map();
        this.wars = new Map();
        this.tradeAgreements = new Map();
        
        this.history = new Map();
        this.generationMemory = new Map();
        
        this.maxHistoryLength = 1000;
        this.memoryDecayRate = 0.0001;
        
        this.diplomaticActions = [
            'propose_alliance', 'declare_war', 'propose_peace',
            'demand_tribute', 'offer_trade', 'send_aid',
            'insult', 'compliment', 'threaten', 'negotiate'
        ];
        
        this.reactionFactors = {
            trust: 0.4,
            respect: 0.3,
            fear: 0.2,
            selfInterest: 0.1
        };
        
        console.log('🤝 Diplomatic AI System: Initialized');
    }

    /**
     * Initialize the diplomatic system
     */
    initialize(config = {}) {
        this.createInitialFactions(config.factions || 5);
        this.generateInitialRelations();
    }

    /**
     * Create initial factions
     */
    createInitialFactions(count) {
        const factionTypes = ['empire', 'republic', 'federation', 'kingdom', 'corporation', 'religious_order'];
        const ideologies = ['expansionist', 'isolationist', 'pacifist', 'militarist', 'trade_focused', 'scientific'];
        
        for (let i = 0; i < count; i++) {
            const type = factionTypes[Math.floor(Math.random() * factionTypes.length)];
            const ideology = ideologies[Math.floor(Math.random() * ideologies.length)];
            
            this.createFaction(`faction_${i}`, {
                name: this.generateFactionName(type),
                type,
                ideology,
                leader: this.generateLeaderName()
            });
        }
    }

    /**
     * Generate faction name
     */
    generateFactionName(type) {
        const prefixes = {
            empire: ['Imperial', 'Grand', 'Eternal', 'Celestial', 'Stellar'],
            republic: ['United', 'Federal', 'Democratic', 'Free', 'Sovereign'],
            federation: ['Galactic', 'Interstellar', 'Cosmic', 'Universal', 'Pan-Galactic'],
            kingdom: ['Royal', 'Noble', 'Ancient', 'Divine', 'Sacred'],
            corporation: ['Interstellar', 'Galactic', 'Universal', 'Omni', 'Mega'],
            religious_order: ['Holy', 'Divine', 'Sacred', 'Enlightened', 'Ascendant']
        };
        
        const suffixes = {
            empire: ['Empire', 'Dominion', 'Realm', 'Imperium', 'Dynasty'],
            republic: ['Republic', 'Union', 'Confederation', 'Alliance', 'League'],
            federation: ['Federation', 'Coalition', 'Commonwealth', 'Union', 'Alliance'],
            kingdom: ['Kingdom', 'Principality', 'Monarchy', 'Dynasty', 'Realm'],
            corporation: ['Corporation', 'Syndicate', 'Consortium', 'Conglomerate', 'Enterprise'],
            religious_order: ['Order', 'Covenant', 'Sanctuary', 'Temple', 'Brotherhood']
        };
        
        const typePrefixes = prefixes[type] || prefixes.empire;
        const typeSuffixes = suffixes[type] || suffixes.empire;
        
        const prefix = typePrefixes[Math.floor(Math.random() * typePrefixes.length)];
        const suffix = typeSuffixes[Math.floor(Math.random() * typeSuffixes.length)];
        
        return `${prefix} ${suffix}`;
    }

    /**
     * Generate leader name
     */
    generateLeaderName() {
        const titles = ['Emperor', 'President', 'Chancellor', 'King', 'CEO', 'Grand Master'];
        const names = ['Valerius', 'Aurelia', 'Maximus', 'Octavia', 'Cassius', 'Livia', 'Marcus', 'Julia'];
        
        const title = titles[Math.floor(Math.random() * titles.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        
        return `${title} ${name}`;
    }

    /**
     * Create a faction
     */
    createFaction(factionId, config) {
        const faction = {
            id: factionId,
            name: config.name || 'Unknown Faction',
            type: config.type || 'republic',
            ideology: config.ideology || 'neutral',
            leader: config.leader || 'Unknown',
            
            // Resources
            territory: config.territory || Math.random() * 100 + 50,
            population: config.population || Math.floor(Math.random() * 1000000) + 100000,
            economy: config.economy || Math.random() * 100 + 50,
            military: config.military || Math.random() * 100 + 50,
            technology: config.technology || Math.random() * 100 + 50,
            
            // Personality
            aggressiveness: config.aggressiveness || Math.random(),
            trustworthiness: config.trustworthiness || Math.random(),
            generosity: config.generosity || Math.random(),
            pride: config.pride || Math.random(),
            
            // Goals
            primaryGoal: config.primaryGoal || this.generatePrimaryGoal(config.ideology),
            secondaryGoals: config.secondaryGoals || [],
            
            // Relations
            allies: [],
            enemies: [],
            neutral: [],
            
            // Memory
            longTermMemory: [],
            shortTermMemory: [],
            
            // Generations
            generation: 0,
            ancestralMemory: [],
            
            createdAt: Date.now(),
            lastUpdated: Date.now()
        };
        
        this.factions.set(factionId, faction);
        this.history.set(factionId, []);
        this.generationMemory.set(factionId, []);
        
        return faction;
    }

    /**
     * Generate primary goal based on ideology
     */
    generatePrimaryGoal(ideology) {
        const goals = {
            expansionist: 'expand_territory',
            isolationist: 'maintain_independence',
            pacifist: 'promote_peace',
            militarist: 'dominate_militarily',
            trade_focused: 'maximize_trade',
            scientific: 'advance_technology'
        };
        
        return goals[ideology] || 'maintain_stability';
    }

    /**
     * Generate initial relations between factions
     */
    generateInitialRelations() {
        const factionIds = Array.from(this.factions.keys());
        
        for (let i = 0; i < factionIds.length; i++) {
            for (let j = i + 1; j < factionIds.length; j++) {
                const faction1 = this.factions.get(factionIds[i]);
                const faction2 = this.factions.get(factionIds[j]);
                
                // Calculate initial relationship based on ideologies
                let relationValue = 0;
                
                if (faction1.ideology === faction2.ideology) {
                    relationValue = 0.3 + Math.random() * 0.3;
                } else if (this.areIdeologiesCompatible(faction1.ideology, faction2.ideology)) {
                    relationValue = Math.random() * 0.3;
                } else {
                    relationValue = -Math.random() * 0.3;
                }
                
                this.setRelation(factionIds[i], factionIds[j], relationValue);
            }
        }
    }

    /**
     * Check if ideologies are compatible
     */
    areIdeologiesCompatible(ideology1, ideology2) {
        const compatible = {
            expansionist: ['trade_focused', 'militarist'],
            isolationist: ['pacifist'],
            pacifist: ['isolationist', 'scientific'],
            militarist: ['expansionist'],
            trade_focused: ['expansionist', 'scientific'],
            scientific: ['pacifist', 'trade_focused']
        };
        
        return compatible[ideology1]?.includes(ideology2) || false;
    }

    /**
     * Set diplomatic relation between factions
     */
    setRelation(factionId1, factionId2, value) {
        const key = this.getRelationKey(factionId1, factionId2);
        
        if (!this.diplomaticRelations.has(key)) {
            this.diplomaticRelations.set(key, {
                faction1: factionId1,
                faction2: factionId2,
                value: 0,
                trust: 0.5,
                respect: 0.5,
                fear: 0,
                history: [],
                treaties: [],
                wars: []
            });
        }
        
        const relation = this.diplomaticRelations.get(key);
        relation.value = Math.max(-1, Math.min(1, value));
        
        // Update faction relation lists
        this.updateFactionRelationLists(factionId1, factionId2, relation.value);
        
        return relation;
    }

    /**
     * Get relation key
     */
    getRelationKey(factionId1, factionId2) {
        return [factionId1, factionId2].sort().join('_');
    }

    /**
     * Update faction relation lists
     */
    updateFactionRelationLists(factionId1, factionId2, value) {
        const faction1 = this.factions.get(factionId1);
        const faction2 = this.factions.get(factionId2);
        
        if (!faction1 || !faction2) return;
        
        // Remove from all lists first
        faction1.allies = faction1.allies.filter(id => id !== factionId2);
        faction1.enemies = faction1.enemies.filter(id => id !== factionId2);
        faction1.neutral = faction1.neutral.filter(id => id !== factionId2);
        
        faction2.allies = faction2.allies.filter(id => id !== factionId1);
        faction2.enemies = faction2.enemies.filter(id => id !== factionId1);
        faction2.neutral = faction2.neutral.filter(id => id !== factionId1);
        
        // Add to appropriate list
        if (value > 0.5) {
            faction1.allies.push(factionId2);
            faction2.allies.push(factionId1);
        } else if (value < -0.5) {
            faction1.enemies.push(factionId2);
            faction2.enemies.push(factionId1);
        } else {
            faction1.neutral.push(factionId2);
            faction2.neutral.push(factionId1);
        }
    }

    /**
     * Process diplomatic action
     */
    processDiplomaticAction(actorId, targetId, action, details = {}) {
        const actor = this.factions.get(actorId);
        const target = this.factions.get(targetId);
        
        if (!actor || !target) return null;
        
        const relation = this.diplomaticRelations.get(this.getRelationKey(actorId, targetId));
        if (!relation) return null;
        
        // Calculate reaction
        const reaction = this.calculateReaction(actor, target, action, details);
        
        // Update relation
        const relationChange = this.calculateRelationChange(action, reaction);
        this.setRelation(actorId, targetId, relation.value + relationChange);
        
        // Record in history
        this.recordHistory(actorId, targetId, action, reaction, relationChange);
        
        // Update trust, respect, fear
        this.updateRelationAttributes(relation, action, reaction);
        
        // Handle special actions
        if (action === 'declare_war') {
            this.handleWarDeclaration(actorId, targetId);
        } else if (action === 'propose_peace') {
            this.handlePeaceProposal(actorId, targetId);
        } else if (action === 'propose_alliance') {
            this.handleAllianceProposal(actorId, targetId);
        }
        
        return {
            action,
            reaction,
            relationChange,
            newRelationValue: relation.value
        };
    }

    /**
     * Calculate reaction to diplomatic action
     */
    calculateReaction(actor, target, action, details) {
        const relation = this.diplomaticRelations.get(this.getRelationKey(actor.id, target.id));
        
        let reactionScore = 0;
        let reactionType = 'neutral';
        
        // Base reaction based on action type
        const actionReactions = {
            propose_alliance: { base: 0.3, trustBonus: 0.3, respectBonus: 0.2 },
            declare_war: { base: -0.8, fearBonus: 0.5, respectPenalty: -0.3 },
            propose_peace: { base: 0.2, trustBonus: 0.2 },
            demand_tribute: { base: -0.3, respectPenalty: -0.2, fearBonus: 0.3 },
            offer_trade: { base: 0.1, trustBonus: 0.1 },
            send_aid: { base: 0.4, trustBonus: 0.3, respectBonus: 0.2 },
            insult: { base: -0.4, respectPenalty: -0.3 },
            compliment: { base: 0.2, respectBonus: 0.2 },
            threaten: { base: -0.5, fearBonus: 0.4, respectPenalty: -0.2 },
            negotiate: { base: 0.1, trustBonus: 0.1 }
        };
        
        const actionReaction = actionReactions[action] || { base: 0 };
        reactionScore += actionReaction.base;
        
        // Apply relation modifiers
        if (relation) {
            reactionScore += relation.value * 0.3;
            reactionScore += relation.trust * (actionReaction.trustBonus || 0);
            reactionScore += relation.respect * (actionReaction.respectBonus || 0);
            reactionScore += relation.fear * (actionReaction.fearBonus || 0);
            reactionScore += relation.respect * (actionReaction.respectPenalty || 0);
        }
        
        // Apply personality modifiers
        reactionScore += target.trustworthiness * 0.1;
        reactionScore -= target.aggressiveness * (action === 'demand_tribute' || action === 'threaten' ? -0.2 : 0);
        
        // Determine reaction type
        if (reactionScore > 0.5) {
            reactionType = 'enthusiastic';
        } else if (reactionScore > 0.2) {
            reactionType = 'positive';
        } else if (reactionScore > -0.2) {
            reactionType = 'neutral';
        } else if (reactionScore > -0.5) {
            reactionType = 'negative';
        } else {
            reactionType = 'hostile';
        }
        
        return {
            type: reactionType,
            score: reactionScore
        };
    }

    /**
     * Calculate relation change from action
     */
    calculateRelationChange(action, reaction) {
        const baseChanges = {
            propose_alliance: 0.1,
            declare_war: -0.5,
            propose_peace: 0.15,
            demand_tribute: -0.2,
            offer_trade: 0.05,
            send_aid: 0.2,
            insult: -0.15,
            compliment: 0.1,
            threaten: -0.25,
            negotiate: 0.05
        };
        
        let change = baseChanges[action] || 0;
        
        // Modify based on reaction
        if (reaction.type === 'enthusiastic') {
            change *= 1.5;
        } else if (reaction.type === 'positive') {
            change *= 1.2;
        } else if (reaction.type === 'negative') {
            change *= 0.8;
        } else if (reaction.type === 'hostile') {
            change *= 0.5;
        }
        
        return change;
    }

    /**
     * Update relation attributes
     */
    updateRelationAttributes(relation, action, reaction) {
        // Trust
        if (['send_aid', 'propose_alliance', 'compliment'].includes(action)) {
            relation.trust = Math.min(1, relation.trust + 0.05);
        } else if (['declare_war', 'threaten', 'insult'].includes(action)) {
            relation.trust = Math.max(0, relation.trust - 0.1);
        }
        
        // Respect
        if (['send_aid', 'compliment'].includes(action)) {
            relation.respect = Math.min(1, relation.respect + 0.03);
        } else if (['demand_tribute', 'insult'].includes(action)) {
            relation.respect = Math.max(0, relation.respect - 0.05);
        }
        
        // Fear
        if (['declare_war', 'threaten', 'demand_tribute'].includes(action)) {
            relation.fear = Math.min(1, relation.fear + 0.1);
        }
    }

    /**
     * Record diplomatic history
     */
    recordHistory(actorId, targetId, action, reaction, relationChange) {
        const key = this.getRelationKey(actorId, targetId);
        
        const entry = {
            timestamp: Date.now(),
            actor: actorId,
            target: targetId,
            action,
            reaction: reaction.type,
            relationChange,
            generation: this.factions.get(actorId)?.generation || 0
        };
        
        // Add to both factions' history
        for (const factionId of [actorId, targetId]) {
            const history = this.history.get(factionId);
            if (history) {
                history.push(entry);
                
                // Keep only recent history
                if (history.length > this.maxHistoryLength) {
                    history.shift();
                }
            }
        }
        
        // Add to relation history
        const relation = this.diplomaticRelations.get(key);
        if (relation) {
            relation.history.push(entry);
            
            if (relation.history.length > 100) {
                relation.history.shift();
            }
        }
    }

    /**
     * Handle war declaration
     */
    handleWarDeclaration(actorId, targetId) {
        const warId = `war_${Date.now()}_${Math.random()}`;
        
        const war = {
            id: warId,
            aggressor: actorId,
            defender: targetId,
            startTime: Date.now(),
            endTime: null,
            status: 'active',
            battles: [],
            casualties: {
                [actorId]: 0,
                [targetId]: 0
            },
            territoryChanges: []
        };
        
        this.wars.set(warId, war);
        
        // Update relation to hostile
        this.setRelation(actorId, targetId, -1);
        
        console.log(`⚔️ War declared: ${this.factions.get(actorId)?.name} vs ${this.factions.get(targetId)?.name}`);
    }

    /**
     * Handle peace proposal
     */
    handlePeaceProposal(actorId, targetId) {
        const relation = this.diplomaticRelations.get(this.getRelationKey(actorId, targetId));
        
        // Check if there's an active war
        for (const [warId, war] of this.wars) {
            if (war.status === 'active' && 
                (war.aggressor === actorId || war.defender === actorId) &&
                (war.aggressor === targetId || war.defender === targetId)) {
                
                // End the war
                war.status = 'ended';
                war.endTime = Date.now();
                
                // Improve relations
                this.setRelation(actorId, targetId, -0.3);
                
                console.log(`🕊️ Peace treaty: ${this.factions.get(actorId)?.name} and ${this.factions.get(targetId)?.name}`);
                return;
            }
        }
    }

    /**
     * Handle alliance proposal
     */
    handleAllianceProposal(actorId, targetId) {
        const relation = this.diplomaticRelations.get(this.getRelationKey(actorId, targetId));
        
        if (relation && relation.value > 0.6) {
            const treatyId = `treaty_${Date.now()}_${Math.random()}`;
            
            const treaty = {
                id: treatyId,
                type: 'alliance',
                parties: [actorId, targetId],
                terms: {
                    mutualDefense: true,
                    sharedIntelligence: true,
                    tradeBenefits: true
                },
                startTime: Date.now(),
                endTime: null,
                status: 'active'
            };
            
            this.treaties.set(treatyId, treaty);
            
            // Add to relation treaties
            relation.treaties.push(treatyId);
            
            // Improve relations
            this.setRelation(actorId, targetId, 0.9);
            
            console.log(`🤝 Alliance formed: ${this.factions.get(actorId)?.name} and ${this.factions.get(targetId)?.name}`);
        }
    }

    /**
     * Process generational transition
     */
    processGenerationalTransition(factionId) {
        const faction = this.factions.get(factionId);
        if (!faction) return;
        
        faction.generation++;
        
        // Transfer important memories to ancestral memory
        const importantMemories = faction.longTermMemory.filter(m => m.importance > 0.7);
        faction.ancestralMemory = [...importantMemories];
        
        // Decay short-term memory
        faction.shortTermMemory = [];
        
        // Generate new leader
        faction.leader = this.generateLeaderName();
        
        // Slightly modify personality (generational drift)
        faction.aggressiveness += (Math.random() - 0.5) * 0.1;
        faction.trustworthiness += (Math.random() - 0.5) * 0.1;
        faction.generosity += (Math.random() - 0.5) * 0.1;
        faction.pride += (Math.random() - 0.5) * 0.1;
        
        // Clamp values
        faction.aggressiveness = Math.max(0, Math.min(1, faction.aggressiveness));
        faction.trustworthiness = Math.max(0, Math.min(1, faction.trustworthiness));
        faction.generosity = Math.max(0, Math.min(1, faction.generosity));
        faction.pride = Math.max(0, Math.min(1, faction.pride));
        
        // Record in generation memory
        const generationEntry = {
            generation: faction.generation,
            leader: faction.leader,
            personality: {
                aggressiveness: faction.aggressiveness,
                trustworthiness: faction.trustworthiness,
                generosity: faction.generosity,
                pride: faction.pride
            },
            relations: this.getRelationSummary(factionId),
            timestamp: Date.now()
        };
        
        const genMemory = this.generationMemory.get(factionId);
        if (genMemory) {
            genMemory.push(generationEntry);
            
            // Keep only last 10 generations
            if (genMemory.length > 10) {
                genMemory.shift();
            }
        }
        
        console.log(`👑 Generation ${faction.generation}: ${faction.name} now led by ${faction.leader}`);
    }

    /**
     * Get relation summary for a faction
     */
    getRelationSummary(factionId) {
        const summary = {};
        
        for (const [key, relation] of this.diplomaticRelations) {
            if (relation.faction1 === factionId) {
                summary[relation.faction2] = relation.value;
            } else if (relation.faction2 === factionId) {
                summary[relation.faction1] = relation.value;
            }
        }
        
        return summary;
    }

    /**
     * Make AI diplomatic decision
     */
    makeDiplomaticDecision(factionId) {
        const faction = this.factions.get(factionId);
        if (!faction) return null;
        
        const decisions = [];
        
        // Evaluate relations with all other factions
        for (const [key, relation] of this.diplomaticRelations) {
            if (relation.faction1 !== factionId && relation.faction2 !== factionId) {
                continue;
            }
            
            const otherFactionId = relation.faction1 === factionId ? relation.faction2 : relation.faction1;
            const otherFaction = this.factions.get(otherFactionId);
            
            if (!otherFaction) continue;
            
            // Generate potential actions
            if (relation.value < -0.7 && faction.aggressiveness > 0.6) {
                decisions.push({
                    action: 'declare_war',
                    target: otherFactionId,
                    priority: 0.8,
                    reasoning: 'Hostile relations and aggressive stance'
                });
            } else if (relation.value > 0.7 && !relation.treaties.some(t => this.treaties.get(t)?.type === 'alliance')) {
                decisions.push({
                    action: 'propose_alliance',
                    target: otherFactionId,
                    priority: 0.6,
                    reasoning: 'Strong relations, no alliance yet'
                });
            } else if (relation.value < 0 && faction.military > otherFaction.military * 1.2) {
                decisions.push({
                    action: 'demand_tribute',
                    target: otherFactionId,
                    priority: 0.5,
                    reasoning: 'Military advantage over weaker enemy'
                });
            } else if (relation.value > 0.3 && faction.ideology === 'trade_focused') {
                decisions.push({
                    action: 'offer_trade',
                    target: otherFactionId,
                    priority: 0.4,
                    reasoning: 'Positive relations, trade-focused ideology'
                });
            }
        }
        
        // Sort by priority and return best decision
        decisions.sort((a, b) => b.priority - a.priority);
        
        return decisions.length > 0 ? decisions[0] : null;
    }

    /**
     * Get faction state
     */
    getFactionState(factionId) {
        const faction = this.factions.get(factionId);
        if (!faction) return null;
        
        return {
            id: faction.id,
            name: faction.name,
            type: faction.type,
            ideology: faction.ideology,
            leader: faction.leader,
            generation: faction.generation,
            resources: {
                territory: faction.territory,
                population: faction.population,
                economy: faction.economy,
                military: faction.military,
                technology: faction.technology
            },
            personality: {
                aggressiveness: faction.aggressiveness,
                trustworthiness: faction.trustworthiness,
                generosity: faction.generosity,
                pride: faction.pride
            },
            relations: {
                allies: faction.allies,
                enemies: faction.enemies,
                neutral: faction.neutral
            }
        };
    }

    /**
     * Serialize data
     */
    serialize() {
        return {
            factions: Array.from(this.factions.entries()),
            diplomaticRelations: Array.from(this.diplomaticRelations.entries()),
            treaties: Array.from(this.treaties.entries()),
            wars: Array.from(this.wars.entries()),
            history: Array.from(this.history.entries()),
            generationMemory: Array.from(this.generationMemory.entries())
        };
    }

    /**
     * Deserialize data
     */
    deserialize(data) {
        this.factions = new Map(data.factions);
        this.diplomaticRelations = new Map(data.diplomaticRelations);
        this.treaties = new Map(data.treaties);
        this.wars = new Map(data.wars);
        this.history = new Map(data.history);
        this.generationMemory = new Map(data.generationMemory);
    }

    /**
     * Cleanup
     */
    dispose() {
        this.factions.clear();
        this.diplomaticRelations.clear();
        this.treaties.clear();
        this.wars.clear();
        this.history.clear();
        this.generationMemory.clear();
    }
}

export default DiplomaticAISystem;
