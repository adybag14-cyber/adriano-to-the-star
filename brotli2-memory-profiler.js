/**
 * Brotli2 Memory Usage Profiler
 * 
 * Profiles memory usage during compression and decompression
 */

class Brotli2MemoryProfiler {
    constructor() {
        this.results = [];
        this.testCases = [];
    }

    /**
     * Get current memory usage
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Generate test data
     */
    generateTestData() {
        const data = {};
        
        // Small data
        data['Small (1KB)'] = this.generateRandomData(1024);
        
        // Medium data
        data['Medium (10KB)'] = this.generateRandomData(10 * 1024);
        
        // Large data
        data['Large (100KB)'] = this.generateRandomData(100 * 1024);
        
        // Very large data
        data['Very Large (1MB)'] = this.generateRandomData(1024 * 1024);
        
        // Text data
        data['Text (10KB)'] = new TextEncoder().encode('This is a test string for memory profiling. '.repeat(200));
        
        // JSON data
        data['JSON (10KB)'] = new TextEncoder().encode(JSON.stringify({
            data: Array(100).fill({
                id: Math.random().toString(36).substring(2),
                value: Math.random(),
                text: 'Test content for memory profiling'
            })
        }));
        
        return data;
    }

    /**
     * Generate random data
     */
    generateRandomData(size) {
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    /**
     * Run memory profiling
     */
    async runMemoryProfile() {
        if (!window.Brotli2) {
            console.error('[Brotli2 Memory Profiler] Brotli2 not loaded');
            return;
        }
        
        if (!performance.memory) {
            console.warn('[Brotli2 Memory Profiler] Memory API not available in this browser');
            console.log('[Brotli2 Memory Profiler] Chrome/Edge required for memory profiling');
            return;
        }
        
        console.log('[Brotli2 Memory Profiler] Starting memory profiling...\n');
        
        this.testCases = this.generateTestData();
        
        console.log(`Profiling ${Object.keys(this.testCases).length} test cases...\n`);
        
        for (const [name, data] of Object.entries(this.testCases)) {
            await this.profileCompression(name, data);
        }
        
        this.printResults();
    }

    /**
     * Profile compression and decompression
     */
    async profileCompression(name, data) {
        console.log(`Profiling ${name}...`);
        
        // Get baseline memory
        const baselineMemory = this.getMemoryUsage();
        
        try {
            const compressor = new window.Brotli2();
            
            // Create compressor instance memory
            const afterCompressorMemory = this.getMemoryUsage();
            
            // Compress
            const compStartMemory = this.getMemoryUsage();
            const compressed = compressor.compress(data);
            const compEndMemory = this.getMemoryUsage();
            
            // Decompress
            const decompStartMemory = this.getMemoryUsage();
            const decompressed = compressor.decompress(compressed);
            const decompEndMemory = this.getMemoryUsage();
            
            // Verify
            const verified = this.arraysEqual(data, decompressed);
            
            // Calculate memory deltas
            const compressorMemoryDelta = afterCompressorMemory.used - baselineMemory.used;
            const compMemoryDelta = compEndMemory.used - compStartMemory.used;
            const decompMemoryDelta = decompEndMemory.used - decompStartMemory.used;
            
            // Calculate memory efficiency
            const originalSizeBytes = data.length;
            const compressedSizeBytes = compressed.length;
            const compressionRatio = originalSizeBytes / compressedSizeBytes;
            
            // Memory overhead per byte
            const overheadPerByte = compressorMemoryDelta / originalSizeBytes;
            
            console.log(`  Original: ${this.formatBytes(originalSizeBytes)}`);
            console.log(`  Compressed: ${this.formatBytes(compressedSizeBytes)} (${compressionRatio.toFixed(2)}x)`);
            console.log(`  Compressor instance overhead: ${this.formatBytes(compressorMemoryDelta)}`);
            console.log(`  Compression memory delta: ${this.formatBytes(compMemoryDelta)}`);
            console.log(`  Decompression memory delta: ${this.formatBytes(decompMemoryDelta)}`);
            console.log(`  Overhead per byte: ${overheadPerByte.toFixed(2)} bytes`);
            console.log(`  Verified: ${verified ? '✓' : '✗'}`);
            
            this.results.push({
                name,
                originalSize: originalSizeBytes,
                compressedSize: compressedSizeBytes,
                compressionRatio,
                baselineMemory: baselineMemory.used,
                compressorMemoryDelta,
                compMemoryDelta,
                decompMemoryDelta,
                overheadPerByte,
                verified
            });
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            this.results.push({
                name,
                originalSize: data.length,
                compressedSize: 0,
                compressionRatio: 0,
                baselineMemory: baselineMemory ? baselineMemory.used : 0,
                compressorMemoryDelta: 0,
                compMemoryDelta: 0,
                decompMemoryDelta: 0,
                overheadPerByte: 0,
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
     * Print profiling results
     */
    printResults() {
        console.log('\n=== Memory Profiling Results ===');
        console.log('Test Case | Original | Compressed | Ratio | Comp Overhead | Decomp Delta | Overhead/Byte | Verified');
        console.log('----------|----------|-----------|-------|---------------|-------------|--------------|----------');
        
        for (const result of this.results) {
            const { name, originalSize, compressedSize, compressionRatio, compressorMemoryDelta, decompMemoryDelta, overheadPerByte, verified } = result;
            console.log(`${name.padEnd(20)} | ${this.formatBytes(originalSize).padEnd(8)} | ${this.formatBytes(compressedSize).padEnd(9)} | ${compressionRatio.toFixed(2).padEnd(5)}x | ${this.formatBytes(compressorMemoryDelta).padEnd(13)} | ${this.formatBytes(decompMemoryDelta).padEnd(11)} | ${overheadPerByte.toFixed(2).padEnd(12)} | ${verified ? '✓' : '✗'}`);
        }
        
        const verifiedResults = this.results.filter(r => r.verified);
        if (verifiedResults.length > 0) {
            const avgRatio = verifiedResults.reduce((sum, r) => sum + r.compressionRatio, 0) / verifiedResults.length;
            const avgCompOverhead = verifiedResults.reduce((sum, r) => sum + r.compressorMemoryDelta, 0) / verifiedResults.length;
            const avgDecompDelta = verifiedResults.reduce((sum, r) => sum + r.decompMemoryDelta, 0) / verifiedResults.length;
            const avgOverheadPerByte = verifiedResults.reduce((sum, r) => sum + r.overheadPerByte, 0) / verifiedResults.length;
            
            console.log('\n=== Statistics (verified tests) ===');
            console.log(`Total tests: ${verifiedResults.length}`);
            console.log(`Average compression ratio: ${avgRatio.toFixed(2)}x`);
            console.log(`Average compressor overhead: ${this.formatBytes(avgCompOverhead)}`);
            console.log(`Average decompression delta: ${this.formatBytes(avgDecompDelta)}`);
            console.log(`Average overhead per byte: ${avgOverheadPerByte.toFixed(2)} bytes`);
            
            // Memory efficiency analysis
            console.log('\n=== Memory Efficiency Analysis ===');
            
            // Calculate memory efficiency score
            const efficiencyScore = 100 - (avgOverheadPerByte * 10);
            console.log(`Memory efficiency score: ${Math.max(0, efficiencyScore).toFixed(2)}/100`);
            
            // Memory usage per KB of data
            const memoryPerKB = avgCompOverhead / 1024;
            console.log(`Memory usage per KB: ${memoryPerKB.toFixed(2)} KB`);
            
            // Total memory for 1MB of data
            const memoryFor1MB = avgCompOverhead * 1024;
            console.log(`Estimated memory for 1MB: ${this.formatBytes(memoryFor1MB)}`);
            
            // Total memory for 10MB of data
            const memoryFor10MB = avgCompOverhead * 10240;
            console.log(`Estimated memory for 10MB: ${this.formatBytes(memoryFor10MB)}`);
            
            // Total memory for 100MB of data
            const memoryFor100MB = avgCompOverhead * 102400;
            console.log(`Estimated memory for 100MB: ${this.formatBytes(memoryFor100MB)}`);
        }
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.brotli2MemoryProfiler = new Brotli2MemoryProfiler();
        console.log('[Brotli2 Memory Profiler] Initialized');
    });
}
