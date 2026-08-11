/**
 * Promotions Engine
 * Promotions and discounts engine
 */

class PromotionsEngine {
    constructor() {
        this.promotions = new Map();
        this.init();
    }
    
    init() {
        this.setupPromotions();
    }
    
    setupPromotions() {
        // Setup promotions
    }
    
    async createPromotion(promotionData) {
        const promotion = {
            id: Date.now().toString(),
            name: promotionData.name,
            type: promotionData.type,
            discount: promotionData.discount,
            validFrom: promotionData.validFrom,
            validTo: promotionData.validTo,
            createdAt: Date.now()
        };
        this.promotions.set(promotion.id, promotion);
        return promotion;
    }
    
    async applyPromotion(order, promotionId) {
        const promotion = this.promotions.get(promotionId);
        if (promotion && this.isValid(promotion)) {
            const discount = order.total * (promotion.discount / 100);
            order.total -= discount;
            order.appliedPromotion = promotionId;
        }
        return order;
    }
    
    isValid(promotion) {
        const now = Date.now();
        return now >= promotion.validFrom && now <= promotion.validTo;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.promotionsEngine = new PromotionsEngine(); });
} else {
    window.promotionsEngine = new PromotionsEngine();
}

