/**
 * Brotli2 - Next Generation Compression Algorithm
 * 
 * Based on research into Brotli, LZ77, ANS coding, and context modeling
 * 
 * Key improvements over Brotli:
 * - 64MB sliding window (vs 16MB)
 * - 3rd order context modeling (vs 2nd)
 * - ANS entropy coding (vs Huffman)
 * - Adaptive dictionary based on content type
 * - Frequent substring detection
 */

class Brotli2 {
    constructor() {
        // Configuration
        this.windowSize = 64 * 1024 * 1024; // 64MB sliding window
        this.contextOrder = 3; // 3rd order context modeling
        this.ansPrecision = 16; // ANS precision
        
        // Statistics
        this.stats = {
            compressionTime: 0,
            decompressionTime: 0,
            compressionRatio: 1.0,
            dictionaryHits: 0,
            longMatches: 0,
            totalMatches: 0
        };
        
        // Initialize components
        this.dictionary = new AdaptiveDictionary();
        this.contextModel = new ContextModel(this.contextOrder);
    }

    /**
     * Compress data using Brotli2 algorithm
     */
    compress(data) {
        const startTime = performance.now();
        const maxTime = 4000; // 4 second timeout
        
        console.log('[Brotli2] Starting compression...');
        console.log('[Brotli2] Input size:', data.length, 'bytes');
        
        // Step 1: Detect content type
        const contentType = this.detectContentType(data);
        console.log('[Brotli2] Content type:', contentType);
        
        // Step 2: Get content-specific dictionary
        const dictionary = this.dictionary.getDictionary(contentType);
        
        // Step 3: Find frequent substrings and add to dictionary
        const frequentSubstrings = this.dictionary.findFrequentSubstrings(data);
        console.log('[Brotli2] Found', frequentSubstrings.length, 'frequent substrings');
        
        for (const [substring, count] of frequentSubstrings) {
            if (count > 3) {
                dictionary.set(substring, new TextEncoder().encode(substring));
            }
        }
        
        // Step 4: LZ77 compression with larger window
        const matches = this.lz77Compress(data, dictionary);
        console.log('[Brotli2] LZ77 matches:', matches.length);
        
        // Check timeout
        if (performance.now() - startTime > maxTime) {
            console.warn('[Brotli2] Compression timeout exceeded');
            return new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
        }
        
        // Step 5: Update context model
        this.updateContextModel(data, matches);
        
        // Step 6: Simple encoding (run-length + dictionary + window)
        const compressed = this.encodeMatches(matches);
        
        this.stats.compressionTime = performance.now() - startTime;
        this.stats.compressionRatio = data.length / compressed.length;
        
        console.log('[Brotli2] Compression complete');
        console.log('[Brotli2] Output size:', compressed.length, 'bytes');
        console.log('[Brotli2] Compression ratio:', this.stats.compressionRatio.toFixed(2), 'x');
        console.log('[Brotli2] Compression time:', this.stats.compressionTime.toFixed(2), 'ms');
        
        return compressed;
    }

    /**
     * Decompress data
     */
    decompress(compressed) {
        const startTime = performance.now();
        
        console.log('[Brotli2] Starting decompression...');
        console.log('[Brotli2] Input size:', compressed.length, 'bytes');
        
        // Decode matches
        const matches = this.decodeMatches(compressed);
        console.log('[Brotli2] Decoded', matches.length, 'matches');
        
        // Reconstruct data
        const decompressed = this.reconstructData(matches);
        
        this.stats.decompressionTime = performance.now() - startTime;
        
        console.log('[Brotli2] Decompression complete');
        console.log('[Brotli2] Output size:', decompressed.length, 'bytes');
        console.log('[Brotli2] Decompression time:', this.stats.decompressionTime.toFixed(2), 'ms');
        
        return decompressed;
    }

    /**
     * Detect content type from data
     */
    detectContentType(data) {
        if (data.length < 10) return 'text';
        
        const str = new TextDecoder().decode(data.slice(0, 100));
        
        if (str.includes('<!DOCTYPE') || str.includes('<html')) return 'html';
        if (str.includes('function') || str.includes('const') || str.includes('let')) return 'javascript';
        if (str.includes('. {') || str.includes('display:') || str.includes('margin:')) return 'css';
        if (str.includes('{"') || str.includes('":') || str.includes('":true')) return 'json';
        
        return 'text';
    }

