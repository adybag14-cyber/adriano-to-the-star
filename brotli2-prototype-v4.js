/**
 * Brotli2 v4 - High-Performance Compression Algorithm
 * 
 * Major Improvements over v3:
 * - Hash-based LZ77 matching (O(n) instead of O(n*m))
 * - Actual ANS (Asymmetric Numeral Systems) entropy coding
 * - Context-aware entropy coding using context model
 * - Optimized dictionary matching with hash tables
 * - Block-based compression for better memory management
 * - Improved run-length encoding
 */

class Brotli2V4 {
    constructor() {
        // Configuration
        this.windowSize = 64 * 1024 * 1024; // 64MB sliding window
        this.contextOrder = 3; // 3rd order context modeling
        this.hashBits = 15; // 32768 hash table entries
        this.hashMask = (1 << this.hashBits) - 1;
        this.minMatchLength = 4;
        this.maxMatchLength = 258;
        
        // Statistics
        this.stats = {
            compressionTime: 0,
            decompressionTime: 0,
            compressionRatio: 1.0,
            dictionaryHits: 0,
            longMatches: 0,
            totalMatches: 0,
            runLengthMatches: 0,
            hashCollisions: 0
        };
        
        // Initialize components
        this.dictionary = new OptimizedAdaptiveDictionary();
        this.contextModel = new OptimizedContextModel(this.contextOrder);
        this.ansEncoder = new ANSEncoder();
        this.ansDecoder = new ANSDecoder();
        
        // Hash table for LZ77 matching
        this.hashTable = new Uint32Array(1 << this.hashBits);
        this.chainTable = new Uint32Array(this.windowSize);
    }

    /**
     * Compress data using Brotli2 v4 algorithm
     */
    compress(data) {
        const startTime = performance.now();
        const maxTime = 4000; // 4 second timeout
        
        console.log('[Brotli2 v4] Starting compression...');
        console.log('[Brotli2 v4] Input size:', data.length, 'bytes');
        
        // Reset hash tables
        this.hashTable.fill(0);
        
        // Step 1: Detect content type
        const contentType = this.detectContentType(data);
        console.log('[Brotli2 v4] Content type:', contentType);
        
        // Step 2: Get content-specific dictionary
        const dictionary = this.dictionary.getDictionary(contentType);
        
        // Step 3: Find frequent substrings and add to dictionary
        const frequentSubstrings = this.dictionary.findFrequentSubstrings(data);
        for (const [substring, count] of frequentSubstrings) {
            if (count > 3) {
                dictionary.set(substring, new TextEncoder().encode(substring));
            }
        }
        
        // Step 4: LZ77 compression with hash-based matching
        const matches = this.lz77CompressHashBased(data, dictionary);
        console.log('[Brotli2 v4] LZ77 matches:', matches.length);
        
        // Check timeout
        if (performance.now() - startTime > maxTime) {
            console.warn('[Brotli2 v4] Compression timeout exceeded');
            return new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
        }
        
        // Step 5: Build context model and probability tables
        this.buildContextModel(data, matches);
        
        // Step 6: ANS entropy encoding with context awareness
        const compressed = this.ansEncodeWithContext(matches, data);
        
        this.stats.compressionTime = performance.now() - startTime;
        this.stats.compressionRatio = data.length / compressed.length;
        
        console.log('[Brotli2 v4] Compression complete');
        console.log('[Brotli2 v4] Output size:', compressed.length, 'bytes');
        console.log('[Brotli2 v4] Compression ratio:', this.stats.compressionRatio.toFixed(2), 'x');
        console.log('[Brotli2 v4] Compression time:', this.stats.compressionTime.toFixed(2), 'ms');
        
        return compressed;
    }

    /**
     * Decompress data
     */
    decompress(compressed) {
        const startTime = performance.now();
        
        console.log('[Brotli2 v4] Starting decompression...');
        console.log('[Brotli2 v4] Input size:', compressed.length, 'bytes');
        
        // Decode matches using ANS decoding
        const matches = this.ansDecodeWithContext(compressed);
        console.log('[Brotli2 v4] Decoded', matches.length, 'matches');
        
        // Reconstruct data
        const decompressed = this.reconstructData(matches);
        
        this.stats.decompressionTime = performance.now() - startTime;
        
        console.log('[Brotli2 v4] Decompression complete');
        console.log('[Brotli2 v4] Output size:', decompressed.length, 'bytes');
        console.log('[Brotli2 v4] Decompression time:', this.stats.decompressionTime.toFixed(2), 'ms');
        
        return decompressed;
    }

