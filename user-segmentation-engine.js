/**
 * User Segmentation Engine
 * Advanced user segmentation based on behavior, demographics, and preferences
 */

class UserSegmentationEngine {
    constructor() {
        this.segments = new Map();
        this.userSegments = new Map(); // userId -> [segmentIds]
        this.segmentRules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('u_se_rs_eg_me_nt_at_io_ne_ng_in_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("u_se_rs_eg_me_nt_at_io_ne_ng_in_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createSegment(segmentId, name, description, rules) {
        this.segments.set(segmentId, {
            id: segmentId,
            name,
            description,
            rules,
            userCount: 0,
            createdAt: new Date()
        });
        this.segmentRules.set(segmentId, rules);
        console.log(`Segment created: ${segmentId}`);
    }

    assignUserToSegment(userId, segmentId) {
        if (!this.segments.has(segmentId)) {
            throw new Error('Segment does not exist');
        }
        
        const userSegments = this.userSegments.get(userId) || [];
        if (!userSegments.includes(segmentId)) {
            userSegments.push(segmentId);
            this.userSegments.set(userId, userSegments);
            
            const segment = this.segments.get(segmentId);
            segment.userCount++;
            console.log(`User ${userId} assigned to segment ${segmentId}`);
        }
    }

    removeUserFromSegment(userId, segmentId) {
        const userSegments = this.userSegments.get(userId) || [];
        const index = userSegments.indexOf(segmentId);
        if (index > -1) {
            userSegments.splice(index, 1);
            this.userSegments.set(userId, userSegments);
            
            const segment = this.segments.get(segmentId);
            segment.userCount--;
            console.log(`User ${userId} removed from segment ${segmentId}`);
        }
    }

    getUserSegments(userId) {
        return this.userSegments.get(userId) || [];
    }

    getSegmentUsers(segmentId) {
        const users = [];
        for (const [userId, segments] of this.userSegments.entries()) {
            if (segments.includes(segmentId)) {
                users.push(userId);
            }
        }
        return users;
    }

    evaluateUser(userId, userData) {
        const matchedSegments = [];
        for (const [segmentId, rules] of this.segmentRules.entries()) {
            if (this.evaluateRules(userData, rules)) {
                this.assignUserToSegment(userId, segmentId);
                matchedSegments.push(segmentId);
            }
        }
        return matchedSegments;
    }

    evaluateRules(userData, rules) {
        // Evaluate segmentation rules
        for (const rule of rules) {
            if (!this.evaluateRule(userData, rule)) {
                return false;
            }
        }
        return true;
    }

    evaluateRule(userData, rule) {
        const { field, operator, value } = rule;
        const userValue = userData[field];
        
        switch (operator) {
            case 'equals':
                return userValue === value;
            case 'not_equals':
                return userValue !== value;
            case 'greater_than':
                return userValue > value;
            case 'less_than':
                return userValue < value;
            case 'contains':
                return userValue && userValue.includes(value);
            case 'in':
                return value.includes(userValue);
            default:
                return false;
        }
    }

    getSegmentStats(segmentId) {
        const segment = this.segments.get(segmentId);
        if (!segment) {
            throw new Error('Segment does not exist');
        }
        return {
            id: segment.id,
            name: segment.name,
            userCount: segment.userCount,
            createdAt: segment.createdAt
        };
    }

    getAllSegments() {
        return Array.from(this.segments.values());
    }
}

if (typeof window !== 'undefined') {
    window.userSegmentationEngine = new UserSegmentationEngine();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserSegmentationEngine;
}

