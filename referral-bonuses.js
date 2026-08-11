/**
 * Referral Bonuses
 * Referral bonus system
 */

class ReferralBonuses {
    constructor() {
        this.referrals = new Map();
        this.init();
    }
    
    init() {
        this.setupReferrals();
    }
    
    setupReferrals() {
        // Setup referral bonuses
    }
    
    async createReferral(referrerId, referredId) {
        const referral = {
            id: Date.now().toString(),
            referrerId,
            referredId,
            status: 'pending',
            createdAt: Date.now()
        };
        this.referrals.set(referral.id, referral);
        
        // Award bonus when referred user signs up
        if (window.gamificationSystem) {
            await window.gamificationSystem.awardPoints(referrerId, 100, 'referral');
        }
        
        return referral;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.referralBonuses = new ReferralBonuses(); });
} else {
    window.referralBonuses = new ReferralBonuses();
}

