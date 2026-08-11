/**
 * Real-time Data Sync
 * @class RealtimeDataSync
 * @description Provides real-time data synchronization capabilities.
 */
class RealtimeDataSync {
    constructor() {
        this.syncChannels = new Map();
        this.subscribers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ea_lt_im_ed_at_as_yn_c_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ea_lt_im_ed_at_as_yn_c_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a sync channel.
     * @param {string} channelId - Unique channel identifier.
     * @param {object} config - Channel configuration.
     */
    createChannel(channelId, config) {
        this.syncChannels.set(channelId, {
            ...config,
            subscribers: [],
            lastUpdate: null
        });
        console.log(`Sync channel created: ${channelId}`);
    }

    /**
     * Subscribe to a channel.
     * @param {string} channelId - Channel identifier.
     * @param {function} callback - Callback function for updates.
     * @returns {string} Subscription ID.
     */
    subscribe(channelId, callback) {
        const channel = this.syncChannels.get(channelId);
        if (!channel) {
            throw new Error(`Sync channel not found: ${channelId}`);
        }

        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        channel.subscribers.push({ id: subscriptionId, callback });
        this.subscribers.set(subscriptionId, { channelId, callback });

        console.log(`Subscribed to channel: ${channelId}`);
        return subscriptionId;
    }

    /**
     * Publish data to a channel.
     * @param {string} channelId - Channel identifier.
     * @param {object} data - Data to publish.
     */
    publish(channelId, data) {
        const channel = this.syncChannels.get(channelId);
        if (!channel) {
            throw new Error(`Sync channel not found: ${channelId}`);
        }

        channel.lastUpdate = new Date();
        
        // Notify all subscribers
        for (const subscriber of channel.subscribers) {
            try {
                subscriber.callback(data);
            } catch (error) {
                console.error(`Error in subscriber callback:`, error);
            }
        }

        console.log(`Published to channel: ${channelId}`);
    }

    /**
     * Unsubscribe from a channel.
     * @param {string} subscriptionId - Subscription identifier.
     */
    unsubscribe(subscriptionId) {
        const subscriber = this.subscribers.get(subscriptionId);
        if (subscriber) {
            const channel = this.syncChannels.get(subscriber.channelId);
            if (channel) {
                channel.subscribers = channel.subscribers.filter(
                    sub => sub.id !== subscriptionId
                );
            }
            this.subscribers.delete(subscriptionId);
            console.log(`Unsubscribed from channel: ${subscriber.channelId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.realtimeDataSync = new RealtimeDataSync();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeDataSync;
}
