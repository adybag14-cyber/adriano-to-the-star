/**
 * AI Model Marketplace System
 * Marketplace for buying, selling, and sharing AI models
 */

class AIModelMarketplace {
    constructor() {
        this.models = new Map();
        this.categories = new Map();
        this.purchases = new Map();
        this.init();
    }

    init() {
        this.loadCategories();
        this.setupEventListeners();
        this.trackEvent('marketplace_initialized');
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeMarketplace();
        });
    }

    /**
     * Load categories
     */
    loadCategories() {
        this.categories.set('vision', 'Computer Vision');
        this.categories.set('nlp', 'Natural Language Processing');
        this.categories.set('audio', 'Audio Processing');
        this.categories.set('recommendation', 'Recommendation Systems');
        this.categories.set('forecasting', 'Time Series Forecasting');
    }

    /**
     * Initialize marketplace
     */
    initializeMarketplace() {
        const containers = document.querySelectorAll('[data-model-marketplace]');
        containers.forEach(container => {
            this.setupMarketplaceUI(container);
        });
    }

    /**
     * Setup marketplace UI
     */
    setupMarketplaceUI(container) {
        if (container.querySelector('.marketplace-ui')) {
            return;
        }

        const ui = document.createElement('div');
        ui.className = 'marketplace-ui';

        ui.innerHTML = `
            <div class="marketplace-header">
                <h2>AI Model Marketplace</h2>
                <div class="marketplace-filters">
                    <select class="category-filter" data-category-filter>
                        <option value="">All Categories</option>
                        ${Array.from(this.categories.entries()).map(([code, name]) => 
                            `<option value="${code}">${name}</option>`
                        ).join('')}
                    </select>
                    <input type="text" 
                           class="search-filter" 
                           data-search-filter 
                           placeholder="Search models...">
                </div>
            </div>
            <div class="marketplace-grid" role="list"></div>
        `;

        container.appendChild(ui);

        // Event listeners
        const categoryFilter = ui.querySelector('[data-category-filter]');
        const searchFilter = ui.querySelector('[data-search-filter]');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filterModels(container);
            });
        }
        
        if (searchFilter) {
            searchFilter.addEventListener('input', () => {
                this.filterModels(container);
            });
        }

        this.loadModels(container);
    }

    /**
     * Load models
     */
    async loadModels(container) {
        // In production, this would load from an API
        const models = this.getSampleModels();
        this.displayModels(container, models);
    }

    /**
     * Get sample models
     */
    getSampleModels() {
        return [
            {
                id: 'model-1',
                name: 'Image Classifier',
                category: 'vision',
                description: 'High-accuracy image classification model',
                price: 99.99,
                rating: 4.5,
                downloads: 1234,
                author: 'AI Labs'
            },
            {
                id: 'model-2',
                name: 'Sentiment Analyzer',
                category: 'nlp',
                description: 'Analyze sentiment in text data',
                price: 49.99,
                rating: 4.8,
                downloads: 2345,
                author: 'NLP Experts'
            }
        ];
    }

    /**
     * Display models
     */
    displayModels(container, models) {
        const grid = container.querySelector('.marketplace-grid');
        grid.innerHTML = '';

        models.forEach(model => {
            const card = this.createModelCard(model);
            grid.appendChild(card);
        });
    }

    /**
     * Create model card
     */
    createModelCard(model) {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('data-model-id', model.id);

        card.innerHTML = `
            <div class="model-header">
                <h3>${this.escapeHtml(model.name)}</h3>
                <span class="model-category">${this.escapeHtml(this.categories.get(model.category) || model.category || 'Uncategorized')}</span>
            </div>
            <div class="model-description">${this.escapeHtml(model.description)}</div>
            <div class="model-meta">
                <div class="model-rating">
                    ${'⭐'.repeat(Math.floor(model.rating || 0))} ${(model.rating || 0).toFixed(1)}
                </div>
                <div class="model-downloads">${model.downloads || 0} downloads</div>
                <div class="model-author">By ${this.escapeHtml(model.author || 'Unknown')}</div>
            </div>
            <div class="model-footer">
                <div class="model-price">$${(model.price || 0).toFixed(2)}</div>
                <button class="model-purchase-btn" data-purchase-model="${this.escapeHtml(model.id)}">
                    Purchase
                </button>
            </div>
        `;

        const purchaseBtn = card.querySelector('[data-purchase-model]');
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', () => {
                this.purchaseModel(model.id);
            });
        }

        return card;
    }

    /**
     * Filter models
     */
    filterModels(container) {
        const categoryFilter = container.querySelector('[data-category-filter]');
        const searchFilter = container.querySelector('[data-search-filter]');
        
        if (!categoryFilter || !searchFilter) {
            return;
        }
        
        const category = categoryFilter.value;
        const search = searchFilter.value.toLowerCase();

        const allModels = this.getSampleModels();
        const filtered = allModels.filter(model => {
            const categoryMatch = !category || model.category === category;
            const searchMatch = !search || 
                model.name.toLowerCase().includes(search) ||
                model.description.toLowerCase().includes(search);
            return categoryMatch && searchMatch;
        });

        this.displayModels(container, filtered);
    }

    /**
     * Purchase model
     */
    purchaseModel(modelId) {
        const model = this.getSampleModels().find(m => m.id === modelId);
        if (!model) {
            return;
        }

        // In production, this would integrate with payment system
        this.purchases.set(modelId, {
            modelId,
            timestamp: Date.now(),
            price: model.price
        });

        this.trackEvent('model_purchased', { modelId, price: model.price });
        alert(`Purchased ${model.name} for $${model.price.toFixed(2)}`);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`marketplace_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_model_marketplace', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const aiModelMarketplace = new AIModelMarketplace();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelMarketplace;
}
