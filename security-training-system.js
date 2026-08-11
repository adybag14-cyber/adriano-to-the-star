/**
 * Security Training System
 * System for security awareness training and education
 */

class SecurityTrainingSystem {
    constructor() {
        this.courses = new Map();
        this.enrollments = new Map(); // userId -> [courseIds]
        this.completions = new Map(); // userId -> courseId -> completion
        this.assessments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ec_ur_it_yt_ra_in_in_gs_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_yt_ra_in_in_gs_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createCourse(courseId, title, description, modules, duration) {
        this.courses.set(courseId, {
            id: courseId,
            title,
            description,
            modules,
            duration,
            status: 'active',
            createdAt: new Date()
        });
        console.log(`Security training course created: ${courseId}`);
    }

    enrollUser(userId, courseId) {
        if (!this.courses.has(courseId)) {
            throw new Error('Course does not exist');
        }
        
        const enrollments = this.enrollments.get(userId) || [];
        if (!enrollments.includes(courseId)) {
            enrollments.push(courseId);
            this.enrollments.set(userId, enrollments);
            console.log(`User ${userId} enrolled in course ${courseId}`);
        }
    }

    completeModule(userId, courseId, moduleId) {
        const course = this.courses.get(courseId);
        if (!course) {
            throw new Error('Course does not exist');
        }
        
        const completionKey = `${userId}_${courseId}`;
        const completion = this.completions.get(completionKey) || {
            userId,
            courseId,
            completedModules: [],
            progress: 0,
            startedAt: new Date()
        };
        
        if (!completion.completedModules.includes(moduleId)) {
            completion.completedModules.push(moduleId);
            completion.progress = (completion.completedModules.length / course.modules.length) * 100;
            this.completions.set(completionKey, completion);
            console.log(`User ${userId} completed module ${moduleId} in course ${courseId}`);
        }
        
        // Check if course is complete
        if (completion.completedModules.length === course.modules.length) {
            completion.completedAt = new Date();
            console.log(`User ${userId} completed course ${courseId}`);
        }
    }

    createAssessment(assessmentId, courseId, questions) {
        this.assessments.set(assessmentId, {
            id: assessmentId,
            courseId,
            questions,
            passingScore: 80,
            createdAt: new Date()
        });
        console.log(`Assessment created: ${assessmentId}`);
    }

    submitAssessment(userId, assessmentId, answers) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment does not exist');
        }
        
        let correct = 0;
        assessment.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                correct++;
            }
        });
        
        const score = (correct / assessment.questions.length) * 100;
        const passed = score >= assessment.passingScore;
        
        const result = {
            userId,
            assessmentId,
            score,
            passed,
            answers,
            submittedAt: new Date()
        };
        
        console.log(`Assessment submitted: ${assessmentId}, Score: ${score}%, Passed: ${passed}`);
        return result;
    }

    getUserProgress(userId) {
        const enrollments = this.enrollments.get(userId) || [];
        const progress = [];
        
        enrollments.forEach(courseId => {
            const completionKey = `${userId}_${courseId}`;
            const completion = this.completions.get(completionKey);
            const course = this.courses.get(courseId);
            
            if (course) {
                progress.push({
                    courseId,
                    courseTitle: course.title,
                    progress: completion ? completion.progress : 0,
                    completed: completion ? completion.completedAt !== undefined : false
                });
            }
        });
        
        return progress;
    }

    getCourse(courseId) {
        return this.courses.get(courseId);
    }

    getAllCourses() {
        return Array.from(this.courses.values());
    }

    getTrainingStatistics() {
        const totalCourses = this.courses.size;
        const totalEnrollments = Array.from(this.enrollments.values())
            .reduce((sum, courses) => sum + courses.length, 0);
        const totalCompletions = Array.from(this.completions.values())
            .filter(c => c.completedAt).length;
        
        return {
            totalCourses,
            totalEnrollments,
            totalCompletions,
            completionRate: totalEnrollments > 0 
                ? (totalCompletions / totalEnrollments) * 100 
                : 0
        };
    }
}

if (typeof window !== 'undefined') {
    window.securityTrainingSystem = new SecurityTrainingSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityTrainingSystem;
}

