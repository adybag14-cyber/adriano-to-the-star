/**
 * Simple Node.js test for Brotli2 v4.2
 */

import Brotli2V4_2 from './brotli2-prototype-v4-2.js';

console.log('\n=== Brotli2 v4.2 Node.js Test ===\n');

try {
    const brotli2 = new Brotli2V4_2();
    
    // Test 1: Simple text compression
    console.log('Test 1: Simple text compression');
    const text = 'the quick brown fox jumps over the lazy dog. the quick brown fox jumps over the lazy dog. ';
    const textData = new TextEncoder().encode(text);
    
    const compressed = brotli2.compress(textData);
    const decompressed = brotli2.decompress(compressed);
    
    const verified = textData.length === decompressed.length &&
        textData.every((byte, i) => byte === decompressed[i]);
    
    console.log(`  Original: ${textData.length} bytes`);
    console.log(`  Compressed: ${compressed.length} bytes`);
    console.log(`  Ratio: ${(textData.length / compressed.length).toFixed(2)}x`);
    console.log(`  Verified: ${verified ? '✓' : '✗'}`);
    
    if (!verified) {
        console.error('  ERROR: Decompression failed!');
        process.exit(1);
    }
    
    // Test 2: HTML compression
    console.log('\nTest 2: HTML compression');
    const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><div class="container"><h1>Header</h1><p>Paragraph text here</p></div></body></html>';
    const htmlData = new TextEncoder().encode(html);
    
    const htmlCompressed = brotli2.compress(htmlData);
    const htmlDecompressed = brotli2.decompress(htmlCompressed);
    
    const htmlVerified = htmlData.length === htmlDecompressed.length &&
        htmlData.every((byte, i) => byte === htmlDecompressed[i]);
    
    console.log(`  Original: ${htmlData.length} bytes`);
    console.log(`  Compressed: ${htmlCompressed.length} bytes`);
    console.log(`  Ratio: ${(htmlData.length / htmlCompressed.length).toFixed(2)}x`);
    console.log(`  Verified: ${htmlVerified ? '✓' : '✗'}`);
    
    if (!htmlVerified) {
        console.error('  ERROR: Decompression failed!');
        process.exit(1);
    }
    
    // Test 3: JavaScript compression
    console.log('\nTest 3: JavaScript compression');
    const js = 'function test() { const data = []; for (let i = 0; i < 100; i++) { data.push({value: i, name: "test"}); } return data; }';
    const jsData = new TextEncoder().encode(js);
    
    const jsCompressed = brotli2.compress(jsData);
    const jsDecompressed = brotli2.decompress(jsCompressed);
    
    const jsVerified = jsData.length === jsDecompressed.length &&
        jsData.every((byte, i) => byte === jsDecompressed[i]);
    
    console.log(`  Original: ${jsData.length} bytes`);
    console.log(`  Compressed: ${jsCompressed.length} bytes`);
    console.log(`  Ratio: ${(jsData.length / jsCompressed.length).toFixed(2)}x`);
    console.log(`  Verified: ${jsVerified ? '✓' : '✗'}`);
    
    if (!jsVerified) {
        console.error('  ERROR: Decompression failed!');
        process.exit(1);
    }
    
    // Test 4: Large text compression
    console.log('\nTest 4: Large text compression (10KB)');
    const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'compression', 'algorithm'];
    let largeText = '';
    for (let i = 0; i < 1000; i++) {
        largeText += words[i % words.length] + ' ';
    }
    const largeData = new TextEncoder().encode(largeText.slice(0, 10000));
    
    const largeStart = performance.now();
    const largeCompressed = brotli2.compress(largeData);
    const largeCompTime = performance.now() - largeStart;
    
    const largeDecompStart = performance.now();
    const largeDecompressed = brotli2.decompress(largeCompressed);
    const largeDecompTime = performance.now() - largeDecompStart;
    
    const largeVerified = largeData.length === largeDecompressed.length &&
        largeData.every((byte, i) => byte === largeDecompressed[i]);
    
    console.log(`  Original: ${largeData.length} bytes`);
    console.log(`  Compressed: ${largeCompressed.length} bytes`);
    console.log(`  Ratio: ${(largeData.length / largeCompressed.length).toFixed(2)}x`);
    console.log(`  Compression time: ${largeCompTime.toFixed(2)}ms`);
    console.log(`  Decompression time: ${largeDecompTime.toFixed(2)}ms`);
    console.log(`  Verified: ${largeVerified ? '✓' : '✗'}`);
    
    if (!largeVerified) {
        console.error('  ERROR: Decompression failed!');
        process.exit(1);
    }
    
    // Get statistics
    const stats = brotli2.getStats();
    console.log('\n=== Statistics ===');
    console.log(`  Dictionary hits: ${stats.dictionaryHits}`);
    console.log(`  Long matches: ${stats.longMatches}`);
    console.log(`  Total matches: ${stats.totalMatches}`);
    console.log(`  Run-length matches: ${stats.runLengthMatches}`);
    
    console.log('\n✓ All tests passed!');
    process.exit(0);
    
} catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
