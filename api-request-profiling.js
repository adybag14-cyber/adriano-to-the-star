/**
 * API Request Profiling
 * Profile API request performance
 */

class APIRequestProfiling {
    constructor() {
        this.profiles = new Map();
        this.profilingEnabled = false;
        this.init();
    }

    init() {
        this.trackEvent('profiling_initialized');
    }

    enableProfiling() {
        this.profilingEnabled = true;
        console.log('Profiling enabled');
    }

    disableProfiling() {
        this.profilingEnabled = false;
        console.log('Profiling disabled');
    }

    startProfile(requestId, endpoint) {
        if (!this.profilingEnabled) {
            return null;
        }
        
        const profile = {
            id: requestId,
            endpoint,
            startTime: Date.now(),
            endTime: null,
            duration: null,
            operations: [],
            memory: {
                start: this.getMemoryUsage(),
                end: null,
                peak: null
            },
            createdAt: new Date()
        };
        
        this.profiles.set(requestId, profile);
        console.log(`Profile started: ${requestId}`);
        return profile;
    }

    recordOperation(requestId, operation, duration, metadata = {}) {
        if (!this.profilingEnabled) {
            return;
        }
        
        const profile = this.profiles.get(requestId);
        if (!profile) {
            return;
        }
        
        profile.operations.push({
            operation,
            duration,
            metadata,
            timestamp: Date.now()
        });
        
        // Update peak memory
        const currentMemory = this.getMemoryUsage();
        if (!profile.memory.peak || currentMemory > profile.memory.peak) {
            profile.memory.peak = currentMemory;
        }
    }

    endProfile(requestId) {
        if (!this.profilingEnabled) {
            return null;
        }
        
        const profile = this.profiles.get(requestId);
        if (!profile) {
            return null;
        }
        
        profile.endTime = Date.now();
        profile.duration = profile.endTime - profile.startTime;
        profile.memory.end = this.getMemoryUsage();
        
        console.log(`Profile ended: ${requestId}, duration: ${profile.duration}ms`);
        return profile;
    }

    getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    getProfile(requestId) {
        return this.profiles.get(requestId);
    }

    analyzeProfile(requestId) {
        const profile = this.profiles.get(requestId);
        if (!profile) {
            return null;
        }
        
        const operations = profile.operations;
        const totalOpTime = operations.reduce((sum, op) => sum + op.duration, 0);
        const overhead = profile.duration - totalOpTime;
        
        const slowestOps = [...operations]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);
        
        return {
            totalDuration: profile.duration,
            operationsCount: operations.length,
            totalOperationsTime: totalOpTime,
            overhead: overhead,
            overheadPercent: profile.duration > 0 ? (overhead / profile.duration * 100).toFixed(2) + '%' : '0%',
            slowestOperations: slowestOps,
            memoryUsage: {
                start: profile.memory.start,
                end: profile.memory.end,
                peak: profile.memory.peak,
                delta: profile.memory.end - profile.memory.start
            }
        };
    }

    getAllProfiles() {
        return Array.from(this.profiles.values());
    }

    clearProfiles() {
        this.profiles.clear();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`profiling_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestProfiling = new APIRequestProfiling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestProfiling;
}

