/**
 * Product Catalog
 * E-commerce product catalog
 */

class ProductCatalog {
    constructor() {
        this.products = new Map();
        this.init();
    }
    
    init() {
        this.setupCatalog();
    }
    
    setupCatalog() {
        // Setup product catalog
    }
    
    async addProduct(productData) {
        // Add product
        const product = {
            id: Date.now().toString(),
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            stock: productData.stock || 0,
            createdAt: Date.now()
        };
        
        this.products.set(product.id, product);
        return product;
    }
    
    async getProducts(filters = {}) {
        // Get products
        let products = Array.from(this.products.values());
        
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
        }
        
        if (filters.minPrice) {
            products = products.filter(p => p.price >= filters.minPrice);
        }
        
        if (filters.maxPrice) {
            products = products.filter(p => p.price <= filters.maxPrice);
        }
        
        return products;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.productCatalog = new ProductCatalog(); });
} else {
    window.productCatalog = new ProductCatalog();
}
