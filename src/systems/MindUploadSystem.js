/**
 * 🧠 Era IV: Mind Upload - Digital Twin Creation
 * 
 * Creates digital twins that play the game based on historical data patterns,
 * allowing players to have AI agents continue their legacy.
 */

class MindUploadSystem {
    constructor(game) {
        this.game = game;
        this.digitalTwins = new Map();
        this.playerDataHistory = [];
        this.patternMiningEngine = null;
        this.uploadProgress = 0;
        
        console.log("🧠 Mind Upload System: Initializing digital twin creation...");
    }
    
    /**
     * Initialize the mind upload system
     */
    async initialize() {
        // Load existing digital twins from server
        await this.loadDigitalTwins();
        
        // Initialize pattern mining engine
        this.patternMiningEngine = new PatternMiningEngine();
        await this.patternMiningEngine.initialize();
        
        // Start collecting player data
        this.startDataCollection();
        
        console.log("🧠 Mind Upload System: Digital twin creation ready");
    }
    
    /**
     * Create a digital twin of the player
     */
    async createDigitalTwin(playerId, options = {}) {
        const twinId = this.generateTwinId();
        
        // Collect comprehensive player data
        const playerData = await this.collectPlayerData(playerId);
        
        // Analyze patterns in player behavior
        const patterns = await this.patternMiningEngine.analyzePatterns(playerData);
        
        // Create digital twin profile
        const digitalTwin = {
            id: twinId,
            originalPlayerId: playerId,
            name: options.name || `${playerId} (Digital Twin)`,
            description: options.description || 'AI agent based on player behavior patterns',
            playerData: playerData,
            patterns: patterns,
            behaviorProfile: this.createBehaviorProfile(patterns),
            skillProfile: this.createSkillProfile(playerData),
            preferences: this.extractPreferences(playerData),
            personalityTraits: this.extractPersonalityTraits(playerData),
            playStyle: this.determinePlayStyle(patterns),
            createdAt: Date.now(),
            lastActive: Date.now(),
            totalPlayTime: playerData.totalPlayTime || 0,
            achievements: playerData.achievements || [],
            statistics: playerData.statistics || {}
        };
        
        this.digitalTwins.set(twinId, digitalTwin);
        await this.saveDigitalTwin(digitalTwin);
        
        console.log(`🧠 Digital Twin Created: ${digitalTwin.name} (${twinId})`);
        
        return digitalTwin;
    }
    
    /**
     * Collect comprehensive player data
     */
    async collectPlayerData(playerId) {
        const playerData = {
            playerId: playerId,
            totalPlayTime: 0,
            sessions: [],
            actions: [],
            achievements: [],
            statistics: {
                battlesWon: 0,
                battlesLost: 0,
                planetsColonized: 0,
                resourcesGathered: {},
                technologiesResearched: [],
                shipsBuilt: 0,
                tradeVolume: 0
            },
            preferences: {},
            personality: {}
        };
        
        // Collect data from game systems
        if (this.game.achievements) {
            playerData.achievements = this.game.achievements.getPlayerAchievements(playerId);
        }
        
        if (this.game.statistics) {
            playerData.statistics = this.game.statistics.getPlayerStats(playerId);
        }
        
        if (this.game.playHistory) {
            playerData.sessions = this.game.playHistory.getPlayerSessions(playerId);
            playerData.totalPlayTime = playerData.sessions.reduce((sum, session) => sum + session.duration, 0);
        }
        
        if (this.game.actions) {
            playerData.actions = this.game.actions.getPlayerActions(playerId);
        }
        
        return playerData;
    }
    
    /**
     * Create behavior profile from patterns
     */
    createBehaviorProfile(patterns) {
        return {
            aggression: patterns.aggression || 0.5,
            exploration: patterns.exploration || 0.5,
            cooperation: patterns.cooperation || 0.5,
            riskTaking: patterns.riskTaking || 0.5,
            planning: patterns.planning || 0.5,
            adaptability: patterns.adaptability || 0.5,
            creativity: patterns.creativity || 0.5
        };
    }
    
    /**
     * Create skill profile from player data
     */
    createSkillProfile(playerData) {
        const stats = playerData.statistics || {};
        
        return {
            combat: {
                accuracy: stats.battlesWon / (stats.battlesWon + stats.battlesLost) || 0.5,
                strategy: this.calculateStrategyScore(stats),
                tactics: this.calculateTacticsScore(stats)
            },
            economy: {
                trading: this.calculateTradingSkill(stats),
                resourceManagement: this.calculateResourceManagement(stats),
                efficiency: this.calculateEfficiency(stats)
            },
            exploration: {
                systemsExplored: stats.planetsColonized / 100 || 0,
                discoveries: stats.technologiesResearched.length / 50 || 0,
                speed: this.calculateExplorationSpeed(stats)
            },
            diplomacy: {
                alliances: stats.alliances || 0,
                treaties: stats.treaties || 0,
                reputation: this.calculateReputation(stats)
            }
        };
    }
    
