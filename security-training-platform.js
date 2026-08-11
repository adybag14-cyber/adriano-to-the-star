/**
 * Security Training Platform
 * Security awareness training system
 */

class SecurityTrainingPlatform {
    constructor() {
        this.courses = new Map();
        this.enrollments = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Security Training Platform initialized' };
    }

    createCourse(title, modules) {
        if (!Array.isArray(modules) || modules.length === 0) {
            throw new Error('Course must have at least one module');
        }
        const course = {
            id: Date.now().toString(),
            title,
            modules,
            createdAt: new Date()
        };
        this.courses.set(course.id, course);
        return course;
    }

    enrollUser(userId, courseId) {
        const course = this.courses.get(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        const enrollment = {
            id: Date.now().toString(),
            userId,
            courseId,
            enrolledAt: new Date(),
            progress: 0
        };
        this.enrollments.set(enrollment.id, enrollment);
        return enrollment;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityTrainingPlatform;
}

