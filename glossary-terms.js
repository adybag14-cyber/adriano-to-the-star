/**
 * Glossary of Terms
 * @class GlossaryTerms
 * @description Manages a glossary of terms with definitions, examples, and cross-references.
 */
class GlossaryTerms {
    constructor() {
        this.terms = new Map();
        this.categories = new Map();
        this.init();
    }

    init() {
        this.trackEvent('g_lo_ss_ar_yt_er_ms_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_lo_ss_ar_yt_er_ms_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add a term.
     * @param {string} termId - Term identifier.
     * @param {object} termData - Term data.
     */
    addTerm(termId, termData) {
        this.terms.set(termId, {
            ...termData,
            term: termData.term,
            definition: termData.definition,
            examples: termData.examples || [],
            relatedTerms: termData.relatedTerms || [],
            category: termData.category,
            createdAt: new Date()
        });
        console.log(`Term added: ${termId}`);
    }

    /**
     * Search terms.
     * @param {string} query - Search query.
     * @returns {Array<object>} Matching terms.
     */
    search(query) {
        return Array.from(this.terms.values()).filter(term => {
            const searchText = `${term.term} ${term.definition} ${term.examples.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
    }

    /**
     * Get term by ID.
     * @param {string} termId - Term identifier.
     * @returns {object} Term data.
     */
    getTerm(termId) {
        return this.terms.get(termId);
    }

    /**
     * Get related terms.
     * @param {string} termId - Term identifier.
     * @returns {Array<object>} Related terms.
     */
    getRelatedTerms(termId) {
        const term = this.terms.get(termId);
        if (!term) return [];

        return term.relatedTerms.map(relatedId => this.terms.get(relatedId)).filter(Boolean);
    }

    /**
     * Get terms by category.
     * @param {string} categoryId - Category identifier.
     * @returns {Array<object>} Terms in category.
     */
    getTermsByCategory(categoryId) {
        return Array.from(this.terms.values())
            .filter(term => term.category === categoryId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.glossaryTerms = new GlossaryTerms();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlossaryTerms;
}
