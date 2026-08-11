/**
 * Mock Data Generator
 * Generates mock data for testing
 */

class MockDataGenerator {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupGenerator();
    }
    
    setupGenerator() {
        // Setup mock data generator
    }
    
    async generateMockData(type, count = 10) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(this.generateItem(type, i));
        }
        return data;
    }
    
    generateItem(type, index) {
        return {
            id: `${type}_${index}`,
            name: `${type} ${index}`,
            createdAt: Date.now()
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.mockDataGenerator = new MockDataGenerator(); });
} else {
    window.mockDataGenerator = new MockDataGenerator();
}

