/**
 * Security Awareness Program
 * Security awareness program management
 */

class SecurityAwarenessProgram {
    constructor() {
        this.programs = new Map();
        this.participants = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('sec_awareness_prog_initialized');
        return { success: true, message: 'Security Awareness Program initialized' };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sec_awareness_prog_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    createProgram(name, objectives, activities) {
        if (!Array.isArray(objectives) || !Array.isArray(activities)) {
            throw new Error('Objectives and activities must be arrays');
        }
        const program = {
            id: Date.now().toString(),
            name,
            objectives,
            activities,
            createdAt: new Date()
        };
        this.programs.set(program.id, program);
        return program;
    }

    enrollParticipant(userId, programId) {
        const program = this.programs.get(programId);
        if (!program) {
            throw new Error('Program not found');
        }
        const participation = {
            id: Date.now().toString(),
            userId,
            programId,
            enrolledAt: new Date()
        };
        this.participants.set(participation.id, participation);
        return participation;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityAwarenessProgram;
}

