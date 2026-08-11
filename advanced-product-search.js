/**
 * Advanced Product Search
 * @class AdvancedProductSearch
 * @description Provides advanced search with filters, sorting, and faceting.
 */
class AdvancedProductSearch {
    constructor() {
        this.index = [];
        this.filters = new Map();
        this.init();
    }

    init() {
        this.trackEvent('product_search_initialized');
    }

    /**
     * Index product.
     * @param {object} product - Product object.
     */
    indexProduct(product) {
        this.index.push({
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            attributes: product.attributes || {},
            tags: product.tags || []
        });
        this.trackEvent('product_indexed', { productId: product.id });
    }

    /**
     * Search products.
     * @param {string} query - Search query.
     * @param {object} options - Search options.
     * @returns {Array<object>} Search results.
     */
    searchProducts(query, options = {}) {
        let results = this.index.filter(item => {
            const searchText = `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        // Apply filters
        if (options.filters) {
            results = this.applyFilters(results, options.filters);
        }

        // Apply sorting
        if (options.sortBy) {
            results = this.sortResults(results, options.sortBy, options.sortOrder || 'asc');
        }

        // Apply pagination
        if (options.page && options.pageSize) {
            const start = (options.page - 1) * options.pageSize;
            results = results.slice(start, start + options.pageSize);
        }

        this.trackEvent('products_searched', { query, resultCount: results.length });
        return results;
    }

    /**
     * Apply filters.
     * @param {Array<object>} results - Results to filter.
     * @param {object} filters - Filter criteria.
     * @returns {Array<object>} Filtered results.
     */
    applyFilters(results, filters) {
        return results.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (item[key] !== value && !item.attributes[key]?.includes(value)) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Sort results.
     * @param {Array<object>} results - Results to sort.
     * @param {string} sortBy - Field to sort by.
     * @param {string} order - Sort order.
     * @returns {Array<object>} Sorted results.
     */
    sortResults(results, sortBy, order) {
        return results.sort((a, b) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return order === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`product_search_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_product_search', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.advancedProductSearch = new AdvancedProductSearch();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedProductSearch;
}

