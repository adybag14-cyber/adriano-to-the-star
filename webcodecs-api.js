/**
 * WebCodecs API Implementation
 * Provides video and audio encoding/decoding capabilities
 */

class WebCodecsAPI {
    constructor() {
        this.videoDecoder = null;
        this.videoEncoder = null;
        this.audioDecoder = null;
        this.audioEncoder = null;
        this.initialized = false;
    }

    /**
     * Initialize WebCodecs API
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('WebCodecs API is not supported in this browser');
        }

        try {
            this.initialized = true;
            return { success: true, message: 'WebCodecs API initialized' };
        } catch (error) {
            throw new Error(`WebCodecs initialization failed: ${error.message}`);
        }
    }

    /**
     * Check if WebCodecs is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined';
    }

    /**
     * Create video decoder
     * @param {Object} config - Decoder configuration
     * @param {Function} outputCallback - Output callback
     * @param {Function} errorCallback - Error callback
     * @returns {VideoDecoder}
     */
    createVideoDecoder(config, outputCallback, errorCallback) {
        try {
            this.videoDecoder = new VideoDecoder({
                output: outputCallback,
                error: errorCallback || ((error) => {
                    console.error('VideoDecoder error:', error);
                })
            });

            this.videoDecoder.configure({
                codec: config.codec || 'vp8',
                hardwareAcceleration: config.hardwareAcceleration || 'prefer-hardware',
                optimizeForLatency: config.optimizeForLatency || false
            });

            return this.videoDecoder;
        } catch (error) {
            throw new Error(`Failed to create video decoder: ${error.message}`);
        }
    }

    /**
     * Create video encoder
     * @param {Object} config - Encoder configuration
     * @param {Function} outputCallback - Output callback
     * @param {Function} errorCallback - Error callback
     * @returns {VideoEncoder}
     */
    createVideoEncoder(config, outputCallback, errorCallback) {
        try {
            this.videoEncoder = new VideoEncoder({
                output: outputCallback,
                error: errorCallback || ((error) => {
                    console.error('VideoEncoder error:', error);
                })
            });

            this.videoEncoder.configure({
                codec: config.codec || 'vp8',
                width: config.width,
                height: config.height,
                bitrate: config.bitrate || 1000000,
                framerate: config.framerate || 30,
                hardwareAcceleration: config.hardwareAcceleration || 'prefer-hardware'
            });

            return this.videoEncoder;
        } catch (error) {
            throw new Error(`Failed to create video encoder: ${error.message}`);
        }
    }

    /**
     * Create audio decoder
     * @param {Object} config - Decoder configuration
     * @param {Function} outputCallback - Output callback
     * @param {Function} errorCallback - Error callback
     * @returns {AudioDecoder}
     */
    createAudioDecoder(config, outputCallback, errorCallback) {
        try {
            this.audioDecoder = new AudioDecoder({
                output: outputCallback,
                error: errorCallback || ((error) => {
                    console.error('AudioDecoder error:', error);
                })
            });

            this.audioDecoder.configure({
                codec: config.codec || 'mp4a.40.2',
                sampleRate: config.sampleRate || 44100,
                numberOfChannels: config.numberOfChannels || 2
            });

            return this.audioDecoder;
        } catch (error) {
            throw new Error(`Failed to create audio decoder: ${error.message}`);
        }
    }

    /**
     * Create audio encoder
     * @param {Object} config - Encoder configuration
     * @param {Function} outputCallback - Output callback
     * @param {Function} errorCallback - Error callback
     * @returns {AudioEncoder}
     */
    createAudioEncoder(config, outputCallback, errorCallback) {
        try {
            this.audioEncoder = new AudioEncoder({
                output: outputCallback,
                error: errorCallback || ((error) => {
                    console.error('AudioEncoder error:', error);
                })
            });

            this.audioEncoder.configure({
                codec: config.codec || 'mp4a.40.2',
                sampleRate: config.sampleRate || 44100,
                numberOfChannels: config.numberOfChannels || 2,
                bitrate: config.bitrate || 128000
            });

            return this.audioEncoder;
        } catch (error) {
            throw new Error(`Failed to create audio encoder: ${error.message}`);
        }
    }

