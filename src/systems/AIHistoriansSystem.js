/**
 * 📜 Era III: AI Historians System
 * 
 * Automated chronicling of player wars, events, and history as published
 * "Galactic News" with AI-generated narratives and analysis.
 */

class AIHistoriansSystem {
    constructor(game) {
        this.game = game;
        this.eventBuffer = [];
        this.publishedNews = [];
        this.historicalArchives = [];
        this.chronicleInterval = null;
        
        console.log("📜 AI Historians System: Initializing galactic chronicle...");
    }
    
    /**
     * Initialize the AI Historians
     */
    async initialize() {
        // Load existing historical archives
        await this.loadHistoricalArchives();
        
        // Start chronicling events
        this.startChronicling();
        
        // Start news generation cycle
        this.startNewsGeneration();
        
        console.log("📜 AI Historians: Galactic chronicle active");
    }
    
    /**
     * Start chronicling in-game events
     */
    startChronicling() {
        // Chronicle major events every 5 minutes
        this.chronicleInterval = setInterval(() => {
            this.analyzeAndRecordEvents();
        }, 300000); // 5 minutes
        
        // Listen for game events
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners for major game events
     */
    setupEventListeners() {
        // War declarations
        window.addEventListener('WAR_DECLARED', (event) => {
            this.recordEvent('war', event.detail);
        });
        
        // Battles
        window.addEventListener('BATTLE_ENDED', (event) => {
            this.recordEvent('battle', event.detail);
        });
        
        // Faction changes
        window.addEventListener('FACTION_FORMED', (event) => {
            this.recordEvent('faction', event.detail);
        });
        
        // Discoveries
        window.addEventListener('SCIENTIFIC_DISCOVERY', (event) => {
            this.recordEvent('discovery', event.detail);
        });
        
        // Territory changes
        window.addEventListener('TERRITORY_CLAIMED', (event) => {
            this.recordEvent('territory', event.detail);
        });
        
        // Economic events
        window.addEventListener('MARKET_EVENT', (event) => {
            this.recordEvent('economy', event.detail);
        });
    }
    
    /**
     * Record a significant event
     */
    recordEvent(eventType, eventData) {
        const event = {
            id: this.generateEventId(),
            event_type: eventType,
            title: this.generateEventTitle(eventType, eventData),
            description: this.generateEventDescription(eventType, eventData),
            participants: this.extractParticipants(eventData),
            factions: this.extractFactions(eventData),
            location: eventData.location || 'Unknown',
            timestamp: Date.now(),
            impact_score: this.calculateImpactScore(eventType, eventData),
            verified: false
        };
        
        this.eventBuffer.push(event);
        
        console.log(`📜 Event recorded: ${event.title}`);
    }
    
    /**
     * Generate event title based on type and data
     */
    generateEventTitle(eventType, eventData) {
        const titles = {
            war: `War Declared: ${eventData.aggressor} vs ${eventData.defender}`,
            battle: `Battle of ${eventData.location}`,
            faction: `New Faction Formed: ${eventData.factionName}`,
            discovery: `Scientific Discovery: ${eventData.keplerId || eventData.type}`,
            territory: `Territory Claimed: ${eventData.system}`,
            economy: `Market Event: ${eventData.eventType}`
        };
        
        return titles[eventType] || 'Significant Event';
    }
    
    /**
     * Generate event description
     */
    generateEventDescription(eventType, eventData) {
        const descriptions = {
            war: `${eventData.aggressor} has declared war on ${eventData.defender}. Conflict expected to impact ${eventData.affectedSystems.length} star systems.`,
            battle: `A major engagement occurred at ${eventData.location}. ${eventData.victor} emerged victorious with ${eventData.casualties} reported casualties.`,
            faction: `${eventData.factionName} has been established under the leadership of ${eventData.leader}. Initial membership: ${eventData.memberCount}.`,
            discovery: `A significant discovery has been made: ${eventData.type}. Scientific impact rating: ${eventData.impact}.`,
            territory: `${eventData.faction} has successfully claimed the ${eventData.system} system, expanding their territorial holdings.`,
            economy: `${eventData.eventType} affecting ${eventData.commodity} prices. Market volatility: ${eventData.volatility}%.`
        };
        
        return descriptions[eventType] || 'A significant event has occurred.';
    }
    
    /**
     * Extract participants from event data
     */
    extractParticipants(eventData) {
        const participants = [];
        
        if (eventData.aggressor) participants.push(eventData.aggressor);
        if (eventData.defender) participants.push(eventData.defender);
        if (eventData.victor) participants.push(eventData.victor);
        if (eventData.leader) participants.push(eventData.leader);
        if (eventData.faction) participants.push(eventData.faction);
        
        return participants.join(', ');
    }
    
    /**
     * Extract factions from event data
     */
    extractFactions(eventData) {
        const factions = [];
        
        if (eventData.aggressorFaction) factions.push(eventData.aggressorFaction);
        if (eventData.defenderFaction) factions.push(eventData.defenderFaction);
        if (eventData.factionName) factions.push(eventData.factionName);
        if (eventData.factions && Array.isArray(eventData.factions)) {
            factions.push(...eventData.factions);
        }
        
        return factions.join(', ');
    }
    
    /**
     * Calculate impact score for an event
     */
    calculateImpactScore(eventType, eventData) {
        const baseScores = {
            war: 100,
            battle: 75,
            faction: 50,
            discovery: 60,
            territory: 40,
            economy: 30
        };
        
        let score = baseScores[eventType] || 25;
        
        // Adjust based on event data
        if (eventData.casualties) score += Math.min(eventData.casualties / 100, 50);
        if (eventData.memberCount) score += Math.min(eventData.memberCount / 10, 30);
        if (eventData.impact) score += eventData.impact;
        
        return Math.min(score, 100);
    }
    
    /**
     * Analyze and record buffered events
     */
    async analyzeAndRecordEvents() {
        if (this.eventBuffer.length === 0) return;
        
        // Process events in batch
        const eventsToRecord = [...this.eventBuffer];
        this.eventBuffer = [];
        
        for (const event of eventsToRecord) {
            await this.saveEvent(event);
        }
        
        console.log(`📜 Recorded ${eventsToRecord.length} events to galactic chronicle`);
    }
    
    /**
     * Save event to database
     */
    async saveEvent(event) {
        try {
            const response = await fetch('/api/historians/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save event:', error);
            return null;
        }
    }
    
    /**
     * Start news generation cycle
     */
    startNewsGeneration() {
        // Generate news every hour
        setInterval(() => {
            this.generateGalacticNews();
        }, 3600000); // 1 hour
    }
    
    /**
     * Generate galactic news from recent events
     */
    async generateGalacticNews() {
        const recentEvents = await this.fetchRecentEvents(24); // Last 24 hours
        
        if (recentEvents.length === 0) return;
        
        // Group events by type
        const eventGroups = this.groupEventsByType(recentEvents);
        
        // Generate news articles
        for (const [eventType, events] of Object.entries(eventGroups)) {
            if (events.length > 0) {
                const article = await this.generateNewsArticle(eventType, events);
                if (article) {
                    await this.publishNews(article);
                }
            }
        }
    }
    
    /**
     * Fetch recent events from database
     */
    async fetchRecentEvents(hours = 24) {
        const timestamp = Date.now() - (hours * 60 * 60 * 1000);
        
        try {
            const response = await fetch(`/api/historians/events?since=${timestamp}`);
            const data = await response.json();
            return data.events || [];
        } catch (error) {
            console.error('Failed to fetch recent events:', error);
            return [];
        }
    }
    
    /**
     * Group events by type
     */
    groupEventsByType(events) {
        const groups = {};
        
        for (const event of events) {
            if (!groups[event.event_type]) {
                groups[event.event_type] = [];
            }
            groups[event.event_type].push(event);
        }
        
        return groups;
    }
    
    /**
     * Generate news article from events
     */
    async generateNewsArticle(eventType, events) {
        const headline = this.generateHeadline(eventType, events);
        const articleBody = this.generateArticleBody(eventType, events);
        
        return {
            id: this.generateNewsId(),
            headline: headline,
            article_body: articleBody,
            author: 'AI Historian',
            published_at: Date.now(),
            views: 0,
            likes: 0
        };
    }
    
    /**
     * Generate headline for news article
     */
    generateHeadline(eventType, events) {
        const headlines = {
            war: `Galactic Conflict Escalates: ${events.length} War Declarations in 24 Hours`,
            battle: `Major Battles Reported Across ${events.length} Star Systems`,
            faction: `New Powers Rise: ${events.length} Factions Established`,
            discovery: `Scientific Breakthrough: ${events.length} Discoveries Advance Knowledge`,
            territory: `Territorial Shift: ${events.length} Systems Change Hands`,
            economy: `Market Volatility: Economic Events Impact ${events.length} Sectors`
        };
        
        return headlines[eventType] || 'Galactic News Update';
    }
    
    /**
     * Generate article body
     */
    generateArticleBody(eventType, events) {
        let body = `The Galactic News Network reports significant developments in the ${eventType} sector.\n\n`;
        
        // Add event summaries
        for (const event of events.slice(0, 5)) {
            body += `• ${event.title}\n`;
            body += `  ${event.description}\n\n`;
        }
        
        // Add AI analysis
        body += `\n**AI Analysis:**\n`;
        body += this.generateAIAnalysis(eventType, events);
        
        return body;
    }
    
    /**
     * Generate AI analysis of events
     */
    generateAIAnalysis(eventType, events) {
        const totalImpact = events.reduce((sum, e) => sum + e.impact_score, 0);
        const avgImpact = totalImpact / events.length;
        
        let analysis = `Based on ${events.length} events, the overall impact is rated at ${avgImpact.toFixed(1)}/100. `;
        
        if (avgImpact > 75) {
            analysis += 'These developments represent a major shift in galactic dynamics. ';
        } else if (avgImpact > 50) {
            analysis += 'These events indicate significant changes in the current state of affairs. ';
        } else {
            analysis += 'These events are part of the ongoing evolution of galactic society. ';
        }
        
        // Add trend analysis
        const topParticipants = this.getTopParticipants(events);
        if (topParticipants.length > 0) {
            analysis += `Key participants include: ${topParticipants.slice(0, 3).join(', ')}. `;
        }
        
        return analysis;
    }
    
    /**
     * Get top participants from events
     */
    getTopParticipants(events) {
        const participantCounts = {};
        
        for (const event of events) {
            const participants = event.participants.split(', ');
            for (const participant of participants) {
                if (!participantCounts[participant]) {
                    participantCounts[participant] = 0;
                }
                participantCounts[participant]++;
            }
        }
        
        return Object.entries(participantCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([participant]) => participant);
    }
    
    /**
     * Publish news article
     */
    async publishNews(article) {
        try {
            const response = await fetch('/api/historians/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(article)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.publishedNews.push(article);
                console.log(`📜 News published: ${article.headline}`);
            }
            
            return data;
        } catch (error) {
            console.error('Failed to publish news:', error);
            return null;
        }
    }
    
    /**
     * Load historical archives
     */
    async loadHistoricalArchives() {
        try {
            const response = await fetch('/api/historians/archives');
            const data = await response.json();
            this.historicalArchives = data.archives || [];
            console.log(`📜 Loaded ${this.historicalArchives.length} historical archives`);
        } catch (error) {
            console.error('Failed to load archives:', error);
        }
    }
    
    /**
     * Get latest news
     */
    async getLatestNews(limit = 10) {
        try {
            const response = await fetch(`/api/historians/news?limit=${limit}`);
            const data = await response.json();
            return data.news || [];
        } catch (error) {
            console.error('Failed to fetch latest news:', error);
            return [];
        }
    }
    
    /**
     * Get historical archives by era
     */
    async getArchivesByEra(era) {
        try {
            const response = await fetch(`/api/historians/archives?era=${era}`);
            const data = await response.json();
            return data.archives || [];
        } catch (error) {
            console.error('Failed to fetch archives:', error);
            return [];
        }
    }
    
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate unique news ID
     */
    generateNewsId() {
        return `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Stop chronicling
     */
    stop() {
        if (this.chronicleInterval) {
            clearInterval(this.chronicleInterval);
            this.chronicleInterval = null;
        }
        
        console.log("📜 AI Historians: Galactic chronicle paused");
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.AIHistoriansSystem = AIHistoriansSystem;
}
