/**
 * Spam Detection and Prevention
 * 
 * Implements comprehensive spam detection and prevention.
 * 
 * @module SpamDetectionPrevention
 * @version 1.0.0
 * @author Adriano To The Star
 */

class SpamDetectionPrevention {
    constructor() {
        this.spamPatterns = new Map();
        this.userBehavior = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize spam detection system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('SpamDetectionPrevention already initialized');
            return;
        }

        this.setupSpamPatterns();
        this.loadSpamPatterns();
        
        this.isInitialized = true;
        console.log('✅ Spam Detection System initialized');
    }

    /**
     * Set up spam patterns
     * @private
     */
    setupSpamPatterns() {
        // URL spam
        this.addPattern('url-spam', {
            type: 'pattern',
            pattern: /(https?:\/\/[^\s]+){3,}/gi,
            threshold: 3,
            weight: 2
        });

        // Repetitive text
        this.addPattern('repetitive', {
            type: 'pattern',
            pattern: /(.{1,20})\1{4,}/gi,
            threshold: 1,
            weight: 1.5
        });

        // All caps
        this.addPattern('all-caps', {
            type: 'pattern',
            pattern: /^[A-Z\s]{20,}$/,
            threshold: 1,
            weight: 0.5
        });

        // Excessive punctuation
        this.addPattern('excessive-punctuation', {
            type: 'pattern',
            pattern: /[!?]{3,}/g,
            threshold: 2,
            weight: 1
        });
    }

    /**
     * Add spam pattern
     * @public
     * @param {string} name - Pattern name
     * @param {Object} pattern - Pattern configuration
     * @returns {Object} Pattern object
     */
    addPattern(name, pattern) {
        const patternObj = {
            name,
            enabled: pattern.enabled !== false,
            ...pattern
        };

        this.spamPatterns.set(name, patternObj);
        this.saveSpamPatterns();

        return patternObj;
    }

    /**
     * Detect spam
     * @public
     * @param {string} content - Content to check
     * @param {Object} metadata - Content metadata
     * @returns {Object} Spam detection result
     */
    detectSpam(content, metadata = {}) {
        let spamScore = 0;
        const matches = [];

        // Check patterns
        this.spamPatterns.forEach((pattern, name) => {
            if (!pattern.enabled) {
                return;
            }

            const match = this.checkPattern(pattern, content);
            if (match) {
                matches.push(match);
                spamScore += pattern.weight || 1;
            }
        });

        // Check user behavior
        const behaviorScore = this.checkUserBehavior(metadata.userId);
        spamScore += behaviorScore;

        // Determine if spam
        const isSpam = spamScore >= 3; // Threshold

        return {
            isSpam,
            score: spamScore,
            matches,
            action: isSpam ? 'block' : (spamScore >= 2 ? 'flag' : 'allow')
        };
    }

    /**
     * Check pattern
     * @private
     * @param {Object} pattern - Pattern object
     * @param {string} content - Content
     * @returns {Object|null} Match object or null
     */
    checkPattern(pattern, content) {
        if (pattern.type === 'pattern' && pattern.pattern) {
            const matches = content.match(pattern.pattern);
            if (matches && matches.length >= (pattern.threshold || 1)) {
                return {
                    pattern: pattern.name,
                    matches: matches.length,
                    type: pattern.type
                };
            }
        }

        return null;
    }

    /**
     * Check user behavior
     * @private
     * @param {string} userId - User ID
     * @returns {number} Behavior score
     */
    checkUserBehavior(userId) {
        if (!userId) {
            return 0;
        }

        const behavior = this.userBehavior.get(userId) || {
            submissions: [],
            flagged: 0
        };

        // Check submission frequency
        const now = Date.now();
        const recentSubmissions = behavior.submissions.filter(
            time => now - time < 60 * 1000 // Last minute
        );

        if (recentSubmissions.length > 10) {
            return 2; // High frequency
        }

        // Check flagged history
        if (behavior.flagged > 5) {
            return 1.5; // Previously flagged
        }

        return 0;
    }

    /**
     * Record submission
     * @public
     * @param {string} userId - User ID
     * @param {boolean} wasSpam - Whether it was spam
     */
    recordSubmission(userId, wasSpam = false) {
        if (!userId) {
            return;
        }

        if (!this.userBehavior.has(userId)) {
            this.userBehavior.set(userId, {
                submissions: [],
                flagged: 0
            });
        }

        const behavior = this.userBehavior.get(userId);
        behavior.submissions.push(Date.now());

        // Keep only last 100 submissions
        if (behavior.submissions.length > 100) {
            behavior.submissions.shift();
        }

        if (wasSpam) {
            behavior.flagged++;
        }

        this.saveUserBehavior();
    }

    /**
     * Block user
     * @public
     * @param {string} userId - User ID
     * @param {string} reason - Block reason
     */
    blockUser(userId, reason) {
        const behavior = this.userBehavior.get(userId) || {
            submissions: [],
            flagged: 0
        };

        behavior.blocked = true;
        behavior.blockReason = reason;
        behavior.blockedAt = new Date().toISOString();

        this.userBehavior.set(userId, behavior);
        this.saveUserBehavior();
    }

    /**
     * Is user blocked
     * @public
     * @param {string} userId - User ID
     * @returns {boolean} True if blocked
     */
    isUserBlocked(userId) {
        const behavior = this.userBehavior.get(userId);
        return behavior?.blocked === true;
    }

    /**
     * Save spam patterns
     * @private
     */
    saveSpamPatterns() {
        try {
            const patterns = Object.fromEntries(this.spamPatterns);
            localStorage.setItem('spam-patterns', JSON.stringify(patterns));
        } catch (e) {
            console.warn('Failed to save spam patterns:', e);
        }
    }

    /**
     * Load spam patterns
     * @private
     */
    loadSpamPatterns() {
        try {
            const saved = localStorage.getItem('spam-patterns');
            if (saved) {
                const patterns = JSON.parse(saved);
                Object.entries(patterns).forEach(([name, pattern]) => {
                    this.spamPatterns.set(name, pattern);
                });
            }
        } catch (e) {
            console.warn('Failed to load spam patterns:', e);
        }
    }

    /**
     * Save user behavior
     * @private
     */
    saveUserBehavior() {
        try {
            const behavior = Object.fromEntries(this.userBehavior);
            localStorage.setItem('spam-user-behavior', JSON.stringify(behavior));
        } catch (e) {
            console.warn('Failed to save user behavior:', e);
        }
    }
}

// Create global instance
window.SpamDetectionPrevention = SpamDetectionPrevention;
window.spamDetection = new SpamDetectionPrevention();
window.spamDetection.init();