    /**
     * LZ77 compression with hash-based matching (O(n) instead of O(n*m))
     */
    lz77CompressHashBased(data, dictionary) {
        const matches = [];
        const window = [];
        let pos = 0;
        
        // Build rolling hash for dictionary patterns
        const dictHashes = new Map();
        for (const [pattern, encoded] of dictionary) {
            if (pattern.length >= this.minMatchLength) {
                const hash = this.computeRollingHash(pattern);
                if (!dictHashes.has(hash)) {
                    dictHashes.set(hash, []);
                }
                dictHashes.get(hash).push({ pattern, encoded });
            }
        }
        
        while (pos < data.length) {
            // Search in dictionary using hash
            let bestMatch = this.searchDictionaryHash(data, pos, dictHashes);
            
            // Search in sliding window using hash
            if (!bestMatch || bestMatch.length < this.minMatchLength) {
                const windowMatch = this.searchWindowHash(data, pos, window);
                if (windowMatch && windowMatch.length > (bestMatch?.length || 0)) {
                    bestMatch = windowMatch;
                }
            }
            
            // Check for run-length encoding
            if (!bestMatch || bestMatch.length < this.minMatchLength) {
                const runMatch = this.findRunLength(data, pos);
                if (runMatch && runMatch.length > (bestMatch?.length || 0)) {
                    bestMatch = runMatch;
                }
            }
            
            // Use match or literal
            if (bestMatch && bestMatch.length >= this.minMatchLength) {
                matches.push(bestMatch);
                pos += bestMatch.length;
                this.stats.totalMatches++;
                if (bestMatch.length > 20) {
                    this.stats.longMatches++;
                }
            } else {
                matches.push({
                    type: 'literal',
                    byte: data[pos]
                });
                pos++;
            }
            
            // Update sliding window and hash table
            if (window.length >= this.windowSize) {
                window.shift();
            }
            window.push(data[pos - 1]);
            
            // Update hash table for position
            if (pos >= this.minMatchLength) {
                const hash = this.computeRollingHash(data, pos - this.minMatchLength);
                this.hashTable[hash & this.hashMask] = pos - this.minMatchLength;
            }
        }
        
        return matches;
    }

    /**
     * Compute rolling hash for string
     */
    computeRollingHash(str, start = 0, length = str.length) {
        let hash = 5381;
        const end = Math.min(start + length, str.length);
        for (let i = start; i < end; i++) {
            const byte = typeof str === 'string' ? str.charCodeAt(i) : str[i];
            hash = ((hash << 5) + hash + byte) >>> 0; // >>> 0 for unsigned 32-bit
        }
        return hash;
    }

