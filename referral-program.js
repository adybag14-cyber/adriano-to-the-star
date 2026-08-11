/**
 * Referral Program
 * @class ReferralProgram
 * @description Manages referral program with codes, tracking, and rewards.
 */
class ReferralProgram {
    constructor() {
        this.referrals = new Map();
        this.referralCodes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ef_er_ra_lp_ro_gr_am_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ef_er_ra_lp_ro_gr_am_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Generate referral code for user.
     * @param {string} userId - User identifier.
     * @returns {string} Referral code.
     */
    generateReferralCode(userId) {
        const code = `REF${userId.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        this.referralCodes.set(code, {
            code,
            userId,
            referrals: [],
            rewardEarned: 0,
            createdAt: new Date()
        });
        console.log(`Referral code generated for user ${userId}: ${code}`);
        return code;
    }

    /**
     * Use referral code.
     * @param {string} code - Referral code.
     * @param {string} newUserId - New user identifier.
     */
    useReferralCode(code, newUserId) {
        const referralData = this.referralCodes.get(code);
        if (!referralData) {
            throw new Error('Invalid referral code');
        }

        if (referralData.userId === newUserId) {
            throw new Error('Cannot use your own referral code');
        }

        if (referralData.referrals.includes(newUserId)) {
            throw new Error('Referral code already used by this user');
        }

        referralData.referrals.push(newUserId);
        
        this.referrals.set(`${referralData.userId}_${newUserId}`, {
            referrerId: referralData.userId,
            referredId: newUserId,
            code,
            rewardGiven: false,
            createdAt: new Date()
        });

        // Award rewards
        this.awardReferralRewards(referralData.userId, newUserId);
        console.log(`Referral code ${code} used by user ${newUserId}`);
    }

    /**
     * Award referral rewards.
     * @param {string} referrerId - Referrer identifier.
     * @param {string} referredId - Referred user identifier.
     */
    awardReferralRewards(referrerId, referredId) {
        // Placeholder for reward distribution
        console.log(`Awarding referral rewards: referrer ${referrerId}, referred ${referredId}`);
    }

    /**
     * Get referral statistics.
     * @param {string} userId - User identifier.
     * @returns {object} Referral statistics.
     */
    getReferralStats(userId) {
        const referrals = Array.from(this.referrals.values())
            .filter(ref => ref.referrerId === userId);

        return {
            totalReferrals: referrals.length,
            activeReferrals: referrals.filter(ref => !ref.rewardGiven).length,
            rewardsEarned: referrals.filter(ref => ref.rewardGiven).length
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.referralProgram = new ReferralProgram();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReferralProgram;
}
