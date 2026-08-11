/**
 * LaaS
 * Logging as a Service
 */

class LaaS {
    constructor() {
        this.logGroups = new Map();
        this.logs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_aa_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_aa_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createLogGroup(groupId, groupData) {
        const group = {
            id: groupId,
            ...groupData,
            name: groupData.name || groupId,
            retention: groupData.retention || 30,
            logs: [],
            createdAt: new Date()
        };
        
        this.logGroups.set(groupId, group);
        console.log(`Log group created: ${groupId}`);
        return group;
    }

    writeLog(groupId, logData) {
        const group = this.logGroups.get(groupId);
        if (!group) {
            throw new Error('Log group not found');
        }
        
        const log = {
            id: `log_${Date.now()}`,
            groupId,
            ...logData,
            message: logData.message || '',
            level: logData.level || 'info',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.logs.set(log.id, log);
        group.logs.push(log.id);
        
        return log;
    }

    queryLogs(groupId, filters = {}) {
        const group = this.logGroups.get(groupId);
        if (!group) {
            throw new Error('Log group not found');
        }
        
        let logs = group.logs.map(id => this.logs.get(id)).filter(Boolean);
        
        if (filters.level) {
            logs = logs.filter(l => l.level === filters.level);
        }
        
        if (filters.startTime) {
            logs = logs.filter(l => l.timestamp >= filters.startTime);
        }
        
        if (filters.endTime) {
            logs = logs.filter(l => l.timestamp <= filters.endTime);
        }
        
        return logs.sort((a, b) => b.timestamp - a.timestamp);
    }

    getLogGroup(groupId) {
        return this.logGroups.get(groupId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.laas = new LaaS();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaaS;
}

