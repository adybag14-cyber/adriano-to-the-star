/**
 * Course Enrollment System
 * @class CourseEnrollmentSystem
 * @description Manages course enrollment with capacity and waitlists.
 */
class CourseEnrollmentSystem {
    constructor() {
        this.enrollments = new Map();
        this.waitlists = new Map();
        this.init();
    }

    init() {
        this.trackEvent('course_enrollment_initialized');
    }

    /**
     * Enroll user in course.
     * @param {string} courseId - Course identifier.
     * @param {string} userId - User identifier.
     * @param {object} courseData - Course data.
     * @returns {object} Enrollment result.
     */
    enrollUser(courseId, userId, courseData) {
        const enrollmentKey = `${courseId}_${userId}`;
        
        // Check if already enrolled
        if (this.enrollments.has(enrollmentKey)) {
            throw new Error('User already enrolled');
        }

        // Check capacity
        const currentEnrollments = Array.from(this.enrollments.values())
            .filter(e => e.courseId === courseId).length;

        if (courseData.capacity && currentEnrollments >= courseData.capacity) {
            // Add to waitlist
            this.addToWaitlist(courseId, userId);
            return { success: false, waitlisted: true };
        }

        this.enrollments.set(enrollmentKey, {
            courseId,
            userId,
            enrolledAt: new Date(),
            status: 'enrolled'
        });

        console.log(`User ${userId} enrolled in course ${courseId}`);
        return { success: true, enrolled: true };
    }

    /**
     * Add to waitlist.
     * @param {string} courseId - Course identifier.
     * @param {string} userId - User identifier.
     */
    addToWaitlist(courseId, userId) {
        if (!this.waitlists.has(courseId)) {
            this.waitlists.set(courseId, []);
        }

        this.waitlists.get(courseId).push({
            userId,
            position: this.waitlists.get(courseId).length + 1,
            addedAt: new Date()
        });

    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_enrollment_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseEnrollmentSystem = new CourseEnrollmentSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseEnrollmentSystem;
}

