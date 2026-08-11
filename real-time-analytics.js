/**
 * Real-Time Analytics
 * @class RealTimeAnalytics
 * @description Provides real-time analytics with live data streaming.
 */
class RealTimeAnalytics {
    constructor() {
        this.streams = new Map();
        this.subscribers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ea_lt_im_ea_na_ly_ti_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ea_lt_im_ea_na_ly_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create analytics stream.
     * @param {string} streamId - Stream identifier.
     * @param {object} streamData - Stream data.
     */
    createStream(streamId, streamData) {
        this.streams.set(streamId, {
            ...streamData,
            id: streamId,
            metric: streamData.metric,
            interval: streamData.interval || 1000,
            subscribers: [],
            status: 'active',
            createdAt: new Date()
        });
        console.log(`Analytics stream created: ${streamId}`);
    }

    /**
     * Subscribe to stream.
     * @param {string} streamId - Stream identifier.
     * @param {function} callback - Callback function.
     */
    subscribe(streamId, callback) {
        const stream = this.streams.get(streamId);
        if (!stream) {
            throw new Error(`Stream not found: ${streamId}`);
        }

        stream.subscribers.push(callback);
        console.log(`Subscribed to stream: ${streamId}`);
    }

    /**
     * Publish data to stream.
     * @param {string} streamId - Stream identifier.
     * @param {object} data - Data to publish.
     */
    publish(streamId, data) {
        const stream = this.streams.get(streamId);
        if (stream) {
            stream.subscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in stream callback:', error);
                }
            });
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.realTimeAnalytics = new RealTimeAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeAnalytics;
}

