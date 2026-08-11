/**
 * Component Communication Patterns
 * Implements various component communication patterns
 */

class ComponentCommunicationPatterns {
    constructor() {
        this.eventBus = new EventTarget();
        this.channels = new Map();
        this.initialized = false;
    }

    /**
     * Initialize Component Communication Patterns
     */
    async initialize() {
        this.initialized = true;
        this.trackEvent('comp_comm_initialized');
        return { success: true, message: 'Component Communication Patterns initialized' };
    }

    /**
     * Emit event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    emit(eventName, data) {
        this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    /**
     * Listen to event
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     */
    on(eventName, callback) {
        this.eventBus.addEventListener(eventName, (event) => {
            callback(event.detail);
        });
    }

    /**
     * Create communication channel
     * @param {string} channelName - Channel name
     * @returns {Object}
     */
    createChannel(channelName) {
        const channel = {
            postMessage: (message) => {
                this.emit(`${channelName}:message`, message);
            },
            onMessage: (callback) => {
                this.on(`${channelName}:message`, callback);
            }
        };
        this.channels.set(channelName, channel);
        return channel;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`comp_comm_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentCommunicationPatterns;
}

