/**
 * 🌟 Era III: Citizen Science Integration - TESS/Kepler Data Processing
 * 
 * Processes real astronomical data from NASA's TESS and Kepler telescopes
 * through engaging game mechanics, contributing to actual scientific research.
 */

class CitizenScienceSystem {
    constructor(game) {
        this.game = game;
        this.activeTasks = [];
        this.completedTasks = [];
        this.contributionScore = 0;
        this.discoveries = [];
        
        // TESS/Kepler data sources
        this.dataSources = {
            tess: 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI',
            kepler: 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI'
        };
        
        console.log("🌟 Citizen Science System: Initializing real astronomical data processing...");
    }
    
    /**
     * Fetches transit light curve data for a specific exoplanet candidate
     */
    async fetchLightCurve(keplerId) {
        try {
            const response = await fetch(
                `${this.dataSources.kepler}?table=koi&format=json&where=kepoi_name='${keplerId}'`
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch light curve data:', error);
            return null;
        }
    }
    
    /**
     * Creates a data processing task for the player
     */
    createProcessingTask(taskType, difficulty = 'medium') {
        const task = {
            id: this.generateTaskId(),
            type: taskType,
            difficulty: difficulty,
            status: 'pending',
            data: null,
            reward: this.calculateReward(difficulty),
            createdAt: Date.now()
        };
        
        this.activeTasks.push(task);
        return task;
    }
    
    /**
     * Task: Transit Detection - Identify exoplanets by analyzing light curves
     */
    async createTransitDetectionTask(keplerId) {
        const task = this.createProcessingTask('transit_detection', 'medium');
        
        // Fetch real light curve data
        const lightCurveData = await this.fetchLightCurve(keplerId);
        
        if (lightCurveData && lightCurveData.length > 0) {
            task.data = {
                keplerId: keplerId,
                lightCurve: this.processLightCurve(lightCurveData[0]),
                expectedPeriod: lightCurveData[0].koi_period,
                expectedRadius: lightCurveData[0].koi_prad
            };
            task.status = 'ready';
        }
        
        return task;
    }
    
    /**
     * Task: Period Validation - Confirm orbital periods
     */
    async createPeriodValidationTask(keplerId) {
        const task = this.createProcessingTask('period_validation', 'easy');
        
        const lightCurveData = await this.fetchLightCurve(keplerId);
        
        if (lightCurveData && lightCurveData.length > 0) {
            task.data = {
                keplerId: keplerId,
                observedPeriod: lightCurveData[0].koi_period,
                uncertainty: lightCurveData[0].koi_period_err1,
                confidenceLevel: lightCurveData[0].koi_period_err2
            };
            task.status = 'ready';
        }
        
        return task;
    }
    
    /**
     * Task: Radius Estimation - Calculate planet size from transit depth
     */
    async createRadiusEstimationTask(keplerId) {
        const task = this.createProcessingTask('radius_estimation', 'hard');
        
        const lightCurveData = await this.fetchLightCurve(keplerId);
        
        if (lightCurveData && lightCurveData.length > 0) {
            task.data = {
                keplerId: keplerId,
                starRadius: lightCurveData[0].koi_srad,
                transitDepth: lightCurveData[0].koi_depth,
                stellarTemp: lightCurveData[0].koi_steff
            };
            task.status = 'ready';
        }
        
        return task;
    }
    
    /**
     * Process raw light curve data into game-usable format
     */
    processLightCurve(rawData) {
        return {
            keplerId: rawData.kepoi_name,
            period: rawData.koi_period,
            radius: rawData.koi_prad,
            equilibriumTemp: rawData.koi_teq,
            stellarMass: rawData.koi_smass,
            stellarRadius: rawData.koi_srad,
            stellarTemp: rawData.koi_steff,
            discoveryMethod: rawData.koi_disposition,
            confidence: rawData.koi_score
        };
    }
    
    /**
     * Submit player's analysis for validation
     */
    async submitAnalysis(taskId, playerResult) {
        const task = this.activeTasks.find(t => t.id === taskId);
        
        if (!task) {
            throw new Error('Task not found');
        }
        
        // Calculate accuracy based on expected values
        const accuracy = this.calculateAccuracy(task, playerResult);
        
        // Update task status
        task.status = 'completed';
        task.playerResult = playerResult;
        task.accuracy = accuracy;
        task.completedAt = Date.now();
        
        // Update contribution score
        this.contributionScore += this.calculateContributionPoints(accuracy, task.difficulty);
        
        // Move to completed tasks
        this.completedTasks.push(task);
        this.activeTasks = this.activeTasks.filter(t => t.id !== taskId);
        
        // Check for discovery
        if (accuracy > 0.95) {
            this.recordDiscovery(task);
        }
        
        return {
            success: true,
            accuracy: accuracy,
            reward: task.reward * accuracy,
            contributionPoints: this.calculateContributionPoints(accuracy, task.difficulty)
        };
    }
    
    /**
     * Calculate accuracy of player's analysis
     */
    calculateAccuracy(task, playerResult) {
        let accuracy = 0;
        
        switch (task.type) {
            case 'transit_detection':
                // Compare detected period with expected
                const periodDiff = Math.abs(playerResult.period - task.data.expectedPeriod);
                accuracy = Math.max(0, 1 - (periodDiff / task.data.expectedPeriod));
                break;
                
            case 'period_validation':
                // Compare validated period
                const validationDiff = Math.abs(playerResult.period - task.data.observedPeriod);
                accuracy = Math.max(0, 1 - (validationDiff / task.data.observedPeriod));
                break;
                
            case 'radius_estimation':
                // Compare estimated radius
                const radiusDiff = Math.abs(playerResult.radius - task.data.expectedRadius);
                accuracy = Math.max(0, 1 - (radiusDiff / task.data.expectedRadius));
                break;
        }
        
        return accuracy;
    }
    
    /**
     * Calculate reward based on difficulty
     */
    calculateReward(difficulty) {
        const rewards = {
            'easy': 100,
            'medium': 250,
            'hard': 500
        };
        return rewards[difficulty] || 100;
    }
    
    /**
     * Calculate contribution points for scientific impact
     */
    calculateContributionPoints(accuracy, difficulty) {
        const basePoints = {
            'easy': 10,
            'medium': 25,
            'hard': 50
        };
        return Math.floor(basePoints[difficulty] * accuracy);
    }
    
    /**
     * Record a scientific discovery
     */
    recordDiscovery(task) {
        const discovery = {
            id: this.generateTaskId(),
            taskId: task.id,
            type: task.type,
            keplerId: task.data.keplerId,
            accuracy: task.accuracy,
            discoveredAt: Date.now(),
            scientificValue: this.calculateScientificValue(task)
        };
        
        this.discoveries.push(discovery);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('SCIENTIFIC_DISCOVERY', {
            detail: discovery
        }));
        
        console.log(`🌟 Scientific Discovery: ${discovery.keplerId} (${discovery.type})`);
    }
    
