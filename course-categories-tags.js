/**
 * Course Categories and Tags
 * @class CourseCategoriesTags
 * @description Manages course categories and tags for organization.
 */
class CourseCategoriesTags {
    constructor() {
        this.categories = new Map();
        this.tags = new Map();
        this.init();
    }

    init() {
        this.trackEvent('course_cat_tags_initialized');
    }

    /**
     * Create category.
     * @param {string} categoryId - Category identifier.
     * @param {object} categoryData - Category data.
     */
    createCategory(categoryId, categoryData) {
        this.categories.set(categoryId, {
            ...categoryData,
            id: categoryId,
            name: categoryData.name,
            description: categoryData.description,
            courses: [],
            createdAt: new Date()
        });
        console.log(`Category created: ${categoryId}`);
    }

    /**
     * Create tag.
     * @param {string} tagId - Tag identifier.
     * @param {object} tagData - Tag data.
     */
    createTag(tagId, tagData) {
        this.tags.set(tagId, {
            ...tagData,
            id: tagId,
            name: tagData.name,
            usageCount: 0,
            createdAt: new Date()
        });
        console.log(`Tag created: ${tagId}`);
    }

    /**
     * Get categories.
     * @returns {Array<object>} All categories.
     */
    getCategories() {
        return Array.from(this.categories.values());
    }

    /**
     * Get popular tags.
     * @param {number} limit - Number of tags to return.
     * @returns {Array<object>} Popular tags.
     */
    getPopularTags(limit = 10) {
        return Array.from(this.tags.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_cat_tags_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseCategoriesTags = new CourseCategoriesTags();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseCategoriesTags;
}

