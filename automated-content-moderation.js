/**
 * Automated Content Moderation
 * AI-powered content moderation system
 */

class AutomatedContentModeration {
    constructor() {
        this.moderationRules = {};
        this.init();
    }
    
    init() {
        this.loadModerationRules();
        this.trackEvent('content_mod_initialized');
    }
    
    loadModerationRules() {
        this.moderationRules = {
            profanity: ['bad', 'word', 'list'], // Simplified
            spam: {
                patterns: [
                    /(buy|sell|cheap|discount).{0,20}(now|today|click)/gi,
                    /(http|www\.).{0,10}(com|net|org)/gi
                ]
            },
            toxicity: {
                threshold: 0.7
            }
        };
    }
    
    async moderateContent(content, contentType = 'text') {
        // Moderate content
        const checks = {
            profanity: this.checkProfanity(content),
            spam: this.checkSpam(content),
            toxicity: await this.checkToxicity(content),
            inappropriate: this.checkInappropriate(content)
        };
        
        const score = this.calculateModerationScore(checks);
        const action = this.determineAction(score, checks);
        
        return {
            approved: action === 'approve',
            action,
            score,
            checks,
            reason: this.getReason(checks)
        };
    }
    
    checkProfanity(content) {
        // Check for profanity
        const lowerContent = content.toLowerCase();
        const found = this.moderationRules.profanity.some(word => 
            lowerContent.includes(word)
        );
        
        return {
            flagged: found,
            severity: found ? 'medium' : 'none'
        };
    }
    
    checkSpam(content) {
        // Check for spam patterns
        let flagged = false;
        let matches = 0;
        
        this.moderationRules.spam.patterns.forEach(pattern => {
            if (pattern.test(content)) {
                flagged = true;
                matches++;
            }
        });
        
        return {
            flagged,
            severity: matches > 2 ? 'high' : matches > 0 ? 'medium' : 'none',
            matches
        };
    }
    
    async checkToxicity(content) {
        // Check toxicity (simplified sentiment analysis)
        const negativeWords = ['hate', 'stupid', 'idiot', 'worst', 'terrible'];
        const lowerContent = content.toLowerCase();
        const negativeCount = negativeWords.filter(word => 
            lowerContent.includes(word)
        ).length;
        
        const toxicityScore = negativeCount / negativeWords.length;
        
        return {
            flagged: toxicityScore > this.moderationRules.toxicity.threshold,
            score: toxicityScore,
            severity: toxicityScore > 0.8 ? 'high' : toxicityScore > 0.5 ? 'medium' : 'low'
        };
    }
    
    checkInappropriate(content) {
        // Check for inappropriate content
        const inappropriatePatterns = [
            /violence|weapon|attack/gi,
            /drug|illegal/gi
        ];
        
        let flagged = false;
        inappropriatePatterns.forEach(pattern => {
            if (pattern.test(content)) {
                flagged = true;
            }
        });
        
        return {
            flagged,
            severity: flagged ? 'high' : 'none'
        };
    }
    
    calculateModerationScore(checks) {
        // Calculate overall moderation score (0-1, higher = worse)
        let score = 0;
        
        if (checks.profanity.flagged) score += 0.3;
        if (checks.spam.flagged) score += 0.3;
        if (checks.toxicity.flagged) score += checks.toxicity.score * 0.3;
        if (checks.inappropriate.flagged) score += 0.4;
        
        return Math.min(1, score);
    }
    
    determineAction(score, checks) {
        if (score > 0.7 || checks.inappropriate.flagged) {
            return 'reject';
        } else if (score > 0.4) {
            return 'review';
        }
        return 'approve';
    }
    
    getReason(checks) {
        const reasons = [];
        
        if (checks.profanity.flagged) reasons.push('Profanity detected');
        if (checks.spam.flagged) reasons.push('Spam detected');
        if (checks.toxicity.flagged) reasons.push('Toxic content');
        if (checks.inappropriate.flagged) reasons.push('Inappropriate content');
        
        return reasons.join(', ') || 'Content approved';
    }
    
    async moderateImage(imageUrl) {
        // Moderate image content
        // Would use image recognition API
        return {
            approved: true,
            action: 'approve',
            score: 0.1,
            checks: {
                explicit: { flagged: false },
                violence: { flagged: false }
            }
        };
    }
    
    async moderateBatch(contentList) {
        // Moderate multiple content items
        return await Promise.all(
            contentList.map(content => this.moderateContent(content))
        );
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_mod_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.automatedContentModeration = new AutomatedContentModeration(); });
} else {
    window.automatedContentModeration = new AutomatedContentModeration();
}