    /**
     * Calculate scientific value of a discovery
     */
    calculateScientificValue(task) {
        // Value based on accuracy, difficulty, and data quality
        return Math.floor(task.accuracy * this.calculateReward(task.difficulty) * 1.5);
    }
    
    /**
     * Get player's contribution statistics
     */
    getContributionStats() {
        return {
            totalScore: this.contributionScore,
            tasksCompleted: this.completedTasks.length,
            discoveries: this.discoveries.length,
            averageAccuracy: this.completedTasks.length > 0
                ? this.completedTasks.reduce((sum, t) => sum + t.accuracy, 0) / this.completedTasks.length
                : 0,
            scientificImpact: this.discoveries.reduce((sum, d) => sum + d.scientificValue, 0)
        };
    }
    
    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get leaderboard of top contributors
     */
    async getLeaderboard() {
        // This would fetch from the Cloudflare API
        try {
            const response = await fetch('/api/citizen-science/leaderboard');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return [];
        }
    }
    
    /**
     * Sync player's contributions to the cloud
     */
    async syncContributions() {
        const stats = this.getContributionStats();
        
        try {
            const response = await fetch('/api/citizen-science/contributions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: this.game.playerId,
                    stats: stats,
                    completedTasks: this.completedTasks,
                    discoveries: this.discoveries
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to sync contributions:', error);
            return null;
        }
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.CitizenScienceSystem = CitizenScienceSystem;
}
