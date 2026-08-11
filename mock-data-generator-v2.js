/**
 * Mock Data Generator v2
 * Advanced mock data generator
 */

class MockDataGeneratorV2 {
    constructor() {
        this.generators = new Map();
        this.data = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Mock Data Generator v2 initialized' };
    }

    registerGenerator(name, generator) {
        if (typeof generator !== 'function') {
            throw new Error('Generator must be a function');
        }
        const gen = {
            id: Date.now().toString(),
            name,
            generator,
            registeredAt: new Date()
        };
        this.generators.set(gen.id, gen);
        return gen;
    }

    generate(generatorId, count, options) {
        const generator = this.generators.get(generatorId);
        if (!generator) {
            throw new Error('Generator not found');
        }
        if (count < 1) {
            throw new Error('Count must be at least 1');
        }
        const data = Array.from({ length: count }, () => generator.generator(options));
        const record = {
            id: Date.now().toString(),
            generatorId,
            count,
            data,
            generatedAt: new Date()
        };
        this.data.push(record);
        return record;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockDataGeneratorV2;
}

