/**
 * 👁️ THE SOUL ENGINE
 * Era II: The Living Cosmos - The Intelligence Explosion
 * 
 * LLM-driven autonomous NPCs with persistent memory, relationships,
 * personality traits, and emotional states.
 */

class SoulEngine {
    constructor(game) {
        this.game = game;
        this.npcs = new Map();
        this.relationships = new Map();
        this.memories = new Map();
        this.conversations = new Map();
        
        this.llmEndpoint = null;
        this.llmApiKey = null;
        this.useLocalLLM = false;
        
        this.personalityTraits = [
            'aggressive', 'peaceful', 'curious', 'cautious',
            'generous', 'selfish', 'honest', 'deceptive',
            'loyal', 'treacherous', 'ambitious', 'content'
        ];
        
        this.emotionalStates = [
            'happy', 'sad', 'angry', 'fearful',
            'excited', 'bored', 'confident', 'anxious'
        ];
        
        this.memoryTypes = {
            interaction: 'interaction',
            observation: 'observation',
            event: 'event',
            knowledge: 'knowledge'
        };
        
        this.maxMemories = 1000;
        this.memoryDecayRate = 0.001;
        
        console.log('👁️ The Soul Engine: Initialized');
    }

    /**
     * Initialize the Soul Engine
     */
    initialize(config = {}) {
        this.llmEndpoint = config.llmEndpoint || null;
        this.llmApiKey = config.llmApiKey || null;
        this.useLocalLLM = config.useLocalLLM || false;
        
        if (this.useLocalLLM && window.WebLLM) {
            this.initializeLocalLLM();
        }
    }

    /**
     * Initialize local LLM (WebLLM)
     */
    async initializeLocalLLM() {
        try {
            this.localLLM = await window.WebLLM.CreateMLCEngine();
            console.log('👁️ Local LLM initialized');
        } catch (error) {
            console.error('Failed to initialize local LLM:', error);
            this.useLocalLLM = false;
        }
    }

    /**
     * Create a new NPC with a soul
     */
    createNPC(npcId, config) {
        const npc = {
            id: npcId,
            name: config.name || 'Unknown',
            species: config.species || 'human',
            role: config.role || 'civilian',
            faction: config.faction || 'neutral',
            
            // Personality
            personality: this.generatePersonality(config.personality),
            emotionalState: this.generateEmotionalState(config.emotionalState),
            mood: 0.5, // -1 to 1
            
            // Memory
            shortTermMemory: [],
            longTermMemory: [],
            workingMemory: [],
            
            // Relationships
            relationships: new Map(),
            
            // Goals and motivations
            goals: config.goals || [],
            motivations: config.motivations || [],
            
            // Capabilities
            capabilities: config.capabilities || {
                canTrade: true,
                canFight: false,
                canCraft: false,
                canTeach: false
            },
            
            // State
            currentActivity: 'idle',
            currentLocation: config.location || null,
            health: config.health || 100,
            inventory: config.inventory || [],
            
            // Learning
            learningRate: 0.1,
            adaptationLevel: 0,
            
            // Social
            socialNeeds: {
                interaction: 0.5,
                belonging: 0.5,
                recognition: 0.5
            },
            
            createdAt: Date.now(),
            lastUpdated: Date.now()
        };
        
        this.npcs.set(npcId, npc);
        this.memories.set(npcId, []);
        
        // Create initial memory
        this.addMemory(npcId, {
            type: this.memoryTypes.knowledge,
            content: `I am ${npc.name}, a ${npc.role} of the ${npc.faction} faction.`,
            importance: 1.0,
            timestamp: Date.now()
        });
        
        return npc;
    }

    /**
     * Generate personality traits
     */
    generatePersonality(preset = null) {
        if (preset) {
            return preset;
        }
        
        const personality = {};
        for (const trait of this.personalityTraits) {
            personality[trait] = Math.random();
        }
        
        return personality;
    }

    /**
     * Generate emotional state
     */
    generateEmotionalState(preset = null) {
        if (preset) {
            return preset;
        }
        
        const emotions = {};
        for (const emotion of this.emotionalStates) {
            emotions[emotion] = Math.random() * 0.3; // Start with low intensity
        }
        
        return emotions;
    }

