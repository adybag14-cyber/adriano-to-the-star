/**
 * Galactic Events System
 * Manages dynamic events like Solar Flares, Supernovae, and Anomalies.
 */

class GalacticEventsManager {
    constructor() {
        this.activeEvents = [];
        this.history = [];
        this.isInitialized = false;

        // Event Definitions with probabilities (0-1)
        this.eventTypes = [
            {
                type: 'SOLAR_FLARE',
                name: 'Solar Flare',
                description: 'A massive burst of energy from the host star. Increases energy output but damages unshielded electronics.',
                probability: 0.3,
                duration: 1000 * 60 * 60 * 24 * 3, // 3 days
                severity: 'medium',
                icon: '☀️'
            },
            {
                type: 'GEOMAGNETIC_STORM',
                name: 'Geomagnetic Storm',
                description: 'Disturbance in the planetary magnetosphere.',
                probability: 0.25,
                duration: 1000 * 60 * 60 * 24 * 5, // 5 days
                severity: 'low',
                icon: '⚡'
            },
            {
                type: 'SUPERNOVA_PRECURSOR',
                name: 'Supernova Precursor',
                description: 'A nearby star exhibits signs of imminent collapse. Massive scientific data potential.',
                probability: 0.05, // Rare
                duration: 1000 * 60 * 60 * 24 * 30, // 30 days
                severity: 'high',
                icon: '💥'
            },
            {
                type: 'COMET_FLYBY',
                name: 'Comet Flyby',
                description: 'A rare comet passes through the system. Harvestable resources available.',
                probability: 0.15,
                duration: 1000 * 60 * 60 * 24 * 14, // 14 days
                severity: 'low',
                icon: '☄️'
            }
        ];

        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('🌌 Galactic Events System initialized');

        // Try to load saved state first
        this.loadState();

        this.notifyUI();

        // Attempt server connection
        this.connectToServer();

        // Start local simulation loop (check for events every 60 seconds)
        // Only trigger local events if server is disconnected
        if (typeof window !== 'undefined') {
            setInterval(() => this.simulateStep(), 60000);
        }
    }

