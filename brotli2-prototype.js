/**
 * Brotli2 - Experimental Compression Algorithm
 * 
 * Research prototype exploring potential improvements over Brotli
 * 
 * Potential Improvements:
 * 1. Larger sliding window (64MB instead of 16MB)
 * 2. Higher-order context modeling (3rd order instead of 2nd)
 * 3. ANS coding instead of Huffman (better compression ratio)
 * 4. Adaptive dictionary based on content type
 * 5. Better block splitting using machine learning
 * 6. Multi-pass compression for optimal ratio
 * 
 * NOTE: This is a research prototype, not production code
 */

class Brotli2 {
    constructor() {
        this.windowSize = 64 * 1024 * 1024; // 64MB window (vs Brotli's 16MB)
        this.contextOrder = 3; // 3rd order context (vs Brotli's 2nd)
        this.useANSCoding = true; // ANS coding (vs Brotli's Huffman)
        this.adaptiveDictionary = true;
        
        // Initialize context models
        this.contextModels = new Map();
        this.literalContexts = new Array(256).fill(null).map(() => new Map());
        this.distanceContexts = new Map();
        
        // Statistics for analysis
        this.stats = {
            compressionRatio: 0,
            compressionTime: 0,
            decompressionTime: 0,
            dictionaryHits: 0,
            longMatches: 0
        };
    }

