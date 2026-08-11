/**
 * Security Awareness Training
 * Security awareness training management and tracking
 */

class SecurityAwarenessTraining {
    constructor() {
        this.courses = new Map();
        this.enrollments = new Map();
        this.completions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('sec_awareness_train_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sec_awareness_train_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    createCourse(courseId, courseData) {
        const course = {
            id: courseId,
            ...courseData,
            title: courseData.title || '',
            description: courseData.description || '',
            modules: courseData.modules || [],
            duration: courseData.duration || 0,
            required: courseData.required || false,
            createdAt: new Date()
        };
        
        this.courses.set(courseId, course);
        console.log(`Security training course created: ${courseId}`);
        return course;
    }

    enrollUser(userId, courseId) {
        const course = this.courses.get(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        const enrollment = {
            id: `enrollment_${Date.now()}`,
            userId,
            courseId,
            status: 'enrolled',
            progress: 0,
            enrolledAt: new Date(),
            completedAt: null,
            createdAt: new Date()
        };
        
        this.enrollments.set(enrollment.id, enrollment);
        console.log(`User ${userId} enrolled in course ${courseId}`);
        return enrollment;
    }

    updateProgress(enrollmentId, progress) {
        const enrollment = this.enrollments.get(enrollmentId);
        if (!enrollment) {
            throw new Error('Enrollment not found');
        }
        
        enrollment.progress = Math.min(100, Math.max(0, progress));
        
        if (enrollment.progress >= 100 && enrollment.status !== 'completed') {
            enrollment.status = 'completed';
            enrollment.completedAt = new Date();
            
            const completion = {
                id: `completion_${Date.now()}`,
                enrollmentId,
                userId: enrollment.userId,
                courseId: enrollment.courseId,
                completedAt: new Date(),
                createdAt: new Date()
            };
            
            this.completions.set(completion.id, completion);
        }
        
        return enrollment;
    }

    getCompletionRate(courseId) {
        const enrollments = Array.from(this.enrollments.values())
            .filter(e => e.courseId === courseId);
        
        if (enrollments.length === 0) {
            return { completionRate: 0, totalEnrollments: 0, completed: 0 };
        }
        
        const completed = enrollments.filter(e => e.status === 'completed').length;
        const completionRate = (completed / enrollments.length) * 100;
        
        return {
            completionRate,
            totalEnrollments: enrollments.length,
            completed,
            inProgress: enrollments.filter(e => e.status === 'enrolled').length
        };
    }

    getUserProgress(userId) {
        const enrollments = Array.from(this.enrollments.values())
            .filter(e => e.userId === userId);
        
        return {
            userId,
            totalCourses: enrollments.length,
            completedCourses: enrollments.filter(e => e.status === 'completed').length,
            inProgressCourses: enrollments.filter(e => e.status === 'enrolled').length,
            enrollments: enrollments.map(e => ({
                courseId: e.courseId,
                course: this.courses.get(e.courseId),
                progress: e.progress,
                status: e.status
            }))
        };
    }

    getRequiredCourses() {
        return Array.from(this.courses.values())
            .filter(c => c.required);
    }

    checkCompliance(userId) {
        const requiredCourses = this.getRequiredCourses();
        const userEnrollments = Array.from(this.enrollments.values())
            .filter(e => e.userId === userId);
        
        const completedRequired = requiredCourses.filter(rc => {
            return userEnrollments.some(e => 
                e.courseId === rc.id && e.status === 'completed'
            );
        }).length;
        
        const complianceRate = requiredCourses.length > 0 
            ? (completedRequired / requiredCourses.length) * 100 
            : 100;
        
        return {
            userId,
            complianceRate,
            requiredCourses: requiredCourses.length,
            completedRequired,
            missingCourses: requiredCourses.filter(rc => {
                return !userEnrollments.some(e => 
                    e.courseId === rc.id && e.status === 'completed'
                );
            }).map(rc => ({ id: rc.id, title: rc.title }))
        };
    }

    getCourse(courseId) {
        return this.courses.get(courseId);
    }

    getEnrollment(enrollmentId) {
        return this.enrollments.get(enrollmentId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityAwarenessTraining = new SecurityAwarenessTraining();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityAwarenessTraining;
}