    /**
     * Decode video frame
     * @param {EncodedVideoChunk} chunk - Encoded video chunk
     */
    decodeVideoFrame(chunk) {
        if (!this.videoDecoder) {
            throw new Error('Video decoder not initialized');
        }
        this.videoDecoder.decode(chunk);
    }

    /**
     * Encode video frame
     * @param {VideoFrame} frame - Video frame
     * @param {Object} options - Encode options
     */
    encodeVideoFrame(frame, options = {}) {
        if (!this.videoEncoder) {
            throw new Error('Video encoder not initialized');
        }
        this.videoEncoder.encode(frame, options);
    }

    /**
     * Decode audio data
     * @param {EncodedAudioChunk} chunk - Encoded audio chunk
     */
    decodeAudioData(chunk) {
        if (!this.audioDecoder) {
            throw new Error('Audio decoder not initialized');
        }
        this.audioDecoder.decode(chunk);
    }

    /**
     * Encode audio data
     * @param {AudioData} data - Audio data
     * @param {Object} options - Encode options
     */
    encodeAudioData(data, options = {}) {
        if (!this.audioEncoder) {
            throw new Error('Audio encoder not initialized');
        }
        this.audioEncoder.encode(data, options);
    }

    /**
     * Flush decoder
     * @param {string} type - 'video' or 'audio'
     * @returns {Promise}
     */
    async flushDecoder(type) {
        const decoder = type === 'video' ? this.videoDecoder : this.audioDecoder;
        if (!decoder) {
            throw new Error(`${type} decoder not initialized`);
        }
        return decoder.flush();
    }

    /**
     * Flush encoder
     * @param {string} type - 'video' or 'audio'
     * @returns {Promise}
     */
    async flushEncoder(type) {
        const encoder = type === 'video' ? this.videoEncoder : this.audioEncoder;
        if (!encoder) {
            throw new Error(`${type} encoder not initialized`);
        }
        return encoder.flush();
    }

    /**
     * Reset decoder
     * @param {string} type - 'video' or 'audio'
     */
    resetDecoder(type) {
        const decoder = type === 'video' ? this.videoDecoder : this.audioDecoder;
        if (!decoder) {
            throw new Error(`${type} decoder not initialized`);
        }
        decoder.reset();
    }

    /**
     * Reset encoder
     * @param {string} type - 'video' or 'audio'
     */
    resetEncoder(type) {
        const encoder = type === 'video' ? this.videoEncoder : this.audioEncoder;
        if (!encoder) {
            throw new Error(`${type} encoder not initialized`);
        }
        encoder.reset();
    }

    /**
     * Get decoder state
     * @param {string} type - 'video' or 'audio'
     * @returns {string}
     */
    getDecoderState(type) {
        const decoder = type === 'video' ? this.videoDecoder : this.audioDecoder;
        if (!decoder) {
            return null;
        }
        return decoder.state;
    }

    /**
     * Get encoder state
     * @param {string} type - 'video' or 'audio'
     * @returns {string}
     */
    getEncoderState(type) {
        const encoder = type === 'video' ? this.videoEncoder : this.audioEncoder;
        if (!encoder) {
            return null;
        }
        return encoder.state;
    }

    /**
     * Close decoder
     * @param {string} type - 'video' or 'audio'
     */
    closeDecoder(type) {
        const decoder = type === 'video' ? this.videoDecoder : this.audioDecoder;
        if (decoder) {
            decoder.close();
            if (type === 'video') {
                this.videoDecoder = null;
            } else {
                this.audioDecoder = null;
            }
        }
    }

    /**
     * Close encoder
     * @param {string} type - 'video' or 'audio'
     */
    closeEncoder(type) {
        const encoder = type === 'video' ? this.videoEncoder : this.audioEncoder;
        if (encoder) {
            encoder.close();
            if (type === 'video') {
                this.videoEncoder = null;
            } else {
                this.audioEncoder = null;
            }
        }
    }

    /**
     * Cleanup all resources
     */
    cleanup() {
        if (this.videoDecoder) {
            this.videoDecoder.close();
            this.videoDecoder = null;
        }
        if (this.videoEncoder) {
            this.videoEncoder.close();
            this.videoEncoder = null;
        }
        if (this.audioDecoder) {
            this.audioDecoder.close();
            this.audioDecoder = null;
        }
        if (this.audioEncoder) {
            this.audioEncoder.close();
            this.audioEncoder = null;
        }
        this.initialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebCodecsAPI;
}

