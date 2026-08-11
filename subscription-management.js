class SubscriptionManagement {
    constructor() {
        this.subscriptions = new Map();
        this.plans = new Map();
        this.init();
    }

    init() {
        // Subscription Management initialized.
        this.setupDefaultPlans();
    }

    setupDefaultPlans() {
        this.plans.set('basic', {
            id: 'basic',
            name: 'Basic Plan',
            price: 9.99,
            billingCycle: 'monthly',
            features: ['feature1', 'feature2']
        });

        this.plans.set('premium', {
            id: 'premium',
            name: 'Premium Plan',
            price: 19.99,
            billingCycle: 'monthly',
            features: ['feature1', 'feature2', 'feature3', 'feature4']
        });
    }

    /**
     * Add a new subscription plan.
     * @param {string} planId - Plan identifier.
     * @param {object} planData - Plan data (price, currency, etc).
     */
    addPlan(planId, planData) {
        this.plans.set(planId, {
            id: planId,
            name: planData.name || 'New Plan',
            price: planData.price || 0,
            currency: planData.currency || 'USD',
            billingCycle: planData.billingCycle || 'monthly',
            features: planData.features || []
        });
    }

    /**
     * Get a subscription by ID.
     * @param {string} subscriptionId - Subscription identifier.
     * @returns {object|undefined} Subscription object.
     */
    getSubscription(subscriptionId) {
        return this.subscriptions.get(subscriptionId);
    }

    /**
     * Create a subscription.
     * @param {string} userId - User identifier.
     * @param {string} planId - Plan identifier.
     * @returns {string} Subscription identifier.
     */
    createSubscription(userId, planId) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }

        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const nextBillingDate = new Date(now);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        this.subscriptions.set(subscriptionId, {
            id: subscriptionId,
            userId,
            planId,
            status: 'active',
            startDate: now,
            nextBillingDate,
            billingCycle: plan.billingCycle,
            price: plan.price,
            autoRenew: true,
            createdAt: now
        });

        this.trackEvent('subscription_created', { subscriptionId, userId, planId });
        return subscriptionId;
    }

    /**
     * Cancel a subscription.
     * @param {string} subscriptionId - Subscription identifier.
     */
    cancelSubscription(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        subscription.autoRenew = false;
        this.trackEvent('subscription_cancelled', { subscriptionId });
    }

    /**
     * Renew a subscription.
     * @param {string} subscriptionId - Subscription identifier.
     */
    renewSubscription(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        const nextBillingDate = new Date(subscription.nextBillingDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        subscription.nextBillingDate = nextBillingDate;
        subscription.lastRenewedAt = new Date();
        this.trackEvent('subscription_renewed', { subscriptionId });
    }

    /**
     * Get user subscription.
     * @param {string} userId - User identifier.
     * @returns {object} Subscription data.
     */
    getUserSubscription(userId) {
        for (const subscription of this.subscriptions.values()) {
            if (subscription.userId === userId && subscription.status === 'active') {
                return subscription;
            }
        }
        return null;
    }

    trackEvent(eventName, data = {}) {
        if (typeof window !== 'undefined' && window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`subscription:${eventName}`, 1, {
                    source: 'subscription-management',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record subscription event:', e);
            }
        }
        if (typeof window !== 'undefined' && window.analytics && window.analytics.track) {
            window.analytics.track('Subscription Event', { event: eventName, ...data });
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.subscriptionManagement = new SubscriptionManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionManagement;
}
