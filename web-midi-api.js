/**
 * Web MIDI API
 * MIDI device communication
 */

class WebMIDIAPI {
    constructor() {
        this.access = null;
        this.inputs = [];
        this.outputs = [];
        this.initialized = false;
    }

    /**
     * Initialize Web MIDI API
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Web MIDI API is not supported');
        }
        this.access = await navigator.requestMIDIAccess();
        this.inputs = Array.from(this.access.inputs.values());
        this.outputs = Array.from(this.access.outputs.values());
        this.initialized = true;
        return { success: true, message: 'Web MIDI API initialized' };
    }

    /**
     * Check if Web MIDI is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
    }

    /**
     * Get inputs
     * @returns {Array<MIDIInput>}
     */
    getInputs() {
        return this.inputs;
    }

    /**
     * Get outputs
     * @returns {Array<MIDIOutput>}
     */
    getOutputs() {
        return this.outputs;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebMIDIAPI;
}

