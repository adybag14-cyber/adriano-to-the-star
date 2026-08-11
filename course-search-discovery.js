/**
 * Course Search and Discovery
 * @class CourseSearchDiscovery
 * @description Provides course search and discovery functionality.
 */
class CourseSearchDiscovery {
    constructor() {
        this.courses = new Map();
        this.searchIndex = [];
        this.init();
    }

    init() {
        this.trackEvent('course_search_initialized');
    }

    /**
     * Index course.
     * @param {string} courseId - Course identifier.
     * @param {object} courseData - Course data.
     */
    indexCourse(courseId, courseData) {
        this.courses.set(courseId, courseData);
        this.searchIndex.push({
            id: courseId,
            title: courseData.title,
            description: courseData.description,
            tags: courseData.tags || [],
            category: courseData.category
        });
        console.log(`Course indexed: ${courseId}`);
    }

    /**
     * Search courses.
     * @param {string} query - Search query.
     * @param {object} filters - Filter options.
     * @returns {Array<object>} Matching courses.
     */
    searchCourses(query, filters = {}) {
        let results = this.searchIndex.filter(item => {
            const searchText = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        if (filters.category) {
            results = results.filter(item => item.category === filters.category);
        }

        return results.map(item => this.courses.get(item.id));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_search_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseSearchDiscovery = new CourseSearchDiscovery();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseSearchDiscovery;
}

