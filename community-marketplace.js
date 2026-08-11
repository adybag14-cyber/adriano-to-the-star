/**
 * Community Marketplace for Planet-Related Items
 * Marketplace for space-related products and services
 * 
 * Features:
 * - Product listings
 * - Service offerings
 * - Reviews and ratings
 * - Transaction management
 */

class CommunityMarketplace {
    constructor() {
        this.listings = [];
        this.init();
    }
    
    init() {
        this.loadListings();
        this.trackEvent('comm_market_initialized');
    }
    
    async loadListings() {
        try {
            if (window.supabase) {
                const { data } = await window.supabase
                    .from('marketplace_listings')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                
                if (data) {
                    this.listings = data;
                }
            }
        } catch (e) {
            console.warn('Failed to load marketplace listings:', e);
        }
    }
    
    async createListing(title, description, price, category) {
        try {
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('marketplace_listings')
                    .insert({
                        title,
                        description,
                        price,
                        category,
                        seller_id: window.supabase.auth.user?.id,
                        status: 'active',
                        created_at: new Date().toISOString()
                    });
                
                return !error;
            }
        } catch (e) {
            console.error('Failed to create listing:', e);
        }
        return false;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`comm_market_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.communityMarketplace = new CommunityMarketplace();
    });
} else {
    window.communityMarketplace = new CommunityMarketplace();
}
