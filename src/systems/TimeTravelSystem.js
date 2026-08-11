/**
 * ⏳ Era IV: Time Travel - Closed Timelike Curves
 * 
 * Enables interception of fleets through time manipulation,
 * temporal paradoxes, and causality loops.
 */

class TimeTravelSystem {
    constructor(game) {
        this.game = game;
        this.timelines = new Map();
        this.currentTimeline = null;
        this.timelineBranches = [];
        this.temporalAnomalies = [];
        this.ctcNetwork = new Map(); // Closed Timelike Curve network
        
        console.log("⏳ Time Travel System: Initializing temporal mechanics...");
    }
    
    /**
     * Initialize the time travel system
     */
    async initialize() {
        // Load existing timelines from the server
        await this.loadTimelines();
        
        // Create the prime timeline if it doesn't exist
        if (!this.timelines.has('prime')) {
            this.createPrimeTimeline();
        }
        
        // Set current timeline to prime
        this.currentTimeline = this.timelines.get('prime');
        
        // Start temporal monitoring
        this.startTemporalMonitoring();
        
        console.log(`⏳ Time Travel Initialized: ${this.timelines.size} timelines available`);
    }
    
    /**
     * Create the prime timeline (baseline causality)
     */
    createPrimeTimeline() {
        const primeTimeline = {
            id: 'prime',
            name: 'Prime Timeline',
            description: 'Baseline causality without temporal interventions',
            origin: Date.now(),
            divergencePoints: [],
            stability: 1.0,
            paradoxRisk: 0.0,
            population: 0,
            createdAt: Date.now()
        };
        
        this.timelines.set('prime', primeTimeline);
        this.saveTimeline(primeTimeline);
    }
    
    /**
     * Create a new timeline branch
     */
    createBranch(originTimelineId, divergencePoint) {
        const branchId = this.generateTimelineId();
        
        // Copy origin timeline
        const originTimeline = this.timelines.get(originTimelineId);
        const newTimeline = {
            id: branchId,
            name: this.generateTimelineName(),
            description: `Branch from ${originTimeline.name} at ${new Date(divergencePoint.timestamp).toLocaleString()}`,
            origin: originTimeline.origin,
            divergencePoints: [
                ...originTimeline.divergencePoints,
                divergencePoint
            ],
            stability: this.calculateBranchStability(originTimeline),
            paradoxRisk: this.calculateParadoxRisk(originTimeline),
            parentTimeline: originTimelineId,
            population: 0,
            createdAt: Date.now()
        };
        
        this.timelines.set(branchId, newTimeline);
        this.timelineBranches.push({
            from: originTimelineId,
            to: branchId,
            divergencePoint: divergencePoint,
            timestamp: Date.now()
        });
        
        this.saveTimeline(newTimeline);
        
        console.log(`⏳ Timeline Branch Created: ${newTimeline.name} (${branchId})`);
        
        return newTimeline;
    }
    
    /**
     * Calculate branch stability
     */
    calculateBranchStability(timeline) {
        // Stability decreases with each divergence
        const divergenceCount = timeline.divergencePoints.length;
        return Math.max(0.1, 1.0 - (divergenceCount * 0.1));
    }
    
    /**
     * Calculate paradox risk
     */
    calculateParadoxRisk(timeline) {
        // Paradox risk increases with divergence count
        const divergenceCount = timeline.divergencePoints.length;
        return Math.min(1.0, divergenceCount * 0.15);
    }
    
    /**
     * Create a Closed Timelike Curve (CTC)
     */
    createCTC(options = {}) {
        const ctcId = options.id || this.generateCTCId();
        
        const ctc = {
            id: ctcId,
            name: options.name || this.generateCTCName(),
            type: options.type || 'interception',
            origin: options.origin || this.currentTimeline.id,
            destination: options.destination || this.currentTimeline.id,
            entryPoint: options.entryPoint,
            exitPoint: options.exitPoint,
            temporalCoordinates: {
                entry: options.entryTime || Date.now() - 3600000, // 1 hour ago
                exit: options.exitTime || Date.now(),
                duration: options.duration || 3600000
            },
            spatialCoordinates: options.spatialCoordinates || {
                x: 0,
                y: 0,
                z: 0
            },
            stability: this.calculateCTCStability(options),
            paradoxRisk: this.calculateCTCParadoxRisk(options),
            status: 'active',
            interceptors: [],
            createdAt: Date.now()
        };
        
        this.ctcNetwork.set(ctcId, ctc);
        this.saveCTC(ctc);
        
        console.log(`⏳ CTC Created: ${ctc.name} (${ctcId})`);
        
        return ctc;
    }
    