    connectToServer() {
        try {
            // Check if we are in environment that supports WS
            if (typeof WebSocket === 'undefined') return;

            const wsUrl = (typeof window !== 'undefined'
                && typeof window.GALACTIC_SIM_WS_URL === 'string'
                && window.GALACTIC_SIM_WS_URL)
                ? window.GALACTIC_SIM_WS_URL
                : null;

            // Opt-in only: avoid noisy console errors when no backend is running
            if (!wsUrl) {
                this.usingServer = false;
                return;
            }

            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('🟢 Connected to Galactic Simulation Server');
                this.usingServer = true;
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'GALAXY_STATE_UPDATE' || data.type === 'INIT_STATE') {
                        this.syncFromServer(data.events);
                    }
                } catch (e) {
                    console.error('Failed to parse galaxy update', e);
                }
            };

            this.socket.onclose = () => {
                console.log('🔴 Disconnected from Galactic Simulation Server - Reverting to local simulation');
                this.usingServer = false;
                // Try reconnect in 60s
                setTimeout(() => this.connectToServer(), 60000);
            };

            this.socket.onerror = (err) => {
                // Silent fail/warn, fallback to local
                this.usingServer = false;
            };

        } catch (e) {
            console.warn('Could not connect to Simulation Server:', e);
            this.usingServer = false;
        }
    }

    syncFromServer(serverEvents) {
        // Replace local active events with server events
        // But keep local history for UI consistency if needed
        this.activeEvents = serverEvents;
        this.saveState();
        this.notifyUI();
    }

    simulateStep() {
        // If connected to server, let server handle logic sync
        if (this.usingServer) return;

        // 1. Clean up expired events
        this.cleanupExpiredEvents();

        // 2. Chance to spawn new event
        if (Math.random() < 0.1) { // 10% chance per minute check
            this.triggerRandomEvent();
        }
    }

    triggerRandomEvent() {
        const rand = Math.random();
        let cumulativeProb = 0;

        // Normalize probabilities for selection
        const totalProb = this.eventTypes.reduce((sum, e) => sum + e.probability, 0);
        const randomValue = rand * totalProb;

        for (const eventType of this.eventTypes) {
            cumulativeProb += eventType.probability;
            if (randomValue <= cumulativeProb) {
                this.createEvent(eventType);
                return;
            }
        }
    }

    createEvent(eventTypeDefinition) {
        const event = {
            id: 'evt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: eventTypeDefinition.type,
            name: eventTypeDefinition.name,
            description: eventTypeDefinition.description,
            icon: eventTypeDefinition.icon,
            severity: eventTypeDefinition.severity,
            startTime: Date.now(),
            endTime: Date.now() + eventTypeDefinition.duration,
            affectedSystems: ['all'] // Simplified: affects whole galaxy for now
        };

        this.activeEvents.push(event);
        this.history.push(event);

        // Keep history manageable
        if (this.history.length > 50) this.history.shift();

        this.saveState();
        this.notifyUI(event);
        console.log(`🌌 New Galactic Event: ${event.name}`);

        return event;
    }

    cleanupExpiredEvents() {
        const now = Date.now();
        const initialCount = this.activeEvents.length;

        this.activeEvents = this.activeEvents.filter(e => e.endTime > now);

        if (this.activeEvents.length !== initialCount) {
            this.saveState();
            this.notifyUI(); // Update UI to remove expired
        }
    }

    /**
     * Force trigger an event by name (for debugging/testing)
     */
    triggerEvent(eventName) {
        const def = this.eventTypes.find(e => e.name.toLowerCase() === eventName.toLowerCase() || e.type === eventName);
        if (def) {
            return this.createEvent(def);
        } else {
            console.warn(`Event type '${eventName}' not found.`);
            return null;
        }
    }

    saveState() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('galactic_events_active', JSON.stringify(this.activeEvents));
        }
    }

    loadState() {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('galactic_events_active');
            if (saved) {
                try {
                    const events = JSON.parse(saved);
                    // Filter out ones that expired while offline
                    const now = Date.now();
                    this.activeEvents = events.filter(e => e.endTime > now);
                } catch (e) {
                    console.error('Failed to load galactic events state', e);
                }
            }
        }
    }

    notifyUI(newEvent = null) {
        const container = document.getElementById('galactic-events-container');
        if (container) {
            this.renderEventsWidget(container);
        }

        // Could also trigger a toast/notification here
        if (newEvent && typeof window.showNotification === 'function') {
            window.showNotification(`🌌 ${newEvent.name}: ${newEvent.description}`);
        }
    }

    renderEventsWidget(containerElement) {
        if (!containerElement) return;

        if (this.activeEvents.length === 0) {
            containerElement.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: rgba(255,255,255,0.5); font-style: italic;">
                    No active galactic events... sectors quiet.
                </div>
            `;
            return;
        }

        containerElement.innerHTML = `
            <div class="galactic-events-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${this.activeEvents.map(event => `
                    <div class="event-card severity-${event.severity}" style="
                        background: rgba(20, 20, 30, 0.9); 
                        border: 1px solid ${this.getSeverityColor(event.severity)}; 
                        border-left: 4px solid ${this.getSeverityColor(event.severity)};
                        border-radius: 8px; 
                        padding: 1rem;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.5rem;">${event.icon}</span>
                                <h4 style="margin: 0; color: #f9fafb;">${event.name}</h4>
                            </div>
                            <span style="
                                font-size: 0.7rem; 
                                padding: 0.2rem 0.5rem; 
                                border-radius: 4px; 
                                background: ${this.getSeverityColor(event.severity, 0.2)}; 
                                color: ${this.getSeverityColor(event.severity)};
                                text-transform: uppercase;
                                font-weight: bold;
                            ">
                                ${event.severity}
                            </span>
                        </div>
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: rgba(255,255,255,0.8);">${event.description}</p>
                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">
                            Ends in: ${this.formatTimeRemaining(event.endTime)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getSeverityColor(severity, opacity = 1) {
        switch (severity) {
            case 'low': return `rgba(59, 130, 246, ${opacity})`; // Blue
            case 'medium': return `rgba(245, 158, 11, ${opacity})`; // Amber
            case 'high': return `rgba(239, 68, 68, ${opacity})`; // Red
            case 'critical': return `rgba(168, 85, 247, ${opacity})`; // Purple
            default: return `rgba(156, 163, 175, ${opacity})`; // Gray
        }
    }

    formatTimeRemaining(endTime) {
        const now = Date.now();
        const diff = Math.max(0, endTime - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h ${(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)))}m`;
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.GalacticEventsManager = GalacticEventsManager;
    window.galacticEventsManager = new GalacticEventsManager();
}
