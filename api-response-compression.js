/**
 * API Response Compression
 * Response compression for API endpoints
 */

class APIResponseCompression {
    constructor() {
        this.compressionRules = new Map();
        this.compressionStats = {
            totalRequests: 0,
            compressed: 0,
            originalSize: 0,
            compressedSize: 0
        };
        this.init();
    }

    init() {
        this.trackEvent('compression_initialized');
    }

    addCompressionRule(ruleId, endpoint, algorithm, minSize) {
        this.compressionRules.set(ruleId, {
            id: ruleId,
            endpoint,
            algorithm,
            minSize,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Compression rule added: ${ruleId}`);
    }

    shouldCompress(endpoint, responseSize) {
        for (const rule of this.compressionRules.values()) {
            if (rule.enabled && endpoint.includes(rule.endpoint)) {
                if (responseSize >= rule.minSize) {
                    return {
                        should: true,
                        algorithm: rule.algorithm
                    };
                }
            }
        }
        return { should: false };
    }

    compressResponse(data, algorithm = 'gzip') {
        const originalSize = JSON.stringify(data).length;
        
        // Simulate compression
        const compressionRatio = algorithm === 'gzip' ? 0.7 : algorithm === 'brotli' ? 0.6 : 0.75;
        const compressedSize = Math.floor(originalSize * compressionRatio);
        
        this.compressionStats.totalRequests++;
        this.compressionStats.compressed++;
        this.compressionStats.originalSize += originalSize;
        this.compressionStats.compressedSize += compressedSize;
        
        console.log(`Response compressed using ${algorithm}`);
        
        return {
            compressed: true,
            algorithm,
            originalSize,
            compressedSize,
            ratio: ((1 - compressionRatio) * 100).toFixed(2) + '%'
        };
    }

    getCompressionHeaders(algorithm) {
        const headers = {
            'Content-Encoding': algorithm
        };
        
        if (algorithm === 'gzip' || algorithm === 'deflate') {
            headers['Vary'] = 'Accept-Encoding';
        }
        
        return headers;
    }

    getCompressionStats() {
        const savings = this.compressionStats.originalSize - this.compressionStats.compressedSize;
        const savingsPercent = this.compressionStats.originalSize > 0
            ? (savings / this.compressionStats.originalSize * 100).toFixed(2)
            : 0;
        
        return {
            ...this.compressionStats,
            savings,
            savingsPercent: savingsPercent + '%',
            averageCompressionRatio: this.compressionStats.compressed > 0
                ? ((this.compressionStats.compressedSize / this.compressionStats.originalSize) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    getCompressionRule(ruleId) {
        return this.compressionRules.get(ruleId);
    }

    getAllCompressionRules() {
        return Array.from(this.compressionRules.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`compression_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseCompression = new APIResponseCompression();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseCompression;
}

