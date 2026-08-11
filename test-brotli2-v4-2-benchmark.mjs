/**
 * Simple Node.js test for Brotli2 v4.2 Benchmark
 */

import Brotli2V4_2 from './brotli2-prototype-v4-2.js';

console.log('\n=== Brotli2 v4.2 Performance Benchmark ===\n');

try {
    const data = [
        { type: 'html', size: 10000 },
        { type: 'javascript', size: 10000 },
        { type: 'json', size: 10000 },
        { type: 'text', size: 10000 },
        { type: 'html', size: 50000 },
        { type: 'text', size: 50000 }
    ];
    
    const brotli2 = new Brotli2V4_2();
    
    console.log('Type        | Size   | Ratio     | Comp Time  | Decomp Time | Verified');
    console.log('------------|--------|-----------|------------|-------------|----------');
    
    let totalRatio = 0;
    let totalCompTime = 0;
    let totalDecompTime = 0;
    
    for (const testCase of data) {
        const testData = brotli2.generateTestData(testCase.type, testCase.size);
        
        const compStart = performance.now();
        const compressed = brotli2.compress(testData);
        const compTime = performance.now() - compStart;
        
        const decompStart = performance.now();
        const decompressed = brotli2.decompress(compressed);
        const decompTime = performance.now() - decompStart;
        
        const verified = testData.length === decompressed.length &&
            testData.every((byte, i) => byte === decompressed[i]);
        
        const ratio = testData.length / compressed.length;
        
        console.log(`${testCase.type.padEnd(11)} | ${testCase.size.toString().padEnd(6)} | ${ratio.toFixed(2).padEnd(9)}x | ${compTime.toFixed(2).padEnd(10)}ms | ${decompTime.toFixed(2).padEnd(11)}ms | ${verified ? '✓' : '✗'}`);
        
        totalRatio += ratio;
        totalCompTime += compTime;
        totalDecompTime += decompTime;
    }
    
    console.log('\n=== Overall Statistics ===\n');
    console.log(`Average compression ratio: ${(totalRatio / data.length).toFixed(2)}x`);
    console.log(`Average compression time: ${(totalCompTime / data.length).toFixed(2)}ms`);
    console.log(`Average decompression time: ${(totalDecompTime / data.length).toFixed(2)}ms`);
    
    console.log('\n✓ Benchmark completed successfully!');
    process.exit(0);
    
} catch (error) {
    console.error('\n✗ Benchmark failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
