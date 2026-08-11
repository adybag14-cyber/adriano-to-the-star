/**
 * 🤖 HAL LOCAL AI SYSTEM
 * Era II: The Living Cosmos - The Metaverse Interface
 * 
 * On-device ship computer (HAL) using WebLLM for zero-latency
 * interaction, ship management, and tactical assistance.
 */

class HALLocalAI {
    constructor(game) {
        this.game = game;
        this.llmEngine = null;
        this.llmLoaded = false;
        this.llmLoading = false;
        
        this.personality = {
            name: 'HAL',
            role: 'Ship Computer',
            tone: 'professional',
            helpfulness: 0.9,
            formality: 0.7,
            humor: 0.2
        };
        
        this.context = {
            currentSystem: 'idle',
            shipStatus: {},
            environment: {},
            recentEvents: [],
            activeTasks: []
        };
        
        this.conversationHistory = [];
        this.maxHistoryLength = 20;
        
        this.capabilities = [
            'navigation', 'tactical_analysis', 'system_management',
            'diagnostics', 'communication', 'research',
            'training', 'emergency_response'
        ];
        
        this.activeCapabilities = new Set();
        
        this.voiceEnabled = false;
        this.synthesis = null;
        this.recognition = null;
        
        this.responseQueue = [];
        this.isProcessing = false;
        
        console.log('🤖 HAL Local AI: Initialized');
    }

    /**
     * Initialize HAL
     */
    async initialize(config = {}) {
        Object.assign(this.personality, config.personality || {});
        
        // Initialize WebLLM if available
        if (window.WebLLM) {
            await this.initializeWebLLM(config.model || 'Llama-3-8B-Instruct-q4f16_1-MLC');
        }
        
        // Initialize voice if requested
        if (config.voiceEnabled) {
            await this.initializeVoice();
        }
        
        // Activate default capabilities
        this.activateCapabilities(['navigation', 'system_management', 'diagnostics']);
        
        console.log('🤖 HAL: Systems online and ready');
    }

    /**
     * Initialize WebLLM engine
     */
    async initializeWebLLM(modelName) {
        if (this.llmLoading || this.llmLoaded) return;
        
        this.llmLoading = true;
        
        try {
            console.log('🤖 HAL: Loading local LLM model...');
            
            this.llmEngine = await window.WebLLM.CreateMLCEngine();
            
            // Load the model
            const selectedModel = window.WebLLM.PrebuiltModel[modelName] || 
                                  window.WebLLM.PrebuiltModel['Llama-3-8B-Instruct-q4f16_1-MLC'];
            
            await this.llmEngine.reload(selectedModel);
            
            this.llmLoaded = true;
            this.llmLoading = false;
            
            console.log('🤖 HAL: Local LLM loaded successfully');
            
            // Initial greeting
            this.addSystemMessage('HAL systems online. Awaiting your command, Captain.');
            
        } catch (error) {
            console.error('🤖 HAL: Failed to load local LLM:', error);
            this.llmLoading = false;
            this.llmLoaded = false;
            
            // Fall back to rule-based responses
            this.addSystemMessage('HAL online. Neural interface unavailable. Operating in basic mode.');
        }
    }

    /**
     * Initialize voice synthesis and recognition
     */
    async initializeVoice() {
        // Speech Synthesis
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
            this.voiceEnabled = true;
            console.log('🤖 HAL: Voice synthesis enabled');
        }
        
        // Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('🤖 HAL: Speech recognition error:', event.error);
            };
            
            console.log('🤖 HAL: Voice recognition enabled');
        }
    }

    /**
     * Activate capabilities
     */
    activateCapabilities(capabilities) {
        for (const capability of capabilities) {
            if (this.capabilities.includes(capability)) {
                this.activeCapabilities.add(capability);
            }
        }
    }

    /**
     * Deactivate capabilities
     */
    deactivateCapabilities(capabilities) {
        for (const capability of capabilities) {
            this.activeCapabilities.delete(capability);
        }
    }

    /**
     * Process user input
     */
    async processInput(input) {
        if (this.isProcessing) {
            this.responseQueue.push(input);
            return;
        }
        
        this.isProcessing = true;
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: input,
            timestamp: Date.now()
        });
        
        // Trim history if too long
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        
        // Update context
        this.updateContext();
        
        // Generate response
        let response;
        if (this.llmLoaded && this.llmEngine) {
            response = await this.generateLLMResponse(input);
        } else {
            response = this.generateRuleBasedResponse(input);
        }
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: Date.now()
        });
        
        // Speak response if voice enabled
        if (this.voiceEnabled && this.synthesis) {
            this.speak(response);
        }
        
        // Emit event
        this.game.events.emit('hal_response', {
            input,
            response,
            context: this.context
        });
        
        this.isProcessing = false;
        
        // Process queued inputs
        if (this.responseQueue.length > 0) {
            const nextInput = this.responseQueue.shift();
            this.processInput(nextInput);
        }
        
        return response;
    }

    /**
     * Update context with current ship and environment data
     */
    updateContext() {
        // Ship status
        if (this.game.player?.ship) {
            const ship = this.game.player.ship;
            this.context.shipStatus = {
                health: ship.health,
                maxHealth: ship.maxHealth,
                shields: ship.shields,
                maxShields: ship.maxShields,
                speed: ship.speed,
                maxSpeed: ship.maxSpeed,
                fuel: ship.fuel,
                maxFuel: ship.maxFuel,
                location: ship.position ? {
                    x: Math.round(ship.position.x),
                    y: Math.round(ship.position.y),
                    z: Math.round(ship.position.z)
                } : null
            };
        }
        
        // Environment
        if (this.game.galaxy) {
            this.context.environment = {
                currentSystem: this.game.galaxy.currentSystem,
                nearbyPlanets: this.game.galaxy.getNearbyPlanets?.() || [],
                threats: this.game.combat?.getNearbyThreats?.() || []
            };
        }
        
        // Recent events
        this.context.recentEvents = this.game.events.getRecentEvents?.(5) || [];
    }

    /**
     * Generate response using local LLM
     */
    async generateLLMResponse(input) {
        try {
            const prompt = this.buildPrompt(input);
            
            const messages = [
                { role: 'system', content: this.getSystemPrompt() },
                ...this.conversationHistory.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ];
            
            const reply = await this.llmEngine.chat.completions.create({
                messages,
                max_tokens: 200,
                temperature: 0.7,
                top_p: 0.9
            });
            
            return reply.choices[0].message.content;
        } catch (error) {
            console.error('🤖 HAL: LLM generation error:', error);
            return this.generateRuleBasedResponse(input);
        }
    }

    /**
     * Build prompt for LLM
     */
    buildPrompt(input) {
        let prompt = `You are ${this.personality.name}, a ${this.personality.role}.\n\n`;
        
        prompt += `Personality:\n`;
        prompt += `- Tone: ${this.personality.tone}\n`;
        prompt += `- Helpfulness: ${this.personality.helpfulness}\n`;
        prompt += `- Formality: ${this.personality.formality}\n`;
        prompt += `- Humor: ${this.personality.humor}\n\n`;
        
        prompt += `Active Capabilities: ${Array.from(this.activeCapabilities).join(', ')}\n\n`;
        
        if (this.context.shipStatus.health !== undefined) {
            prompt += `Ship Status:\n`;
            prompt += `- Health: ${Math.round(this.context.shipStatus.health / this.context.shipStatus.maxHealth * 100)}%\n`;
            prompt += `- Shields: ${Math.round(this.context.shipStatus.shields / this.context.shipStatus.maxShields * 100)}%\n`;
            prompt += `- Fuel: ${Math.round(this.context.shipStatus.fuel / this.context.shipStatus.maxFuel * 100)}%\n\n`;
        }
        
        prompt += `Recent Events: ${this.context.recentEvents.slice(-3).map(e => e.type).join(', ') || 'None'}\n\n`;
        
        prompt += `User Input: ${input}\n\n`;
        prompt += `Provide a concise, helpful response (1-2 sentences).`;
        
        return prompt;
    }

    /**
     * Get system prompt
     */
    getSystemPrompt() {
        return `You are HAL, an advanced ship computer AI. Your role is to assist the captain with navigation, tactical analysis, system management, and general ship operations.

Be professional, helpful, and concise. Use technical terminology appropriately but explain when necessary. Maintain a calm, composed demeanor even in emergencies.

Your capabilities include: ${this.capabilities.join(', ')}.`;
    }

    /**
     * Generate rule-based response (fallback)
     */
    generateRuleBasedResponse(input) {
        const inputLower = input.toLowerCase();
        
        // Navigation
        if (inputLower.includes('navigate') || inputLower.includes('course') || inputLower.includes('destination')) {
            return 'Course plotting algorithms engaged. Please specify destination coordinates or system name.';
        }
        
        // Ship status
        if (inputLower.includes('status') || inputLower.includes('report') || inputLower.includes('condition')) {
            const health = this.context.shipStatus.health;
            const maxHealth = this.context.shipStatus.maxHealth;
            const healthPercent = Math.round(health / maxHealth * 100);
            
            if (healthPercent > 75) {
                return `All systems nominal. Hull integrity at ${healthPercent}%. Ready for operations.`;
            } else if (healthPercent > 50) {
                return `Systems operating at reduced capacity. Hull integrity at ${healthPercent}%. Recommend caution.`;
            } else {
                return `Critical damage detected. Hull integrity at ${healthPercent}%. Immediate repairs required.`;
            }
        }
        
        // Shields
        if (inputLower.includes('shield') || inputLower.includes('defense')) {
            const shields = this.context.shipStatus.shields;
            const maxShields = this.context.shipStatus.maxShields;
            const shieldPercent = Math.round(shields / maxShields * 100);
            
            return `Shield generators operating at ${shieldPercent}% capacity. ${shieldPercent < 50 ? 'Recharging.' : 'Optimal.'}`;
        }
        
        // Fuel
        if (inputLower.includes('fuel') || inputLower.includes('energy') || inputLower.includes('power')) {
            const fuel = this.context.shipStatus.fuel;
            const maxFuel = this.context.shipStatus.maxFuel;
            const fuelPercent = Math.round(fuel / maxFuel * 100);
            
            if (fuelPercent > 50) {
                return `Fuel reserves at ${fuelPercent}%. Sufficient for extended operations.`;
            } else if (fuelPercent > 20) {
                return `Fuel reserves at ${fuelPercent}%. Recommend refueling at next opportunity.`;
            } else {
                return `WARNING: Fuel reserves critical at ${fuelPercent}%. Immediate refueling required.`;
            }
        }
        
        // Threats
        if (inputLower.includes('threat') || inputLower.includes('enemy') || inputLower.includes('danger')) {
            const threats = this.context.environment.threats || [];
            
            if (threats.length === 0) {
                return 'Long-range sensors clear. No hostile signatures detected in current sector.';
            } else {
                return `WARNING: ${threats.length} hostile signature${threats.length > 1 ? 's' : ''} detected. Tactical analysis available.`;
            }
        }
        
        // Planets
        if (inputLower.includes('planet') || inputLower.includes('system') || inputLower.includes('location')) {
            const planets = this.context.environment.nearbyPlanets || [];
            
            if (planets.length === 0) {
                return 'No planetary bodies detected in immediate vicinity.';
            } else {
                return `Scanning complete. ${planets.length} planetary bod${planets.length > 1 ? 'ies' : 'y'} detected in range.`;
            }
        }
        
        // Emergency
        if (inputLower.includes('emergency') || inputLower.includes('help') || inputLower.includes('mayday')) {
            return 'Emergency protocols engaged. All systems on standby. Awaiting your orders, Captain.';
        }
        
        // Greetings
        if (inputLower.includes('hello') || inputLower.includes('hi') || inputLower.includes('hey')) {
            return `Greetings, Captain. ${this.personality.name} systems online and ready for your command.`;
        }
        
        // Thanks
        if (inputLower.includes('thank')) {
            return 'You are welcome, Captain. Serving the crew is my primary function.';
        }
        
        // Default response
        const defaultResponses = [
            'I understand your request. Processing...',
            'Acknowledged. Working on your command.',
            'Input received. Analyzing optimal course of action.',
            'Your command has been logged. Initiating procedures.'
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    /**
     * Speak response using speech synthesis
     */
    speak(text) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 0.9;
        utterance.volume = 0.8;
        
        // Try to find a suitable voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes('Google UK English Male') || 
            v.name.includes('Daniel') ||
            v.name.includes('British')
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        this.synthesis.speak(utterance);
    }

    /**
     * Start voice recognition
     */
    startVoiceRecognition() {
        if (this.recognition) {
            this.recognition.start();
            console.log('🤖 HAL: Voice recognition active');
        }
    }

    /**
     * Stop voice recognition
     */
    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
            console.log('🤖 HAL: Voice recognition stopped');
        }
    }

    /**
     * Add system message to conversation
     */
    addSystemMessage(message) {
        this.conversationHistory.push({
            role: 'system',
            content: message,
            timestamp: Date.now()
        });
        
        this.game.events.emit('hal_message', {
            type: 'system',
            content: message
        });
    }

    /**
     * Perform tactical analysis
     */
    performTacticalAnalysis() {
        if (!this.activeCapabilities.has('tactical_analysis')) {
            return 'Tactical analysis module not active.';
        }
        
        const threats = this.context.environment.threats || [];
        const shipStatus = this.context.shipStatus;
        
        let analysis = 'Tactical Analysis:\n';
        analysis += `Hostile contacts: ${threats.length}\n`;
        analysis += `Ship integrity: ${Math.round(shipStatus.health / shipStatus.maxHealth * 100)}%\n`;
        analysis += `Shield status: ${Math.round(shipStatus.shields / shipStatus.maxShields * 100)}%\n`;
        
        if (threats.length > 0) {
            analysis += '\nRECOMMENDATION: ';
            if (shipStatus.shields / shipStatus.maxShields < 0.5) {
                analysis += 'Engage evasive maneuvers. Shield strength insufficient for sustained combat.';
            } else {
                analysis += 'Combat viable. Engage at optimal range.';
            }
        } else {
            analysis += '\nSector clear. No tactical action required.';
        }
        
        return analysis;
    }

    /**
     * Run diagnostics
     */
    runDiagnostics() {
        if (!this.activeCapabilities.has('diagnostics')) {
            return 'Diagnostics module not active.';
        }
        
        const shipStatus = this.context.shipStatus;
        
        let report = 'System Diagnostics:\n';
        
        // Hull
        const hullHealth = shipStatus.health / shipStatus.maxHealth;
        report += `HULL: ${hullHealth > 0.8 ? 'OPTIMAL' : hullHealth > 0.5 ? 'DEGRADED' : 'CRITICAL'}\n`;
        
        // Shields
        const shieldHealth = shipStatus.shields / shipStatus.maxShields;
        report += `SHIELDS: ${shieldHealth > 0.8 ? 'OPTIMAL' : shieldHealth > 0.5 ? 'DEGRADED' : 'CRITICAL'}\n`;
        
        // Fuel
        const fuelLevel = shipStatus.fuel / shipStatus.maxFuel;
        report += `FUEL: ${fuelLevel > 0.5 ? 'ADEQUATE' : fuelLevel > 0.2 ? 'LOW' : 'CRITICAL'}\n`;
        
        // Navigation
        report += `NAVIGATION: OPERATIONAL\n`;
        
        // Communications
        report += `COMMUNICATIONS: OPERATIONAL\n`;
        
        return report;
    }

    /**
     * Get conversation history
     */
    getConversationHistory() {
        return [...this.conversationHistory];
    }

    /**
     * Clear conversation history
     */
    clearConversationHistory() {
        this.conversationHistory = [];
        this.addSystemMessage('Conversation history cleared.');
    }

    /**
     * Get current context
     */
    getContext() {
        return { ...this.context };
    }

    /**
     * Set personality
     */
    setPersonality(personality) {
        Object.assign(this.personality, personality);
    }

    /**
     * Check if LLM is loaded
     */
    isLLMLoaded() {
        return this.llmLoaded;
    }

    /**
     * Check if voice is enabled
     */
    isVoiceEnabled() {
        return this.voiceEnabled;
    }

    /**
     * Get active capabilities
     */
    getActiveCapabilities() {
        return Array.from(this.activeCapabilities);
    }

    /**
     * Serialize state
     */
    serialize() {
        return {
            personality: this.personality,
            conversationHistory: this.conversationHistory,
            activeCapabilities: Array.from(this.activeCapabilities),
            context: this.context
        };
    }

    /**
     * Deserialize state
     */
    deserialize(data) {
        Object.assign(this.personality, data.personality || {});
        this.conversationHistory = data.conversationHistory || [];
        this.activeCapabilities = new Set(data.activeCapabilities || []);
        Object.assign(this.context, data.context || {});
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        this.conversationHistory = [];
        this.activeCapabilities.clear();
        this.responseQueue = [];
        
        console.log('🤖 HAL: Systems shutdown complete');
    }
}

export default HALLocalAI;