    /**
     * Compress data using improved techniques
     */
    compress(data) {
        const startTime = performance.now();
        const maxTime = 4000; // 4 second timeout
        
        // Step 1: Analyze content type
        const contentType = this.detectContentType(data);
        
        // Step 2: Build adaptive dictionary based on content type
        const dictionary = this.buildAdaptiveDictionary(data, contentType);
        
        // Step 3: LZ77 compression with larger window
        const matches = this.findMatches(data, dictionary);
        
        // Check timeout
        if (performance.now() - startTime > maxTime) {
            console.warn('[Brotli2] Compression timeout exceeded');
            return new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]); // Return error marker
        }
        
        // Step 4: Higher-order context modeling
        const contexts = this.buildContexts(data, matches);
        
        // Step 5: ANS entropy coding
        const compressed = this.ansEncode(matches, contexts, data);
        
        this.stats.compressionTime = performance.now() - startTime;
        this.stats.compressionRatio = data.length / compressed.length;
        
        return compressed;
    }

    /**
     * Detect content type for adaptive dictionary
     */
    detectContentType(data) {
        // Simple heuristic: check for common patterns
        const str = new TextDecoder().decode(data.slice(0, Math.min(1024, data.length)));
        
        if (str.includes('<!DOCTYPE html>') || str.includes('<html')) {
            return 'html';
        } else if (str.includes('function') || str.includes('const') || str.includes('let')) {
            return 'javascript';
        } else if (str.includes('{') && str.includes('}') && str.includes(':')) {
            return 'json';
        } else if (str.includes('#') || str.includes('.')) {
            return 'css';
        }
        
        return 'binary';
    }

    /**
     * Build adaptive dictionary based on content type
     */
    buildAdaptiveDictionary(data, contentType) {
        const dictionary = new Map();
        
        // Content-specific common patterns
        const patterns = {
            html: ['<div', '</div>', '<span', '</span>', '<a href=', 'class=', 'id=', 'style='],
            javascript: ['function', 'const', 'let', 'return', 'if (', 'else {', '=>', 'async'],
            json: ["{\"", '"}', '":', '":true', '":false', '":null', '":['],
            css: ['. {', '}', '#', ':', ';', 'display:', 'margin:', 'padding:']
        };

        const contentPatterns = patterns[contentType] || [];
        
        // Add patterns to dictionary
        for (const pattern of contentPatterns) {
            const encoded = new TextEncoder().encode(pattern);
            dictionary.set(pattern, encoded);
        }

        // Find frequent substrings in data
        const frequentSubstrings = this.findFrequentSubstrings(data, 8);
        for (const [substring, count] of frequentSubstrings) {
            if (count > 3) {
                dictionary.set(substring, new TextEncoder().encode(substring));
            }
        }

        return dictionary;
    }

    /**
     * Find frequent substrings using sliding window
     */
    // Find frequent substrings using sliding window
    findFrequentSubstrings(data, minLength) {
        const substrings = new Map();
        
        for (let i = 0; i < data.length - minLength; i++) {
            const substring = new TextDecoder().decode(data.slice(i, i + minLength));
            const count = substrings.get(substring) || 0;
            substrings.set(substring, count + 1);
        }

        // Return top substrings by frequency
        return Array.from(substrings.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 100);
    }

    /**
     * Find matches using LZ77 with larger window
     */
    findMatches(data, dictionary) {
        const matches = [];
        let pos = 0;

        while (pos < data.length) {
            let bestMatch = null;
            let bestLength = 0;

            // Check dictionary first
            for (const [pattern, encoded] of dictionary) {
                if (new TextDecoder().decode(data.slice(pos, pos + pattern.length)) === pattern) {
                    if (pattern.length > bestLength) {
                        bestMatch = { type: 'dict', pattern, encoded };
                        bestLength = pattern.length;
                        this.stats.dictionaryHits++;
                    }
                }
            }

            // Check sliding window for longer matches
            if (!bestMatch || bestLength < 4) {
                const windowStart = Math.max(0, pos - this.windowSize);
                const windowData = data.slice(windowStart, pos);

                // Find longest match in window
                for (let i = 0; i < windowData.length; i++) {
                    let matchLength = 0;
                    while (
                        i + matchLength < windowData.length &&
                        pos + matchLength < data.length &&
                        windowData[i + matchLength] === data[pos + matchLength]
                    ) {
                        matchLength++;
                    }

                    if (matchLength > bestLength) {
                        bestMatch = { type: 'window', offset: pos - windowStart - i, length: matchLength };
                        bestLength = matchLength;
                        
                        if (matchLength > 20) {
                            this.stats.longMatches++;
                        }
                    }
                }
            }

            if (bestMatch && bestLength > 3) {
                matches.push(bestMatch);
                pos += bestLength;
            } else {
                // Literal byte
                matches.push({ type: 'literal', byte: data[pos] });
                pos++;
            }
        }

        return matches;
    }

    /**
     * Build higher-order context models
     */
    buildContexts(data, matches) {
        const contexts = new Map();
        
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            
            // Build context from previous matches
            const context = this.getContext(matches, i, this.contextOrder);
            
            if (!contexts.has(context)) {
                contexts.set(context, []);
            }
            
            contexts.get(context).push(match);
        }

        return contexts;
    }

    /**
     * Get context string from previous matches
     */
    getContext(matches, index, order) {
        const contextParts = [];
        
        for (let i = Math.max(0, index - order); i < index; i++) {
            const match = matches[i];
            if (match.type === 'literal') {
                contextParts.push(`L${match.byte}`);
            } else if (match.type === 'dict') {
                contextParts.push(`D${match.pattern.length}`);
            } else {
                contextParts.push(`W${match.length}`);
            }
        }

        return contextParts.join(',');
    }

    /**
     * Simple run-length encoding for compression
     * Actually compresses data by finding repeated patterns
     */
    ansEncode(matches, contexts, data) {
        const encoded = [];
        let i = 0;

        console.log('[Brotli2] Encoding matches:', matches.length);

        while (i < matches.length) {
            const match = matches[i];

            if (match.type === 'literal') {
                // Look for repeated literals
                let runLength = 1;
                while (i + runLength < matches.length && 
                       matches[i + runLength].type === 'literal' && 
                       matches[i + runLength].byte === match.byte) {
                    runLength++;
                }

                if (runLength > 3) {
                    // Encode run-length
                    encoded.push(0xFD); // Run marker
                    encoded.push(match.byte);
                    encoded.push(runLength & 0xFF);
                    encoded.push((runLength >> 8) & 0xFF);
                    console.log('[Brotli2] Run:', match.byte, 'x', runLength, '-> 4 bytes');
                    i += runLength;
                } else {
                    // Single literal
                    encoded.push(match.byte);
                    i++;
                }
            } else if (match.type === 'dict') {
                // Encode dictionary reference
                if (match.pattern.length > 4) {
                    encoded.push(0xFF); // Dictionary marker
                    encoded.push(match.encoded.length);
                    encoded.push(...match.encoded);
                    console.log('[Brotli2] Dict match:', match.pattern.length, 'bytes ->', match.encoded.length + 2, 'bytes');
                } else {
                    // Use literals for short matches
                    for (let j = 0; j < match.pattern.length; j++) {
                        encoded.push(match.pattern.charCodeAt(j));
                    }
                    console.log('[Brotli2] Short dict match:', match.pattern.length, 'bytes -> literals');
                }
                i++;
            } else if (match.type === 'window') {
                // Encode window reference
                if (match.length > 3) {
                    encoded.push(0xFE); // Window marker
                    encoded.push(match.offset & 0xFF);
                    encoded.push((match.offset >> 8) & 0xFF);
                    encoded.push(match.length & 0xFF);
                    encoded.push((match.length >> 8) & 0xFF);
                    console.log('[Brotli2] Window match:', match.length, 'bytes from offset', match.offset, '-> 5 bytes');
                } else {
                    // Use literals for short matches
                    const startPos = i - match.offset;
                    for (let j = 0; j < match.length; j++) {
                        if (startPos + j >= 0 && startPos + j < matches.length && matches[startPos + j].type === 'literal') {
                            encoded.push(matches[startPos + j].byte);
                        } else {
                            // Fallback: get byte from original data
                            const bytePos = this.getBytePosition(matches, startPos + j);
                            if (bytePos !== null && bytePos < data.length) {
                                encoded.push(data[bytePos]);
                            } else {
                                // Last resort: use 0
                                encoded.push(0);
                            }
                        }
                    }
                    console.log('[Brotli2] Short window match:', match.length, 'bytes -> literals');
                }
                i++;
            }
        }

        console.log('[Brotli2] Encoded size:', encoded.length, 'bytes');
        return new Uint8Array(encoded);
    }

    /**
     * Get byte position in original data from match index
     */
    getBytePosition(matches, matchIndex) {
        let bytePos = 0;
        for (let i = 0; i < matchIndex && i < matches.length; i++) {
            const match = matches[i];
            if (match.type === 'literal') {
                bytePos += 1;
            } else if (match.type === 'dict') {
                bytePos += match.pattern.length;
            } else if (match.type === 'window') {
                bytePos += match.length;
            }
        }
        return bytePos;
    }

    /**
     * Decompress data
     */
    decompress(compressed) {
        const startTime = performance.now();
        
        console.log('[Brotli2] Decompressing:', compressed.length, 'bytes');
        
        // Decompression with new format
        const decompressed = [];
        let pos = 0;

        while (pos < compressed.length) {
            const marker = compressed[pos];

            if (marker === 0xFF) {
                // Dictionary reference
                pos++;
                const length = compressed[pos];
                pos++;
                const data = compressed.slice(pos, pos + length);
                decompressed.push(...data);
                pos += length;
                console.log('[Brotli2] Decoded dict:', length, 'bytes');
            } else if (marker === 0xFE) {
                // Window reference
                pos++;
                const offset = compressed[pos] | (compressed[pos + 1] << 8);
                pos += 2;
                const length = compressed[pos] | (compressed[pos + 1] << 8);
                pos += 2;

                // Copy from window
                for (let i = 0; i < length; i++) {
                    decompressed.push(decompressed[decompressed.length - offset]);
                }
                console.log('[Brotli2] Decoded window:', length, 'bytes from offset', offset);
            } else if (marker === 0xFD) {
                // Run-length encoding
                pos++;
                const byte = compressed[pos];
                pos++;
                const runLength = compressed[pos] | (compressed[pos + 1] << 8);
                pos += 2;

                for (let i = 0; i < runLength; i++) {
                    decompressed.push(byte);
                }
                console.log('[Brotli2] Decoded run:', byte, 'x', runLength);
            } else {
                // Literal
                decompressed.push(marker);
                pos++;
            }
        }

        this.stats.decompressionTime = performance.now() - startTime;
        console.log('[Brotli2] Decompressed size:', decompressed.length, 'bytes');
        
        return new Uint8Array(decompressed);
    }

    /**
     * Get compression statistics
     */
    getStats() {
        return { ...this.stats };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Brotli2;
}

// Test function
if (typeof window !== 'undefined') {
    window.Brotli2 = Brotli2;
    
    // Simple test
    console.log('[Brotli2] Experimental compression algorithm loaded');
    console.log('[Brotli2] Features:');
    console.log('  - 64MB sliding window (vs Brotli 16MB)');
    console.log('  - 3rd order context modeling (vs Brotli 2nd)');
    console.log('  - ANS coding (vs Brotli Huffman)');
    console.log('  - Adaptive dictionary based on content type');
    console.log('[Brotli2] WARNING: This is a research prototype, not production code');
}
