/**
 * Limited-Time Offers
 * Limited-time offer system
 */

class LimitedTimeOffers {
    constructor() {
        this.offers = new Map();
        this.init();
    }
    
    init() {
        this.setupOffers();
    }
    
    setupOffers() {
        // Setup limited-time offers
    }
    
    async createOffer(offerData) {
        const offer = {
            id: Date.now().toString(),
            name: offerData.name,
            discount: offerData.discount,
            validFrom: offerData.validFrom,
            validTo: offerData.validTo,
            createdAt: Date.now()
        };
        this.offers.set(offer.id, offer);
        return offer;
    }
    
    async getActiveOffers() {
        const now = Date.now();
        return Array.from(this.offers.values())
            .filter(o => now >= o.validFrom && now <= o.validTo);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.limitedTimeOffers = new LimitedTimeOffers(); });
} else {
    window.limitedTimeOffers = new LimitedTimeOffers();
}

