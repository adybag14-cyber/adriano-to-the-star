/**
 * Competency Mapping
 * @class CompetencyMapping
 * @description Maps competencies to courses and tracks user progress.
 */
class CompetencyMapping {
    constructor() {
        this.competencies = new Map();
        this.mappings = new Map();
        this.userCompetencies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('competency_initialized');
    }

    /**
     * Create competency.
     * @param {string} competencyId - Competency identifier.
     * @param {object} competencyData - Competency data.
     */
    createCompetency(competencyId, competencyData) {
        this.competencies.set(competencyId, {
            ...competencyData,
            id: competencyId,
            name: competencyData.name,
            description: competencyData.description,
            level: competencyData.level || 1,
            createdAt: new Date()
        });
        console.log(`Competency created: ${competencyId}`);
    }

    /**
     * Map competency to course.
     * @param {string} competencyId - Competency identifier.
     * @param {string} courseId - Course identifier.
     */
    mapToCourse(competencyId, courseId) {
        const mappingKey = `${competencyId}_${courseId}`;
        this.mappings.set(mappingKey, {
            competencyId,
            courseId,
            mappedAt: new Date()
        });
        console.log(`Competency ${competencyId} mapped to course ${courseId}`);
    }

    /**
     * Award competency to user.
     * @param {string} userId - User identifier.
     * @param {string} competencyId - Competency identifier.
     */
    awardCompetency(userId, competencyId) {
        const userCompetencyKey = `${userId}_${competencyId}`;
        this.userCompetencies.set(userCompetencyKey, {
            userId,
            competencyId,
            awardedAt: new Date()
        });
        console.log(`Competency awarded: ${competencyId} to user ${userId}`);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`competency_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.competencyMapping = new CompetencyMapping();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompetencyMapping;
}