    /**
     * Add a memory to an NPC
     */
    addMemory(npcId, memory) {
        const npc = this.npcs.get(npcId);
        if (!npc) return false;
        
        const memoryData = {
            id: `memory_${Date.now()}_${Math.random()}`,
            type: memory.type,
            content: memory.content,
            importance: memory.importance || 0.5,
            timestamp: memory.timestamp || Date.now(),
            decay: 0,
            associatedEntities: memory.associatedEntities || [],
            emotions: memory.emotions || {},
            context: memory.context || {}
        };
        
        const memories = this.memories.get(npcId);
        memories.push(memoryData);
        
        // Manage memory limit
        if (memories.length > this.maxMemories) {
            memories.sort((a, b) => this.calculateMemoryValue(b) - this.calculateMemoryValue(a));
            memories.splice(this.maxMemories);
        }
        
        // Update short-term memory (last 10 memories)
        npc.shortTermMemory = memories.slice(-10);
        
        // Update long-term memory (important memories)
        npc.longTermMemory = memories.filter(m => m.importance > 0.7);
        
        npc.lastUpdated = Date.now();
        
        return true;
    }

    /**
     * Calculate memory value based on importance and decay
     */
    calculateMemoryValue(memory) {
        const age = Date.now() - memory.timestamp;
        const decay = Math.exp(-this.memoryDecayRate * age / 1000);
        return memory.importance * decay;
    }

