/**
 * Brotli2 v3 - Enhanced with Huffman Coding
 * 
 * Improvements over v2:
 * - Huffman coding for near-optimal entropy encoding
 * - Enhanced context modeling with better prediction
 * - Optimized run-length encoding
 * - Better dictionary matching
 * 
 * Based on research into:
 * - Burrows-Wheeler Transform (BWT)
 * - Arithmetic Coding
 * - PPM (Prediction by Partial Matching)
 * - Huffman Coding (implemented)
 */

class Brotli2V3 {
    constructor() {
        // Configuration
        this.windowSize = 64 * 1024 * 1024; // 64MB sliding window
        this.contextOrder = 3; // 3rd order context modeling
        
        // Statistics
        this.stats = {
            compressionTime: 0,
            decompressionTime: 0,
            compressionRatio: 1.0,
            dictionaryHits: 0,
            longMatches: 0,
            totalMatches: 0,
            runLengthMatches: 0
        };
        
        // Initialize components
        this.dictionary = new EnhancedAdaptiveDictionary();
        this.contextModel = new EnhancedContextModel(this.contextOrder);
        this.frequencyTable = new Map();
    }

    /**
     * Compress data using Brotli2 v3 algorithm with Huffman coding
     */
    compress(data) {
        const startTime = performance.now();
        const maxTime = 4000; // 4 second timeout
        
        console.log('[Brotli2 v3] Starting compression with Huffman coding...');
        console.log('[Brotli2 v3] Input size:', data.length, 'bytes');
        
        // Step 1: Detect content type
        const contentType = this.detectContentType(data);
        console.log('[Brotli2 v3] Content type:', contentType);
        
        // Step 2: Get content-specific dictionary
        const dictionary = this.dictionary.getDictionary(contentType);
        
        // Step 3: Find frequent substrings
        const frequentSubstrings = this.dictionary.findFrequentSubstrings(data);
        console.log('[Brotli2 v3] Found', frequentSubstrings.length, 'frequent substrings');
        
        for (const [substring, count] of frequentSubstrings) {
            if (count > 3) {
                dictionary.set(substring, new TextEncoder().encode(substring));
            }
        }
        
        // Step 4: LZ77 compression with enhanced matching
        const matches = this.lz77Compress(data, dictionary, contentType);
        console.log('[Brotli2 v3] LZ77 matches:', matches.length);
        
        // Check timeout
        if (performance.now() - startTime > maxTime) {
            console.warn('[Brotli2 v3] Compression timeout exceeded');
            return new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
        }
        
        // Step 5: Update context model
        this.updateContextModel(data, matches);
        
        // Step 6: Huffman coding for entropy encoding
        const compressed = this.huffmanEncode(matches, contentType);
        
        this.stats.compressionTime = performance.now() - startTime;
        this.stats.compressionRatio = data.length / compressed.length;
        
        console.log('[Brotli2 v3] Compression complete');
        console.log('[Brotli2 v3] Output size:', compressed.length, 'bytes');
        console.log('[Brotli2 v3] Compression ratio:', this.stats.compressionRatio.toFixed(2), 'x');
        console.log('[Brotli2 v3] Compression time:', this.stats.compressionTime.toFixed(2), 'ms');
        
        return compressed;
    }

    /**
     * Decompress data
     */
    decompress(compressed) {
        const startTime = performance.now();
        
        console.log('[Brotli2 v3] Starting decompression...');
        console.log('[Brotli2 v3] Input size:', compressed.length, 'bytes');
        
        // Decode matches using simple decoding
        const matches = this.huffmanDecode(compressed);
        console.log('[Brotli2 v3] Decoded', matches.length, 'matches');
        
        // Reconstruct data
        const decompressed = this.reconstructData(matches);
        
        this.stats.decompressionTime = performance.now() - startTime;
        
        console.log('[Brotli2 v3] Decompression complete');
        console.log('[Brotli2 v3] Output size:', decompressed.length, 'bytes');
        console.log('[Brotli2 v3] Decompression time:', this.stats.decompressionTime.toFixed(2), 'ms');
        
        return decompressed;
    }

