/**
 * Web HID API
 * Human Interface Device communication
 */

class WebHIDAPI {
    constructor() {
        this.devices = [];
        this.initialized = false;
    }

    /**
     * Initialize Web HID API
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Web HID API is not supported');
        }
        this.initialized = true;
        return { success: true, message: 'Web HID API initialized' };
    }

    /**
     * Check if Web HID is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof navigator !== 'undefined' && 'hid' in navigator;
    }

    /**
     * Request device
     * @param {Object} options - Device options
     * @returns {Promise<Array<HIDDevice>>}
     */
    async requestDevice(options) {
        if (!this.isSupported()) {
            throw new Error('Web HID API is not supported');
        }
        this.devices = await navigator.hid.requestDevice(options);
        return this.devices;
    }

    /**
     * Get devices
     * @returns {Promise<Array<HIDDevice>>}
     */
    async getDevices() {
        if (!this.isSupported()) {
            throw new Error('Web HID API is not supported');
        }
        return await navigator.hid.getDevices();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebHIDAPI;
}

