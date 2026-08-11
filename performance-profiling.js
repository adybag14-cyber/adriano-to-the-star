/**
 * Performance Profiling
 * Code performance profiling and analysis
 */

class PerformanceProfiling {
    constructor() {
        this.profiles = new Map();
        this.sessions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_er_fo_rm_an_ce_pr_of_il_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_er_fo_rm_an_ce_pr_of_il_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    startProfile(sessionId, sessionData) {
        const session = {
            id: sessionId,
            ...sessionData,
            name: sessionData.name || sessionId,
            functions: [],
            startTime: Date.now(),
            status: 'running',
            createdAt: new Date()
        };
        
        this.sessions.set(sessionId, session);
        console.log(`Profiling session started: ${sessionId}`);
        return session;
    }

    recordFunctionCall(sessionId, functionName, duration, metadata = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const call = {
            functionName,
            duration,
            callCount: 1,
            totalDuration: duration,
            minDuration: duration,
            maxDuration: duration,
            ...metadata,
            timestamp: Date.now()
        };
        
        const existing = session.functions.find(f => f.functionName === functionName);
        if (existing) {
            existing.callCount++;
            existing.totalDuration += duration;
            existing.minDuration = Math.min(existing.minDuration, duration);
            existing.maxDuration = Math.max(existing.maxDuration, duration);
        } else {
            session.functions.push(call);
        }
        
        return call;
    }

    stopProfile(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        session.status = 'completed';
        
        const profile = {
            id: `profile_${Date.now()}`,
            sessionId,
            ...session,
            analyzedAt: new Date(),
            createdAt: new Date()
        };
        
        this.profiles.set(profile.id, profile);
        
        return profile;
    }

    getHotFunctions(sessionId, limit = 10) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const functions = session.functions.map(f => ({
            ...f,
            avgDuration: f.totalDuration / f.callCount,
            percentage: (f.totalDuration / session.duration) * 100
        }));
        
        return functions
            .sort((a, b) => b.totalDuration - a.totalDuration)
            .slice(0, limit);
    }

    getProfile(profileId) {
        return this.profiles.get(profileId);
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.performanceProfiling = new PerformanceProfiling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceProfiling;
}


