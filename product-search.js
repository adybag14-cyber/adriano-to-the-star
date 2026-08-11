/**
 * Product Search
 * Product search functionality
 */

class ProductSearch {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupSearch();
    }
    
    setupSearch() {
        // Setup product search
    }
    
    async search(query, filters = {}) {
        if (window.productCatalog) {
            return await window.productCatalog.getProducts({
                ...filters,
                search: query
            });
        }
        return [];
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.productSearch = new ProductSearch(); });
} else {
    window.productSearch = new ProductSearch();
}
