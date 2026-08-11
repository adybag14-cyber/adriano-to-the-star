// Debug test for Huffman encoding/decoding
import Brotli2V3 from './brotli2-prototype-v3.js';

const brotli2 = new Brotli2V3();

// Test with simple data
const testData = new TextEncoder().encode('hello world');

console.log('=== Original data ===');
console.log('Data:', testData);
console.log('Length:', testData.length);
console.log('String:', new TextDecoder().decode(testData));

// Compress
console.log('\n=== Compressing ===');
const compressed = brotli2.compress(testData, 'text');
console.log('Compressed length:', compressed.length);
console.log('Compression ratio:', (testData.length / compressed.length).toFixed(2) + 'x');

// Decompress
console.log('\n=== Decompressing ===');
const decompressed = brotli2.decompress(compressed);
console.log('Decompressed length:', decompressed.length);

// Verify
const originalStr = new TextDecoder().decode(testData);
const decompressedStr = new TextDecoder().decode(decompressed);
console.log('\n=== Verification ===');
console.log('Original:', originalStr);
console.log('Decompressed:', decompressedStr);
console.log('Match:', originalStr === decompressedStr ? '✓' : '✗');

// Show byte-by-byte comparison
console.log('\n=== Byte comparison ===');
for (let i = 0; i < Math.max(testData.length, decompressed.length); i++) {
    const origByte = i < testData.length ? testData[i] : 'N/A';
    const decompByte = i < decompressed.length ? decompressed[i] : 'N/A';
    const match = origByte === decompByte ? '✓' : '✗';
    console.log(`Byte ${i}: ${origByte} -> ${decompByte} ${match}`);
}
