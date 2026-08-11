/**
 * Referral Bonuses v2
 * Advanced referral bonuses system
 */

class ReferralBonusesV2 {
    constructor() {
        this.referrals = new Map();
        this.bonuses = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Referral Bonuses v2 initialized' };
    }

    createReferralCode(userId, bonus) {
        if (bonus <= 0) {
            throw new Error('Bonus must be positive');
        }
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const referral = {
            userId,
            code,
            bonus,
            uses: 0,
            createdAt: new Date()
        };
        this.referrals.set(code, referral);
        return referral;
    }

    useReferralCode(code, newUserId) {
        const referral = this.referrals.get(code);
        if (!referral) {
            throw new Error('Invalid referral code');
        }
        referral.uses += 1;
        const bonus = {
            id: Date.now().toString(),
            referrerId: referral.userId,
            newUserId,
            code,
            bonus: referral.bonus,
            awardedAt: new Date()
        };
        this.bonuses.push(bonus);
        return bonus;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReferralBonusesV2;
}

