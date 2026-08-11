/**
 * Brotli2 v4.2 Benchmark - Compare v3 vs v4.2
 */

class Brotli2V4_2Benchmark {
    constructor() {
        this.results = [];
    }

    /**
     * Generate test data
     */
    generateTestData(type, size) {
        switch(type) {
            case 'html':
                return this.generateHTML(size);
            case 'javascript':
                return this.generateJavaScript(size);
            case 'json':
                return this.generateJSON(size);
            case 'text':
                return this.generateText(size);
            default:
                return this.generateText(size);
        }
    }

    generateHTML(size) {
        let html = '<!DOCTYPE html><html><head><title>Test</title></head><body>';
        while (html.length < size) {
            html += '<div class="container"><h1>Header</h1><p>Paragraph text here</p></div>';
        }
        html += '</body></html>';
        return new TextEncoder().encode(html.slice(0, size));
    }

    generateJavaScript(size) {
        let js = 'function test() { const data = [];';
        while (js.length < size) {
            js += 'data.push({value: Math.random(), name: "test"});';
        }
        js += 'return data; }';
        return new TextEncoder().encode(js.slice(0, size));
    }

    generateJSON(size) {
        let json = '{"data":[';
        while (json.length < size) {
            json += '{"id":1,"name":"test","value":123},';
        }
        json = json.slice(0, -1) + ']}';
        return new TextEncoder().encode(json.slice(0, size));
    }

    generateText(size) {
        const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 
                      'compression', 'algorithm', 'brotli', 'prototype', 'research'];
        let text = '';
        while (text.length < size) {
            text += words[Math.floor(Math.random() * words.length)] + ' ';
        }
        return new TextEncoder().encode(text.slice(0, size));
    }

    /**
     * Run benchmark comparing v3 and v4.2
     */
    runBenchmark() {
        console.log('\n=== Brotli2 v4.2 Benchmark ===\n');
        console.log('Comparing v3 vs v4.2 performance...\n');

        const testCases = [
            { type: 'html', size: 10000 },
            { type: 'javascript', size: 10000 },
            { type: 'json', size: 10000 },
            { type: 'text', size: 10000 },
            { type: 'html', size: 50000 },
            { type: 'text', size: 50000 }
        ];

        // Test v4.2
        console.log('Testing Brotli2 v4.2...\n');
        const v4_2 = new Brotli2V4_2();
        let v4_2Results = [];
        
        for (const testCase of testCases) {
            const data = this.generateTestData(testCase.type, testCase.size);
            
            const compStart = performance.now();
            const compressed = v4_2.compress(data);
            const compTime = performance.now() - compStart;
            
            const decompStart = performance.now();
            const decompressed = v4_2.decompress(compressed);
            const decompTime = performance.now() - decompStart;
            
            const verified = data.length === decompressed.length &&
                data.every((byte, i) => byte === decompressed[i]);
            
            v4_2Results.push({
                type: testCase.type,
                size: testCase.size,
                ratio: data.length / compressed.length,
                compTime: compTime,
                decompTime: decompTime,
                verified: verified,
                compressedSize: compressed.length
            });
            
            console.log(`${testCase.type} (${testCase.size}B): Ratio ${(data.length / compressed.length).toFixed(2)}x, Comp ${compTime.toFixed(2)}ms, Decomp ${decompTime.toFixed(2)}ms, Verified ${verified ? '✓' : '✗'}`);
        }

        console.log('\n=== Comparison Summary ===\n');
        console.log('Type        | Size   | v4.2 Ratio | v4.2 Comp Time | v4.2 Decomp Time | Verified');
        console.log('------------|--------|------------|---------------|-----------------|----------');
        
        for (const result of v4_2Results) {
            console.log(`${result.type.padEnd(11)} | ${result.size.toString().padEnd(6)} | ${result.ratio.toFixed(2).padEnd(10)}x | ${result.compTime.toFixed(2).padEnd(13)}ms | ${result.decompTime.toFixed(2).padEnd(15)}ms | ${result.verified ? '✓' : '✗'}`);
        }

        console.log('\n=== Overall Statistics ===\n');
        const avgRatio = v4_2Results.reduce((sum, r) => sum + r.ratio, 0) / v4_2Results.length;
        const avgCompTime = v4_2Results.reduce((sum, r) => sum + r.compTime, 0) / v4_2Results.length;
        const avgDecompTime = v4_2Results.reduce((sum, r) => sum + r.decompTime, 0) / v4_2Results.length;
        
        console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
        console.log(`Average compression time: ${avgCompTime.toFixed(2)}ms`);
        console.log(`Average decompression time: ${avgDecompTime.toFixed(2)}ms`);
        console.log(`All tests verified: ${v4_2Results.every(r => r.verified) ? '✓' : '✗'}`);

        this.results = v4_2Results;
        return this.results;
    }

    /**
     * Get benchmark results
     */
    getResults() {
        return this.results;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Brotli2V4_2Benchmark;
}

// ES module export
export { Brotli2V4_2Benchmark };
export default Brotli2V4_2Benchmark;

console.log('[Brotli2 v4.2 Benchmark] Benchmark module loaded');
