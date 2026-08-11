/**
 * Accessibility for Courses
 * @class AccessibilityCourses
 * @description Ensures course content is accessible to all users.
 */
class AccessibilityCourses {
    constructor() {
        this.checks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('accessibility_courses_initialized');
    }

    /**
     * Check course accessibility.
     * @param {string} courseId - Course identifier.
     * @param {object} courseData - Course data.
     * @returns {object} Accessibility report.
     */
    checkAccessibility(courseId, courseData) {
        const issues = [];
        const checks = {
            hasTranscripts: !!courseData.transcripts,
            hasCaptions: !!courseData.captions,
            hasAltText: !!courseData.altText,
            keyboardNavigable: courseData.keyboardNavigable !== false,
            screenReaderCompatible: courseData.screenReaderCompatible !== false
        };

        if (!checks.hasTranscripts) {
            issues.push({ type: 'transcript', severity: 'medium' });
        }
        if (!checks.hasCaptions) {
            issues.push({ type: 'captions', severity: 'high' });
        }
        if (!checks.hasAltText) {
            issues.push({ type: 'alt-text', severity: 'medium' });
        }

        const report = {
            courseId,
            checks,
            issues,
            score: this.calculateScore(checks),
            checkedAt: new Date()
        };

        this.checks.set(courseId, report);
        this.trackEvent('course_accessibility_checked', { courseId, score: report.score, issueCount: issues.length });
        return report;
    }

    /**
     * Calculate accessibility score.
     * @param {object} checks - Accessibility checks.
     * @returns {number} Score (0-100).
     */
    calculateScore(checks) {
        const totalChecks = Object.keys(checks).length;
        const passedChecks = Object.values(checks).filter(v => v === true).length;
        return Math.round((passedChecks / totalChecks) * 100);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`accessibility_courses_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'accessibility_courses', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.accessibilityCourses = new AccessibilityCourses();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityCourses;
}

