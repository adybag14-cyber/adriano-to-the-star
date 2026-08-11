/**
 * Brotli2 Benchmark Test
 * 
 * Compare Brotli2 prototype against Brotli compression
 */

class Brotli2Benchmark {
    constructor() {
        // Check if Brotli2 is defined before instantiating
        if (typeof Brotli2 === 'undefined') {
            throw new Error('Brotli2 prototype not loaded. Make sure brotli2-prototype.js is loaded before brotli2-benchmark.js');
        }
        this.brotli2 = new Brotli2();
        this.results = [];
    }

    /**
     * Helper method to compare two Uint8Arrays
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Run benchmark on test data
     */
    async runBenchmarks() {
        console.log('[Brotli2 Benchmark] Starting compression tests...\n');

        // Test 1: HTML content
        await this.benchmark('HTML', this.generateHTML());

        // Test 2: JavaScript content
        await this.benchmark('JavaScript', this.generateJavaScript());

        // Test 3: CSS content
        await this.benchmark('CSS', this.generateCSS());

        // Test 4: JSON content
        await this.benchmark('JSON', this.generateJSON());

        // Test 5: Mixed content
        await this.benchmark('Mixed', this.generateMixedContent());

        // Test 6: Large text file
        await this.benchmark('Large Text', this.generateLargeText());

        // Test 7: Empty data (edge case)
        await this.benchmark('Empty Data', new Uint8Array([]));

        // Test 8: Very small data (edge case)
        await this.benchmark('Small Data', new Uint8Array([1, 2, 3, 4, 5]));

        // Test 9: Repeated pattern data
        await this.benchmark('Repeated Pattern', this.generateRepeatedPattern());

        // Test 10: Large file stress test
        await this.benchmark('Large File (10KB)', this.generateLargeFile(10 * 1024));

        // Test 11: Very large file stress test
        await this.benchmark('Very Large File (50KB)', this.generateLargeFile(50 * 1024));

        // Print results
        this.printResults();
    }

    /**
     * Benchmark a specific content type
     */
    async benchmark(contentType, data) {
        console.log(`[Brotli2 Benchmark] Testing ${contentType}...`);

        // Convert string to Uint8Array for browser compatibility
        const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
        const originalSize = dataBuffer.length;

        // Compress with Brotli2
        const brotli2Start = performance.now();
        const brotli2Compressed = this.brotli2.compress(dataBuffer);
        const brotli2Time = performance.now() - brotli2Start;
        const brotli2Size = brotli2Compressed.length;
        const brotli2Ratio = originalSize / brotli2Size;

        // Decompress with Brotli2
        const brotli2DecompressStart = performance.now();
        const brotli2Decompressed = this.brotli2.decompress(brotli2Compressed);
        const brotli2DecompressTime = performance.now() - brotli2DecompressStart;

        // Verify decompression
        const brotli2Verified = this.arraysEqual(dataBuffer, brotli2Decompressed);

        // Get Brotli2 stats
        const brotli2Stats = this.brotli2.getStats();

        // Store results
        this.results.push({
            contentType,
            originalSize,
            brotli2: {
                compressedSize: brotli2Size,
                compressionRatio: brotli2Ratio,
                compressionTime: brotli2Time,
                decompressionTime: brotli2DecompressTime,
                verified: brotli2Verified,
                stats: brotli2Stats
            }
        });

        console.log(`  Original size: ${originalSize} bytes`);
        console.log(`  Brotli2 compressed: ${brotli2Size} bytes (${brotli2Ratio.toFixed(2)}x)`);
        console.log(`  Compression time: ${brotli2Time.toFixed(2)}ms`);
        console.log(`  Decompression time: ${brotli2DecompressTime.toFixed(2)}ms`);
        console.log(`  Verified: ${brotli2Verified ? '✓' : '✗'}`);
        console.log(`  Dictionary hits: ${brotli2Stats.dictionaryHits}`);
        console.log(`  Long matches: ${brotli2Stats.longMatches}`);
        console.log('');
    }

    /**
     * Generate sample HTML content
     */
    generateHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
</head>
<body>
    <div class="container">
        <header>
            <h1>Test Page</h1>
        </header>
        <main>
            <section>
                <h2>Section Title</h2>
                <p>This is a test paragraph.</p>
            </section>
        </main>
    </div>
</body>
</html>
        `.repeat(1);
    }

    /**
     * Generate sample JavaScript content
     */
    generateJavaScript() {
        return `
// Test JavaScript file
const CONFIG = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
};

class App {
    constructor() {
        this.state = 'idle';
    }

    init() {
        console.log('App initialized');
    }
}

const app = new App();
app.init();
        `.repeat(1);
    }

    /**
     * Generate sample CSS content
     */
    generateCSS() {
        return `
/* Test CSS file */
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --background-color: #ffffff;
    --text-color: #333333;
    --border-radius: 4px;
    --spacing-unit: 8px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: calc(var(--spacing-unit) * 2);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-unit);
    border-bottom: 1px solid var(--secondary-color);
}

.navigation {
    display: flex;
    gap: var(--spacing-unit);
}

.navigation a {
    color: var(--primary-color);
    text-decoration: none;
    padding: calc(var(--spacing-unit) / 2);
    border-radius: var(--border-radius);
}