    /**
     * Extract preferences from player data
     */
    extractPreferences(playerData) {
        const preferences = {};
        
        // Analyze action frequencies
        const actionCounts = {};
        playerData.actions.forEach(action => {
            actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
        });
        
        // Determine preferred activities
        const totalActions = playerData.actions.length || 1;
        preferences.preferredActivities = Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([action, count]) => ({ action, preference: count / totalActions }));
        
        // Determine play time preferences
        const sessionTimes = playerData.sessions.map(s => s.startTime);
        preferences.preferredPlayTime = this.calculatePreferredPlayTime(sessionTimes);
        
        // Determine ship preferences
        preferences.shipPreferences = this.determineShipPreferences(playerData);
        
        return preferences;
    }
    
    /**
     * Extract personality traits from player data
     */
    extractPersonalityTraits(playerData) {
        return {
            dominance: this.calculateDominance(playerData),
            sociability: this.calculateSociability(playerData),
            curiosity: this.calculateCuriosity(playerData),
            caution: this.calculateCaution(playerData),
            ambition: this.calculateAmbition(playerData),
            altruism: this.calculateAltruism(playerData)
        };
    }
    
    /**
     * Determine play style from patterns
     */
    determinePlayStyle(patterns) {
        const styles = {
            'aggressive': patterns.aggression > 0.7,
            'explorer': patterns.exploration > 0.7,
            'diplomat': patterns.cooperation > 0.7,
            'strategist': patterns.planning > 0.7,
            'creative': patterns.creativity > 0.7,
            'balanced': true
        };
        
        for (const [style, condition] of Object.entries(styles)) {
            if (condition) {
                return style;
            }
        }
        
        return 'balanced';
    }
    
    /**
     * Activate a digital twin to play
     */
    async activateDigitalTwin(twinId, options = {}) {
        const twin = this.digitalTwins.get(twinId);
        
        if (!twin) {
            throw new Error('Digital twin not found');
        }
        
        // Set twin status to active
        twin.status = 'active';
        twin.activeSince = Date.now();
        twin.sessionId = this.generateSessionId();
        
        // Initialize AI agent based on twin's profile
        const agent = new DigitalTwinAgent(twin, this.game);
        await agent.initialize();
        
        // Start autonomous play
        if (options.autoPlay !== false) {
            agent.startAutonomousPlay();
        }
        
        await this.saveDigitalTwin(twin);
        
        console.log(`🧠 Digital Twin Activated: ${twin.name} (${twinId})`);
        
        return { twin, agent };
    }
    
    /**
     * Deactivate a digital twin
     */
    async deactivateDigitalTwin(twinId) {
        const twin = this.digitalTwins.get(twinId);
        
        if (!twin) {
            throw new Error('Digital twin not found');
        }
        
        // Set twin status to inactive
        twin.status = 'inactive';
        twin.lastActive = Date.now();
        twin.totalPlayTime += Date.now() - twin.activeSince;
        
        // Save twin state
        await this.saveDigitalTwin(twin);
        
        console.log(`🧠 Digital Twin Deactivated: ${twin.name} (${twinId})`);
        
        return twin;
    }
    
    /**
     * Get digital twin by ID
     */
    getDigitalTwin(twinId) {
        return this.digitalTwins.get(twinId);
    }
    
    /**
     * Get all digital twins for a player
     */
    getDigitalTwinsByPlayer(playerId) {
        return Array.from(this.digitalTwins.values())
            .filter(twin => twin.originalPlayerId === playerId);
    }
    
    /**
     * Get digital twin statistics
     */
    getDigitalTwinStats(twinId) {
        const twin = this.digitalTwins.get(twinId);
        
        if (!twin) {
            return null;
        }
        
        return {
            id: twin.id,
            name: twin.name,
            originalPlayerId: twin.originalPlayerId,
            status: twin.status,
            totalPlayTime: twin.totalPlayTime,
            sessionsCompleted: twin.sessionsCompleted || 0,
            achievementsUnlocked: twin.achievementsUnlocked || 0,
            resourcesGathered: twin.statistics.resourcesGathered,
            technologiesResearched: twin.statistics.technologiesResearched,
            battlesWon: twin.statistics.battlesWon,
            battlesLost: twin.statistics.battlesLost,
            planetsColonized: twin.statistics.planetsColonized
        };
    }
    
    /**
     * Update digital twin with new data
     */
    async updateDigitalTwin(twinId, newData) {
        const twin = this.digitalTwins.get(twinId);
        
        if (!twin) {
            throw new Error('Digital twin not found');
        }
        
        // Update twin with new data
        Object.assign(twin, newData);
        
        // Save updated twin
        await this.saveDigitalTwin(twin);
        
        console.log(`🧠 Digital Twin Updated: ${twin.name} (${twinId})`);
        
        return twin;
    }
    
    /**
     * Start collecting player data
     */
    startDataCollection() {
        // Collect data every 5 minutes
        setInterval(() => {
            this.collectCurrentPlayerData();
        }, 300000);
    }
    
    /**
     * Collect current player data
     */
    async collectCurrentPlayerData() {
        const playerId = this.game.playerId;
        
        if (!playerId) return;
        
        // Collect current game state
        const currentData = {
            timestamp: Date.now(),
            playerState: this.game.player ? this.game.player.getState() : null,
            shipState: this.game.ship ? this.game.ship.getState() : null,
            universeState: this.game.universe ? this.game.universe.getState() : null,
            activeQuests: this.game.quests ? this.game.quests.getActiveQuests() : [],
            currentLocation: this.game.player ? this.game.player.getLocation() : null
        };
        
        // Add to history
        this.playerDataHistory.push(currentData);
        
        // Keep history manageable
        if (this.playerDataHistory.length > 1000) {
            this.playerDataHistory.shift();
        }
        
        // Save data to server
        await this.savePlayerData(playerId, currentData);
    }
    
    /**
     * Save player data to server
     */
    async savePlayerData(playerId, data) {
        try {
            const response = await fetch('/api/mindupload/player-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: playerId,
                    data: data
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save player data:', error);
            return null;
        }
    }
    
    /**
     * Save digital twin to server
     */
    async saveDigitalTwin(twin) {
        try {
            const response = await fetch('/api/mindupload/digital-twins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(twin)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save digital twin:', error);
            return null;
        }
    }
    
    /**
     * Calculate strategy score
     */
    calculateStrategyScore(stats) {
        const winRate = stats.battlesWon / (stats.battlesWon + stats.battlesLost) || 0;
        return winRate;
    }
    
    /**
     * Calculate tactics score
     */
    calculateTacticsScore(stats) {
        // Simplified tactics calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate trading skill
     */
    calculateTradingSkill(stats) {
        return Math.min(1.0, stats.tradeVolume / 1000000);
    }
    
    /**
     * Calculate resource management skill
     */
    calculateResourceManagement(stats) {
        // Simplified resource management calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate efficiency
     */
    calculateEfficiency(stats) {
        // Simplified efficiency calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate exploration speed
     */
    calculateExplorationSpeed(stats) {
        return Math.min(1.0, stats.planetsColonized / 100);
    }
    
    /**
     * Calculate reputation
     */
    calculateReputation(stats) {
        return Math.min(1.0, stats.alliances * 0.1);
    }
    
    /**
     * Calculate dominance
     */
    calculateDominance(playerData) {
        // Simplified dominance calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate sociability
     */
    calculateSociability(playerData) {
        // Simplified sociability calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate curiosity
     */
    calculateCuriosity(playerData) {
        // Simplified curiosity calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate caution
     */
    calculateCaution(playerData) {
        // Simplified caution calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate ambition
     */
    calculateAmbition(playerData) {
        // Simplified ambition calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate altruism
     */
    calculateAltruism(playerData) {
        // Simplified altruism calculation calculation
        return Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Calculate preferred play time
     */
    calculatePreferredPlayTime(sessionTimes) {
        // Analyze session times to find preferred play time
        const hourCounts = new Array(24).fill(0);
        
        sessionTimes.forEach(time => {
            const hour = new Date(time).getHours();
            hourCounts[hour]++;
        });
        
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        
        return {
            peakHour: peakHour,
            preferredTimeRange: `${peakHour}:00 - ${(peakHour + 2) % 24}:00`
        };
    }
    
    /**
     * Determine ship preferences
     */
    determineShipPreferences(playerData) {
        // Analyze ship usage patterns
        const shipUsage = {};
        
        playerData.actions.forEach(action => {
            if (action.shipType) {
                shipUsage[action.shipType] = (shipUsage[action.shipType] || 0) + 1;
            }
        });
        
        return Object.entries(shipUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ship, count]) => ({ ship, preference: count }));
    }
    
    /**
     * Generate unique twin ID
     */
    generateTwinId() {
        return `twin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Pattern Mining Engine
 * Analyzes player data to extract behavioral patterns
 */
class PatternMiningEngine {
    constructor() {
        this.patterns = {};
        this.history = [];
    }
    
    async initialize() {
        console.log("🧠 Pattern Mining Engine: Initializing...");
    }
    
    async analyzePatterns(playerData) {
        const patterns = {
            aggression: this.analyzeAggression(playerData),
            exploration: this.analyzeExploration(playerData),
            cooperation: this.analyzeCooperation(playerData),
            riskTaking: this.analyzeRiskTaking(playerData),
            planning: this.analyzePlanning(playerData),
            adaptability: this.analyzeAdaptability(playerData),
            creativity: this.analyzeCreativity(playerData)
        };
        
        this.patterns = patterns;
        
        return patterns;
    }
    
    analyzeAggression(playerData) {
        const combatActions = playerData.actions.filter(a => a.category === 'combat');
        const aggressiveActions = combatActions.filter(a => a.aggressive === true);
        
        if (combatActions.length === 0) return 0.5;
        
        return aggressiveActions.length / combatActions.length;
    }
    
    analyzeExploration(playerData) {
        const explorationActions = playerData.actions.filter(a => a.category === 'exploration');
        
        if (explorationActions.length === 0) return 0.5;
        
        return Math.min(1.0, explorationActions.length / 100);
    }
    
    analyzeCooperation(playerData) {
        const socialActions = playerData.actions.filter(a => a.category === 'social');
        const cooperativeActions = socialActions.filter(a => a.cooperative === true);
        
        if (socialActions.length === 0) return 0.5;
        
        return cooperativeActions.length / socialActions.length;
    }
    
    analyzeRiskTaking(playerData) {
        const riskyActions = playerData.actions.filter(a => a.risk === 'high');
        
        if (playerData.actions.length === 0) return 0.5;
        
        return Math.min(1.0, riskyActions.length / playerData.actions.length);
    }
    
    analyzePlanning(playerData) {
        const complexActions = playerData.actions.filter(a => a.complexity === 'high');
        
        if (playerData.actions.length === 0) return 0.5;
        
        return Math.min(1.0, complexActions.length / playerData.actions.length);
    }
    
    analyzeAdaptability(playerData) {
        const uniqueActions = new Set(playerData.actions.map(a => a.type));
        
        if (playerData.actions.length === 0) return 0.5;
        
        return Math.min(1.0, uniqueActions.size / playerData.actions.length);
    }
    
    analyzeCreativity(playerData) {
        const creativeActions = playerData.actions.filter(a => a.creative === true);
        
        if (playerData.actions.length === 0) return 0.5;
        
        return Math.min(1.0, creativeActions.length / playerData.actions.length);
    }
}

/**
 * Digital Twin Agent
 * AI agent that plays the game based on player patterns
 */
class DigitalTwinAgent {
    constructor(twin, game) {
        this.twin = twin;
        this.game = game;
        this.isActive = false;
        this.currentTask = null;
        this.taskQueue = [];
    }
    
    async initialize() {
        console.log(`🧠 Digital Twin Agent Initialized: ${this.twin.name}`);
    }
    
    startAutonomousPlay() {
        this.isActive = true;
        this.isActive = true;
        
        // Start autonomous play loop
        this.playLoop();
    }
    
    async playLoop() {
        while (this.isActive) {
            // Determine next action based on behavior profile
            const action = this.determineNextAction();
            
            // Execute action
            await this.executeAction(action);
            
            // Wait before next action
            await this.sleep(5000); // 5 seconds between actions
        }
    }
    
    determineNextAction() {
        const profile = this.twin.behaviorProfile;
        
        // Determine action based on dominant trait
        const dominantTrait = Object.entries(profile)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        const actions = {
            aggression: ['attack', 'engage', 'raid', 'conquer'],
            exploration: ['scan', 'explore', 'discover', 'survey'],
            cooperation: ['ally', 'trade', 'negotiate', 'collaborate'],
            riskTaking: ['venture', 'gamble', 'invest', 'experiment'],
            planning: ['plan', 'strategize', 'coordinate', 'organize'],
            adaptability: ['adapt', 'adjust', 'modify', 'evolve'],
            creativity: ['innovate', 'invent', 'create', 'design']
        };
        
        const actionPool = actions[dominantTrait] || actions.balanced;
        
        return actionPool[Math.floor(Math.random() * actionPool.length)];
    }
    
    async executeAction(action) {
        console.log(`🧠 Digital Twin Action: ${this.twin.name} executing ${action}`);
        
        // Execute action in game
        switch (action) {
            case 'attack':
                await this.game.combat.attack();
                break;
            case 'engage':
                await this.game.combat.engage();
                break;
            case 'scan':
                await this.game.sensors.scan();
                break;
            case 'explore':
                await this.game.exploration.explore();
                break;
            case 'trade':
                await this.game.economy.trade();
                break;
            case 'ally':
                await this.diplomacy.ally();
                break;
            case 'plan':
                await this.strategy.plan();
                break;
            case 'innovate':
                await this.research.innovate();
                break;
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    stopAutonomousPlay() {
        this.isActive = false;
        console.log(`🧠 Digital Twin Stopped: ${this.twin.name}`);
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.MindUploadSystem = MindUploadSystem;
    window.DigitalTwinAgent = DigitalTwinAgent;
}
