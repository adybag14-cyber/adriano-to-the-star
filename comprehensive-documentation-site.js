/**
 * Comprehensive Documentation Site
 * @class ComprehensiveDocumentationSite
 * @description Provides a comprehensive documentation site with search, navigation, and content management.
 */
class ComprehensiveDocumentationSite {
    constructor() {
        this.docs = new Map();
        this.categories = new Map();
        this.searchIndex = [];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSearch();
        this.trackEvent('doc_site_initialized');
    }

    setupNavigation() {
        // Create navigation structure
        this.categories.set('getting-started', {
            title: 'Getting Started',
            docs: []
        });
        this.categories.set('api-reference', {
            title: 'API Reference',
            docs: []
        });
        this.categories.set('guides', {
            title: 'Guides',
            docs: []
        });
    }

    setupSearch() {
        // Setup full-text search
        console.log('Documentation search initialized');
    }

    /**
     * Add a documentation page.
     * @param {string} docId - Documentation identifier.
     * @param {object} docData - Documentation data.
     */
    addDocumentation(docId, docData) {
        this.docs.set(docId, {
            ...docData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Add to category
        if (docData.category) {
            const category = this.categories.get(docData.category);
            if (category) {
                category.docs.push(docId);
            }
        }

        // Index for search
        this.indexDocument(docId, docData);
        console.log(`Documentation added: ${docId}`);
    }

    /**
     * Index a document for search.
     * @param {string} docId - Document identifier.
     * @param {object} docData - Document data.
     */
    indexDocument(docId, docData) {
        this.searchIndex.push({
            id: docId,
            title: docData.title,
            content: docData.content,
            keywords: docData.keywords || []
        });
    }

    /**
     * Search documentation.
     * @param {string} query - Search query.
     * @returns {Array<object>} Search results.
     */
    search(query) {
        return this.searchIndex.filter(item => {
            const searchText = `${item.title} ${item.content} ${item.keywords.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
    }

    /**
     * Get documentation by ID.
     * @param {string} docId - Documentation identifier.
     * @returns {object} Documentation data.
     */
    getDocumentation(docId) {
        return this.docs.get(docId);
    }

    /**
     * Get documentation by category.
     * @param {string} categoryId - Category identifier.
     * @returns {Array<object>} Documentation in category.
     */
    getDocumentationByCategory(categoryId) {
        const category = this.categories.get(categoryId);
        if (!category) return [];

        return category.docs.map(docId => this.docs.get(docId));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`doc_site_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.comprehensiveDocumentationSite = new ComprehensiveDocumentationSite();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveDocumentationSite;
}
