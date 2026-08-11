/**
 * Course Analytics
 * @class CourseAnalytics
 * @description Provides analytics for courses including enrollment, completion, and engagement.
 */
class CourseAnalytics {
    constructor() {
        this.analytics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('c_ou_rs_ea_na_ly_ti_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_ou_rs_ea_na_ly_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Track course event.
     * @param {string} courseId - Course identifier.
     * @param {string} eventType - Event type.
     * @param {object} eventData - Event data.
     */
    trackEvent(courseId, eventType, eventData) {
        if (!this.analytics.has(courseId)) {
            this.analytics.set(courseId, {
                courseId,
                events: [],
                metrics: {
                    enrollments: 0,
                    completions: 0,
                    averageTime: 0
                }
            });
        }

        const analytics = this.analytics.get(courseId);
        analytics.events.push({
            type: eventType,
            ...eventData,
            timestamp: new Date()
        });

        // Update metrics
        if (eventType === 'enrollment') {
            analytics.metrics.enrollments++;
        } else if (eventType === 'completion') {
            analytics.metrics.completions++;
        }
    }

    /**
     * Get course analytics.
     * @param {string} courseId - Course identifier.
     * @returns {object} Analytics data.
     */
    getAnalytics(courseId) {
        return this.analytics.get(courseId) || {
            courseId,
            metrics: {
                enrollments: 0,
                completions: 0,
                averageTime: 0
            }
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseAnalytics = new CourseAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseAnalytics;
}

