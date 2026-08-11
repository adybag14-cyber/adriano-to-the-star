// Simple test to verify Huffman encoding/decoding
import Brotli2V3 from './brotli2-prototype-v3.js';

const brotli2 = new Brotli2V3();

// Test with simple data
const testData = new TextEncoder().encode('hello world');

console.log('Original data:', testData);
console.log('Original length:', testData.length);

// Compress
const compressed = brotli2.compress(testData, 'text');
console.log('Compressed length:', compressed.length);
console.log('Compression ratio:', (testData.length / compressed.length).toFixed(2) + 'x');

// Decompress
const decompressed = brotli2.decompress(compressed);
console.log('Decompressed length:', decompressed.length);

// Verify
const originalStr = new TextDecoder().decode(testData);
const decompressedStr = new TextDecoder().decode(decompressed);
console.log('Original:', originalStr);
console.log('Decompressed:', decompressedStr);
console.log('Match:', originalStr === decompressedStr ? '✓' : '✗');