    /**
     * Calculate CTC stability
     */
    calculateCTCStability(options) {
        // CTC stability depends on temporal distance and complexity
        const temporalDistance = Math.abs(options.exitTime - options.entryTime);
        const maxDistance = 86400000; // 24 hours
        
        // Stability decreases with temporal distance
        return Math.max(0.1, 1.0 - (temporalDistance / maxDistance));
    }
    
    /**
     * Calculate CTC paradox risk
     */
    calculateCTCParadoxRisk(options) {
        // Paradox risk increases with temporal distance and complexity
        const temporalDistance = Math.abs(options.exitTime - options.entryTime);
        const maxDistance = 86400000; // 24 hours
        
        // Paradox risk increases with temporal distance
        return Math.min(1.0, temporalDistance / maxDistance);
    }
    
    /**
     * Intercept a fleet through time
     */
    async interceptFleet(fleetId, ctcId, interceptData) {
        const ctc = this.ctcNetwork.get(ctcId);
        
        if (!ctc) {
            throw new Error('CTC not found');
        }
        
        // Record interception
        const interception = {
            id: this.generateInterceptionId(),
            fleetId: fleetId,
            ctcId: ctcId,
            interceptor: interceptData.interceptor || this.game.playerId,
            timestamp: Date.now(),
            temporalCoordinates: ctc.temporalCoordinates,
            spatialCoordinates: ctc.spatialCoordinates,
            success: false,
            paradoxes: []
        };
        
        try {
            // Attempt interception
            const success = await this.executeInterception(interception, ctc);
            interception.success = success;
            
            // Check for paradoxes
            if (success) {
                const paradoxes = this.detectParadoxes(interception);
                interception.paradoxes = paradoxes;
                
                if (paradoxes.length > 0) {
                    this.handleParadoxes(interception, paradoxes);
                }
            }
            
            // Save interception record
            await this.saveInterception(interception);
            
            console.log(`⏳ Fleet Interception: ${fleetId} via ${ctc.name} - ${success ? 'Success' : 'Failed'}`);
            
            return interception;
            
        } catch (error) {
            console.error('Interception failed:', error);
            return interception;
        }
    }
    
    /**
     * Execute the temporal interception
     */
    async executeInterception(interception, ctc) {
        // Simulate time travel mechanics
        const temporalDistance = ctc.temporalCoordinates.duration;
        const ctcStability = ctc.stability;
        const paradoxRisk = ctc.paradoxRisk;
        
        // Success probability based on CTC stability
        const successProbability = ctcStability * (1.0 - paradoxRisk * 0.5);
        
        // Roll for success
        const roll = Math.random();
        
        if (roll < successProbability) {
            // Successful interception
            return true;
        } else {
            // Failed interception
            return false;
        }
    }
    
    /**
     * Detect temporal paradoxes
     */
    detectParadoxes(interception) {
        const paradoxes = [];
        
        // Grandfather paradox: Intercepting your own past
        if (this.isGrandfatherParadox(interception)) {
            paradoxes.push({
                type: 'grandfather',
                severity: 'critical',
                description: 'Grandfather paradox detected: Intercepting past that affects your own existence'
            });
        }
        
        // Bootstrap paradox: Information without origin
        if (this.isBootstrapParadox(interception)) {
            paradoxes.push({
                type: 'bootstrap',
                severity: 'major',
                description: 'Bootstrap paradox detected: Information exists without origin'
            });
        }
        
        // Predestination paradox: Events are self-fulfilling
        if (this.isPredestinationParadox(interception)) {
            paradoxes.push({
                type: 'predestination',
                severity: 'minor',
                description: 'Predestination paradox detected: Events are self-fulfilling'
            });
        }
        
        return paradoxes;
    }
    
    /**
     * Check for grandfather paradox
     */
    isGrandfatherParadox(interception) {
        // Simplified check: Intercepting within 1 hour of own creation
        const playerCreationTime = this.game.playerCreationTime || Date.now();
        const interceptTime = interception.temporalCoordinates.entry;
        
        return Math.abs(interceptTime - playerCreationTime) < 3600000;
    }
    
