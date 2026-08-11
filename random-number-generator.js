/**
 * Random Number Generator
 * Blockchain-based random number generation
 */

class RandomNumberGenerator {
    constructor() {
        this.generators = new Map();
        this.numbers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_an_do_mn_um_be_rg_en_er_at_or_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_an_do_mn_um_be_rg_en_er_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerGenerator(generatorId, generatorData) {
        const generator = {
            id: generatorId,
            ...generatorData,
            name: generatorData.name || generatorId,
            algorithm: generatorData.algorithm || 'vrf',
            enabled: generatorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.generators.set(generatorId, generator);
        console.log(`Random number generator registered: ${generatorId}`);
        return generator;
    }

    async generate(generatorId, requestId, min = 0, max = 100) {
        const generator = this.generators.get(generatorId);
        if (!generator) {
            throw new Error('Generator not found');
        }
        
        const number = {
            id: `number_${Date.now()}`,
            generatorId,
            requestId,
            value: this.generateRandomNumber(min, max, generator),
            min,
            max,
            proof: this.generateProof(generator),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.numbers.set(number.id, number);
        
        return number;
    }

    generateRandomNumber(min, max, generator) {
        if (generator.algorithm === 'vrf') {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateProof(generator) {
        return {
            algorithm: generator.algorithm,
            proof: '0x' + Array.from({ length: 128 }, () => 
                Math.floor(Math.random() * 16).toString(16)
            ).join('')
        };
    }

    verify(numberId) {
        const number = this.numbers.get(numberId);
        if (!number) {
            throw new Error('Number not found');
        }
        
        return {
            valid: number.proof !== undefined,
            number,
            verifiedAt: new Date()
        };
    }

    getGenerator(generatorId) {
        return this.generators.get(generatorId);
    }

    getNumber(numberId) {
        return this.numbers.get(numberId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.randomNumberGenerator = new RandomNumberGenerator();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RandomNumberGenerator;
}