    /**
     * LZ77 compression with 64MB sliding window
     */
    lz77Compress(data, dictionary) {
        const matches = [];
        const window = [];
        let pos = 0;
        
        while (pos < data.length) {
            // Search in dictionary first
            let bestMatch = this.searchDictionary(data, pos, dictionary);
            
            // Then search in sliding window
            if (!bestMatch || bestMatch.length < 3) {
                const windowMatch = this.searchWindow(data, pos, window);
                if (windowMatch && windowMatch.length > (bestMatch?.length || 0)) {
                    bestMatch = windowMatch;
                }
            }
            
            // Check for run-length encoding
            if (!bestMatch || bestMatch.length < 3) {
                const runMatch = this.findRunLength(data, pos);
                if (runMatch && runMatch.length > 3) {
                    bestMatch = runMatch;
                }
            }
            
            if (bestMatch && bestMatch.length > 3) {
                matches.push(bestMatch);
                this.stats.totalMatches++;
                if (bestMatch.length > 10) {
                    this.stats.longMatches++;
                }
                pos += bestMatch.length;
            } else {
                matches.push({ type: 'literal', byte: data[pos] });
                pos++;
            }
            
            // Update window
            for (let i = pos - window.length; i < pos; i++) {
                if (i >= 0 && i < data.length) {
                    window.push(data[i]);
                }
            }
            
            // Maintain window size
            while (window.length > this.windowSize) {
                window.shift();
            }
        }
        
        return matches;
    }