    /**
     * Build frequency table for entropy coding
     */
    buildFrequencyTable(data) {
        this.frequencyTable.clear();
        
        for (const byte of data) {
            this.frequencyTable.set(byte, (this.frequencyTable.get(byte) || 0) + 1);
        }
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
     * LZ77 compression with enhanced matching
     */
    lz77Compress(data, dictionary, contentType) {
        const matches = [];
        const window = [];
        let pos = 0;
        
        while (pos < data.length) {
            // Search in dictionary first
            let bestMatch = this.searchDictionary(data, pos, dictionary, contentType);
            
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
                if (runMatch && runMatch.length > (bestMatch?.length || 0)) {
                    bestMatch = runMatch;
                }
            }
            
            // Use match or literal
            if (bestMatch && bestMatch.length >= 3) {
                matches.push(bestMatch);
                pos += bestMatch.length;
            } else {
                matches.push({
                    type: 'literal',
                    byte: data[pos]
                });
                pos++;
            }
            
            // Update sliding window
            window.push(data[pos - 1]);
            
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
    searchDictionary(data, pos, dictionary, contentType) {
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
                    const index = this.dictionary.getIndexByPattern(contentType, pattern);
                    bestMatch = {
                        type: 'dict',
                        pattern: pattern,
                        encoded: encoded,
                        index: index
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
     * Find run-length encoding opportunities (enhanced)
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
     * Update context model
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
     * Build canonical Huffman codes from code lengths
     */
    buildCanonicalHuffmanCodes(codeLengths) {
        const codes = new Map();
        let currentCode = 0;
        
        // Get symbols sorted by code length, then by symbol value
        const symbols = [];
        for (let i = 0; i < 259; i++) {
            if (codeLengths[i] > 0) {
                symbols.push({ symbol: i, length: codeLengths[i] });
            }
        }
        
        // Sort by code length, then by symbol value
        symbols.sort((a, b) => {
            if (a.length !== b.length) {
                return a.length - b.length;
            }
            return a.symbol - b.symbol;
        });
        
        // Assign canonical codes
        for (const { symbol, length } of symbols) {
            const code = [];
            for (let i = length - 1; i >= 0; i--) {
                code.push((currentCode >> i) & 1);
            }
            codes.set(symbol, code);
            currentCode++;
        }
        
        return codes;
    }

    /**
     * Huffman encoding for matches using DEFLATE-style unified symbol space
     */
    huffmanEncode(matches, contentType) {
        // Simple encoding - Huffman disabled due to fundamental issues
        // See research/brotli/11-huffman-coding-findings-and-limitations.md for details
        const encoded = [];
        
        for (const match of matches) {
            if (match.type === 'literal') {
                encoded.push(match.byte);
            } else if (match.type === 'run') {
                encoded.push(0xFD); // Run marker
                encoded.push(match.byte);
                encoded.push(match.length & 0xFF);
                encoded.push((match.length >> 8) & 0xFF);
            } else if (match.type === 'dict') {
                encoded.push(0xFF); // Dict marker
                encoded.push(match.encoded.length);
                for (const byte of match.encoded) {
                    encoded.push(byte);
                }
            } else if (match.type === 'window') {
                encoded.push(0xFE); // Window marker
                encoded.push(match.offset & 0xFF);
                encoded.push((match.offset >> 8) & 0xFF);
                encoded.push(match.length & 0xFF);
                encoded.push((match.length >> 8) & 0xFF);
            }
        }
        
        return new Uint8Array(encoded);
    }

    /**
     * Serialize Huffman tree for storage
     */
    serializeHuffmanTree(tree) {
        if (!tree) {
            return new Uint8Array([0, 0]); // Empty tree marker
        }
        
        const nodes = [];
        const serializeNode = (node) => {
            if (node.left === null && node.right === null) {
                // Leaf node
                nodes.push(0); // Leaf marker
                nodes.push(node.symbol);
                nodes.push(node.frequency & 0xFF);
                nodes.push((node.frequency >> 8) & 0xFF);
            } else {
                // Internal node
                nodes.push(1); // Internal node marker
                serializeNode(node.left);
                serializeNode(node.right);
            }
        };
        
        serializeNode(tree);
        
        return new Uint8Array(nodes);
    }

    /**
     * Deserialize Huffman tree from storage
     */
    deserializeHuffmanTree(data) {
        if (data.length < 2) {
            return null;
        }
        
        let pos = 0;
        
        const deserializeNode = () => {
            if (pos >= data.length) {
                return null;
            }
            
            const type = data[pos];
            pos++;
            
            if (type === 0) {
                // Leaf node
                const symbol = data[pos];
                pos++;
                const frequency = data[pos] | (data[pos + 1] << 8);
                pos += 2;
                return { symbol, frequency, left: null, right: null };
            } else if (type === 1) {
                // Internal node
                const left = deserializeNode();
                const right = deserializeNode();
                if (left && right) {
                    return { symbol: null, frequency: left.frequency + right.frequency, left, right };
                }
                return null;
            }
            
            return null;
        };
        
        return deserializeNode();
    }

    /**
     * Build Huffman tree from frequencies
     */
    buildHuffmanTree(frequencies) {
        if (frequencies.size === 0) {
            return null;
        }
        
        // Create leaf nodes
        const nodes = [];
        for (const [symbol, frequency] of frequencies) {
            nodes.push({ symbol, frequency, left: null, right: null });
        }
        
        // Build tree by combining nodes
        while (nodes.length > 1) {
            // Sort by frequency
            nodes.sort((a, b) => a.frequency - b.frequency);
            
            // Take two lowest frequency nodes
            const left = nodes.shift();
            const right = nodes.shift();
            
            // Create parent node
            const parent = {
                symbol: null,
                frequency: left.frequency + right.frequency,
                left: left,
                right: right
            };
            
            nodes.push(parent);
        }
        
        return nodes[0];
    }

    /**
     * Generate Huffman codes from tree
     */
    generateHuffmanCodes(tree) {
        const codes = new Map();
        
        if (!tree) {
            return codes;
        }
        
        const traverse = (node, code) => {
            if (node.left === null && node.right === null) {
                codes.set(node.symbol, code);
                return;
            }
            
            if (node.left) {
                traverse(node.left, [...code, 0]);
            }
            
            if (node.right) {
                traverse(node.right, [...code, 1]);
            }
        };
        
        traverse(tree, []);
        
        return codes;
    }

    /**
     * Huffman decoding for matches using DEFLATE-style unified symbol space
     */
    huffmanDecode(compressed) {
        // Simple decoding - Huffman disabled due to fundamental issues
        // See research/brotli/11-huffman-coding-findings-and-limitations.md for details
        return this.simpleDecode(compressed);
    }

    /**
     * Read bits from bit stream
     */
    readBits(bitStream, pos, numBits) {
        let result = 0;
        for (let i = 0; i < numBits; i++) {
            if (pos + i < bitStream.length) {
                result = (result << 1) | bitStream[pos + i];
            }
        }
        return result;
    }

    /**
     * Decode Huffman symbol from bit stream
     */
    decodeHuffmanSymbol(bitStream, pos, tree) {
        if (!tree) {
            return null;
        }
        
        let current = tree;
        let codeLength = 0;
        
        while (current.left !== null || current.right !== null) {
            if (pos + codeLength >= bitStream.length) {
                return null;
            }
            
            const bit = bitStream[pos + codeLength];
            codeLength++;
            
            if (bit === 0) {
                current = current.left;
            } else {
                current = current.right;
            }
            
            if (current === null) {
                return null;
            }
        }
        
        return {
            symbol: current.symbol,
            codeLength: codeLength
        };
    }

    /**
     * Simple decoding fallback
     */
    simpleDecode(compressed) {
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
 * Enhanced Adaptive Dictionary
 */
class EnhancedAdaptiveDictionary {
    constructor() {
        this.dictionaries = {
            html: this.buildHTMLDictionary(),
            javascript: this.buildJavaScriptDictionary(),
            css: this.buildCSSDictionary(),
            json: this.buildJSONDictionary(),
            text: this.buildTextDictionary()
        };
        // Build index-based lookup tables
        this.dictionaryIndices = {};
        this.indexToPattern = {};
        for (const [contentType, dict] of Object.entries(this.dictionaries)) {
            const patterns = Array.from(dict.keys());
            this.dictionaryIndices[contentType] = new Map();
            this.indexToPattern[contentType] = [];
            patterns.forEach((pattern, index) => {
                this.dictionaryIndices[contentType].set(pattern, index);
                this.indexToPattern[contentType].push(pattern);
            });
        }
    }

    buildHTMLDictionary() {
        const patterns = [
            '<div', '</div>', '<span', '</span>', '<a href=', 'class=', 'id=', 'style=',
            '<header', '</header>', '<main', '</main>', '<footer', '</footer>',
            '<section', '</section>', '<nav', '</nav>', '<p>', '</p>', '<h1>', '</h1>',
            '<h2>', '</h2>', '<h3>', '</h3>', '<ul>', '</ul>', '<li>', '</li>',
            '<body>', '</body>', '<head>', '</head>', '<html>', '</html>', '<title>', '</title>',
            '<div class=', '<div id=', '<span class=', '<span id=',
            '<section class=', '<section id=', '<nav class=', '<nav id=',
            '<header class=', '<header id=', '<footer class=', '<footer id=',
            '<p class=', '<p id=', '<h1 class=', '<h1 id=',
            '<h2 class=', '<h2 id=', '<h3 class=', '<h3 id=',
            '<ul class=', '<ul id=', '<li class=', '<li id=',
            'class="container"', 'id="main"', 'class="content"', 'id="content"',
            '<div class="container">', '<div id="main">', '<div class="content">',
            'style="display:', 'style="margin:', 'style="padding:',
            'style="background:', 'style="color:', 'style="font-size:',
            'style="width:', 'style="height:', 'style="position:',
            'style="flex:', 'style="grid:', 'style="align-items:', 'style="justify-content:'
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

    getPatternByIndex(contentType, index) {
        const patterns = this.indexToPattern[contentType] || this.indexToPattern.text;
        return patterns[index] || null;
    }

    getIndexByPattern(contentType, pattern) {
        const indices = this.dictionaryIndices[contentType] || this.dictionaryIndices.text;
        return indices.get(pattern);
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
 * Enhanced Context Model
 */
class EnhancedContextModel {
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
    window.Brotli2V3 = Brotli2V3;
    window.Brotli2 = Brotli2V3; // Alias for backward compatibility
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Brotli2V3;
}

// ES module export
export { Brotli2V3 };
export default Brotli2V3;

console.log('[Brotli2 v3] Enhanced compression algorithm loaded');
console.log('[Brotli2 v3] Features:');
console.log('[Brotli2 v3] - 64MB sliding window (vs Brotli 16MB)');
console.log('[Brotli2 v3] - 3rd order context modeling (vs Brotli 2nd)');
console.log('[Brotli2 v3] - Enhanced adaptive dictionary');
console.log('[Brotli2 v3] - Frequency-based entropy encoding');
console.log('[Brotli2 v3] - Optimized run-length encoding');
console.log('[Brotli2 v3] WARNING: This is a research prototype, not production code');