    /**
     * Retrieve relevant memories
     */
    retrieveMemories(npcId, query, limit = 5) {
        const memories = this.memories.get(npcId);
        if (!memories) return [];
        
        const queryLower = query.toLowerCase();
        
        // Score memories based on relevance
        const scored = memories.map(memory => {
            let score = 0;
            const contentLower = memory.content.toLowerCase();
            
            // Exact match
            if (contentLower.includes(queryLower)) {
                score += 1.0;
            }
            
            // Partial word matches
            const queryWords = queryLower.split(' ');
            for (const word of queryWords) {
                if (contentLower.includes(word)) {
                    score += 0.3;
                }
            }
            
            // Associated entities
            for (const entity of memory.associatedEntities) {
                if (entity.toLowerCase().includes(queryLower)) {
                    score += 0.5;
                }
            }
            
            // Importance and recency
            score += memory.importance * 0.5;
            score += Math.max(0, 1 - (Date.now() - memory.timestamp) / 86400000) * 0.3;
            
            return { memory, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        
        return scored.slice(0, limit).map(s => s.memory);
    }

    /**
     * Update relationship between NPCs
     */
    updateRelationship(npcId1, npcId2, change, context = {}) {
        const key = this.getRelationshipKey(npcId1, npcId2);
        
        if (!this.relationships.has(key)) {
            this.relationships.set(key, {
                npc1: npcId1,
                npc2: npcId2,
                value: 0,
                history: [],
                trust: 0.5,
                respect: 0.5,
                fear: 0,
                love: 0,
                hatred: 0
            });
        }
        
        const relationship = this.relationships.get(key);
        relationship.value = Math.max(-1, Math.min(1, relationship.value + change));
        
        // Update history
        relationship.history.push({
            change,
            timestamp: Date.now(),
            context
        });
        
        // Keep only last 50 history entries
        if (relationship.history.length > 50) {
            relationship.history.shift();
        }
        
        // Update derived emotions
        if (relationship.value > 0.7) {
            relationship.love = Math.min(1, relationship.love + 0.1);
            relationship.hatred = Math.max(0, relationship.hatred - 0.1);
        } else if (relationship.value < -0.7) {
            relationship.hatred = Math.min(1, relationship.hatred + 0.1);
            relationship.love = Math.max(0, relationship.love - 0.1);
        }
        
        // Update NPC's relationship map
        const npc1 = this.npcs.get(npcId1);
        const npc2 = this.npcs.get(npcId2);
        
        if (npc1) {
            npc1.relationships.set(npcId2, relationship.value);
        }
        if (npc2) {
            npc2.relationships.set(npcId1, relationship.value);
        }
        
        return relationship;
    }

    /**
     * Get relationship key
     */
    getRelationshipKey(npcId1, npcId2) {
        return [npcId1, npcId2].sort().join('_');
    }

    /**
     * Process an interaction between NPCs
     */
    async processInteraction(npcId1, npcId2, interaction) {
        const npc1 = this.npcs.get(npcId1);
        const npc2 = this.npcs.get(npcId2);
        
        if (!npc1 || !npc2) return null;
        
        // Determine interaction outcome based on personalities
        const outcome = this.calculateInteractionOutcome(npc1, npc2, interaction);
        
        // Update relationships
        this.updateRelationship(npcId1, npcId2, outcome.relationshipChange, {
            type: interaction.type,
            result: outcome.result
        });
        
        // Add memories
        this.addMemory(npcId1, {
            type: this.memoryTypes.interaction,
            content: `I ${interaction.type} with ${npc2.name}. ${outcome.description}`,
            importance: outcome.importance,
            timestamp: Date.now(),
            associatedEntities: [npcId2],
            emotions: outcome.emotions1
        });
        
        this.addMemory(npcId2, {
            type: this.memoryTypes.interaction,
            content: `${npc1.name} ${interaction.type} with me. ${outcome.description}`,
            importance: outcome.importance,
            timestamp: Date.now(),
            associatedEntities: [npcId1],
            emotions: outcome.emotions2
        });
        
        // Update emotional states
        this.updateEmotionalState(npc1, outcome.emotions1);
        this.updateEmotionalState(npc2, outcome.emotions2);
        
        return outcome;
    }

    /**
     * Calculate interaction outcome
     */
    calculateInteractionOutcome(npc1, npc2, interaction) {
        const relationshipKey = this.getRelationshipKey(npc1.id, npc2.id);
        const relationship = this.relationships.get(relationshipKey) || { value: 0 };
        
        let relationshipChange = 0;
        let result = 'neutral';
        let description = '';
        let importance = 0.5;
        
        const emotions1 = {};
        const emotions2 = {};
        
        switch (interaction.type) {
            case 'trade':
                if (npc1.personality.generous > 0.5 && npc2.personality.selfish < 0.5) {
                    relationshipChange = 0.1;
                    result = 'successful';
                    description = 'The trade went well.';
                    emotions1.happy = 0.3;
                    emotions2.happy = 0.3;
                    importance = 0.7;
                } else {
                    relationshipChange = -0.05;
                    result = 'disputed';
                    description = 'There were disagreements about the terms.';
                    emotions1.frustrated = 0.2;
                    emotions2.frustrated = 0.2;
                }
                break;
                
            case 'fight':
                if (npc1.personality.aggressive > 0.7) {
                    relationshipChange = -0.3;
                    result = 'hostile';
                    description = 'A violent confrontation occurred.';
                    emotions1.angry = 0.5;
                    emotions2.fearful = 0.5;
                    importance = 0.9;
                } else {
                    relationshipChange = -0.1;
                    result = 'defensive';
                    description = 'Tensions rose but violence was avoided.';
                    emotions1.anxious = 0.3;
                    emotions2.anxious = 0.3;
                }
                break;
                
            case 'conversation':
                if (relationship.value > 0.5) {
                    relationshipChange = 0.05;
                    result = 'friendly';
                    description = 'We had a pleasant conversation.';
                    emotions1.happy = 0.2;
                    emotions2.happy = 0.2;
                } else {
                    relationshipChange = 0.02;
                    result = 'civil';
                    description = 'We exchanged some words.';
                }
                break;
                
            case 'help':
                if (npc1.personality.loyal > 0.5) {
                    relationshipChange = 0.2;
                    result = 'grateful';
                    description = 'I was happy to help.';
                    emotions1.proud = 0.3;
                    emotions2.grateful = 0.4;
                    importance = 0.8;
                } else {
                    relationshipChange = 0.05;
                    result = 'assisted';
                    description = 'I provided some assistance.';
                }
                break;
        }
        
        return {
            relationshipChange,
            result,
            description,
            importance,
            emotions1,
            emotions2
        };
    }

    /**
     * Update emotional state
     */
    updateEmotionalState(npc, emotions) {
        for (const [emotion, intensity] of Object.entries(emotions)) {
            if (npc.emotionalState[emotion] !== undefined) {
                npc.emotionalState[emotion] = Math.min(1, 
                    npc.emotionalState[emotion] + intensity * 0.5);
            }
        }
        
        // Decay emotions over time
        for (const emotion of Object.keys(npc.emotionalState)) {
            npc.emotionalState[emotion] *= 0.99;
        }
        
        // Update mood based on dominant emotions
        const positiveEmotions = npc.emotionalState.happy + npc.emotionalState.excited + npc.emotionalState.confident;
        const negativeEmotions = npc.emotionalState.sad + npc.emotionalState.angry + npc.emotionalState.fearful + npc.emotionalState.anxious;
        
        npc.mood = (positiveEmotions - negativeEmotions) / 2;
        npc.mood = Math.max(-1, Math.min(1, npc.mood));
    }

    /**
     * Generate NPC response using LLM
     */
    async generateResponse(npcId, input, context = {}) {
        const npc = this.npcs.get(npcId);
        if (!npc) return null;
        
        // Retrieve relevant memories
        const relevantMemories = this.retrieveMemories(npcId, input, 5);
        
        // Build prompt
        const prompt = this.buildPrompt(npc, input, relevantMemories, context);
        
        let response;
        
        if (this.useLocalLLM && this.localLLM) {
            response = await this.queryLocalLLM(prompt);
        } else if (this.llmEndpoint && this.llmApiKey) {
            response = await this.queryRemoteLLM(prompt);
        } else {
            response = this.generateFallbackResponse(npc, input, relevantMemories);
        }
        
        // Store conversation
        this.storeConversation(npcId, input, response, context);
        
        // Add memory of the interaction
        this.addMemory(npcId, {
            type: this.memoryTypes.interaction,
            content: `Someone said: "${input}". I responded: "${response}"`,
            importance: 0.3,
            timestamp: Date.now(),
            associatedEntities: context.entities || []
        });
        
        return response;
    }

    /**
     * Build LLM prompt
     */
    buildPrompt(npc, input, memories, context) {
        let prompt = `You are ${npc.name}, a ${npc.species} ${npc.role} from the ${npc.faction} faction.\n\n`;
        
        prompt += `Personality:\n`;
        for (const [trait, value] of Object.entries(npc.personality)) {
            if (value > 0.6) {
                prompt += `- Very ${trait}\n`;
            } else if (value > 0.4) {
                prompt += `- Somewhat ${trait}\n`;
            }
        }
        
        prompt += `\nCurrent Mood: ${this.getMoodDescription(npc.mood)}\n`;
        
        if (memories.length > 0) {
            prompt += `\nRelevant Memories:\n`;
            for (const memory of memories) {
                prompt += `- ${memory.content}\n`;
            }
        }
        
        prompt += `\nCurrent Activity: ${npc.currentActivity}\n`;
        
        if (context.location) {
            prompt += `Location: ${context.location}\n`;
        }
        
        prompt += `\nInput: ${input}\n\n`;
        prompt += `Respond in character as ${npc.name}. Keep responses concise (1-2 sentences).`;
        
        return prompt;
    }

    /**
     * Get mood description
     */
    getMoodDescription(mood) {
        if (mood > 0.7) return 'Very Happy';
        if (mood > 0.3) return 'Happy';
        if (mood > -0.3) return 'Neutral';
        if (mood > -0.7) return 'Unhappy';
        return 'Very Unhappy';
    }

    /**
     * Query local LLM
     */
    async queryLocalLLM(prompt) {
        try {
            const response = await this.localLLM.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant roleplaying as a character.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.7
            });
            
            return response.choices[0].message.content;
        } catch (error) {
            console.error('Local LLM query failed:', error);
            return null;
        }
    }

    /**
     * Query remote LLM
     */
    async queryRemoteLLM(prompt) {
        try {
            const response = await fetch(this.llmEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.llmApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant roleplaying as a character.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 100,
                    temperature: 0.7
                })
            });
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Remote LLM query failed:', error);
            return null;
        }
    }

    /**
     * Generate fallback response without LLM
     */
    generateFallbackResponse(npc, input, memories) {
        const responses = {
            greeting: [
                'Hello there.',
                'Greetings, traveler.',
                'Well met.',
                'Good day to you.'
            ],
            question: [
                'That is an interesting question.',
                'I am not sure I have the answer.',
                'Let me think about that.',
                'Why do you ask?'
            ],
            trade: [
                'I might be interested in a trade.',
                'What do you have to offer?',
                'Let us discuss terms.',
                'I am always open to business.'
            ],
            hostile: [
                'Leave me be.',
                'I have nothing to say to you.',
                'You are not welcome here.',
                'Step away.'
            ],
            friendly: [
                'It is good to see you.',
                'How have you been?',
                'I was hoping we would meet.',
                'A pleasure, as always.'
            ]
        };
        
        const inputLower = input.toLowerCase();
        let category = 'friendly';
        
        if (inputLower.includes('hello') || inputLower.includes('hi') || inputLower.includes('greet')) {
            category = 'greeting';
        } else if (inputLower.includes('?') || inputLower.includes('what') || inputLower.includes('how') || inputLower.includes('why')) {
            category = 'question';
        } else if (inputLower.includes('trade') || inputLower.includes('buy') || inputLower.includes('sell')) {
            category = 'trade';
        } else if (npc.mood < -0.3) {
            category = 'hostile';
        }
        
        const categoryResponses = responses[category];
        return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
    }

    /**
     * Store conversation
     */
    storeConversation(npcId, input, response, context) {
        if (!this.conversations.has(npcId)) {
            this.conversations.set(npcId, []);
        }
        
        const conversations = this.conversations.get(npcId);
        conversations.push({
            input,
            response,
            timestamp: Date.now(),
            context
        });
        
        // Keep only last 50 conversations
        if (conversations.length > 50) {
            conversations.shift();
        }
    }

    /**
     * Update NPC behavior based on current state
     */
    updateNPCBehavior(npcId, deltaTime) {
        const npc = this.npcs.get(npcId);
        if (!npc) return;
        
        // Decay emotional states
        for (const emotion of Object.keys(npc.emotionalState)) {
            npc.emotionalState[emotion] *= 0.999;
        }
        
        // Update social needs
        npc.socialNeeds.interaction = Math.max(0, npc.socialNeeds.interaction - deltaTime * 0.001);
        
        // Determine next action based on goals and needs
        if (npc.socialNeeds.interaction < 0.3) {
            npc.currentActivity = 'seeking_social';
        } else if (npc.goals.length > 0) {
            npc.currentActivity = `pursuing_goal: ${npc.goals[0]}`;
        } else {
            npc.currentActivity = 'idle';
        }
        
        npc.lastUpdated = Date.now();
    }

    /**
     * Get NPC state
     */
    getNPCState(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return null;
        
        return {
            id: npc.id,
            name: npc.name,
            mood: npc.mood,
            emotionalState: { ...npc.emotionalState },
            currentActivity: npc.currentActivity,
            relationships: Object.fromEntries(npc.relationships),
            recentMemories: this.memories.get(npcId)?.slice(-5) || []
        };
    }

    /**
     * Serialize all data
     */
    serialize() {
        const data = {
            npcs: Array.from(this.npcs.entries()).map(([id, npc]) => [
                id,
                {
                    ...npc,
                    relationships: Object.fromEntries(npc.relationships)
                }
            ]),
            relationships: Array.from(this.relationships.entries()),
            memories: Array.from(this.memories.entries()),
            conversations: Array.from(this.conversations.entries())
        };
        
        return data;
    }

    /**
     * Deserialize data
     */
    deserialize(data) {
        this.npcs = new Map(data.npcs.map(([id, npc]) => [
            id,
            {
                ...npc,
                relationships: new Map(Object.entries(npc.relationships))
            }
        ]));
        
        this.relationships = new Map(data.relationships);
        this.memories = new Map(data.memories);
        this.conversations = new Map(data.conversations);
    }

    /**
     * Cleanup
     */
    dispose() {
        this.npcs.clear();
        this.relationships.clear();
        this.memories.clear();
        this.conversations.clear();
    }
}

export default SoulEngine;
