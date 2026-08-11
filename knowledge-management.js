/**
 * Knowledge Management
 * Knowledge management system
 */

class KnowledgeManagement {
    constructor() {
        this.bases = new Map();
        this.articles = new Map();
        this.categories = new Map();
        this.init();
    }

    init() {
        this.trackEvent('k_no_wl_ed_ge_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("k_no_wl_ed_ge_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createBase(baseId, baseData) {
        const base = {
            id: baseId,
            ...baseData,
            name: baseData.name || baseId,
            articles: [],
            categories: [],
            createdAt: new Date()
        };
        
        this.bases.set(baseId, base);
        console.log(`Knowledge base created: ${baseId}`);
        return base;
    }

    createCategory(baseId, categoryId, categoryData) {
        const base = this.bases.get(baseId);
        if (!base) {
            throw new Error('Base not found');
        }
        
        const category = {
            id: categoryId,
            baseId,
            ...categoryData,
            name: categoryData.name || categoryId,
            articles: [],
            createdAt: new Date()
        };
        
        this.categories.set(categoryId, category);
        base.categories.push(categoryId);
        
        return category;
    }

    createArticle(baseId, categoryId, articleId, articleData) {
        const base = this.bases.get(baseId);
        const category = this.categories.get(categoryId);
        
        if (!base || !category) {
            throw new Error('Base or category not found');
        }
        
        const article = {
            id: articleId,
            baseId,
            categoryId,
            ...articleData,
            title: articleData.title || articleId,
            content: articleData.content || '',
            tags: articleData.tags || [],
            createdAt: new Date()
        };
        
        this.articles.set(articleId, article);
        base.articles.push(articleId);
        category.articles.push(articleId);
        
        return article;
    }

    search(query) {
        const results = [];
        
        for (const [articleId, article] of this.articles.entries()) {
            if (article.title.includes(query) || 
                article.content.includes(query) ||
                article.tags.some(tag => tag.includes(query))) {
                results.push(article);
            }
        }
        
        return results;
    }

    getBase(baseId) {
        return this.bases.get(baseId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.knowledgeManagement = new KnowledgeManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KnowledgeManagement;
}

