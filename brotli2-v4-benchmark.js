/**
 * Brotli2 v4 Benchmark - Compare v3 vs v4
 */

class Brotli2V4Benchmark {
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
            html += '<div class="container"><h1>Header</h1><p>Paragraph text</p></div>';
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
     * Run benchmark comparing v3 and v4
     */
    runBenchmark() {
        console.log('\n=== Brotli2 v4 Benchmark ===\n');
        console.log('Comparing v3 vs v4 performance...\n');

        const testCases = [
            { type: 'html', size: 10000 },
            { type: 'javascript', size: 10000 },
            { type: 'json', size: 10000 },
            { type: 'text', size: 10000 },
            { type: 'html', size: 50000 },
            { type: 'text', size: 50000 }
        ];

        // Test v3 if available
        let v3Results = [];
        if (typeof Brotli2V3 !== 'undefined') {
            console.log('Testing Brotli2 v3...\n');
            const v3 = new Brotli2V3();
            
            for (const testCase of testCases) {
                const data = this.generateTestData(testCase.type, testCase.size);
                
                const compStart = performance.now();
                const compressed = v3.compress(data);
                const compTime = performance.now() - compStart;
                
                const decompStart = performance.now();
                const decompressed = v3.decompress(compressed);
                const decompTime = performance.now() - decompStart;
                
                const verified = data.length === decompressed.length &&
                    data.every((byte, i) => byte === decompressed[i]);
                
                v3Results.push({
                    type: testCase.type,
                    size: testCase.size,
                    ratio: data.length / compressed.length,
                    compTime: compTime,
                    decompTime: decompTime,
                    verified: verified
                });
                
                console.log(`${testCase.type} (${testCase.size}B): Ratio ${(data.length / compressed.length).toFixed(2)}x, Comp ${compTime.toFixed(2)}ms, Decomp ${decompTime.toFixed(2)}ms, Verified ${verified ? '✓' : '✗'}`);
            }
            console.log('');
        }

        // Test v4
        console.log('Testing Brotli2 v4...\n');
        const v4 = new Brotli2V4();
        let v4Results = [];
        
        for (const testCase of testCases) {
            const data = this.generateTestData(testCase.type, testCase.size);
            
            const compStart = performance.now();
            const compressed = v4.compress(data);
            const compTime = performance.now() - compStart;
            
            const decompStart = performance.now();
            const decompressed = v4.decompress(compressed);
            const decompTime = performance.now() - decompStart;
            
            const verified = data.length === decompressed.length &&
                data.every((byte, i) => byte === decompressed[i]);
            
            v4Results.push({
                type: testCase.type,
                size: testCase.size,
                ratio: data.length / compressed.length,
                compTime: compTime,
                decompTime: decompTime,
                verified: verified
            });
            
            console.log(`${testCase.type} (${testCase.size}B): Ratio ${(data.length / compressed.length).toFixed(2)}x, Comp ${compTime.toFixed(2)}ms, Decomp ${decompTime.toFixed(2)}ms, Verified ${verified ? '✓' : '✗'}`);
        }

        // Compare results
        console.log('\n=== Comparison Summary ===\n');
        
        if (v3Results.length > 0) {
            let v3AvgRatio = 0, v3AvgCompTime = 0, v3AvgDecompTime = 0;
            let v4AvgRatio = 0, v4AvgCompTime = 0, v4AvgDecompTime = 0;
            
            console.log('Type        | Size   | v3 Ratio | v4 Ratio | Improvement | v3 Comp | v4 Comp | Speedup | v3 Decomp | v4 Decomp | Speedup');
            console.log('------------|--------|----------|----------|-------------|---------|---------|---------|-----------|-----------|---------');
            
            for (let i = 0; i < v3Results.length; i++) {
                const v3 = v3Results[i];
                const v4 = v4Results[i];
                
                const ratioImprovement = ((v4.ratio - v3.ratio) / v3.ratio * 100).toFixed(1);
                const compSpeedup = ((v3.compTime - v4.compTime) / v3.compTime * 100).toFixed(1);
                const decompSpeedup = ((v3.decompTime - v4.decompTime) / v3.decompTime * 100).toFixed(1);
                
                console.log(`${v3.type.padEnd(11)} | ${v3.size.toString().padEnd(6)} | ${v3.ratio.toFixed(2).padEnd(8)} | ${v4.ratio.toFixed(2).padEnd(8)} | ${ratioImprovement.padStart(10)}% | ${v3.compTime.toFixed(1).padEnd(7)} | ${v4.compTime.toFixed(1).padEnd(7)} | ${compSpeedup.padStart(6)}% | ${v3.decompTime.toFixed(1).padEnd(9)} | ${v4.decompTime.toFixed(1).padEnd(9)} | ${decompSpeedup.padStart(6)}%`);
                
                v3AvgRatio += v3.ratio;
                v3AvgCompTime += v3.compTime;
                v3AvgDecompTime += v3.decompTime;
                v4AvgRatio += v4.ratio;
                v4AvgCompTime += v4.compTime;
                v4AvgDecompTime += v4.decompTime;
            }
            
            v3AvgRatio /= v3Results.length;
            v3AvgCompTime /= v3Results.length;
            v3AvgDecompTime /= v3Results.length;
            v4AvgRatio /= v4Results.length;
            v4AvgCompTime /= v4Results.length;
            v4AvgDecompTime /= v4Results.length;
            
            const avgRatioImprovement = ((v4AvgRatio - v3AvgRatio) / v3AvgRatio * 100).toFixed(1);
            const avgCompSpeedup = ((v3AvgCompTime - v4AvgCompTime) / v3AvgCompTime * 100).toFixed(1);
            const avgDecompSpeedup = ((v3AvgDecompTime - v4AvgDecompTime) / v3AvgDecompTime * 100).toFixed(1);
            
            console.log('------------|--------|----------|----------|-------------|---------|---------|---------|-----------|-----------|---------');
            console.log(`AVERAGE     |        | ${v3AvgRatio.toFixed(2).padEnd(8)} | ${v4AvgRatio.toFixed(2).padEnd(8)} | ${avgRatioImprovement.padStart(10)}% | ${v3AvgCompTime.toFixed(1).padEnd(7)} | ${v4AvgCompTime.toFixed(1).padEnd(7)} | ${avgCompSpeedup.padStart(6)}% | ${v3AvgDecompTime.toFixed(1).padEnd(9)} | ${v4AvgDecompTime.toFixed(1).padEnd(9)} | ${avgDecompSpeedup.padStart(6)}%`);
        } else {
            console.log('v3 not available for comparison');
            console.log('\nType        | Size   | v4 Ratio | v4 Comp Time | v4 Decomp Time | Verified');
            console.log('------------|--------|----------|--------------|-----------------|----------');
            
            for (const result of v4Results) {
                console.log(`${result.type.padEnd(11)} | ${result.size.toString().padEnd(6)} | ${result.ratio.toFixed(2).padEnd(8)} | ${result.compTime.toFixed(2).padEnd(12)} | ${result.decompTime.toFixed(2).padEnd(15)} | ${result.verified ? '✓' : '✗'}`);
            }
        }

        this.results = v4Results;
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
    module.exports = Brotli2V4Benchmark;
}

// Expose to window for browser use
if (typeof window !== 'undefined') {
    window.Brotli2V4Benchmark = Brotli2V4Benchmark;
    
    // Auto-run if requested
    window.addEventListener('DOMContentLoaded', () => {
        if (window.location.search.includes('autorun=true')) {
            const benchmark = new Brotli2V4Benchmark();
            benchmark.runBenchmark();
        }
    });
}

console.log('[Brotli2 v4 Benchmark] Benchmark module loaded');