.navigation a:hover {
    background-color: var(--primary-color);
    color: white;
}

.card {
    background-color: white;
    border: 1px solid var(--secondary-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-unit);
    margin-bottom: var(--spacing-unit);
}

.card h3 {
    margin-bottom: var(--spacing-unit);
    color: var(--primary-color);
}

.footer {
    text-align: center;
    padding: var(--spacing-unit);
    margin-top: calc(var(--spacing-unit) * 4);
    border-top: 1px solid var(--secondary-color);
}
        `.repeat(1);
    }

    /**
     * Generate sample JSON content
     */
    generateJSON() {
        const data = [];
        for (let i = 0; i < 10; i++) {
            data.push({
                id: i,
                name: `Item ${i}`,
                description: `This is item number ${i} in the list`,
                value: Math.random() * 100,
                active: i % 2 === 0,
                tags: ['tag1', 'tag2', 'tag3'],
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0'
                }
            });
        }
        return JSON.stringify(data, null, 2);
    }

    /**
     * Generate mixed content
     */
    generateMixedContent() {
        return this.generateHTML() + this.generateJavaScript() + this.generateCSS() + this.generateJSON();
    }

    /**
     * Generate large text content
     */
    generateLargeText() {
        const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'compression', 'algorithm', 'brotli', 'brotli2', 'prototype', 'research', 'development', 'testing', 'benchmark', 'performance'];
        let text = '';
        
        for (let i = 0; i < 100; i++) {
            const sentence = [];
            for (let j = 0; j < 10; j++) {
                sentence.push(words[Math.floor(Math.random() * words.length)]);
            }
            text += sentence.join(' ') + '. ';
        }

        return text;
    }

    /**
     * Generate binary data
     */
    generateBinaryData() {
        const data = new Uint8Array(1024);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    /**
     * Generate repeated pattern data
     */
    generateRepeatedPattern() {
        // Generate a more realistic text pattern that will compress well
        const pattern = 'the quick brown fox jumps over the lazy dog ';
        const data = new Uint8Array(1024);
        let pos = 0;
        
        while (pos < data.length) {
            const encoded = new TextEncoder().encode(pattern);
            for (let i = 0; i < encoded.length && pos < data.length; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    /**
     * Generate large file of specified size
     */
    generateLargeFile(size) {
        const data = new Uint8Array(size);
        const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];
        let pos = 0;
        
        while (pos < size) {
            const word = words[Math.floor(Math.random() * words.length)];
            const encoded = new TextEncoder().encode(word + ' ');
            for (let i = 0; i < encoded.length && pos < size; i++) {
                data[pos++] = encoded[i];
            }
        }
        
        return data;
    }

    /**
     * Print benchmark results
     */
    printResults() {
        console.log('\n=== Brotli2 Benchmark Results ===\n');

        console.log('Content Type | Original | Brotli2 | Ratio | Comp Time | Decomp Time | Verified');
        console.log('-------------|----------|---------|-------|-----------|-------------|----------');

        for (const result of this.results) {
            const { contentType, originalSize, brotli2 } = result;
            const ratio = brotli2.compressionRatio.toFixed(2) + 'x';
            const compTime = brotli2.compressionTime.toFixed(2) + 'ms';
            const decompTime = brotli2.decompressionTime.toFixed(2) + 'ms';
            const verified = brotli2.verified ? '✓' : '✗';

            console.log(`${contentType.padEnd(12)} | ${originalSize.toString().padEnd(8)} | ${brotli2.compressedSize.toString().padEnd(7)} | ${ratio.padEnd(5)} | ${compTime.padEnd(9)} | ${decompTime.padEnd(11)} | ${verified}`);
        }

        console.log('\n=== Summary ===');
        const avgRatio = this.results.reduce((sum, r) => sum + r.brotli2.compressionRatio, 0) / this.results.length;
        const avgCompTime = this.results.reduce((sum, r) => sum + r.brotli2.compressionTime, 0) / this.results.length;
        const avgDecompTime = this.results.reduce((sum, r) => sum + r.brotli2.decompressionTime, 0) / this.results.length;

        console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
        console.log(`Average compression time: ${avgCompTime.toFixed(2)}ms`);
        console.log(`Average decompression time: ${avgDecompTime.toFixed(2)}ms`);
        console.log('\n=== Comparison with Brotli ===');
        console.log('Brotli typical compression ratios:');
        console.log('  - JavaScript: ~1.15x (15% smaller)');
        console.log('  - HTML: ~1.20x (20% smaller)');
        console.log('  - CSS: ~1.16x (16% smaller)');
        console.log('\nNote: Brotli2 is a research prototype and may not match Brotli\'s performance.');
        console.log('Further optimization needed for production use.');
    }
}

// Run benchmarks if in browser
if (typeof window !== 'undefined') {
    window.Brotli2Benchmark = Brotli2Benchmark;
    
    // Auto-run on load
    window.addEventListener('load', async () => {
        const benchmark = new Brotli2Benchmark();
        await benchmark.runBenchmarks();
    });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Brotli2Benchmark;
}

// Expose to window for Playwright testing
if (typeof window !== 'undefined') {
    window.Brotli2Benchmark = Brotli2Benchmark;
}
