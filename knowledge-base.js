/**
 * Knowledge Base
 * @class KnowledgeBase
 * @description Provides a searchable knowledge base with articles, categories, and help content.
 */
class KnowledgeBase {
    constructor() {
        this.articles = new Map();
        this.categories = new Map();
        this.searchIndex = [];
        this.init();
    }

    init() {
        this.trackEvent('k_no_wl_ed_ge_ba_se_initialized');
        this.setupCategories();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("k_no_wl_ed_ge_ba_se_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupCategories() {
        this.categories.set('general', { title: 'General', articles: [] });
        this.categories.set('getting-started', { title: 'Getting Started', articles: [] });
        this.categories.set('troubleshooting', { title: 'Troubleshooting', articles: [] });
        this.categories.set('faq', { title: 'FAQ', articles: [] });
    }

    /**
     * Add an article.
     * @param {string} articleId - Article identifier.
     * @param {object} articleData - Article data.
     */
    addArticle(articleId, articleData) {
        this.articles.set(articleId, {
            ...articleData,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Add to category
        if (articleData.category) {
            const category = this.categories.get(articleData.category);
            if (category) {
                category.articles.push(articleId);
            }
        }

        // Index for search
        this.indexArticle(articleId, articleData);
        console.log(`Article added: ${articleId}`);
    }

    /**
     * Index an article for search.
     * @param {string} articleId - Article identifier.
     * @param {object} articleData - Article data.
     */
    indexArticle(articleId, articleData) {
        this.searchIndex.push({
            id: articleId,
            title: articleData.title,
            content: articleData.content,
            keywords: articleData.keywords || [],
            category: articleData.category
        });
    }

    /**
     * Search articles.
     * @param {string} query - Search query.
     * @returns {Array<object>} Search results.
     */
    search(query) {
        const results = this.searchIndex.filter(item => {
            const searchText = `${item.title} ${item.content} ${item.keywords.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        // Sort by relevance
        results.sort((a, b) => {
            const articleA = this.articles.get(a.id);
            const articleB = this.articles.get(b.id);
            const scoreA = (articleA?.views || 0) + (articleA?.helpful || 0);
            const scoreB = (articleB?.views || 0) + (articleB?.helpful || 0);
            return scoreB - scoreA;
        });

        return results.map(item => this.articles.get(item.id));
    }

    /**
     * Get article by ID.
     * @param {string} articleId - Article identifier.
     * @returns {object} Article data.
     */
    getArticle(articleId) {
        const article = this.articles.get(articleId);
        if (article) {
            article.views++;
        }
        return article;
    }

    /**
     * Mark article as helpful.
     * @param {string} articleId - Article identifier.
     * @param {boolean} helpful - Whether article was helpful.
     */
    markHelpful(articleId, helpful) {
        const article = this.articles.get(articleId);
        if (article) {
            if (helpful) {
                article.helpful++;
            } else {
                article.notHelpful++;
            }
        }
    }

    /**
     * Get articles by category.
     * @param {string} categoryId - Category identifier.
     * @returns {Array<object>} Articles in category.
     */
    getArticlesByCategory(categoryId) {
        const category = this.categories.get(categoryId);
        if (!category) return [];

        return category.articles.map(articleId => this.articles.get(articleId));
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.knowledgeBase = new KnowledgeBase();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KnowledgeBase;
}
