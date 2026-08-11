/**
 * Course Prerequisites
 * @class CoursePrerequisites
 * @description Manages course prerequisites and dependencies.
 */
class CoursePrerequisites {
    constructor() {
        this.prerequisites = new Map();
        this.init();
    }

    init() {
        this.trackEvent('course_prereq_initialized');
    }

    /**
     * Set prerequisites for course.
     * @param {string} courseId - Course identifier.
     * @param {Array<string>} prerequisiteIds - Prerequisite course IDs.
     */
    setPrerequisites(courseId, prerequisiteIds) {
        this.prerequisites.set(courseId, {
            courseId,
            prerequisites: prerequisiteIds,
            updatedAt: new Date()
        });
        console.log(`Prerequisites set for course ${courseId}`);
    }

    /**
     * Check if user can enroll.
     * @param {string} courseId - Course identifier.
     * @param {Array<string>} completedCourses - User's completed courses.
     * @returns {boolean} Whether user can enroll.
     */
    canEnroll(courseId, completedCourses) {
        const prereqs = this.prerequisites.get(courseId);
        if (!prereqs || prereqs.prerequisites.length === 0) {
            return true;
        }

        return prereqs.prerequisites.every(prereqId => 
            completedCourses.includes(prereqId)
        );
    }

    /**
     * Get missing prerequisites.
     * @param {string} courseId - Course identifier.
     * @param {Array<string>} completedCourses - User's completed courses.
     * @returns {Array<string>} Missing prerequisites.
     */
    getMissingPrerequisites(courseId, completedCourses) {
        const prereqs = this.prerequisites.get(courseId);
        if (!prereqs) return [];

        return prereqs.prerequisites.filter(prereqId => 
            !completedCourses.includes(prereqId)
        );
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_prereq_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.coursePrerequisites = new CoursePrerequisites();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoursePrerequisites;
}

