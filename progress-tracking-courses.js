/**
 * Progress Tracking for Courses
 * @class ProgressTrackingCourses
 * @description Tracks student progress through courses with detailed analytics.
 */
class ProgressTrackingCourses {
    constructor() {
        this.courseProgress = new Map();
        this.analytics = [];
        this.init();
    }

    init() {
        this.trackEvent('p_ro_gr_es_st_ra_ck_in_gc_ou_rs_es_initialized');
        this.loadProgress();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_gr_es_st_ra_ck_in_gc_ou_rs_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Initialize progress for a course.
     * @param {string} userId - User identifier.
     * @param {string} courseId - Course identifier.
     * @param {object} courseStructure - Course structure with lessons/modules.
     */
    initializeProgress(userId, courseId, courseStructure) {
        const progressKey = `${userId}_${courseId}`;
        this.courseProgress.set(progressKey, {
            userId,
            courseId,
            startedAt: new Date(),
            lastAccessed: new Date(),
            completedLessons: [],
            completedModules: [],
            currentLesson: null,
            currentModule: null,
            totalLessons: courseStructure.totalLessons || 0,
            totalModules: courseStructure.totalModules || 0,
            timeSpent: 0,
            completionPercentage: 0
        });
        console.log(`Progress initialized for user ${userId} in course ${courseId}`);
    }

    /**
     * Mark a lesson as completed.
     * @param {string} userId - User identifier.
     * @param {string} courseId - Course identifier.
     * @param {string} lessonId - Lesson identifier.
     */
    completeLesson(userId, courseId, lessonId) {
        const progressKey = `${userId}_${courseId}`;
        const progress = this.courseProgress.get(progressKey);
        
        if (progress && !progress.completedLessons.includes(lessonId)) {
            progress.completedLessons.push(lessonId);
            progress.lastAccessed = new Date();
            this.updateCompletionPercentage(progress);
            this.saveProgress();
            console.log(`Lesson ${lessonId} completed for user ${userId}`);
        }
    }

    /**
     * Mark a module as completed.
     * @param {string} userId - User identifier.
     * @param {string} courseId - Course identifier.
     * @param {string} moduleId - Module identifier.
     */
    completeModule(userId, courseId, moduleId) {
        const progressKey = `${userId}_${courseId}`;
        const progress = this.courseProgress.get(progressKey);
        
        if (progress && !progress.completedModules.includes(moduleId)) {
            progress.completedModules.push(moduleId);
            progress.lastAccessed = new Date();
            this.updateCompletionPercentage(progress);
            this.saveProgress();
            console.log(`Module ${moduleId} completed for user ${userId}`);
        }
    }

    /**
     * Update completion percentage.
     * @param {object} progress - Progress object.
     */
    updateCompletionPercentage(progress) {
        if (progress.totalLessons > 0) {
            progress.completionPercentage = 
                (progress.completedLessons.length / progress.totalLessons) * 100;
        }
    }

    /**
     * Track time spent.
     * @param {string} userId - User identifier.
     * @param {string} courseId - Course identifier.
     * @param {number} seconds - Seconds spent.
     */
    trackTime(userId, courseId, seconds) {
        const progressKey = `${userId}_${courseId}`;
        const progress = this.courseProgress.get(progressKey);
        
        if (progress) {
            progress.timeSpent += seconds;
            progress.lastAccessed = new Date();
            this.saveProgress();
        }
    }

    /**
     * Get progress for a user and course.
     * @param {string} userId - User identifier.
     * @param {string} courseId - Course identifier.
     * @returns {object} Progress data.
     */
    getProgress(userId, courseId) {
        const progressKey = `${userId}_${courseId}`;
        return this.courseProgress.get(progressKey);
    }

    /**
     * Get analytics for a course.
     * @param {string} courseId - Course identifier.
     * @returns {object} Analytics data.
     */
    getCourseAnalytics(courseId) {
        const allProgress = Array.from(this.courseProgress.values())
            .filter(p => p.courseId === courseId);

        return {
            totalStudents: allProgress.length,
            averageCompletion: allProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / allProgress.length || 0,
            averageTimeSpent: allProgress.reduce((sum, p) => sum + p.timeSpent, 0) / allProgress.length || 0,
            completedCount: allProgress.filter(p => p.completionPercentage === 100).length
        };
    }

    saveProgress() {
        try {
            localStorage.setItem('courseProgress', JSON.stringify(
                Object.fromEntries(this.courseProgress)
            ));
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    loadProgress() {
        try {
            const stored = localStorage.getItem('courseProgress');
            if (stored) {
                this.courseProgress = new Map(Object.entries(JSON.parse(stored)));
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.progressTrackingCourses = new ProgressTrackingCourses();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressTrackingCourses;
}
