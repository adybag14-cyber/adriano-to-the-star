/**
 * Content Moderation System
 * 
 * Adds comprehensive content moderation system.
 * 
 * @module ContentModerationSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ContentModerationSystem {
    constructor() {
        this.moderationRules = new Map();
        this.flaggedContent = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize content moderation system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('ContentModerationSystem already initialized');
            return;
        }

        this.setupDefaultRules();
        this.loadModerationRules();
        this.loadFlaggedContent();

        this.isInitialized = true;
        this.trackEvent('content_mod_sys_initialized');
    }

    /**
     * Set up default rules
     * @private
     */
    setupDefaultRules() {
        // Profanity filter
        this.addRule('profanity', {
            type: 'keyword',
            keywords: ['badword1', 'badword2'], // Would be a comprehensive list
            action: 'flag',
            severity: 'medium'
        });

        // Spam detection
        this.addRule('spam', {
            type: 'pattern',
            // eslint-disable-next-line security/detect-unsafe-regex
            pattern: /(https?:\/\/[^\s]+){3,}/gi, // Multiple URLs
            action: 'flag',
            severity: 'high'
        });

        // Length check
        this.addRule('length', {
            type: 'length',
            minLength: 10,
            maxLength: 10000,
            action: 'flag',
            severity: 'low'
        });
    }

    /**
     * Add moderation rule
     * @public
     * @param {string} name - Rule name
     * @param {Object} rule - Rule configuration
     * @returns {Object} Rule object
     */
    addRule(name, rule) {
        const ruleObj = {
            name,
            enabled: rule.enabled !== false,
            ...rule
        };

        this.moderationRules.set(name, ruleObj);
        this.saveModerationRules();

        return ruleObj;
    }

    /**
     * Moderate content
     * @public
     * @param {string} content - Content to moderate
     * @param {Object} metadata - Content metadata
     * @returns {Object} Moderation result
     */
    moderateContent(content, metadata = {}) {
        const issues = [];
        let severity = 'low';
        let action = 'allow';

        this.moderationRules.forEach((rule, name) => {
            if (!rule.enabled) {
                return;
            }

            const issue = this.checkRule(rule, content, metadata);
            if (issue) {
                issues.push(issue);

                // Update severity to highest
                if (this.getSeverityLevel(rule.severity) > this.getSeverityLevel(severity)) {
                    severity = rule.severity;
                }
            }
        });

        // Determine action based on issues
        if (issues.length > 0) {
            if (severity === 'high') {
                action = 'block';
            } else if (severity === 'medium') {
                action = 'flag';
            } else {
                action = 'review';
            }
        }

        const result = {
            allowed: action === 'allow',
            action,
            severity,
            issues,
            content,
            metadata
        };

        // Flag content if needed
        if (action === 'flag' || action === 'block') {
            this.flagContent(content, result);
        }

        return result;
    }

    /**
     * Check rule
     * @private
     * @param {Object} rule - Rule object
     * @param {string} content - Content
     * @param {Object} metadata - Metadata
     * @returns {Object|null} Issue object or null
     */
    checkRule(rule, content, metadata) {
        switch (rule.type) {
            case 'keyword':
                return this.checkKeywords(rule, content);
            case 'pattern':
                return this.checkPattern(rule, content);
            case 'length':
                return this.checkLength(rule, content);
            default:
                return null;
        }
    }

    /**
     * Check keywords
     * @private
     * @param {Object} rule - Rule object
     * @param {string} content - Content
     * @returns {Object|null} Issue or null
     */
    checkKeywords(rule, content) {
        const contentLower = content.toLowerCase();
        const found = rule.keywords.filter(keyword =>
            contentLower.includes(keyword.toLowerCase())
        );

        if (found.length > 0) {
            return {
                rule: rule.name,
                type: 'keyword',
                found: found,
                message: `Found prohibited keywords: ${found.join(', ')}`
            };
        }

        return null;
    }

    /**
     * Check pattern
     * @private
     * @param {Object} rule - Rule object
     * @param {string} content - Content
     * @returns {Object|null} Issue or null
     */
    checkPattern(rule, content) {
        if (rule.pattern.test(content)) {
            return {
                rule: rule.name,
                type: 'pattern',
                message: `Content matches prohibited pattern: ${rule.name}`
            };
        }

        return null;
    }

    /**
     * Check length
     * @private
     * @param {Object} rule - Rule object
     * @param {string} content - Content
     * @returns {Object|null} Issue or null
     */
    checkLength(rule, content) {
        const length = content.length;

        if (rule.minLength && length < rule.minLength) {
            return {
                rule: rule.name,
                type: 'length',
                message: `Content too short (${length} < ${rule.minLength})`
            };
        }

        if (rule.maxLength && length > rule.maxLength) {
            return {
                rule: rule.name,
                type: 'length',
                message: `Content too long (${length} > ${rule.maxLength})`
            };
        }

        return null;
    }

    /**
     * Get severity level
     * @private
     * @param {string} severity - Severity string
     * @returns {number} Severity level
     */
    getSeverityLevel(severity) {
        const levels = { low: 1, medium: 2, high: 3 };
        return levels[severity] || 1;
    }

    /**
     * Flag content
     * @private
     * @param {string} content - Content
     * @param {Object} result - Moderation result
     */
    flagContent(content, result) {
        const flag = {
            id: Date.now() + Math.random(),
            content,
            result,
            flaggedAt: new Date().toISOString(),
            status: 'pending'
        };

        this.flaggedContent.set(flag.id, flag);
        this.saveFlaggedContent();
    }

    /**
     * Get flagged content
     * @public
     * @returns {Array} Flagged content array
     */
    getFlaggedContent() {
        return Array.from(this.flaggedContent.values())
            .sort((a, b) => new Date(b.flaggedAt) - new Date(a.flaggedAt));
    }

    /**
     * Resolve flag
     * @public
     * @param {string} flagId - Flag ID
     * @param {string} action - Resolution action
     * @returns {boolean} True if resolved
     */
    resolveFlag(flagId, action) {
        const flag = this.flaggedContent.get(flagId);
        if (!flag) {
            return false;
        }

        flag.status = action;
        flag.resolvedAt = new Date().toISOString();
        this.saveFlaggedContent();

        return true;
    }

    /**
     * Save moderation rules
     * @private
     */
    saveModerationRules() {
        try {
            const rules = Object.fromEntries(this.moderationRules);
            localStorage.setItem('moderation-rules', JSON.stringify(rules));
        } catch (e) {
            console.warn('Failed to save moderation rules:', e);
        }
    }

    /**
     * Load moderation rules
     * @private
     */
    loadModerationRules() {
        try {
            const saved = localStorage.getItem('moderation-rules');
            if (saved) {
                const rules = JSON.parse(saved);
                Object.entries(rules).forEach(([name, rule]) => {
                    this.moderationRules.set(name, rule);
                });
            }
        } catch (e) {
            console.warn('Failed to load moderation rules:', e);
        }
    }

    /**
     * Save flagged content
     * @private
     */
    saveFlaggedContent() {
        try {
            const flagged = Object.fromEntries(this.flaggedContent);
            localStorage.setItem('flagged-content', JSON.stringify(flagged));
        } catch (e) {
            console.warn('Failed to save flagged content:', e);
        }
    }

    /**
     * Load flagged content
     * @private
     */
    loadFlaggedContent() {
        try {
            const saved = localStorage.getItem('flagged-content');
            if (saved) {
                const flagged = JSON.parse(saved);
                Object.entries(flagged).forEach(([key, value]) => {
                    this.flaggedContent.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load flagged content:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_mod_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.ContentModerationSystem = ContentModerationSystem;
window.contentModeration = new ContentModerationSystem();
window.contentModeration.init();

