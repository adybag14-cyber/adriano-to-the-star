/**
 * Social Features
 * @class SocialFeatures
 * @description Provides social features for user interaction and sharing.
 */
class SocialFeatures {
    constructor() {
        this.friends = new Map();
        this.follows = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_oc_ia_lf_ea_tu_re_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_oc_ia_lf_ea_tu_re_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add friend.
     * @param {string} userId - User identifier.
     * @param {string} friendId - Friend identifier.
     */
    addFriend(userId, friendId) {
        const friendKey = `${userId}_${friendId}`;
        this.friends.set(friendKey, {
            userId,
            friendId,
            status: 'pending',
            createdAt: new Date()
        });
        console.log(`Friend request sent: ${userId} -> ${friendId}`);
    }

    /**
     * Accept friend request.
     * @param {string} userId - User identifier.
     * @param {string} friendId - Friend identifier.
     */
    acceptFriend(userId, friendId) {
        const friendKey = `${userId}_${friendId}`;
        const friend = this.friends.get(friendKey);
        if (friend) {
            friend.status = 'accepted';
            friend.acceptedAt = new Date();
            console.log(`Friend request accepted: ${userId} <-> ${friendId}`);
        }
    }

    /**
     * Follow user.
     * @param {string} userId - User identifier.
     * @param {string} followId - User to follow.
     */
    followUser(userId, followId) {
        const followKey = `${userId}_${followId}`;
        this.follows.set(followKey, {
            userId,
            followId,
            followedAt: new Date()
        });
        console.log(`User ${userId} followed ${followId}`);
    }

    /**
     * Get user friends.
     * @param {string} userId - User identifier.
     * @returns {Array<string>} Friend IDs.
     */
    getUserFriends(userId) {
        return Array.from(this.friends.values())
            .filter(friend => (friend.userId === userId || friend.friendId === userId) && friend.status === 'accepted')
            .map(friend => friend.userId === userId ? friend.friendId : friend.userId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.socialFeatures = new SocialFeatures();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialFeatures;
}

