/**
 * Web Serial API
 * Serial port communication
 */

class WebSerialAPI {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.initialized = false;
    }

    /**
     * Initialize Web Serial API
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Web Serial API is not supported');
        }
        this.initialized = true;
        return { success: true, message: 'Web Serial API initialized' };
    }

    /**
     * Check if Web Serial is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof navigator !== 'undefined' && 'serial' in navigator;
    }

    /**
     * Request port
     * @param {Object} options - Port options
     * @returns {Promise<SerialPort>}
     */
    async requestPort(options) {
        if (!this.isSupported()) {
            throw new Error('Web Serial API is not supported');
        }
        this.port = await navigator.serial.requestPort(options);
        return this.port;
    }

    /**
     * Open port
     * @param {Object} options - Port options
     * @returns {Promise<void>}
     */
    async openPort(options = {}) {
        if (!this.port) {
            throw new Error('No port selected');
        }
        await this.port.open({
            baudRate: options.baudRate || 9600
        });
        this.reader = this.port.readable.getReader();
        this.writer = this.port.writable.getWriter();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSerialAPI;
}

