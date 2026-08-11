/**
 * Course Scheduling
 * @class CourseScheduling
 * @description Manages course scheduling with time slots and availability.
 */
class CourseScheduling {
    constructor() {
        this.schedules = new Map();
        this.sessions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('course_sched_initialized');
    }

    /**
     * Create schedule.
     * @param {string} courseId - Course identifier.
     * @param {object} scheduleData - Schedule data.
     */
    createSchedule(courseId, scheduleData) {
        this.schedules.set(courseId, {
            courseId,
            sessions: scheduleData.sessions || [],
            timezone: scheduleData.timezone || 'UTC',
            createdAt: new Date()
        });
        console.log(`Schedule created for course ${courseId}`);
    }

    /**
     * Add session.
     * @param {string} courseId - Course identifier.
     * @param {object} sessionData - Session data.
     */
    addSession(courseId, sessionData) {
        const schedule = this.schedules.get(courseId);
        if (schedule) {
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.sessions.set(sessionId, {
                id: sessionId,
                courseId,
                ...sessionData,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime,
                createdAt: new Date()
            });

            schedule.sessions.push(sessionId);
            console.log(`Session added to course ${courseId}`);
        }
    }

    /**
     * Get upcoming sessions.
     * @param {string} courseId - Course identifier.
     * @returns {Array<object>} Upcoming sessions.
     */
    getUpcomingSessions(courseId) {
        const schedule = this.schedules.get(courseId);
        if (!schedule) return [];

        const now = new Date();
        return schedule.sessions
            .map(sessionId => this.sessions.get(sessionId))
            .filter(session => session && new Date(session.startTime) > now)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_sched_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseScheduling = new CourseScheduling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseScheduling;
}

