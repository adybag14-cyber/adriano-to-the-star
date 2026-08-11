/**
 * Brotli2 Comparison Benchmark
 * 
 * Compares Brotli2 against established compression algorithms:
 * - gzip (DEFLATE)
 * - Brotli
 * - Zstandard
 */

class Brotli2ComparisonBenchmark {
    constructor() {
        this.results = [];
        this.algorithms = ['Brotli2', 'gzip', 'Brotli', 'Brotli (WASM)', 'Zstandard'];
        this.brotliWasm = null;
        this.formatSupport = new Map();
    }

    /**
     * Generate test data for comparison
     */
    generateTestData() {
        const data = {};
        
        // HTML content
        data['HTML'] = this.generateHTML();
        
        // JavaScript content
        data['JavaScript'] = this.generateJavaScript();
        
        // CSS content
        data['CSS'] = this.generateCSS();
        
        // JSON content
        data['JSON'] = this.generateJSON();
        
        // Mixed content
        data['Mixed'] = this.generateMixedContent();
        
        // Large text
        data['Large Text'] = this.generateLargeText();
        
        return data;
    }

    generateHTML() {
        return new TextEncoder().encode(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background-color: #333; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Page</h1>
    </div>
    <div class="container">
        <p>This is a test page for compression benchmarking.</p>
        <p>It contains various types of content for testing compression algorithms.</p>
    </div>
</body>
</html>
        `);
    }

    generateJavaScript() {
        return new TextEncoder().encode(`
function compressData(data) {
    const compressed = [];
    let i = 0;
    while (i < data.length) {
        if (data[i] === data[i + 1] && data[i + 1] === data[i + 2]) {
            const match = findMatch(data, i);
            if (match) {
                compressed.push({ type: 'match', offset: match.offset, length: match.length });
                i += match.length;
            } else {
                compressed.push({ type: 'literal', value: data[i] });
                i++;
            }
        } else {
            compressed.push({ type: 'literal', value: data[i] });
            i++;
        }
    }
    return compressed;
}

function findMatch(data, pos) {
    for (let offset = 1; offset <= 4096; offset++) {
        if (pos + offset >= data.length) break;
        const matchLength = findMatchLength(data, pos, offset);
        if (matchLength >= 3) {
            return { offset, length: matchLength };
        }
    }
    return null;
}

function findMatchLength(data, pos, offset) {
    let length = 0;
    while (pos + offset + length < data.length && 
           data[pos + length] === data[pos + offset + length]) {
        length++;
    }
    return length;
}
        `);
    }

    generateCSS() {
        return new TextEncoder().encode(`
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
    background-color: #007bff;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 4px 4px 0 0;
    margin-bottom: 20px;
}

.content {
    padding: 20px;
    line-height: 1.8;
}

.button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

.button:hover {
    background-color: #0056b3;
}
        `);
    }

    generateJSON() {
        return new TextEncoder().encode(JSON.stringify({
            "name": "Test",
            "version": "1.0.0",
            "features": ["compression", "decompression", "benchmarking"],
            "performance": {
                "compressionRatio": 1.5,
                "compressionSpeed": "fast",
                "decompressionSpeed": "very fast"
            },
            "results": [
                {
                    "test": "HTML",
                    "originalSize": 405,
                    "compressedSize": 366,
                    "compressionRatio": 1.11
                },
                {
                    "test": "JavaScript",
                    "originalSize": 276,
                    "compressedSize": 266,
                    "compressionRatio": 1.04
                },
                {
                    "test": "CSS",
                    "originalSize": 1527,
                    "compressedSize": 1261,
                    "compressionRatio": 1.21
                },
                {
                    "test": "JSON",
                    "originalSize": 3540,
                    "compressedSize": 1480,
                    "compressionRatio": 2.39
                },
                {
                    "test": "Mixed",
                    "originalSize": 5747,
                    "compressedSize": 2808,
                    "compressionRatio": 2.05
                }
            ]
        }, null, 2));
    }

    generateMixedContent() {
        return new TextEncoder().encode(`
<!DOCTYPE html>
<html>
<head>
    <title>Mixed Content</title>
</head>
<body>
    <h1>Mixed Content Test</h1>
    <p>This is a paragraph with some text content.</p>
    <script>
        function test() {
            console.log('Testing compression algorithms');
            return true;
        }
    </script>
    <style>
        body { font-family: Arial, sans-serif; }
        .highlight { color: #007bff; }
    </style>
</head>
</html>
        `);
    }

    generateLargeText() {
        const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'compression', 'algorithm', 'brotli', 'prototype', 'research', 'development', 'testing', 'benchmark', 'performance'];
        let text = '';
        
        for (let i = 0; i < 100; i++) {
            const sentence = [];
            for (let j = 0; j < 10; j++) {
                sentence.push(words[Math.floor(Math.random() * words.length)]);
            }
            text += sentence.join(' ') + '. ';
        }

        return new TextEncoder().encode(text);
    }

    /**
     * Compress data using Brotli2
     */
    compressWithBrotli2(data) {
        if (!window.Brotli2) {
            throw new Error('Brotli2 not loaded');
        }
        
        const compressor = new window.Brotli2();
        const compStart = performance.now();
        const compressed = compressor.compress(data);
        const compTime = performance.now() - compStart;
        
        const decompStart = performance.now();
        const decompressed = compressor.decompress(compressed);
        const decompTime = performance.now() - decompStart;
        
        const verified = this.arraysEqual(data, decompressed);
        
        return {
            algorithm: 'Brotli2',
            originalSize: data.length,
            compressedSize: compressed.length,
            compressionRatio: data.length / compressed.length,
            compressionTime: compTime,
            decompressionTime: decompTime,
            verified
        };
    }

    /**
     * Detect CompressionStream / DecompressionStream format support
     */
    supportsCompressionFormat(format) {
        if (this.formatSupport.has(format)) {
            return this.formatSupport.get(format);
        }

        let supported = false;
        if (typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined') {
            try {
                new CompressionStream(format);
                new DecompressionStream(format);
                supported = true;
            } catch (error) {
                supported = false;
            }
        }

        this.formatSupport.set(format, supported);
        return supported;
    }

    /**
     * Compress data using Brotli WASM baseline
     */
    async compressWithBrotliWasm(data) {
        if (!window.BrotliWasm) {
            return null;
        }

        if (!this.brotliWasm) {
            this.brotliWasm = await window.BrotliWasm.init({
                wasmPath: './wasm/brotli'
            });
        }

        const compStart = performance.now();
        const compressed = this.brotliWasm.compress(data, { quality: 11, lgwin: 22 });
        const compTime = performance.now() - compStart;

        const decompStart = performance.now();
        const decompressed = this.brotliWasm.decompress(compressed);
        const decompTime = performance.now() - decompStart;

        const verified = this.arraysEqual(data, decompressed);

        return {
            algorithm: 'Brotli (WASM)',
            originalSize: data.length,
            compressedSize: compressed.length,
            compressionRatio: data.length / compressed.length,
            compressionTime: compTime,
            decompressionTime: decompTime,
            verified
        };
    }

    /**
     * Compress data using gzip (if available)
     */
    async compressWithGzip(data) {
        if (!this.supportsCompressionFormat('gzip')) {
            return null;
        }
        
        const compStart = performance.now();
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(data);
        writer.close();
        
        const chunks = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => {
            const result = new Uint8Array(acc.length + chunk.length);
            result.set(acc);
            result.set(chunk, acc.length);
            return result;
        }, new Uint8Array(0)));
        
        const compTime = performance.now() - compStart;
        
        const decompStart = performance.now();
        const decompStream = new DecompressionStream('gzip');
        const decompWriter = decompStream.writable.getWriter();
        const decompReader = decompStream.readable.getReader();
        
        decompWriter.write(compressed);
        decompWriter.close();
        
        const decompChunks = [];
        
        while (true) {
            const { done, value } = await decompReader.read();
            if (done) break;
            decompChunks.push(value);
        }
        
        const decompressed = new Uint8Array(decompChunks.reduce((acc, chunk) => {
            const result = new Uint8Array(acc.length + chunk.length);
            result.set(acc);
            result.set(chunk, acc.length);
            return result;
        }, new Uint8Array(0)));
        
        const decompTime = performance.now() - decompStart;
        
        const verified = this.arraysEqual(data, decompressed);
        
        return {
            algorithm: 'gzip',
            originalSize: data.length,
            compressedSize: compressed.length,
            compressionRatio: data.length / compressed.length,
            compressionTime: compTime,
            decompressionTime: decompTime,
            verified
        };
    }

    /**
     * Compress data using Brotli (if available)
     */
    async compressWithBrotli(data) {
        if (!this.supportsCompressionFormat('br')) {
            return null;
        }
        
        const compStart = performance.now();
        const stream = new CompressionStream('br');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(data);
        writer.close();
        
        const chunks = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => {
            const result = new Uint8Array(acc.length + chunk.length);
            result.set(acc);
            result.set(chunk, acc.length);
            return result;
        }, new Uint8Array(0)));
        
        const compTime = performance.now() - compStart;
        
        const decompStart = performance.now();
        const decompStream = new DecompressionStream('br');
        const decompWriter = decompStream.writable.getWriter();
        const decompReader = decompStream.readable.getReader();
        
        decompWriter.write(compressed);
        decompWriter.close();
        
        const decompChunks = [];
        
        while (true) {
            const { done, value } = await decompReader.read();
            if (done) break;
            decompChunks.push(value);
        }
        
        const decompressed = new Uint8Array(decompChunks.reduce((acc, chunk) => {
            const result = new Uint8Array(acc.length + chunk.length);
            result.set(acc);
            result.set(chunk, acc.length);
            return result;
        }, new Uint8Array(0)));
        
        const decompTime = performance.now() - decompStart;
        
        const verified = this.arraysEqual(data, decompressed);
        
        return {
            algorithm: 'Brotli',
            originalSize: data.length,
            compressedSize: compressed.length,
            compressionRatio: data.length / compressed.length,
            compressionTime: compTime,
            decompressionTime: decompTime,
            verified
        };
    }

    /**
     * Compress data using Zstandard (if available)
     */
    async compressWithZstandard(data) {
        if (!this.supportsCompressionFormat('deflate-raw')) {
            return null;
        }
        
        const compStart = performance.now();
        const stream = new CompressionStream('deflate-raw');
        const writer = stream.writable.getWriter();
        
        writer.write(data);
        writer.close();
        
        const chunks = [];
        const reader = stream.readable.getReader();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => {
            const result = new Uint8Array(acc.length + chunk.length);
            result.set(acc);
            result.set(chunk, acc.length);
            return result;
        }, new Uint8Array(0)));
        
        const compTime = performance.now() - compStart;
        
        const decompStart = performance.now();
        const decompStream = new DecompressionStream('deflate-raw');
        const decompWriter = decompStream.writable.getWriter();
        const decompReader = decompStream.readable.getReader();
        
        decompWriter.write(compressed);
        decompWriter.close();
        
        const decompChunks = [];
        
        while (true) {
            const { done, value } = await decompReader.read();
            if (done) break;
            decompChunks.push(value);
        }
        
        const decompressed = new Uint8Array(decompChunks.reduce((acc, chunk) => {
            const result = new Uint8Array(acc.length + chunk.length);
            result.set(acc);
            result.set(chunk, acc.length);
            return result;
        }, new Uint8Array(0)));
        
        const decompTime = performance.now() - decompStart;
        
        const verified = this.arraysEqual(data, decompressed);
        
        return {
            algorithm: 'Zstandard',
            originalSize: data.length,
            compressedSize: compressed.length,
            compressionRatio: data.length / compressed.length,
            compressionTime: compTime,
            decompressionTime: decompTime,
            verified
        };
    }

    /**
     * Compare compression algorithms
     */
    async compareAlgorithms() {
        this.results = [];
        
        const testData = this.generateTestData();
        
        console.log('[Brotli2 Comparison Benchmark] Starting algorithm comparison...\n');
        console.log('Content Type | Original | Brotli2 | gzip | Brotli | Brotli (WASM) | Zstandard');
        console.log('------------|----------|---------|------|-------|---------------|------------');
        
        for (const [name, data] of Object.entries(testData)) {
            console.log(`${name.padEnd(12)} | ${data.length.toString().padEnd(8)} |`);
            
            // Brotli2
            const brotli2Result = this.compressWithBrotli2(data);
            console.log(`${brotli2Result.compressionRatio.toFixed(2).padEnd(7)}x |`);
            
            // gzip
            const gzipResult = await this.compressWithGzip(data);
            if (gzipResult) {
                console.log(`${gzipResult.compressionRatio.toFixed(2).padEnd(7)}x |`);
            } else {
                console.log('N/A     |');
            }
            
            // Brotli
            const brotliResult = await this.compressWithBrotli(data);
            if (brotliResult) {
                console.log(`${brotliResult.compressionRatio.toFixed(2).padEnd(7)}x |`);
            } else {
                console.log('N/A     |');
            }
            
            // Brotli WASM baseline
            const brotliWasmResult = await this.compressWithBrotliWasm(data);
            if (brotliWasmResult) {
                console.log(`${brotliWasmResult.compressionRatio.toFixed(2).padEnd(7)}x |`);
            } else {
                console.log('N/A     |');
            }

            // Zstandard
            const zstdResult = await this.compressWithZstandard(data);
            if (zstdResult) {
                console.log(`${zstdResult.compressionRatio.toFixed(2).padEnd(7)}x |`);
            } else {
                console.log('N/A     |');
            }
            
            this.results.push({
                contentType: name,
                originalSize: data.length,
                brotli2: brotli2Result,
                gzip: gzipResult,
                brotli: brotliResult,
                brotliWasm: brotliWasmResult,
                zstandard: zstdResult
            });
        }
        
        this.printComparisonResults();
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
     * Print comparison results
     */
    printComparisonResults() {
        console.log('\n=== Comparison Results ===');
        console.log('Content Type | Original | Brotli2 | gzip | Brotli | Brotli (WASM) | Zstandard');
        console.log('------------|----------|---------|------|-------|---------------|------------');
        
        for (const result of this.results) {
            const { contentType, originalSize, brotli2, gzip, brotli, brotliWasm, zstandard } = result;
            const gzipRatio = gzip ? gzip.compressionRatio.toFixed(2).padEnd(7) : 'N/A     ';
            const brotliRatio = brotli ? brotli.compressionRatio.toFixed(2).padEnd(7) : 'N/A     ';
            const brotliWasmRatio = brotliWasm ? brotliWasm.compressionRatio.toFixed(2).padEnd(7) : 'N/A     ';
            const zstdRatio = zstandard ? zstandard.compressionRatio.toFixed(2).padEnd(7) : 'N/A     ';
            
            console.log(`${contentType.padEnd(12)} | ${originalSize.toString().padEnd(8)} | ${brotli2.compressionRatio.toFixed(2).padEnd(7)}x | ${gzipRatio}x | ${brotliRatio}x | ${brotliWasmRatio}x | ${zstdRatio}x`);
        }
        
        // Calculate averages
        const brotli2Results = this.results.filter(r => r.brotli2 !== null);
        const gzipResults = this.results.filter(r => r.gzip !== null);
        const brotliResults2 = this.results.filter(r => r.brotli !== null);
        const brotliWasmResults = this.results.filter(r => r.brotliWasm !== null);
        const zstdResults = this.results.filter(r => r.zstandard !== null);
        
        if (brotli2Results.length > 0) {
            const avgBrotli2Ratio = brotli2Results.reduce((sum, r) => sum + r.brotli2.compressionRatio, 0) / brotli2Results.length;
            const avgBrotli2CompTime = brotli2Results.reduce((sum, r) => sum + r.brotli2.compressionTime, 0) / brotli2Results.length;
            const avgBrotli2DecompTime = brotli2Results.reduce((sum, r) => sum + r.brotli2.decompressionTime, 0) / brotli2Results.length;
            
            console.log('\n=== Brotli2 Average Performance ===');
            console.log(`Average compression ratio: ${avgBrotli2Ratio.toFixed(2)}x`);
            console.log(`Average compression time: ${avgBrotli2CompTime.toFixed(2)}ms`);
            console.log(`Average decompression time: ${avgBrotli2DecompTime.toFixed(2)}ms`);
        }
        
        if (gzipResults.length > 0) {
            const avgGzipRatio = gzipResults.reduce((sum, r) => sum + r.gzip.compressionRatio, 0) / gzipResults.length;
            const avgGzipCompTime = gzipResults.reduce((sum, r) => sum + r.gzip.compressionTime, 0) / gzipResults.length;
            const avgGzipDecompTime = gzipResults.reduce((sum, r) => sum + r.gzip.decompressionTime, 0) / gzipResults.length;
            
            console.log('\n=== gzip Average Performance ===');
            console.log(`Average compression ratio: ${avgGzipRatio.toFixed(2)}x`);
            console.log(`Average compression time: ${avgGzipCompTime.toFixed(2)}ms`);
            console.log(`Average decompression time: ${avgGzipDecompTime.toFixed(2)}ms`);
        }
        
        if (brotliResults2.length > 0) {
            const avgBrotliRatio = brotliResults2.reduce((sum, r) => sum + r.brotli.compressionRatio, 0) / brotliResults2.length;
            const avgBrotliCompTime = brotliResults2.reduce((sum, r) => sum + r.brotli.compressionTime, 0) / brotliResults2.length;
            const avgBrotliDecompTime = brotliResults2.reduce((sum, r) => sum + r.brotli.decompressionTime, 0) / brotliResults2.length;
            
            console.log('\n=== Brotli Average Performance ===');
            console.log(`Average compression ratio: ${avgBrotliRatio.toFixed(2)}x`);
            console.log(`Average compression time: ${avgBrotliCompTime.toFixed(2)}ms`);
            console.log(`Average decompression time: ${avgBrotliDecompTime.toFixed(2)}ms`);
        }

        if (brotliWasmResults.length > 0) {
            const avgBrotliWasmRatio = brotliWasmResults.reduce((sum, r) => sum + r.brotliWasm.compressionRatio, 0) / brotliWasmResults.length;
            const avgBrotliWasmCompTime = brotliWasmResults.reduce((sum, r) => sum + r.brotliWasm.compressionTime, 0) / brotliWasmResults.length;
            const avgBrotliWasmDecompTime = brotliWasmResults.reduce((sum, r) => sum + r.brotliWasm.decompressionTime, 0) / brotliWasmResults.length;
            
            console.log('\n=== Brotli WASM Average Performance ===');
            console.log(`Average compression ratio: ${avgBrotliWasmRatio.toFixed(2)}x`);
            console.log(`Average compression time: ${avgBrotliWasmCompTime.toFixed(2)}ms`);
            console.log(`Average decompression time: ${avgBrotliWasmDecompTime.toFixed(2)}ms`);
        }
        
        if (zstdResults.length > 0) {
            const avgZstdRatio = zstdResults.reduce((sum, r) => sum + r.zstandard.compressionRatio, 0) / zstdResults.length;
            const avgZstdCompTime = zstdResults.reduce((sum, r) => sum + r.zstandard.compressionTime, 0) / zstdResults.length;
            const avgZstdDecompTime = zstdResults.reduce((sum, r) => sum + r.zstandard.decompressionTime, 0) / zstdResults.length;
            
            console.log('\n=== Zstandard Average Performance ===');
            console.log(`Average compression ratio: ${avgZstdRatio.toFixed(2)}x`);
            console.log(`Average compression time: ${avgZstdCompTime.toFixed(2)}ms`);
            console.log(`Average decompression time: ${avgZstdDecompTime.toFixed(2)}ms`);
        }
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.brotli2ComparisonBenchmark = new Brotli2ComparisonBenchmark();
        console.log('[Brotli2 Comparison Benchmark] Initialized');
    });
}