    /**
     * Check for bootstrap paradox
     */
    isBootstrapParadox(interception) {
        // Simplified check: Intercepting to prevent an action that caused the interception
        return false; // Would require complex causality tracking
    }
    
    /**
     * Check for predestination paradox
     */
    isPredestinationParadox(interception) {
        // Simplified check: Intercepting to cause an event that was already known
        return false; // Would require complex causality tracking
    }
    
    /**
     * Handle detected paradoxes
     */
    handleParadoxes(interception, paradoxes) {
        for (const paradox of paradoxes) {
            switch (paradox.severity) {
                case 'critical':
                    // Critical paradox: Timeline collapse imminent
                    this.collapseTimeline(interception.ctcId);
                    break;
                    
                case 'major':
                    // Major paradox: Timeline branches
                    this.branchTimeline(interception.ctcId, interception);
                    break;
                    
                case 'minor':
                    // Minor paradox: Timeline absorbs the change
                    this.absorbParadox(interception.ctcId, paradox);
                    break;
            }
        }
    }
    
    /**
     * Collapse a timeline due to critical paradox
     */
    collapseTimeline(timelineId) {
        const timeline = this.timelines.get(timelineId);
        
        if (timeline) {
            timeline.status = 'collapsed';
            timeline.collapseReason = 'Critical temporal paradox';
            timeline.collapsedAt = Date.now();
            
            this.saveTimeline(timeline);
            
            console.log(`⏳ Timeline Collapsed: ${timeline.name} (${timelineId})`);
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('TIMELINE_COLLAPSED', {
                detail: { timeline }
            }));
        }
    }
    
    /**
     * Branch a timeline due to major paradox
     */
    branchTimeline(timelineId, interception) {
        const originTimeline = this.timelines.get(timelineId);
        
        if (originTimeline) {
            const divergencePoint = {
                timestamp: interception.timestamp,
                event: 'temporal_interception',
                description: `Fleet interception via CTC ${interception.ctcId}`,
                impact: 'timeline_branch'
            };
            
            const newTimeline = this.createBranch(timelineId, divergencePoint);
            
            console.log(`⏳ Timeline Branched: ${originTimeline.name} → ${newTimeline.name}`);
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('TIMELINE_BRANCHED', {
                detail: {
                    from: originTimeline,
                    to: newTimeline,
                    divergencePoint
                }
            }));
        }
    }
    
    /**
     * Absorb a minor paradox
     */
    absorbParadox(timelineId, paradox) {
        const timeline = this.timelines.get(timelineId);
        
        if (timeline) {
            // Increase paradox risk slightly
            timeline.paradoxRisk = Math.min(1.0, timeline.paradoxRisk + 0.05);
            timeline.stability = Math.max(0.1, timeline.stability - 0.05);
            
            this.saveTimeline(timeline);
            
            console.log(`⏳ Paradox Absorbed: ${paradox.type} in ${timeline.name}`);
        }
    }
    
    /**
     * Jump to a specific point in time
     */
    async timeJump(targetTime, options = {}) {
        const jumpId = this.generateJumpId();
        
        const jump = {
            id: jumpId,
            originTimeline: this.currentTimeline.id,
            originTime: Date.now(),
            targetTime: targetTime,
            method: options.method || 'ctc',
            ctcId: options.ctcId || null,
            traveler: options.traveler || this.game.playerId,
            success: false,
            paradoxes: [],
            createdAt: Date.now()
        };
        
        try {
            // Execute time jump
            const success = await this.executeTimeJump(jump);
            jump.success = success;
            
            if (success) {
                // Check for paradoxes
                const paradoxes = this.detectTimeJumpParadoxes(jump);
                jump.paradoxes = paradoxes;
                
                if (paradoxes.length > 0) {
                    this.handleParadoxes(jump, paradoxes);
                }
            }
            
            // Save jump record
            await this.saveTimeJump(jump);
            
            console.log(`⏳ Time Jump: ${new Date(jump.originTime).toLocaleString()} → ${new Date(jump.targetTime).toLocaleString()} - ${success ? 'Success' : 'Failed'}`);
            
            return jump;
            
        } catch (error) {
            console.error('Time jump failed:', error);
            return jump;
        }
    }
    
    /**
     * Execute time jump
     */
    async executeTimeJump(jump) {
        const temporalDistance = Math.abs(jump.targetTime - jump.originTime);
        const maxDistance = 86400000; // 24 hours
        
        // Success probability decreases with temporal distance
        const successProbability = Math.max(0.1, 1.0 - (temporalDistance / maxDistance));
        
        // Roll for success
        const roll = Math.random();
        
        if (roll < successProbability) {
            // Successful jump
            return true;
        } else {
            // Failed jump
            return false;
        }
    }
    
    /**
     * Detect time jump paradoxes
     */
    detectTimeJumpParadoxes(jump) {
        const paradoxes = [];
        
        // Check for causality violations
        if (this.isCausalityViolation(jump)) {
            paradoxes.push({
                type: 'causality',
                severity: 'major',
                description: 'Causality violation detected: Effect precedes cause'
            });
        }
        
        return paradoxes;
    }
    
    /**
     * Check for causality violation
     */
    isCausalityViolation(jump) {
        // Simplified check: Jumping to time before important events
        const importantEvents = this.getImportantEvents(jump.originTimeline);
        
        for (const event of importantEvents) {
            if (jump.targetTime < event.timestamp) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get important events in a timeline
     */
    getImportantEvents(timelineId) {
        const timeline = this.timelines.get(timelineId);
        
        if (!timeline) {
            return [];
        }
        
        // Return divergence points as important events
        return timeline.divergencePoints.map(dp => ({
            timestamp: dp.timestamp,
            event: dp.event,
            description: dp.description
        }));
    }
    
    /**
     * Switch to a different timeline
     */
    async switchTimeline(timelineId) {
        const targetTimeline = this.timelines.get(timelineId);
        
        if (!targetTimeline) {
            throw new Error('Timeline not found');
        }
        
        if (targetTimeline.status === 'collapsed') {
            throw new Error('Cannot switch to collapsed timeline');
        }
        
        // Record timeline switch
        const switchRecord = {
            from: this.currentTimeline.id,
            to: timelineId,
            timestamp: Date.now(),
            traveler: this.game.playerId
        };
        
        // Update current timeline
        this.currentTimeline = targetTimeline;
        
        // Apply timeline properties
        this.applyTimelineProperties(targetTimeline);
        
        // Save switch record
        await this.saveTimelineSwitch(switchRecord);
        
        console.log(`⏳ Timeline Switch: ${switchRecord.from} → ${switchRecord.to}`);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('TIMELINE_SWITCHED', {
            detail: {
                fromTimeline: this.timelines.get(switchRecord.from),
                toTimeline: targetTimeline,
                switchRecord
            }
        }));
        
        return switchRecord;
    }
    
    /**
     * Apply timeline properties to game
     */
    applyTimelineProperties(timeline) {
        // Apply timeline-specific effects
        if (this.game.physics) {
            // Timeline might have different physics constants
            if (timeline.physicsConstants) {
                this.game.physics.setConstants(timeline.physicsConstants);
            }
        }
        
        // Apply timeline paradox effects
        if (timeline.paradoxRisk > 0.5) {
            this.game.reality.setInstability(timeline.paradoxRisk);
        }
    }
    
    /**
     * Load timelines from server
     */
    async loadTimelines() {
        try {
            const response = await fetch('/api/timetravel/timelines');
            const data = await response.json();
            
            for (const timeline of data.timelines) {
                this.timelines.set(timeline.id, timeline);
            }
        } catch (error) {
            console.error('Failed to load timelines:', error);
        }
    }
    
    /**
     * Save timeline to server
     */
    async saveTimeline(timeline) {
        try {
            const response = await fetch('/api/timetravel/timelines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(timeline)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save timeline:', error);
            return null;
        }
    }
    
    /**
     * Save CTC to server
     */
    async saveCTC(ctc) {
        try {
            const response = await fetch('/api/timetravel/ctcs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ctc)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save CTC:', error);
            return null;
        }
    }
    
    /**
     * Save interception record
     */
    async saveInterception(interception) {
        try {
            const response = await fetch('/api/timetravel/interceptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(interception)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save interception:', error);
            return null;
        }
    }
    
    /**
     * Save time jump record
     */
    async saveTimeJump(jump) {
        try {
            const response = await fetch('/api/timetravel/jumps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jump)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save time jump:', error);
            return null;
        }
    }
    
    /**
     * Save timeline switch record
     */
    async saveTimelineSwitch(switchRecord) {
        try {
            const response = await fetch('/api/timetravel/switches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(switchRecord)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save timeline switch:', error);
            return null;
        }
    }
    
    /**
     * Get timeline by ID
     */
    getTimeline(timelineId) {
        return this.timelines.get(timelineId);
    }
    
    /**
     * Get all accessible timelines
     */
    getAccessibleTimelines() {
        return Array.from(this.timelines.values())
            .filter(timeline => timeline.status !== 'collapsed');
    }
    
    /**
     * Get current timeline info
     */
    getCurrentTimelineInfo() {
        if (!this.currentTimeline) {
            return null;
        }
        
        return {
            id: this.currentTimeline.id,
            name: this.currentTimeline.name,
            description: this.currentTimeline.description,
            divergencePoints: this.currentTimeline.diversionPoints,
            stability: this.currentTimeline.stability,
            paradoxRisk: this.currentTimeline.paradoxRisk,
            status: this.currentTimeline.status
        };
    }
    
    /**
     * Get all CTCs
     */
    getCTCs() {
        return Array.from(this.ctcNetwork.values());
    }
    
    /**
     * Start temporal monitoring
     */
    startTemporalMonitoring() {
        // Monitor for temporal anomalies every minute
        setInterval(() => {
            this.detectTemporalAnomalies();
        }, 60000);
    }
    
    /**
     * Detect temporal anomalies
     */
    detectTemporalAnomalies() {
        // Check for timeline inconsistencies
        const anomalies = [];
        
        // Check for timeline convergence
        const convergence = this.detectTimelineConvergence();
        if (convergence) {
            anomalies.push(convergence);
        }
        
        // Check for paradox accumulation
        const paradoxAccumulation = this.detectParadoxAccumulation();
        if (paradoxAccumulation) {
            anomalies.push(paradoxAccumulation);
        }
        
        if (anomalies.length > 0) {
            this.temporalAnomalies.push(...anomalies);
            console.log(`⏳ Temporal Anomalies Detected: ${anomalies.length}`);
        }
    }
    
    /**
     * Detect timeline convergence
     */
    detectTimelineConvergence() {
        // Simplified: Check if timelines are becoming too similar
        const timelines = Array.from(this.timelines.values());
        
        for (let i = 0; i < timelines.length; i++) {
            for (let j = i + 1; j < timelines.length; j++) {
                const similarity = this.calculateTimelineSimilarity(timelines[i], timelines[j]);
                
                if (similarity > 0.95) {
                    return {
                        type: 'convergence',
                        timeline1: timelines[i].id,
                        timeline2: timelines[j].id,
                        similarity: similarity
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Calculate timeline similarity
     */
    calculateTimelineSimilarity(t1, t2) {
        // Compare divergence points
        if (t1.divergencePoints.length !== t2.divergencePoints.length) {
            return 0;
        }
        
        let similarity = 1.0;
        
        for (let i = 0; i < t1.divergencePoints.length; i++) {
            const dp1 = t1.divergencePoints[i];
            const dp2 = t2.divergencePoints[i];
            
            if (dp1.timestamp !== dp2.timestamp || dp1.event !== dp2.event) {
                similarity -= 0.2;
            }
        }
        
        return Math.max(0, similarity);
    }
    
    /**
     * Detect paradox accumulation
     */
    detectParadoxAccumulation() {
        // Check if any timeline has accumulated too many paradoxes
        for (const [id, timeline] of this.timelines) {
            if (timeline.paradoxRisk > 0.8) {
                return {
                    type: 'paradox_accumulation',
                    timelineId: id,
                    risk: timeline.paradoxRisk
                };
            }
        }
        
        return null;
    }
    
    /**
     * Generate unique timeline ID
     */
    generateTimelineId() {
        return `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate timeline name
     */
    generateTimelineName() {
        const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Omega', 'Sigma', 'Tau', 'Phi'];
        const numbers = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        
        const name = names[Math.floor(Math.random() * names.length)];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        
        return `Timeline ${name}-${number}`;
    }
    
    /**
     * Generate unique CTC ID
     */
    generateCTCId() {
        return `ctc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate CTC name
     */
    generateCTCName() {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'];
        const suffixes = ['Loop', 'Curve', 'Bridge', 'Tunnel', 'Portal'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix} ${suffix}`;
    }
    
    /**
     * Generate unique interception ID
     */
    generateInterceptionId() {
        return `intercept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate unique jump ID
     */
    generateJumpId() {
        return `jump_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.TimeTravelSystem = TimeTravelSystem;
}
