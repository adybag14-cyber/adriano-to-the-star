/**
 * GraphQL Subscriptions
 * GraphQL real-time subscriptions
 */

class GraphQLSubscriptions {
    constructor() {
        this.subscriptions = new Map();
        this.clients = new Map();
        this.init();
    }

    init() {
        this.trackEvent('g_ra_ph_ql_su_bs_cr_ip_ti_on_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_ra_ph_ql_su_bs_cr_ip_ti_on_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    subscribe(clientId, subscriptionData) {
        const client = this.clients.get(clientId);
        if (!client) {
            const newClient = {
                id: clientId,
                subscriptions: [],
                createdAt: new Date()
            };
            this.clients.set(clientId, newClient);
        }
        
        const subscription = {
            id: `subscription_${Date.now()}`,
            clientId,
            ...subscriptionData,
            query: subscriptionData.query || '',
            variables: subscriptionData.variables || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.subscriptions.set(subscription.id, subscription);
        this.clients.get(clientId).subscriptions.push(subscription.id);
        
        return subscription;
    }

    publish(event, data) {
        const matchingSubscriptions = Array.from(this.subscriptions.values())
            .filter(s => s.status === 'active' && s.query.includes(event));
        
        matchingSubscriptions.forEach(subscription => {
            this.sendUpdate(subscription, data);
        });
        
        return matchingSubscriptions.length;
    }

    sendUpdate(subscription, data) {
        return {
            subscriptionId: subscription.id,
            clientId: subscription.clientId,
            data,
            timestamp: new Date()
        };
    }

    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        
        subscription.status = 'unsubscribed';
        subscription.unsubscribedAt = new Date();
        
        const client = this.clients.get(subscription.clientId);
        if (client) {
            const index = client.subscriptions.indexOf(subscriptionId);
            if (index > -1) {
                client.subscriptions.splice(index, 1);
            }
        }
        
        return subscription;
    }

    getSubscription(subscriptionId) {
        return this.subscriptions.get(subscriptionId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.graphqlSubscriptions = new GraphQLSubscriptions();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphQLSubscriptions;
}

