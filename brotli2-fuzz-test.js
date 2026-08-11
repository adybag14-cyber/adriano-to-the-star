/**
 * Brotli2 Fuzz Testing Framework
 * 
 * Tests Brotli2 robustness with random and edge-case inputs
 */

class Brotli2FuzzTester {
    constructor() {
        this.results = [];
        this.testCases = [];
        this.passed = 0;
        this.failed = 0;
    }

    /**
     * Generate random byte data
     */
    generateRandomData(size) {
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    /**
     * Generate edge case data
     */
    generateEdgeCaseData() {
        const cases = {};
        
        // Empty data
        cases['Empty'] = new Uint8Array(0);
        
        // Single byte
        cases['Single Byte'] = new Uint8Array([0x41]);
        
        // Repeated single byte
        cases['Repeated Byte'] = new Uint8Array(100).fill(0x41);
        
        // All zeros
        cases['All Zeros'] = new Uint8Array(100).fill(0x00);
        
        // All ones
        cases['All Ones'] = new Uint8Array(100).fill(0xFF);
        
        // Alternating pattern
        cases['Alternating'] = new Uint8Array(100);
        for (let i = 0; i < 100; i++) {
            cases['Alternating'][i] = i % 2 === 0 ? 0xAA : 0x55;
        }
        
        // Sequential pattern
        cases['Sequential'] = new Uint8Array(100);
        for (let i = 0; i < 100; i++) {
            cases['Sequential'][i] = i;
        }
        
        // ASCII text
        cases['ASCII Text'] = new TextEncoder().encode('Hello World! This is a test string for compression.');
        
        // Unicode text
        cases['Unicode Text'] = new TextEncoder().encode('Hello 世界! 🌍 This is a test string with emojis.');
        
        // Mixed binary/text
        cases['Mixed'] = new Uint8Array(100);
        for (let i = 0; i < 100; i++) {
            cases['Mixed'][i] = i < 50 ? 0x41 + (i % 26) : Math.floor(Math.random() * 256);
        }
        
        return cases;
    }

    /**
     * Generate fuzz test cases
     */
    generateFuzzCases() {
        const cases = [];
        
        // Random sizes from 1 to 10KB
        for (let i = 0; i < 50; i++) {
            const size = Math.floor(Math.random() * 10240) + 1;
            cases.push({
                name: `Random-${size}B`,
                data: this.generateRandomData(size)
            });
        }
        
        // Edge cases
        const edgeCases = this.generateEdgeCaseData();
        for (const [name, data] of Object.entries(edgeCases)) {
            cases.push({
                name: `Edge-${name}`,
                data: data
            });
        }
        
        // Large random data (up to 100KB)
        for (let i = 0; i < 10; i++) {
            const size = Math.floor(Math.random() * 102400) + 10240;
            cases.push({
                name: `Large Random-${size}B`,
                data: this.generateRandomData(size)
            });
        }
        
        return cases;
    }

    /**
     * Run fuzz test
     */
    async runFuzzTest() {
        if (!window.Brotli2) {
            console.error('[Brotli2 Fuzz Tester] Brotli2 not loaded');
            return;
        }
        
        console.log('[Brotli2 Fuzz Tester] Starting fuzz tests...\n');
        
        this.testCases = this.generateFuzzCases();
        
        console.log(`Running ${this.testCases.length} fuzz test cases...\n`);
        
        for (const testCase of this.testCases) {
            await this.testCompression(testCase);
        }
        
        this.printResults();
    }

    /**
     * Test compression and decompression
     */
    async testCompression(testCase) {
        const { name, data } = testCase;
        
        try {
            const compressor = new window.Brotli2();
            
            // Compress
            const compressed = compressor.compress(data);
            
            // Decompress
            const decompressed = compressor.decompress(compressed);
            
            // Verify
            const verified = this.arraysEqual(data, decompressed);
            
            if (verified) {
                this.passed++;
                console.log(`✓ ${name}: ${data.length}B -> ${compressed.length}B (${(data.length / compressed.length).toFixed(2)}x)`);
            } else {
                this.failed++;
                console.log(`✗ ${name}: Decompression failed`);
            }
            
            this.results.push({
                name,
                originalSize: data.length,
                compressedSize: compressed.length,
                compressionRatio: data.length / compressed.length,
                verified
            });
        } catch (error) {
            this.failed++;
            console.log(`✗ ${name}: Error - ${error.message}`);
            this.results.push({
                name,
                originalSize: data.length,
                compressedSize: 0,
                compressionRatio: 0,
                verified: false,
                error: error.message
            });
        }
    }

    /**
     * Compare two arrays
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Print fuzz test results
     */
    printResults() {
        console.log('\n=== Fuzz Test Results ===');
        console.log(`Total tests: ${this.testCases.length}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Success rate: ${((this.passed / this.testCases.length) * 100).toFixed(2)}%`);
        
        if (this.failed > 0) {
            console.log('\nFailed tests:');
            for (const result of this.results) {
                if (!result.verified) {
                    console.log(`  - ${result.name}: ${result.error || 'Decompression failed'}`);
                }
            }
        }
        
        // Calculate statistics
        const successfulTests = this.results.filter(r => r.verified);
        if (successfulTests.length > 0) {
            const avgRatio = successfulTests.reduce((sum, r) => sum + r.compressionRatio, 0) / successfulTests.length;
            const avgOriginalSize = successfulTests.reduce((sum, r) => sum + r.originalSize, 0) / successfulTests.length;
            const avgCompressedSize = successfulTests.reduce((sum, r) => sum + r.compressedSize, 0) / successfulTests.length;
            
            console.log('\n=== Statistics (successful tests) ===');
            console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
            console.log(`Average original size: ${avgOriginalSize.toFixed(2)}B`);
            console.log(`Average compressed size: ${avgCompressedSize.toFixed(2)}B`);
        }
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.brotli2FuzzTester = new Brotli2FuzzTester();
        console.log('[Brotli2 Fuzz Tester] Initialized');
    });
}