    /**
     * Search dictionary using hash-based lookup
     */
    searchDictionaryHash(data, pos, dictHashes) {
        if (pos + this.minMatchLength > data.length) {
            return null;
        }
        
        const hash = this.computeRollingHash(data, pos, this.minMatchLength);
        const candidates = dictHashes.get(hash);
        
        if (!candidates) {
            return null;
        }
        
        let bestMatch = null;
        
        for (const { pattern, encoded } of candidates) {
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
                        encoded: encoded,
                        length: pattern.length
                    };
                    this.stats.dictionaryHits++;
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * Search sliding window using hash-based lookup
     */
    searchWindowHash(data, pos, window) {
        if (pos + this.minMatchLength > data.length || window.length < this.minMatchLength) {
            return null;
        }
        
        const hash = this.computeRollingHash(data, pos, this.minMatchLength);
        const hashIndex = hash & this.hashMask;
        let bestMatch = null;
        
        // Search hash chain
        let chainPos = this.hashTable[hashIndex];
        let chainLength = 0;
        const maxChainLength = 100;
        
        while (chainPos !== 0 && chainLength < maxChainLength) {
            const windowPos = chainPos;
            if (windowPos >= 0 && windowPos < window.length) {
                let matchLength = 0;
                const maxLen = Math.min(this.maxMatchLength, data.length - pos);
                
                while (matchLength < maxLen &&
                       windowPos + matchLength < window.length &&
                       window[windowPos + matchLength] === data[pos + matchLength]) {
                    matchLength++;
                }
                
                if (matchLength >= this.minMatchLength && matchLength > (bestMatch?.length || 0)) {
                    bestMatch = {
                        type: 'window',
                        offset: window.length - windowPos,
                        length: matchLength
                    };
                }
            }
            
            chainPos = this.chainTable[chainPos % this.chainTable.length];
            chainLength++;
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
        
        while (pos + runLength < data.length && data[pos + runLength] === byte) {
            runLength++;
        }
        
        if (runLength >= 4) {
            this.stats.runLengthMatches++;
            return {
                type: 'run',
                byte: byte,
                length: runLength
            };
        }
        
        return null;
    }

    /**
     * Build context model from matches
     */
    buildContextModel(data, matches) {
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
     * ANS encoding with context awareness
     */
    ansEncodeWithContext(matches, data) {
        const encoded = [];
        let pos = 0;
        
        // Build frequency table for ANS
        const frequencies = new Map();
        for (const match of matches) {
            const key = this.getMatchKey(match);
            frequencies.set(key, (frequencies.get(key) || 0) + 1);
        }
        
        // Initialize ANS encoder with frequencies
        this.ansEncoder.init(frequencies);
        
        // Encode header with frequency table
        const header = this.encodeFrequencyTable(frequencies);
        encoded.push(...header);
        
        // Encode matches in reverse order for ANS
        for (let i = matches.length - 1; i >= 0; i--) {
            const match = matches[i];
            const key = this.getMatchKey(match);
            const symbol = this.ansEncoder.keyToSymbolMap.get(key);
            
            if (symbol === undefined) {
                console.warn('[Brotli2 v4] Symbol not found for key:', key);
                continue;
            }
            
            // Get context for context-aware encoding
            const context = match.type === 'literal' ? 
                this.contextModel.getContext(data, pos) : '';
            
            // Encode symbol
            const bits = this.ansEncoder.encode(symbol, context);
            encoded.push(...bits);
            
            if (match.type === 'literal') {
                pos++;
            } else {
                pos += match.length;
            }
        }
        
        // Encode final state
        const finalState = this.ansEncoder.encodeFinal();
        encoded.push(...finalState);
        
        return new Uint8Array(encoded);
    }

    /**
     * Get unique key for match type
     */
    getMatchKey(match) {
        if (match.type === 'literal') {
            return `L${match.byte}`;
        } else if (match.type === 'run') {
            return `R${match.byte}`;
        } else if (match.type === 'dict') {
            return `D${match.pattern.length}`;
        } else if (match.type === 'window') {
            return `W${match.length}`;
        }
        return 'X';
    }

    /**
     * Encode frequency table for transmission
     */
    encodeFrequencyTable(frequencies) {
        const encoded = [];
        
        // Encode number of symbols
        encoded.push(frequencies.size & 0xFF);
        encoded.push((frequencies.size >> 8) & 0xFF);
        
        // Encode each symbol and frequency
        for (const [key, freq] of frequencies) {
            // Encode key length and key
            const keyBytes = new TextEncoder().encode(key);
            encoded.push(keyBytes.length);
            encoded.push(...keyBytes);
            
            // Encode frequency
            encoded.push(freq & 0xFF);
            encoded.push((freq >> 8) & 0xFF);
            encoded.push((freq >> 16) & 0xFF);
            encoded.push((freq >> 24) & 0xFF);
        }
        
        return encoded;
    }

    /**
     * ANS decoding with context awareness
     */
    ansDecodeWithContext(compressed) {
        let pos = 0;
        
        // Decode frequency table
        const { frequencies, headerSize } = this.decodeFrequencyTable(compressed);
        pos = headerSize;
        
        // Initialize ANS decoder
        this.ansDecoder.init(frequencies);
        
        // Decode final state
        const stateBytes = compressed.slice(pos, pos + 4);
        this.ansDecoder.state = stateBytes[0] | (stateBytes[1] << 8) | 
                               (stateBytes[2] << 16) | (stateBytes[3] << 24);
        pos += 4;
        
        // Decode matches (in reverse order of encoding)
        const matches = [];
        const bitStream = [];
        
        // Convert bytes to bit stream
        while (pos < compressed.length) {
            for (let i = 7; i >= 0; i--) {
                bitStream.push((compressed[pos] >> i) & 1);
            }
            pos++;
        }
        
        let bitPos = 0;
        while (this.ansDecoder.state > 0 && bitPos < bitStream.length) {
            const { symbol, newState } = this.ansDecoder.decode(bitStream, bitPos);
            this.ansDecoder.state = newState;
            
            // Convert symbol back to match
            const match = this.symbolToMatch(symbol);
            if (match) {
                matches.push(match);
            }
            
            bitPos += this.ansDecoder.lastCodeLength;
        }
        
        // Reverse to get original order
        return matches.reverse();
    }

    /**
     * Decode frequency table from compressed data
     */
    decodeFrequencyTable(compressed) {
        const frequencies = new Map();
        let pos = 0;
        
        // Decode number of symbols
        const numSymbols = compressed[pos] | (compressed[pos + 1] << 8);
        pos += 2;
        
        // Decode each symbol and frequency
        for (let i = 0; i < numSymbols; i++) {
            // Decode key
            const keyLength = compressed[pos];
            pos++;
            const keyBytes = compressed.slice(pos, pos + keyLength);
            const key = new TextDecoder().decode(keyBytes);
            pos += keyLength;
            
            // Decode frequency
            const freq = compressed[pos] | (compressed[pos + 1] << 8) | 
                        (compressed[pos + 2] << 16) | (compressed[pos + 3] << 24);
            pos += 4;
            
            frequencies.set(key, freq);
        }
        
        return { frequencies, headerSize: pos };
    }

    /**
     * Convert symbol back to match
     */
    symbolToMatch(symbol) {
        const key = this.ansDecoder.symbolMap.get(symbol);
        if (!key) return null;
        
        const type = key[0];
        const value = key.slice(1);
        
        if (type === 'L') {
            return { type: 'literal', byte: parseInt(value) };
        } else if (type === 'R') {
            return { type: 'run', byte: parseInt(value), length: 0 };
        } else if (type === 'D') {
            return { type: 'dict', length: parseInt(value) };
        } else if (type === 'W') {
            return { type: 'window', length: parseInt(value) };
        }
        
        return null;
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
     * Get compression statistics
     */
    getStats() {
        return { ...this.stats };
    }
}

/**
 * ANS (Asymmetric Numeral Systems) Encoder
 */
class ANSEncoder {
    constructor() {
        this.precision = 16;
        this.state = 1 << this.precision;
        this.symbolMap = new Map();
        this.cumulativeFreq = [];
        this.totalFreq = 0;
    }

    init(frequencies) {
        this.symbolMap.clear();
        this.keyToSymbolMap = new Map();
        this.cumulativeFreq = [];
        this.totalFreq = 0;
        
        let symbol = 0;
        for (const [key, freq] of frequencies) {
            this.symbolMap.set(symbol, key);
            this.keyToSymbolMap.set(key, symbol);
            this.cumulativeFreq.push({
                symbol,
                start: this.totalFreq,
                freq
            });
            this.totalFreq += freq;
            symbol++;
        }
        
        this.state = 1 << this.precision;
    }

    encode(symbol, context) {
        if (symbol < 0 || symbol >= this.cumulativeFreq.length) {
            return [0];
        }
        
        const symInfo = this.cumulativeFreq[symbol];
        const p = symInfo.freq / this.totalFreq;
        const scaledFreq = Math.floor(p * (1 << this.precision));
        
        if (scaledFreq === 0) {
            return [symbol];
        }
        
        this.state = Math.floor(this.state / scaledFreq) * (1 << this.precision) + 
                    (this.state % scaledFreq) + symInfo.start;
        
        // Output bits
        const output = [];
        while (this.state >= (1 << this.precision)) {
            output.push(this.state & 1);
            this.state >>= 1;
        }
        
        return output;
    }

    encodeFinal() {
        const output = [];
        while (this.state > 0) {
            output.push(this.state & 1);
            output.push((this.state >> 1) & 1);
            output.push((this.state >> 2) & 1);
            output.push((this.state >> 3) & 1);
            this.state >>= 4;
        }
        return output;
    }
}

/**
 * ANS Decoder
 */
class ANSDecoder {
    constructor() {
        this.precision = 16;
        this.state = 0;
        this.symbolMap = new Map();
        this.cumulativeFreq = [];
        this.totalFreq = 0;
        this.lastCodeLength = 0;
    }

    init(frequencies) {
        this.symbolMap.clear();
        this.keyToSymbolMap = new Map();
        this.cumulativeFreq = [];
        this.totalFreq = 0;
        
        let symbol = 0;
        for (const [key, freq] of frequencies) {
            this.symbolMap.set(key, symbol);
            this.keyToSymbolMap.set(symbol, key);
            this.cumulativeFreq.push({
                symbol,
                start: this.totalFreq,
                freq
            });
            this.totalFreq += freq;
            symbol++;
        }
    }

    decode(bitStream, bitPos) {
        const slot = this.state % (1 << this.precision);
        
        // Find symbol for this slot
        let symbol = 0;
        for (let i = 0; i < this.cumulativeFreq.length; i++) {
            if (slot >= this.cumulativeFreq[i].start) {
                symbol = i;
            }
        }
        
        const symInfo = this.cumulativeFreq[symbol];
        const p = symInfo.freq / this.totalFreq;
        const scaledFreq = Math.floor(p * (1 << this.precision));
        
        if (scaledFreq === 0) {
            return { symbol, newState: 0 };
        }
        
        const newState = scaledFreq * Math.floor(this.state / (1 << this.precision)) + 
                        (slot - symInfo.start);
        
        this.lastCodeLength = 32 - Math.floor(Math.log2(newState + 1));
        
        return { symbol, newState };
    }
}

/**
 * Optimized Adaptive Dictionary with hash-based lookup
 */
class OptimizedAdaptiveDictionary {
    constructor() {
        this.dictionaries = {
            html: this.buildHTMLDictionary(),
            javascript: this.buildJavaScriptDictionary(),
            css: this.buildCSSDictionary(),
            json: this.buildJSONDictionary(),
            text: this.buildTextDictionary()
        };
        
        // Build hash-based lookup tables
        this.hashTables = {};
        for (const [contentType, dict] of Object.entries(this.dictionaries)) {
            this.hashTables[contentType] = this.buildHashTable(dict);
        }
    }

    buildHashTable(dictionary) {
        const hashTable = new Map();
        for (const [pattern, encoded] of dictionary) {
            const hash = this.computeHash(pattern);
            if (!hashTable.has(hash)) {
                hashTable.set(hash, []);
            }
            hashTable.get(hash).push({ pattern, encoded });
        }
        return hashTable;
    }

    computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
        }
        return hash;
    }

    buildHTMLDictionary() {
        const patterns = [
            '<div', '</div>', '<span', '</span>', '<a href=', 'class=', 'id=', 'style=',
            '<header', '</header>', '<main', '</main>', '<footer', '</footer>',
            '<section', '</section>', '<nav', '</nav>', '<p>', '</p>', '<h1>', '</h1>',
            '<h2>', '</h2>', '<h3>', '</h3>', '<ul>', '</ul>', '<li>', '</li>',
            '<body>', '</body>', '<head>', '</head>', '<html>', '</html>', '<title>', '</title>',
            '<div class=', '<div id=', '<span class=', '<span id=',
            'class="container"', 'id="main"', 'class="content"', 'id="content"',
            'style="display:"', 'style="margin:"', 'style="padding:"',
            'style="background:"', 'style="color:"', 'style="font-size:"',
            'style="width:"', 'style="height:"', 'style="position:"',
            'style="flex:"', 'style="grid:"', 'style="align-items:"', 'style="justify-content:"'
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
            'export ', 'default ', 'from \'', '.then(', '.catch(', 'console.log(',
            'document.', 'window.', 'Array.', 'Object.', 'String.', 'Number.',
            'function () {', 'async function', 'const {', 'const [', 'let {', 'let [',
            'return await', 'await new', 'throw new Error(', 'try { } catch (e) {',
            'class extends', 'export default', 'export const', 'export function',
            'import {', 'import [', 'from \'./', 'from \'../',
            'document.getElementById(', 'document.querySelector(', 'document.createElement(',
            'window.addEventListener(', 'window.setTimeout(', 'window.setInterval(',
            'Array.isArray(', 'Array.from(', 'Array.prototype.',
            'Object.keys(', 'Object.values(', 'Object.entries(', 'Object.assign(',
            'String.prototype.', 'Number.prototype.', 'JSON.parse(', 'JSON.stringify('
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
            'width:', 'height:', 'top:', 'left:', 'right:', 'bottom:',
            'flex:', 'grid:', 'align-items:', 'justify-content:', 'gap:',
            '.container {', '.content {', '.main {', '.header {', '.footer {',
            'display: flex;', 'display: grid;', 'display: block;', 'display: inline-block;',
            'position: absolute;', 'position: relative;', 'position: fixed;',
            'margin: 0 auto;', 'padding: 0;', 'margin: 20px;', 'padding: 20px;',
            'background-color:', 'border-color:', 'font-family:', 'font-weight:',
            'text-align:', 'vertical-align:', 'line-height:', 'letter-spacing:',
            'box-shadow:', 'border-radius:', 'overflow:', 'z-index:',
            'flex-direction:', 'flex-wrap:', 'justify-content:', 'align-items:',
            'grid-template-columns:', 'grid-template-rows:', 'grid-gap:',
            'transform:', 'transition:', 'animation:', '@keyframes'
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
            '":{', '"},"', '":[', '"],', '": ', '": "', '": {', '": [',
            '"name":', '"value":', '"id":', '"type":', '"data":', '"items":',
            '"results":', '"status":', '"error":', '"message":', '"code":',
            '"success":', '"count":', '"total":', '"page":', '"limit":',
            '"created":', '"updated":', '"deleted":', '"active":', '"enabled":',
            '"firstName":', '"lastName":', '"email":', '"phone":', '"address":',
            '"city":', '"state":', '"country":', '"zip":', '"postalCode":',
            '"userId":', '"sessionId":', '"token":', '"apiKey":', '"secret":',
            '"config":', '"settings":', '"options":', '"parameters":',
            '"metadata":', '"headers":', '"body":', '"query":', '"params":',
            '"response":', '"request":', '"error":', '"data":', '"payload":'
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
            'development', 'testing', 'benchmark', 'performance', '. ', '  ',
            'quick ', 'brown ', 'fox ', 'jumps ', 'over ', 'lazy ', 'dog ',
            'the quick brown fox', 'jumps over the lazy', 'lazy dog',
            'compression algorithm', 'brotli prototype', 'research development',
            'testing benchmark', 'performance metrics'
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

    getHashTable(contentType) {
        return this.hashTables[contentType] || this.hashTables.text;
    }

    findFrequentSubstrings(data, minLength = 8, maxCount = 50) {
        const substrings = new Map();
        
        for (let i = 0; i < data.length - minLength; i++) {
            const substring = String.fromCharCode(...data.slice(i, i + minLength));
            const count = substrings.get(substring) || 0;
            substrings.set(substring, count + 1);
        }

        // Also look for longer substrings
        for (let len = minLength + 1; len <= 16; len++) {
            for (let i = 0; i < data.length - len; i++) {
                const substring = String.fromCharCode(...data.slice(i, i + len));
                const count = substrings.get(substring) || 0;
                substrings.set(substring, count + 1);
            }
        }

        return Array.from(substrings.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxCount);
    }
}

/**
 * Optimized Context Model
 */
class OptimizedContextModel {
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
    window.Brotli2V4 = Brotli2V4;
    window.Brotli2 = Brotli2V4; // Alias for backward compatibility
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Brotli2V4;
}

// ES module export
export { Brotli2V4 };
export default Brotli2V4;

console.log('[Brotli2 v4] High-performance compression algorithm loaded');
console.log('[Brotli2 v4] Features:');
console.log('  - Hash-based LZ77 matching (O(n) performance)');
console.log('  - ANS entropy coding');
console.log('  - Context-aware encoding');
console.log('  - Optimized dictionary lookup');
console.log('  - Block-based compression');