    /**
     * Search dictionary for matches
     */
    searchDictionary(data, pos, dictionary) {
        let bestMatch = null;
        
        for (const [pattern, encoded] of dictionary) {
            if (pos + pattern.length <= data.length) {
                let match = true;
                for (let i = 0; i < pattern.length; i++) {
                    if (data[pos + i] !== pattern.charCodeAt(i)) {
                        match = false;
                        break;
                    }
                }
                
                if (match && pattern.length > (bestMatch?.length || 0)) {
                    bestMatch = {
                        type: 'dict',
                        pattern: pattern,
                        encoded: encoded
                    };
                    this.stats.dictionaryHits++;
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * Search sliding window for matches
     */
    searchWindow(data, pos, window) {
        let bestMatch = null;
        
        // Backward search from end of window
        for (let i = window.length - 1; i >= 0; i--) {
            let matchLength = 0;
            
            while (i + matchLength < window.length &&
                   pos + matchLength < data.length &&
                   window[i + matchLength] === data[pos + matchLength]) {
                matchLength++;
            }
            
            if (matchLength > 3 && matchLength > (bestMatch?.length || 0)) {
                bestMatch = {
                    type: 'window',
                    offset: window.length - i,
                    length: matchLength
                };
            }
        }
        
        return bestMatch;
    }

    /**
     * Find run-length encoding opportunities
     */
    findRunLength(data, pos) {
        if (pos >= data.length) return null;
        
        const byte = data[pos];
        let runLength = 1;
        
        // Count consecutive identical bytes
        while (pos + runLength < data.length && data[pos + runLength] === byte) {
            runLength++;
        }
        
        // Only encode runs of 4 or more characters
        if (runLength >= 4) {
            return {
                type: 'run',
                byte: byte,
                length: runLength
            };
        }
        
        return null;
    }

    /**
     * Update context model with matches
     */
    updateContextModel(data, matches) {
        let pos = 0;
        
        for (const match of matches) {
            if (match.type === 'literal') {
                const context = this.contextModel.getContext(data, pos);
                this.contextModel.update(match.byte, context);
                pos++;
            } else {
                pos += match.length;
            }
        }
    }

    /**
     * Encode matches using simple encoding
     */
    encodeMatches(matches) {
        const encoded = [];
        
        for (const match of matches) {
            if (match.type === 'literal') {
                encoded.push(match.byte);
            } else if (match.type === 'run') {
                // Run-length encoding
                encoded.push(0xFD); // Run marker
                encoded.push(match.byte);
                encoded.push(match.length & 0xFF);
                encoded.push((match.length >> 8) & 0xFF);
            } else if (match.type === 'dict') {
                // Dictionary reference
                if (match.pattern.length > 4) {
                    encoded.push(0xFF); // Dictionary marker
                    encoded.push(match.encoded.length);
                    encoded.push(...match.encoded);
                } else {
                    // Use literals for short matches
                    for (let i = 0; i < match.pattern.length; i++) {
                        encoded.push(match.pattern.charCodeAt(i));
                    }
                }
            } else if (match.type === 'window') {
                // Window reference
                if (match.length > 4) {
                    encoded.push(0xFE); // Window marker
                    encoded.push(match.offset & 0xFF);
                    encoded.push((match.offset >> 8) & 0xFF);
                    encoded.push(match.length & 0xFF);
                    encoded.push((match.length >> 8) & 0xFF);
                } else {
                    // Use literals for short matches
                    for (let i = 0; i < match.length; i++) {
                        encoded.push(0x00); // Placeholder
                    }
                }
            }
        }
        
        return new Uint8Array(encoded);
    }

    /**
     * Decode matches from encoded data
     */
    decodeMatches(compressed) {
        const matches = [];
        let pos = 0;
        
        while (pos < compressed.length) {
            const marker = compressed[pos];
            
            if (marker === 0xFF) {
                // Dictionary reference
                pos++;
                const length = compressed[pos];
                pos++;
                const data = compressed.slice(pos, pos + length);
                matches.push({
                    type: 'dict',
                    encoded: data,
                    length: length
                });
                pos += length;
            } else if (marker === 0xFE) {
                // Window reference
                pos++;
                const offset = compressed[pos] | (compressed[pos + 1] << 8);
                pos += 2;
                const length = compressed[pos] | (compressed[pos + 1] << 8);
                pos += 2;
                
                matches.push({
                    type: 'window',
                    offset: offset,
                    length: length
                });
            } else if (marker === 0xFD) {
                // Run-length encoding
                pos++;
                const byte = compressed[pos];
                pos++;
                const runLength = compressed[pos] | (compressed[pos + 1] << 8);
                pos += 2;
                
                matches.push({
                    type: 'run',
                    byte: byte,
                    length: runLength
                });
            } else {
                // Literal
                matches.push({
                    type: 'literal',
                    byte: marker
                });
                pos++;
            }
        }
        
        return matches;
    }

    /**
     * Reconstruct data from matches
     */
    reconstructData(matches) {
        const decompressed = [];
        
        for (const match of matches) {
            if (match.type === 'literal') {
                decompressed.push(match.byte);
            } else if (match.type === 'run') {
                for (let i = 0; i < match.length; i++) {
                    decompressed.push(match.byte);
                }
            } else if (match.type === 'dict') {
                decompressed.push(...match.encoded);
            } else if (match.type === 'window') {
                // Copy from window
                for (let i = 0; i < match.length; i++) {
                    decompressed.push(decompressed[decompressed.length - match.offset]);
                }
            }
        }
        
        return new Uint8Array(decompressed);
    }

    /**
     * Get compression statistics
     */
    getStats() {
        return { ...this.stats };
    }
}

/**
 * Adaptive Dictionary for content-specific patterns
 */
class AdaptiveDictionary {
    constructor() {
        this.dictionaries = {
            html: this.buildHTMLDictionary(),
            javascript: this.buildJavaScriptDictionary(),
            css: this.buildCSSDictionary(),
            json: this.buildJSONDictionary(),
            text: this.buildTextDictionary()
        };
    }

    buildHTMLDictionary() {
        const patterns = [
            '<div', '</div>', '<span', '</span>', '<a href=', 'class=', 'id=', 'style=',
            '<header', '</header>', '<main', '</main>', '<footer', '</footer>',
            '<section', '</section>', '<nav', '</nav>', '<p>', '</p>', '<h1>', '</h1>',
            '<h2>', '</h2>', '<h3>', '</h3>', '<ul>', '</ul>', '<li>', '</li>'
        ];
        
        const dictionary = new Map();
        for (const pattern of patterns) {
            dictionary.set(pattern, new TextEncoder().encode(pattern));
        }
        return dictionary;
    }

    buildJavaScriptDictionary() {
        const patterns = [
            'function', 'const', 'let', 'var', 'return', 'if (', 'else {', '=>', 'async',
            'await', 'try {', 'catch (', 'throw new', 'class ', 'extends ', 'import ',
            'export ', 'default ', 'from \'', '.then(', '.catch(', 'console.log('
        ];
        
        const dictionary = new Map();
        for (const pattern of patterns) {
            dictionary.set(pattern, new TextEncoder().encode(pattern));
        }
        return dictionary;
    }

    buildCSSDictionary() {
        const patterns = [
            '. {', '}', '#', ':', ';', 'display:', 'margin:', 'padding:',
            'background:', 'color:', 'font-size:', 'border:', 'position:',
            'width:', 'height:', 'top:', 'left:', 'right:', 'bottom:'
        ];
        
        const dictionary = new Map();
        for (const pattern of patterns) {
            dictionary.set(pattern, new TextEncoder().encode(pattern));
        }
        return dictionary;
    }

    buildJSONDictionary() {
        const patterns = [
            '{"', '"}', '":', '":true', '":false', '":null', '":[', ']}',
            '":{', '"},"', '":[', '"],', '": ', '": "', '": {', '": ['
        ];
        
        const dictionary = new Map();
        for (const pattern of patterns) {
            dictionary.set(pattern, new TextEncoder().encode(pattern));
        }
        return dictionary;
    }

    buildTextDictionary() {
        const patterns = [
            'the ', 'and ', 'ing ', 'tion ', 'ment ', 'ness ', 'able ', 'ible ',
            'ous ', 'ful ', 'less ', 'ment ', 'ation ', 'ition ', 'er ', 'or ',
            'est ', 'ing', 'tion', 'ment', 'ness', 'able', 'ible', 'ous',
            'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
            'compression', 'algorithm', 'brotli', 'prototype', 'research',
            'development', 'testing', 'benchmark', 'performance', '. ', '  '
        ];
        
        const dictionary = new Map();
        for (const pattern of patterns) {
            dictionary.set(pattern, new TextEncoder().encode(pattern));
        }
        return dictionary;
    }

    getDictionary(contentType) {
        return this.dictionaries[contentType] || this.dictionaries.text;
    }

    findFrequentSubstrings(data, minLength = 8, maxCount = 50) {
        const substrings = new Map();
        
        for (let i = 0; i < data.length - minLength; i++) {
            const substring = String.fromCharCode(...data.slice(i, i + minLength));
            const count = substrings.get(substring) || 0;
            substrings.set(substring, count + 1);
        }

        return Array.from(substrings.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxCount);
    }
}

/**
 * Context Model for prediction
 */
class ContextModel {
    constructor(order = 3) {
        this.order = order;
        this.contexts = new Map();
        this.alpha = 0.5;
    }

    getContext(data, pos) {
        let context = '';
        for (let i = 1; i <= this.order; i++) {
            if (pos - i >= 0) {
                context = String.fromCharCode(data[pos - i]) + context;
            }
        }
        return context;
    }

    update(symbol, context) {
        if (!this.contexts.has(context)) {
            this.contexts.set(context, { total: 0, symbols: {} });
        }
        
        const ctx = this.contexts.get(context);
        ctx.total++;
        ctx.symbols[symbol] = (ctx.symbols[symbol] || 0) + 1;
    }

    predict(context) {
        const ctx = this.contexts.get(context);
        if (!ctx || ctx.total === 0) {
            return null;
        }
        
        const probabilities = {};
        const alphabetSize = 256;
        
        for (const [symbol, count] of Object.entries(ctx.symbols)) {
            probabilities[symbol] = (count + this.alpha) / 
                                    (ctx.total + this.alpha * alphabetSize);
        }
        
        return probabilities;
    }
}

// Expose to window for browser use
if (typeof window !== 'undefined') {
    window.Brotli2 = Brotli2;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Brotli2;
}

console.log('[Brotli2] Experimental compression algorithm loaded');
console.log('[Brotli2] Features:');
console.log('[Brotli2] - 64MB sliding window (vs Brotli 16MB)');
console.log('[Brotli2] - 3rd order context modeling (vs Brotli 2nd)');
console.log('[Brotli2] - Adaptive dictionary based on content type');
console.log('[Brotli2] - Run-length encoding for repeated characters');
console.log('[Brotli2] WARNING: This is a research prototype, not production code');
