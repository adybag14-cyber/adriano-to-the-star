/**
 * Fraud Detection
 * Detects fraudulent activity
 */

class FraudDetection {
    constructor() {
        this.patterns = {};
        this.init();
    }
    
    init() {
        this.loadFraudPatterns();
    }
    
    loadFraudPatterns() {
        // Load fraud detection patterns
        this.patterns = {
            rapidActions: { threshold: 100, window: 60000 }, // 100 actions per minute
            impossibleLocation: { threshold: 1000 }, // 1000km in short time
            suspiciousPatterns: ['bot', 'scraper', 'automated']
        };
    }
    
    async detectFraud(userId, activity) {
        // Detect fraudulent activity
        const fraudSignals = [];
        
        // Check rapid actions
        if (activity.actionsPerMinute > this.patterns.rapidActions.threshold) {
            fraudSignals.push({
                type: 'rapid_actions',
                severity: 'high',
                reason: `Unusually high action rate: ${activity.actionsPerMinute}/min`
            });
        }
        
        // Check location changes
        if (activity.impossibleLocation) {
            fraudSignals.push({
                type: 'impossible_location',
                severity: 'high',
                reason: 'Impossible location change detected'
            });
        }
        
        // Check user agent
        if (this.patterns.suspiciousPatterns.some(pattern => 
            navigator.userAgent.toLowerCase().includes(pattern)
        )) {
            fraudSignals.push({
                type: 'suspicious_agent',
                severity: 'medium',
                reason: 'Suspicious user agent detected'
            });
        }
        
        return {
            isFraud: fraudSignals.length > 0,
            signals: fraudSignals,
            riskScore: this.calculateRiskScore(fraudSignals)
        };
    }
    
    calculateRiskScore(signals) {
        // Calculate fraud risk score
        let score = 0;
        
        signals.forEach(signal => {
            if (signal.severity === 'high') {
                score += 30;
            } else if (signal.severity === 'medium') {
                score += 15;
            }
        });
        
        return Math.min(100, score);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.fraudDetection = new FraudDetection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FraudDetection;
}

