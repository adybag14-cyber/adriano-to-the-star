/**
 * Customer Loyalty Program
 * @class CustomerLoyaltyProgram
 * @description Manages customer loyalty program with tiers, points, and rewards.
 */
class CustomerLoyaltyProgram {
    constructor() {
        this.members = new Map();
        this.tiers = new Map();
        this.rewards = new Map();
        this.init();
    }

    init() {
        this.trackEvent('c_us_to_me_rl_oy_al_ty_pr_og_ra_m_initialized');
        this.setupTiers();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_us_to_me_rl_oy_al_ty_pr_og_ra_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupTiers() {
        this.tiers.set('bronze', {
            id: 'bronze',
            name: 'Bronze',
            minSpend: 0,
            pointsMultiplier: 1.0,
            benefits: ['basic_rewards']
        });

        this.tiers.set('silver', {
            id: 'silver',
            name: 'Silver',
            minSpend: 500,
            pointsMultiplier: 1.5,
            benefits: ['basic_rewards', 'exclusive_items']
        });

        this.tiers.set('gold', {
            id: 'gold',
            name: 'Gold',
            minSpend: 2000,
            pointsMultiplier: 2.0,
            benefits: ['all_benefits', 'priority_support']
        });
    }

    /**
     * Enroll customer.
     * @param {string} customerId - Customer identifier.
     */
    enrollCustomer(customerId) {
        this.members.set(customerId, {
            customerId,
            tier: 'bronze',
            totalSpent: 0,
            points: 0,
            lifetimePoints: 0,
            enrolledAt: new Date()
        });
        console.log(`Customer enrolled: ${customerId}`);
    }

    /**
     * Earn points from purchase.
     * @param {string} customerId - Customer identifier.
     * @param {number} amount - Purchase amount.
     */
    earnPoints(customerId, amount) {
        const member = this.members.get(customerId);
        if (!member) {
            this.enrollCustomer(customerId);
            return this.earnPoints(customerId, amount);
        }

        const tier = this.tiers.get(member.tier);
        const pointsEarned = Math.floor(amount * tier.pointsMultiplier);
        
        member.points += pointsEarned;
        member.lifetimePoints += pointsEarned;
        member.totalSpent += amount;
        
        this.checkTierUpgrade(customerId);
        console.log(`Points earned: ${pointsEarned} for customer ${customerId}`);
    }

    /**
     * Check tier upgrade.
     * @param {string} customerId - Customer identifier.
     */
    checkTierUpgrade(customerId) {
        const member = this.members.get(customerId);
        if (!member) return;

        const tiers = Array.from(this.tiers.values())
            .sort((a, b) => b.minSpend - a.minSpend);

        for (const tier of tiers) {
            if (member.totalSpent >= tier.minSpend && member.tier !== tier.id) {
                member.tier = tier.id;
                console.log(`Tier upgraded: ${customerId} -> ${tier.name}`);
                break;
            }
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.customerLoyaltyProgram = new CustomerLoyaltyProgram();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerLoyaltyProgram;
}

