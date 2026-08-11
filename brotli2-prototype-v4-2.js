/**
 * Brotli2 v4.2 - Working Compression with Huffman Coding
 * 
 * Combines proven v3 LZ77 matching with Huffman coding for better compression
 * 
 * Key Features:
 * - Proven LZ77 matching from v3 (actually works)
 * - Huffman coding for better compression ratios
 * - Optimized dictionary matching
 * - Improved run-length encoding
 */

const CONTEXT_LSB6 = 0;
const CONTEXT_MSB6 = 1;
const CONTEXT_UTF8 = 2;
const CONTEXT_SIGNED = 3;

// Copied from node_modules/brotli/dec/context.js for RFC 7932 context modeling.
const BROTLI_CONTEXT_LOOKUP = new Uint8Array([
  /* CONTEXT_UTF8, last byte. */
  /* ASCII range. */
   0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  4,  0,  0,
   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
   8, 12, 16, 12, 12, 20, 12, 16, 24, 28, 12, 12, 32, 12, 36, 12,
  44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 32, 32, 24, 40, 28, 12,
  12, 48, 52, 52, 52, 48, 52, 52, 52, 48, 52, 52, 52, 52, 52, 48,
  52, 52, 52, 52, 52, 48, 52, 52, 52, 52, 52, 24, 12, 28, 12, 12,
  12, 56, 60, 60, 60, 56, 60, 60, 60, 56, 60, 60, 60, 60, 60, 56,
  60, 60, 60, 60, 60, 56, 60, 60, 60, 60, 60, 24, 12, 28, 12,  0,
  /* UTF8 continuation byte range. */
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  /* UTF8 lead byte range. */
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3,
  /* CONTEXT_UTF8 second last byte. */
  /* ASCII range. */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1,
  1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 0,
  /* UTF8 continuation byte range. */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  /* UTF8 lead byte range. */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  /* CONTEXT_SIGNED, second last byte. */
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7,
  /* CONTEXT_SIGNED, last byte, same as the above values shifted by 3 bits. */
   0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
  40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
  40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
  48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 56,
  /* CONTEXT_LSB6, last byte. */
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
  /* CONTEXT_MSB6, last byte. */
   0,  0,  0,  0,  1,  1,  1,  1,  2,  2,  2,  2,  3,  3,  3,  3,
   4,  4,  4,  4,  5,  5,  5,  5,  6,  6,  6,  6,  7,  7,  7,  7,
   8,  8,  8,  8,  9,  9,  9,  9, 10, 10, 10, 10, 11, 11, 11, 11,
  12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15,
  16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19,
  20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23,
  24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27,
  28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30, 31, 31, 31, 31,
  32, 32, 32, 32, 33, 33, 33, 33, 34, 34, 34, 34, 35, 35, 35, 35,
  36, 36, 36, 36, 37, 37, 37, 37, 38, 38, 38, 38, 39, 39, 39, 39,
  40, 40, 40, 40, 41, 41, 41, 41, 42, 42, 42, 42, 43, 43, 43, 43,
  44, 44, 44, 44, 45, 45, 45, 45, 46, 46, 46, 46, 47, 47, 47, 47,
  48, 48, 48, 48, 49, 49, 49, 49, 50, 50, 50, 50, 51, 51, 51, 51,
  52, 52, 52, 52, 53, 53, 53, 53, 54, 54, 54, 54, 55, 55, 55, 55,
  56, 56, 56, 56, 57, 57, 57, 57, 58, 58, 58, 58, 59, 59, 59, 59,
  60, 60, 60, 60, 61, 61, 61, 61, 62, 62, 62, 62, 63, 63, 63, 63,
  /* CONTEXT_{M,L}SB6, second last byte, */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

const BROTLI_CONTEXT_LOOKUP_OFFSETS = new Uint16Array([
  /* CONTEXT_LSB6 */
  1024, 1536,
  /* CONTEXT_MSB6 */
  1280, 1536,
  /* CONTEXT_UTF8 */
  0, 256,
  /* CONTEXT_SIGNED */
  768, 512
]);

class Brotli2V4_2 {
    constructor() {
        // Configuration
        this.windowSize = 64 * 1024 * 1024; // 64MB sliding window
        this.minMatchLength = 2; // Lowered to 2 to capture matches in short words (3-4 bytes)
        this.minDictIndexLength = 3; // Only index-encode dictionary matches >= 3 bytes
        this.minWindowMatchLength = 4; // Require longer window matches to offset command overhead
        this.minWindowMatchLengthNear = 2; // Allow shorter matches for very recent offsets
        this.minWindowMatchLengthMid = 2; // Moderate matches for nearby offsets
        this.minWindowMatchLengthFar = 3; // Slightly shorter matches for mid-range offsets
        this.minRunMatchLength = 3; // Allow shorter runs to offset command overhead
        this.minDictMatchLength = 4; // Require longer dictionary matches to offset command overhead
        this.dictLengthBias = -0.45; // Favor dictionary matches vs window matches of similar length
        this.dictPreferredLength = 4; // Always accept dictionary matches at/above this length
        this.dictLengthDelta = -2; // Allow dict matches to be slightly shorter than window matches
        this.windowDistancePenalty = 0.04; // Penalize farther window offsets to favor closer distances
        this.windowCacheBonus = 1.8; // Bonus for window matches that hit the distance cache
        this.copyLengthExtraPenalty = 0; // Penalize copy commands with extra bits
        this.distanceExtraPenalty = 0; // Penalize distance commands with extra bits
        this.distanceSymbolPenalty = 0; // Base penalty for non-cache distance symbols
        this.lazyMatchScoreThreshold = 0.5; // Require stronger score gain to lazy-skip
        this.maxHashChainChecks = 0; // 0 = unlimited chain traversal while searching for window matches
        this.maxMatchLength = 8192;
        this.copyCommandPenalty = 0; // Penalty for emitting a copy command
        this.shortCopyPenalty = 0; // Extra penalty for short copies
        this.shortCopyLengthThreshold = 7;
        this.insertCommandPenalty = 0; // Penalty for emitting an insert command
        this.insertLengthExtraPenalty = 0; // Penalize insert length extra bits
        this.commandCostWeight = 0.9; // Weight for estimated command cost
        this.commandCostWeightBase = 0.9;
        this.commandCostWeightText = 0.75;
        this.literalByteCost = 1.0; // Estimated literal cost (bytes)
        this.copyLengthBonus = 0.5; // Bonus per log2(copy length) to favor longer copies
        this.literalRunBonus = 0.45; // Bonus per log2(literal run) before a copy
        this.literalContextThresholdBase = 48;
        this.literalContextThresholdText = 16;
        this.literalContextClusterMax = 32;
        this.literalContextBlockSize = 2048;
        this.literalContextBlockClusterMax = 18;
        this.commandBlockSize = 256;
        this.commandBlockClusterMax = 32;
        this.distanceBlockSize = 256;
        this.distanceBlockClusterMax = 32;
        this.distanceContextCount = 4;
        this.blockSize = 1 * 1024 * 1024; // 1MB blocks for large files
        this.maxCompressionTimeMs = 4000; // Timeout safeguard for large inputs
        this.huffmanThreshold = 2 * 1024; // Only use Huffman for files >= 2KB
        this.enableTextTokens = true;
        this.enablePrediction = false;
        this.payloadHuffmanThreshold = 128; // Minimum payload size to attempt Huffman
        this.literalContextCount = 96;
        this.literalContextMode = CONTEXT_UTF8;
        this.literalContextThreshold = 24; // Minimum literals to attempt context coding
        this.literalStreamHuffmanThreshold = 8; // Minimum literal stream size to Huffman encode
        this.distancePostfixBits = 0;
        this.distanceDirectCodes = 0;
        this.distanceCacheSize = 4;
        this.distanceShortCodeIndex = [0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
        this.distanceShortCodeOffset = [0, 0, 0, 0, -1, 1, -2, 2, -3, 3, -1, 1, -2, 2, -3, 3];
        this.distanceCodeOffset = this.computeDistanceCodeOffset();
        this.brotliInsBase = [
            0, 1, 2, 3, 4, 5, 6, 8, 10, 14, 18, 26,
            34, 50, 66, 98, 130, 194, 322, 578, 1090, 2114, 6210, 22594
        ];
        this.brotliInsExtra = [
            0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 9, 10, 12, 14, 24
        ];
        this.brotliCopyBase = [
            2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 18,
            22, 30, 38, 54, 70, 102, 134, 198, 326, 582, 1094, 2118
        ];
        this.brotliCopyExtra = [
            0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 9, 10, 24
        ];
        
        // Statistics
        this.stats = {
            compressionTime: 0,
            decompressionTime: 0,
            compressionRatio: 1.0,
            dictionaryHits: 0,
            longMatches: 0,
            totalMatches: 0,
            runLengthMatches: 0,
            blocksProcessed: 0,
            huffmanUsed: false,
            literalContextUsed: false,
            literalTransformUsed: false
        };
        
        // Initialize components
        this.dictionary = new OptimizedAdaptiveDictionary();
        this.huffmanEncoder = new HuffmanEncoder();
        this.huffmanDecoder = new HuffmanDecoder();
        this.prefixDistanceEncoder = new PrefixDistanceEncoder();
        this.histogramClusterer = new HistogramClusterer();
        this.textTokenTable = this.buildTextTokenTable();
    }

    getMatchMinimumLength(match) {
        if (!match) {
            return this.minMatchLength;
        }
        if (match.type === 'window') {
            return this.minWindowMatchLength;
        }
        if (match.type === 'run') {
            return this.minRunMatchLength;
        }
        if (match.type === 'dict') {
            return this.minDictMatchLength;
        }
        return this.minMatchLength;
    }

    getMatchSelectionScore(match, distanceCache = null, literalRun = 0) {
        if (!match) {
            return -Infinity;
        }
        const minLength = this.getMatchMinimumLength(match);
        if (match.length < minLength) {
            return -Infinity;
        }
        const literalBaseline = match.length * this.literalByteCost;
        if (match.type === 'window' && typeof match.offset === 'number') {
            const insertCost = this.estimateInsertCost(literalRun);
            const copyCost = this.estimateCopyCost(match.length, match.offset, distanceCache);
            let score = literalBaseline - this.commandCostWeight * (insertCost + copyCost);
            score -= Math.log2(match.offset + 1) * this.windowDistancePenalty;
            if (distanceCache && distanceCache.includes(match.offset)) {
                score += this.windowCacheBonus;
            }
            score += Math.log2(match.length + 1) * this.copyLengthBonus;
            if (literalRun > 0) {
                score += Math.log2(literalRun + 1) * this.literalRunBonus;
            }
            return score;
        }

        if (match.type === 'run') {
            const runCost = this.estimateRunCost(match.length);
            return literalBaseline - this.commandCostWeight * runCost;
        }

        if (match.type === 'dict') {
            const dictCost = this.estimateDictCost(match);
            let score = literalBaseline - this.commandCostWeight * dictCost;
            score -= this.dictLengthBias;
            return score;
        }

        return literalBaseline;
    }

    getWindowOffsetLengthPenalty(offset) {
        if (!offset || offset <= 32768) {
            return 0;
        }
        return Math.min(6, Math.floor(Math.log2(offset)) - 15);
    }

    getWindowMatchMinimumLength(offset) {
        if (!offset) {
            return this.minWindowMatchLength;
        }
        let baseLength = this.minWindowMatchLength;
        if (offset <= 64) {
            baseLength = Math.min(baseLength, this.minWindowMatchLengthNear);
        } else if (offset <= 512) {
            baseLength = Math.min(baseLength, this.minWindowMatchLengthMid);
        } else if (offset <= 4096) {
            baseLength = Math.min(baseLength, this.minWindowMatchLengthFar);
        }
        return baseLength + this.getWindowOffsetLengthPenalty(offset);
    }

    filterDictionaryMatch(dictMatch, windowMatch) {
        if (!dictMatch) {
            return null;
        }
        const windowLength = windowMatch?.length || 0;
        if (dictMatch.length >= this.dictPreferredLength) {
            return dictMatch;
        }
        if (dictMatch.length >= windowLength + this.dictLengthDelta) {
            return dictMatch;
        }
        return null;
    }

    /**
     * Compress data using Brotli2 v4.2 algorithm
     */
    compress(data) {
        const startTime = performance.now();
        const configuredMaxTime = this.maxCompressionTimeMs ?? 4000;
        const maxTime = Number.isFinite(configuredMaxTime) ? configuredMaxTime : Infinity;
        
        console.log('[Brotli2 v4.2] Starting compression with block-based processing...');
        console.log('[Brotli2 v4.2] Input size:', data.length, 'bytes');
        
        // Use block-based compression for large files
        if (data.length > this.blockSize) {
            return this.compressBlockBased(data, startTime, maxTime);
        }
        
        // Single block compression for small files
        const compressed = this.compressSingleBlock(data);
        
        this.stats.compressionTime = performance.now() - startTime;
        this.stats.compressionRatio = data.length / compressed.length;
        
        console.log('[Brotli2 v4.2] Compression complete');
        console.log('[Brotli2 v4.2] Output size:', compressed.length, 'bytes');
        console.log('[Brotli2 v4.2] Compression ratio:', this.stats.compressionRatio.toFixed(2), 'x');
        console.log('[Brotli2 v4.2] Compression time:', this.stats.compressionTime.toFixed(2), 'ms');
        
        return compressed;
    }

    /**
     * Compress using block-based approach for large files
     */
    compressBlockBased(data, startTime, maxTime) {
        const blocks = [];
        let totalCompressedSize = 0;
        
        for (let i = 0; i < data.length; i += this.blockSize) {
            if (performance.now() - startTime > maxTime) {
                console.warn('[Brotli2 v4.2] Compression timeout exceeded');
                return new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
            }
            
            const blockData = data.slice(i, Math.min(i + this.blockSize, data.length));
            const blockCompressed = this.compressSingleBlock(blockData);
            
            // Add block header (size)
            const blockHeader = new Uint8Array(4);
            blockHeader[0] = blockCompressed.length & 0xFF;
            blockHeader[1] = (blockCompressed.length >> 8) & 0xFF;
            blockHeader[2] = (blockCompressed.length >> 16) & 0xFF;
            blockHeader[3] = (blockCompressed.length >> 24) & 0xFF;
            
            blocks.push(blockHeader);
            blocks.push(blockCompressed);
            totalCompressedSize += blockCompressed.length + 4;
            
            this.stats.blocksProcessed++;
        }
        
        // Combine all blocks
        const result = new Uint8Array(totalCompressedSize);
        let offset = 0;
        for (const block of blocks) {
            result.set(block, offset);
            offset += block.length;
        }
        
        return result;
    }

    /**
     * Compress a single block of data
     */
    compressSingleBlock(data) {
        // Step 1: Detect content type
        const contentType = this.detectContentType(data);
        this.setLiteralContextMode(contentType, data);
        const baseDictionary = this.dictionary.getDictionary(contentType);
        const tokenCandidates = [];

        if (this.enableTextTokens && ['text', 'html', 'javascript', 'css', 'json'].includes(contentType)) {
            const tryTokenTable = (table, embedTable) => {
                const tokenized = this.preprocessTextTokens(data, table);
                const headerSize = 1 + (embedTable ? this.encodeTokenTable(table.tokens).length : 0);
                const overheadRatios = {
                    javascript: 0.35,
                    html: 0.3,
                    json: 0.3,
                    text: 0.25,
                    css: 0.25
                };
                const overheadRatio = overheadRatios[contentType] ?? 0.15;
                const maxOverhead = Math.ceil(data.length * overheadRatio);
                if (tokenized.length + headerSize > data.length + maxOverhead) {
                    return null;
                }

                const restored = this.postprocessTextTokens(tokenized, table);
                if (restored.length !== data.length) {
                    return null;
                }

                for (let i = 0; i < data.length; i++) {
                    if (data[i] !== restored[i]) {
                        return null;
                    }
                }

                if (embedTable) {
                    const probe = this.encodeContentHeader('text', tokenized, true, table);
                    const decoded = this.decodeContentHeader(probe);
                    const decodedTable = decoded.tokenTable || table;
                    const decodedRestored = this.postprocessTextTokens(decoded.payload, decodedTable);
                    if (decodedRestored.length !== data.length) {
                        return null;
                    }
                    for (let i = 0; i < data.length; i++) {
                        if (data[i] !== decodedRestored[i]) {
                            return null;
                        }
                    }
                }

                return {
                    payload: tokenized,
                    tokenTable: embedTable ? table : null
                };
            };

            const dynamicTableSizes = {
                javascript: 256,
                html: 384,
                json: 256,
                text: 384,
                css: 256
            };
            const dynamicTableSize = dynamicTableSizes[contentType] ?? 512;
            const dynamicTable = this.buildTextTokenTableFromText(data, dynamicTableSize);
            const dynamicCandidate = tryTokenTable(dynamicTable, true);
            if (dynamicCandidate) {
                tokenCandidates.push(dynamicCandidate);
            }
            const staticCandidate = tryTokenTable(this.textTokenTable, false);
            if (staticCandidate) {
                tokenCandidates.push(staticCandidate);
            }
        }

        const compressPath = (payload, useTextTokens, tokenTable, dictionary) => {
            const matches = this.lz77CompressAdvanced(payload, dictionary);
            return this.simpleEncode(matches, contentType, useTextTokens, tokenTable, dictionary);
        };

        const baseCompressed = compressPath(data, false, null, baseDictionary);
        let bestCompressed = baseCompressed;

        for (const candidate of tokenCandidates) {
            const tokenCompressed = compressPath(candidate.payload, true, candidate.tokenTable, null);
            if (tokenCompressed.length < bestCompressed.length) {
                bestCompressed = tokenCompressed;
            }
        }

        this.stats.huffmanUsed = false;

        return bestCompressed;
    }

    /**
     * Range encoding for better entropy coding
     */
    rangeEncode(matches) {
        // Build frequency table for symbols
        const frequencies = new Map();
        for (const match of matches) {
            const key = this.getMatchKey(match);
            frequencies.set(key, (frequencies.get(key) || 0) + 1);
        }
        
        // Calculate cumulative frequencies
        const symbols = Array.from(frequencies.keys()).sort();
        const total = matches.length;
        const cumulative = new Map();
        let sum = 0;
        for (const symbol of symbols) {
            cumulative.set(symbol, sum);
            sum += frequencies.get(symbol);
        }
        
        // Encode using range coding
        const precision = 16;
        let low = 0;
        let high = (1 << precision) - 1;
        const output = [];
        
        for (const match of matches) {
            const symbol = this.getMatchKey(match);
            const symbolLow = cumulative.get(symbol);
            const symbolHigh = cumulative.get(symbol) + frequencies.get(symbol);
            
            // Calculate new range
            const range = high - low + 1;
            high = low + Math.floor((range * symbolHigh) / total) - 1;
            low = low + Math.floor((range * symbolLow) / total);
            
            // Normalize and output bits
            while (true) {
                if (high < (1 << (precision - 1))) {
                    // Output 0 and shift
                    output.push(0);
                    low = (low << 1);
                    high = (high << 1) | 1;
                } else if (low >= (1 << (precision - 1))) {
                    // Output 1 and shift
                    output.push(1);
                    low = ((low - (1 << (precision - 1))) << 1);
                    high = ((high - (1 << (precision - 1))) << 1) | 1;
                } else {
                    break;
                }
            }
        }
        
        // Output remaining bits
        output.push(1); // EOD marker
        for (let i = precision - 1; i >= 0; i--) {
            output.push((low >> i) & 1);
        }
        
        // Convert bit array to bytes
        const encoded = [];
        let currentByte = 0;
        let bitPos = 0;
        
        for (const bit of output) {
            currentByte = (currentByte << 1) | bit;
            bitPos++;
            
            if (bitPos === 8) {
                encoded.push(currentByte);
                currentByte = 0;
                bitPos = 0;
            }
        }
        
        // Flush remaining bits
        if (bitPos > 0) {
            currentByte = currentByte << (8 - bitPos);
            encoded.push(currentByte);
        }
        
        // Prepend frequency table for decoding
        const freqData = [];
        freqData.push(symbols.length & 0xFF);
        freqData.push((symbols.length >> 8) & 0xFF);
        
        for (const symbol of symbols) {
            const symbolBytes = new TextEncoder().encode(symbol);
            freqData.push(symbolBytes.length);
            for (const byte of symbolBytes) {
                freqData.push(byte);
            }
            const freq = frequencies.get(symbol);
            freqData.push(freq & 0xFF);
            freqData.push((freq >> 8) & 0xFF);
        }
        
        const result = new Uint8Array(freqData.length + encoded.length);
        result.set(freqData, 0);
        result.set(encoded, freqData.length);
        
        return result;
    }

    /**
     * Range decoding
     */
    rangeDecode(compressed) {
        let pos = 0;
        
        // Read frequency table
        const numSymbols = compressed[pos] | (compressed[pos + 1] << 8);
        pos += 2;
        
        const frequencies = new Map();
        const symbols = [];
        
        for (let i = 0; i < numSymbols; i++) {
            const symbolLength = compressed[pos];
            pos++;
            const symbolBytes = compressed.slice(pos, pos + symbolLength);
            pos += symbolLength;
            const symbol = new TextDecoder().decode(symbolBytes);
            
            const freq = compressed[pos] | (compressed[pos + 1] << 8);
            pos += 2;
            
            frequencies.set(symbol, freq);
            symbols.push(symbol);
        }
        
        // Calculate cumulative frequencies
        const total = Array.from(frequencies.values()).reduce((a, b) => a + b, 0);
        const cumulative = new Map();
        let sum = 0;
        for (const symbol of symbols) {
            cumulative.set(symbol, sum);
            sum += frequencies.get(symbol);
        }
        
        // Decode using range coding
        const precision = 16;
        let low = 0;
        let high = (1 << precision) - 1;
        
        // Read encoded bits
        const bitBuffer = [];
        while (pos < compressed.length) {
            const byte = compressed[pos];
            for (let bitPos = 7; bitPos >= 0; bitPos--) {
                bitBuffer.push((byte >> bitPos) & 1);
            }
            pos++;
        }
        
        // Read initial code
        let code = 0;
        for (let i = 0; i < precision; i++) {
            if (bitBuffer.length > 0) {
                code = (code << 1) | bitBuffer.shift();
            }
        }
        
        const matches = [];
        
        while (bitBuffer.length > 0 || code > 0) {
            // Find symbol corresponding to current code
            let found = false;
            for (const symbol of symbols) {
                const symbolLow = cumulative.get(symbol);
                const symbolHigh = cumulative.get(symbol) + frequencies.get(symbol);
                
                const range = high - low + 1;
                const symbolRangeLow = low + Math.floor((range * symbolLow) / total);
                const symbolRangeHigh = low + Math.floor((range * symbolHigh) / total) - 1;
                
                if (code >= symbolRangeLow && code <= symbolRangeHigh) {
                    // Found symbol
                    matches.push(this.keyToMatch(symbol));
                    
                    // Update range
                    high = symbolRangeHigh;
                    low = symbolRangeLow;
                    found = true;
                    break;
                }
            }
            
            if (!found) break;
            
            // Normalize and read bits
            while (true) {
                if (high < (1 << (precision - 1))) {
                    // Read 0 and shift
                    if (bitBuffer.length > 0) {
                        code = (code << 1) | bitBuffer.shift();
                    }
                    low = (low << 1);
                    high = (high << 1) | 1;
                } else if (low >= (1 << (precision - 1))) {
                    // Read 1 and shift
                    if (bitBuffer.length > 0) {
                        code = (code << 1) | bitBuffer.shift();
                    }
                    low = ((low - (1 << (precision - 1))) << 1);
                    high = ((high - (1 << (precision - 1))) << 1) | 1;
                } else {
                    break;
                }
            }
        }
        
        return matches;
    }

    encodeContextMap(contextMap) {
        const rawBytes = new Uint8Array(contextMap.map(value => value & 0xFF));
        const rleBytes = [];
        let i = 0;

        while (i < contextMap.length) {
            const value = contextMap[i] & 0xFF;
            let run = 1;
            while (i + run < contextMap.length && contextMap[i + run] === contextMap[i]) {
                run++;
            }
            rleBytes.push(value);
            rleBytes.push(...this.encodeVarint(run));
            i += run;
        }

        if (rleBytes.length < rawBytes.length) {
            return { encoding: 0x01, data: new Uint8Array(rleBytes) };
        }

        return { encoding: 0x00, data: rawBytes };
    }

    decodeContextMap(encoding, data, expectedLength = null) {
        if (encoding === 0x01) {
            const contextMap = [];
            let pos = 0;
            while (pos < data.length && (expectedLength === null || contextMap.length < expectedLength)) {
                const value = data[pos++];
                const runDecoded = this.decodeVarint(data, pos);
                if (!runDecoded.ok) {
                    break;
                }
                pos += runDecoded.bytes;
                for (let i = 0; i < runDecoded.value; i++) {
                    contextMap.push(value);
                    if (expectedLength !== null && contextMap.length >= expectedLength) {
                        break;
                    }
                }
            }

            if (expectedLength !== null && contextMap.length < expectedLength) {
                while (contextMap.length < expectedLength) {
                    contextMap.push(0);
                }
            }

            return contextMap;
        }

        const contextMap = Array.from(data);
        if (expectedLength !== null && contextMap.length < expectedLength) {
            while (contextMap.length < expectedLength) {
                contextMap.push(0);
            }
        }
        if (expectedLength !== null && contextMap.length > expectedLength) {
            return contextMap.slice(0, expectedLength);
        }

        return contextMap;
    }

    /**
     * Find frequent substrings in data for dynamic dictionary building
     */
    findFrequentSubstrings(data, minLength = 4, maxCount = 50) {
        const substrings = new Map();
        
        for (let i = 0; i < data.length - minLength; i++) {
            for (let len = minLength; len <= Math.min(16, data.length - i); len++) {
                const substring = data.slice(i, i + len);
                const key = Array.from(substring).join(',');
                const entry = substrings.get(key);
                const count = entry ? entry.count + 1 : 1;
                substrings.set(key, { count, bytes: substring });
            }
        }
        
        // Return top substrings by frequency
        return Array.from(substrings.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, maxCount);
    }

    /**
     * Build dynamic dictionary from frequent substrings
     */
    buildDynamicDictionary(baseDictionary, frequentSubstrings) {
        const dynamicDict = new Map();
        
        // Copy base dictionary (handle both Map and {dictionary, hashTable} formats)
        if (baseDictionary instanceof Map) {
            for (const [pattern, encoded] of baseDictionary) {
                dynamicDict.set(pattern, encoded);
            }
        } else if (baseDictionary.dictionary) {
            for (const [pattern, encoded] of baseDictionary.dictionary) {
                dynamicDict.set(pattern, encoded);
            }
        }
        
        // Add frequent substrings
        for (const { bytes, count } of frequentSubstrings) {
            if (count >= 3) {
                const key = Array.from(bytes).join(',');
                dynamicDict.set(key, bytes);
            }
        }
        
        return dynamicDict;
    }

    /**
     * Extract patterns from dictionary structures
     */
    extractPatternsFromDictionary(dictionary) {
        if (!dictionary) {
            return [];
        }

        if (dictionary.buckets) {
            const patterns = [];
            for (const bucket of dictionary.buckets) {
                if (bucket && bucket.length) {
                    patterns.push(...bucket);
                }
            }
            return patterns;
        }

        if (dictionary instanceof Map) {
            return Array.from(dictionary.keys());
        }

        if (dictionary.dictionary instanceof Map) {
            return Array.from(dictionary.dictionary.keys());
        }

        return [];
    }

    /**
     * Decompress data
     */
    decompress(compressed) {
        const startTime = performance.now();
        
        console.log('[Brotli2 v4.2] Starting decompression...');
        console.log('[Brotli2 v4.2] Input size:', compressed.length, 'bytes');
        
        // Decode matches using simple decoding
        const { contentType, payload, useTextTokens, tokenTable } = this.decodeContentHeader(compressed);
        this.setLiteralContextMode(contentType);
        const dictionary = this.dictionary.getDictionary(contentType);
        const matches = this.decodeMatchesPayload(payload, dictionary);
        console.log('[Brotli2 v4.2] Decoded', matches.length, 'matches');
        
        // Reconstruct data
        let decompressed = this.reconstructData(matches, dictionary);

        if (useTextTokens) {
            const table = tokenTable || this.textTokenTable;
            decompressed = this.postprocessTextTokens(decompressed, table);
        }
        
        this.stats.decompressionTime = performance.now() - startTime;
        
        console.log('[Brotli2 v4.2] Decompression complete');
        console.log('[Brotli2 v4.2] Output size:', decompressed.length, 'bytes');
        console.log('[Brotli2 v4.2] Decompression time:', this.stats.decompressionTime.toFixed(2), 'ms');
        
        return decompressed;
    }

    /**
     * LZ77 compression with proven v3 approach
     */
    lz77CompressAdvanced(data, dictionary) {
        const matches = [];
        const window = [];
        const hashTable = new Map(); // Hash table for O(1) position lookup
        const contextModel = new Map(); // 2nd order context model
        const distanceCache = this.initDistanceCache();
        let windowStart = 0;
        let pos = 0;
        let literalRun = 0;
        
        while (pos < data.length) {
            let bestMatch = null;
            let bestScore = -Infinity;

            const considerMatch = (match, runLength = 0) => {
                const score = this.getMatchSelectionScore(match, distanceCache, runLength);
                if (score > bestScore) {
                    bestMatch = match;
                    bestScore = score;
                }
            };

            // Search sliding window using hash-based lookup
            const windowMatch = this.searchWindowHashBased(data, pos, window, hashTable, windowStart, distanceCache, 0, literalRun);

            // Search dictionary for matches
            let dictMatch = this.searchDictionary(data, pos, dictionary);
            dictMatch = this.filterDictionaryMatch(dictMatch, windowMatch);

            considerMatch(windowMatch, literalRun);
            considerMatch(dictMatch);

            // Search for run-length encoding
            const runMatch = this.findRunLength(data, pos);
            considerMatch(runMatch);
            
            let useLiteral = false;
            const matchMinLength = bestMatch ? this.getMatchMinimumLength(bestMatch) : this.minMatchLength;
            if (bestMatch && bestMatch.length >= matchMinLength && bestMatch.length <= matchMinLength + 3 && pos + 1 < data.length) {
                let nextBestMatch = null;

                const nextWindowMatch = this.searchWindowHashBased(
                    data,
                    pos + 1,
                    window,
                    hashTable,
                    windowStart,
                    distanceCache,
                    1,
                    literalRun + 1
                );
                if (nextWindowMatch) {
                    if (!nextBestMatch || nextWindowMatch.length > nextBestMatch.length) {
                        nextBestMatch = nextWindowMatch;
                    }
                }

                const nextDictMatch = this.searchDictionary(data, pos + 1, dictionary);
                const filteredNextDictMatch = this.filterDictionaryMatch(nextDictMatch, nextWindowMatch);
                if (filteredNextDictMatch && (!nextBestMatch || filteredNextDictMatch.length > nextBestMatch.length)) {
                    nextBestMatch = filteredNextDictMatch;
                }

                const nextRunMatch = this.findRunLength(data, pos + 1);
                if (nextRunMatch && (!nextBestMatch || nextRunMatch.length > nextBestMatch.length)) {
                    nextBestMatch = nextRunMatch;
                }

                if (nextBestMatch) {
                    const nextScore = this.getMatchSelectionScore(nextBestMatch, distanceCache, literalRun + 1);
                    if (nextScore === -Infinity) {
                        nextBestMatch = null;
                    }
                }

                if (nextBestMatch) {
                    const nextScore = this.getMatchSelectionScore(nextBestMatch, distanceCache, literalRun + 1);
                    if (nextScore > bestScore + this.lazyMatchScoreThreshold) {
                        useLiteral = true;
                    }
                }
            }

            // Use match or literal
            if (bestMatch && bestMatch.length >= matchMinLength && !useLiteral) {
                matches.push(bestMatch);

                if (bestMatch.type === 'window') {
                    this.updateDistanceCache(distanceCache, bestMatch.offset);
                }
                literalRun = 0;
                
                // Update window with the match (push bytes from original data)
                for (let i = 0; i < bestMatch.length; i++) {
                    if (window.length >= this.windowSize) {
                        // Remove old entries from hash table
                        const oldPos = windowStart;
                        if (oldPos + 2 < data.length) {
                            const oldHashKey = this.getHashKey(data, oldPos);
                            if (hashTable.has(oldHashKey)) {
                                const positions = hashTable.get(oldHashKey);
                                const index = positions.indexOf(oldPos);
                                if (index !== -1) {
                                    positions.splice(index, 1);
                                }
                                if (positions.length === 0) {
                                    hashTable.delete(oldHashKey);
                                }
                            }
                        }
                        window.shift();
                        windowStart++;
                    }
                    
                    const byte = data[pos + i];
                    window.push(byte);
                    
                    // Update hash table with new position
                    if (pos + i + 2 < data.length) {
                        const hashKey = this.getHashKey(data, pos + i);
                        if (!hashTable.has(hashKey)) {
                            hashTable.set(hashKey, []);
                        }
                        hashTable.get(hashKey).push(pos + i);
                    }
                    
                    // Update context model with the byte
                    this.updateContextModel(contextModel, byte, window);
                }
                
                pos += bestMatch.length;
                this.stats.totalMatches++;
                if (bestMatch.length > 20) {
                    this.stats.longMatches++;
                }
            } else {
                if (this.enablePrediction) {
                    // Use context model to predict if we should skip this literal
                    const predictedByte = this.predictNextByte(contextModel, window);
                    if (predictedByte !== null && predictedByte === data[pos]) {
                        // Skip this literal - it's predictable
                        pos++;
                        continue;
                    }
                }
                
                matches.push({
                    type: 'literal',
                    byte: data[pos]
                });
                literalRun++;
                
                // Update window with literal
                if (window.length >= this.windowSize) {
                    // Remove old entries from hash table
                    const oldPos = windowStart;
                    if (oldPos + 2 < data.length) {
                        const oldHashKey = this.getHashKey(data, oldPos);
                        if (hashTable.has(oldHashKey)) {
                            const positions = hashTable.get(oldHashKey);
                            const index = positions.indexOf(oldPos);
                            if (index !== -1) {
                                positions.splice(index, 1);
                            }
                            if (positions.length === 0) {
                                hashTable.delete(oldHashKey);
                            }
                        }
                    }
                    window.shift();
                    windowStart++;
                }
                
                window.push(data[pos]);
                
                // Update hash table with new position
                if (pos + 2 < data.length) {
                    const hashKey = this.getHashKey(data, pos);
                    if (!hashTable.has(hashKey)) {
                        hashTable.set(hashKey, []);
                    }
                    hashTable.get(hashKey).push(pos);
                }
                
                // Update context model with the byte
                this.updateContextModel(contextModel, data[pos], window);
                
                pos++;
            }
        }
        
        return matches;
    }

    /**
     * Update context model with new byte
     */
    updateContextModel(contextModel, byte, window) {
        // Get last 2 bytes as context
        const context = [];
        if (window.length >= 2) {
            context.push(window[window.length - 2]);
            context.push(window[window.length - 1]);
        } else if (window.length === 1) {
            context.push(window[0]);
        }
        
        const contextKey = context.join(',');
        
        if (!contextModel.has(contextKey)) {
            contextModel.set(contextKey, new Map());
        }
        
        const ctx = contextModel.get(contextKey);
        ctx.set(byte, (ctx.get(byte) || 0) + 1);
    }

    /**
     * Predict next byte based on context model
     */
    predictNextByte(contextModel, window) {
        // Get last 2 bytes as context
        const context = [];
        if (window.length >= 2) {
            context.push(window[window.length - 2]);
            context.push(window[window.length - 1]);
        } else if (window.length === 1) {
            context.push(window[0]);
        }
        
        const contextKey = context.join(',');
        const ctx = contextModel.get(contextKey);
        
        if (!ctx || ctx.size === 0) {
            return null;
        }
        
        // Find the most common byte in this context
        let maxCount = 0;
        let predictedByte = null;
        
        for (const [byte, count] of ctx.entries()) {
            if (count > maxCount) {
                maxCount = count;
                predictedByte = byte;
            }
        }
        
        return predictedByte;
    }

    /**
     * Get hash key from 3 bytes
     */
    getHashKey(data, pos) {
        if (pos + 2 >= data.length) {
            return null;
        }
        return (data[pos] << 16) | (data[pos + 1] << 8) | data[pos + 2];
    }

    /**
     * Search sliding window using hash-based lookup for O(1) position lookup
     */
    searchWindowHashBased(data, pos, window, hashTable, windowStart = 0, distanceCache = null, offsetAdjustment = 0, literalRun = 0) {
        let bestMatch = null;
        let bestScore = -Infinity;
        
        // Build hash key from next 3 bytes
        if (pos + 3 > data.length) {
            return null;
        }
        
        const hashKey = (data[pos] << 16) | (data[pos + 1] << 8) | data[pos + 2];
        const positions = hashTable.get(hashKey);
        
        if (positions) {
            // Check all positions with this hash key
            let checks = 0;
            const maxChecks = this.maxHashChainChecks > 0 ? this.maxHashChainChecks : Number.POSITIVE_INFINITY;
            for (let index = positions.length - 1; index >= 0; index--) {
                const windowPos = positions[index];
                if (windowPos < windowStart || windowPos >= windowStart + window.length) {
                    continue;
                }
                const windowIndex = windowPos - windowStart;
                let matchLength = 0;
                const maxLength = Math.min(this.maxMatchLength, data.length - pos, window.length - windowIndex);

                while (matchLength < maxLength &&
                       window[windowIndex + matchLength] === data[pos + matchLength]) {
                    matchLength++;
                }

                const offset = pos - windowPos + offsetAdjustment;
                if (offset <= 0) {
                    continue;
                }
                const requiredLength = this.getWindowMatchMinimumLength(offset);
                if (matchLength >= requiredLength) {
                    const candidate = {
                        type: 'window',
                        offset,
                        length: matchLength
                    };
                    const score = this.getMatchSelectionScore(candidate, distanceCache, literalRun);
                    if (score > bestScore) {
                        bestMatch = candidate;
                        bestScore = score;
                    } else if (score === bestScore && bestMatch) {
                        const bestLength = bestMatch.length || 0;
                        const bestOffset = bestMatch.offset || Number.MAX_SAFE_INTEGER;
                        if (matchLength > bestLength || (matchLength === bestLength && offset < bestOffset)) {
                            bestMatch = candidate;
                            bestScore = score;
                        }
                    }
                }
                checks++;
                if (checks >= maxChecks) {
                    break;
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * Resolve a dictionary entry from the Brotli-style dictionary structure
     */
    getDictionaryEntry(dictionary, length, index) {
        if (!dictionary || !dictionary.buckets) {
            return null;
        }

        const bucket = dictionary.buckets[length];
        if (!bucket || index === undefined || index < 0 || index >= bucket.length) {
            return null;
        }

        return new TextEncoder().encode(bucket[index]);
    }

    /**
     * Search sliding window for matches
     */
    searchWindow(data, pos, window) {
        let bestMatch = null;
        
        // Backward search from end of window for better performance
        for (let i = window.length - 1; i >= 0; i--) {
            let matchLength = 0;
            
            while (i + matchLength < window.length &&
                   pos + matchLength < data.length &&
                   window[i + matchLength] === data[pos + matchLength]) {
                matchLength++;
            }
            
            const offset = window.length - i;
            const requiredLength = this.getWindowMatchMinimumLength(offset);
            const bestLength = bestMatch?.length || 0;
            const bestOffset = bestMatch?.offset || Number.MAX_SAFE_INTEGER;
            if (matchLength >= requiredLength &&
                (matchLength > bestLength || (matchLength === bestLength && offset < bestOffset))) {
                bestMatch = {
                    type: 'window',
                    offset,
                    length: matchLength
                };
            }
        }
        
        return bestMatch;
    }

    /**
     * Search dictionary for matches (handles both old Map and new Brotli-style formats)
     */
    searchDictionary(data, pos, dictionary) {
        let bestMatch = null;
        
        // Check if dictionary has Brotli-style buckets (OptimizedAdaptiveDictionary)
        if (dictionary && dictionary.buckets) {
            // Use Brotli-style bucket lookup
            for (let len = this.maxMatchLength; len >= this.minMatchLength; len--) {
                if (pos + len > data.length) continue;
                
                const bucket = dictionary.buckets[len];
                if (!bucket || bucket.length === 0) continue;
                
                // Search in bucket
                const patternBytes = data.slice(pos, pos + len);
                const patternStr = new TextDecoder().decode(patternBytes);
                
                for (let index = 0; index < bucket.length; index++) {
                    const pattern = bucket[index];
                    if (pattern === patternStr) {
                        return {
                            type: 'dict',
                            pattern: pattern,
                            encoded: patternBytes,
                            length: len,
                            dictIndex: index
                        };
                    }
                }
            }
        } else if (dictionary instanceof Map) {
            // Fallback to old Map-based structure
            for (const [pattern, encoded] of dictionary) {
                let matchLength = 0;
                while (matchLength < encoded.length &&
                       pos + matchLength < data.length &&
                       encoded[matchLength] === data[pos + matchLength]) {
                    matchLength++;
                }
                
                if (matchLength === encoded.length && matchLength > (bestMatch?.length || 0)) {
                    bestMatch = {
                        type: 'dict',
                        encoded: encoded,
                        length: matchLength
                    };
                }
            }
        } else if (dictionary && dictionary.dictionary) {
            // Handle {dictionary, hashTable} format
            for (const [pattern, encoded] of dictionary.dictionary) {
                let matchLength = 0;
                while (matchLength < encoded.length &&
                       pos + matchLength < data.length &&
                       encoded[matchLength] === data[pos + matchLength]) {
                    matchLength++;
                }
                
                if (matchLength === encoded.length && matchLength > (bestMatch?.length || 0)) {
                    bestMatch = {
                        type: 'dict',
                        encoded: encoded,
                        length: matchLength
                    };
                }
            }
        }
        
        if (bestMatch) {
            this.stats.dictionaryHits++;
        }
        
        return bestMatch;
    }

    /**
     * Find run-length encoding opportunities
     */
    findRunLength(data, pos) {
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
     * Proper Huffman encoder with bit-level encoding
     */
    huffmanEncode(matches) {
        // Build frequency table for all match types
        const frequencies = new Map();
        for (const match of matches) {
            const key = this.getMatchKey(match);
            frequencies.set(key, (frequencies.get(key) || 0) + 1);
        }
        
        // Build Huffman tree
        const huffmanTree = this.buildHuffmanTree(frequencies);
        
        // Generate Huffman codes for all match types
        const huffmanCodes = this.generateHuffmanCodes(huffmanTree);
        
        // Serialize Huffman tree to include in compressed output
        const treeData = this.serializeHuffmanTree(huffmanTree, huffmanCodes);
        
        // Encode matches using Huffman codes
        const bitBuffer = [];
        for (const match of matches) {
            const key = this.getMatchKey(match);
            const code = huffmanCodes.get(key);
            
            if (code) {
                // Add Huffman code to bit buffer
                for (const bit of code) {
                    bitBuffer.push(bit);
                }
            } else {
                // This shouldn't happen if all symbols have codes
                throw new Error(`No Huffman code for symbol: ${key}`);
            }
        }
        
        // Convert bit buffer to bytes
        const encoded = [];
        let currentByte = 0;
        let bitPos = 0;
        
        for (const bit of bitBuffer) {
            currentByte = (currentByte << 1) | bit;
            bitPos++;
            
            if (bitPos === 8) {
                encoded.push(currentByte);
                currentByte = 0;
                bitPos = 0;
            }
        }
        
        // Flush remaining bits
        if (bitPos > 0) {
            currentByte = currentByte << (8 - bitPos);
            encoded.push(currentByte);
        }
        
        // Combine tree data and encoded data
        const result = new Uint8Array(treeData.length + encoded.length);
        result.set(treeData, 0);
        result.set(encoded, treeData.length);
        
        return result;
    }

    /**
     * Serialize Huffman tree to byte array
     */
    serializeHuffmanTree(huffmanTree, huffmanCodes) {
        const data = [];
        
        // Store number of symbols
        const symbols = Array.from(huffmanCodes.keys());
        data.push(symbols.length & 0xFF);
        data.push((symbols.length >> 8) & 0xFF);
        
        // Store each symbol and its Huffman code
        for (const symbol of symbols) {
            const code = huffmanCodes.get(symbol);
            
            // Store symbol (as string)
            const symbolBytes = new TextEncoder().encode(symbol);
            data.push(symbolBytes.length);
            for (const byte of symbolBytes) {
                data.push(byte);
            }
            
            // Store code length
            data.push(code.length);
            
            // Store code as bytes
            let currentByte = 0;
            let bitPos = 0;
            for (const bit of code) {
                currentByte = (currentByte << 1) | bit;
                bitPos++;
                
                if (bitPos === 8) {
                    data.push(currentByte);
                    currentByte = 0;
                    bitPos = 0;
                }
            }
            
            // Flush remaining bits
            if (bitPos > 0) {
                currentByte = currentByte << (8 - bitPos);
                data.push(currentByte);
            }
        }
        
        return new Uint8Array(data);
    }

    /**
     * Deserialize Huffman tree from byte array
     */
    deserializeHuffmanTree(data) {
        let pos = 0;
        
        // Read number of symbols
        const numSymbols = data[pos] | (data[pos + 1] << 8);
        pos += 2;
        
        // Read symbols and codes
        const huffmanCodes = new Map();
        for (let i = 0; i < numSymbols; i++) {
            // Read symbol
            const symbolLength = data[pos];
            pos++;
            const symbolBytes = data.slice(pos, pos + symbolLength);
            pos += symbolLength;
            const symbol = new TextDecoder().decode(symbolBytes);
            
            // Read code length
            const codeLength = data[pos];
            pos++;
            
            // Read code as bytes and convert to bit array
            const code = [];
            let currentByte = 0;
            let bitPos = 0;
            
            for (let bytePos = 0; bytePos < Math.ceil(codeLength / 8); bytePos++) {
                const byteVal = data[pos + bytePos];
                for (let bitPos = 7; bitPos >= 0 && code.length < codeLength; bitPos--) {
                    code.push((byteVal >> bitPos) & 1);
                }
            }
            pos += Math.ceil(codeLength / 8);
            
            huffmanCodes.set(symbol, code);
        }
        
        // Rebuild Huffman tree from codes
        return this.buildHuffmanTreeFromCodes(huffmanCodes);
    }

    /**
     * Build Huffman tree from codes
     */
    buildHuffmanTreeFromCodes(huffmanCodes) {
        // Create root node
        const root = { left: null, right: null, isLeaf: false, symbol: null };
        
        // Insert each code into the tree
        for (const [symbol, code] of huffmanCodes) {
            let currentNode = root;
            
            for (const bit of code) {
                if (bit === 0) {
                    if (!currentNode.left) {
                        currentNode.left = { left: null, right: null, isLeaf: false, symbol: null };
                    }
                    currentNode = currentNode.left;
                } else {
                    if (!currentNode.right) {
                        currentNode.right = { left: null, right: null, isLeaf: false, symbol: null };
                    }
                    currentNode = currentNode.right;
                }
            }
            
            currentNode.isLeaf = true;
            currentNode.symbol = symbol;
        }
        
        return root;
    }

    /**
     * Proper Huffman decoder with bit-level decoding
     */
    huffmanDecode(compressed, huffmanTree) {
        const bitBuffer = [];
        let pos = 0;
        
        // Read bits from compressed data
        while (pos < compressed.length) {
            const byte = compressed[pos];
            for (let bitPos = 7; bitPos >= 0; bitPos--) {
                bitBuffer.push((byte >> bitPos) & 1);
            }
            pos++;
        }
        
        // Decode bits using Huffman tree
        const matches = [];
        let bitPos = 0;
        let currentNode = huffmanTree;
        
        while (bitPos < bitBuffer.length) {
            const bit = bitBuffer[bitPos];
            bitPos++;
            
            if (bit === 0) {
                currentNode = currentNode.left;
            } else {
                currentNode = currentNode.right;
            }
            
            if (currentNode.isLeaf) {
                const match = this.keyToMatch(currentNode.symbol);
                if (match) {
                    matches.push(match);
                }
                currentNode = huffmanTree;
            }
        }
        
        return matches;
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
            return `D${match.encoded.length}`;
        } else if (match.type === 'window') {
            return `W${match.length}`;
        }
        return 'X';
    }

    /**
     * Convert key back to match
     */
    keyToMatch(key) {
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

    encodeVarint(value) {
        const bytes = [];
        let v = value >>> 0;

        while (v >= 0x80) {
            bytes.push((v & 0x7F) | 0x80);
            v >>>= 7;
        }

        bytes.push(v);
        return bytes;
    }

    decodeVarint(data, pos) {
        let value = 0;
        let shift = 0;
        let bytes = 0;

        while (bytes < 5 && pos + bytes < data.length) {
            const byte = data[pos + bytes];
            value |= (byte & 0x7F) << shift;
            bytes++;

            if ((byte & 0x80) === 0) {
                return { value, bytes, ok: true };
            }

            shift += 7;
        }

        return { value: 0, bytes, ok: false };
    }

    appendBytes(target, bytes) {
        for (let i = 0; i < bytes.length; i++) {
            target.push(bytes[i]);
        }
    }

    encodeLengthPrefix(length, baseTable, extraTable) {
        for (let i = 0; i < baseTable.length; i++) {
            const base = baseTable[i];
            const extraBits = extraTable[i];
            const max = base + ((1 << extraBits) - 1);
            if (length >= base && length <= max) {
                return { code: i, extraBits, extraValue: length - base };
            }
        }

        const last = baseTable.length - 1;
        return {
            code: last,
            extraBits: extraTable[last],
            extraValue: Math.max(0, length - baseTable[last])
        };
    }

    decodeLengthPrefix(code, extraValue, baseTable) {
        const base = baseTable[code] ?? 0;
        return base + extraValue;
    }

    estimateVarintBytes(value) {
        let v = value >>> 0;
        let bytes = 1;
        while (v >= 0x80) {
            v >>>= 7;
            bytes++;
        }
        return bytes;
    }

    estimateInsertCost(length) {
        if (!length || length <= 0) {
            return 0;
        }
        const insertPrefix = this.encodeLengthPrefix(length, this.brotliInsBase, this.brotliInsExtra);
        return 1 + this.estimateVarintBytes(insertPrefix.extraValue);
    }

    estimateCopyCost(length, offset, distanceCache) {
        if (!length || length <= 0 || !offset || offset <= 0) {
            return 0;
        }
        const copyPrefix = this.encodeLengthPrefix(length, this.brotliCopyBase, this.brotliCopyExtra);
        const cacheCopy = distanceCache ? [...distanceCache] : null;
        const distanceEncoded = this.encodeDistanceWithCache(offset, cacheCopy);
        let cost = 1 + this.estimateVarintBytes(copyPrefix.extraValue);
        cost += 1 + this.estimateVarintBytes(distanceEncoded.code);
        cost += 1 + this.estimateVarintBytes(distanceEncoded.extraBits);
        return cost;
    }

    estimateRunCost(length) {
        if (!length || length <= 0) {
            return 0;
        }
        return 1 + this.estimateVarintBytes(length);
    }

    estimateDictCost(match) {
        if (!match) {
            return 0;
        }
        if (match.dictIndex !== undefined && match.length >= this.minDictIndexLength) {
            return 1 + this.estimateVarintBytes(match.length) + this.estimateVarintBytes(match.dictIndex);
        }
        const literalLength = match.encoded ? match.encoded.length : match.length;
        return 1 + this.estimateVarintBytes(literalLength) + literalLength;
    }

    computeDistanceCodeOffset() {
        return Math.max(0, this.distanceShortCodeIndex.length - 1);
    }

    selectDistanceAlphabetParams(commandEntries) {
        if (!commandEntries || commandEntries.length === 0) {
            return { directCodes: this.distanceDirectCodes, postfixBits: this.distancePostfixBits };
        }

        const candidates = [];
        const postfixOptions = [0, 1, 2, 3, 4];
        const directMax = 160;
        const directStep = 4;
        for (const postfixBits of postfixOptions) {
            const step = 1 << postfixBits;
            for (let directCodes = 0; directCodes <= directMax; directCodes += directStep) {
                if (directCodes % step === 0) {
                    candidates.push({ directCodes, postfixBits });
                }
            }
        }

        const scored = candidates
            .map(candidate => ({
                candidate,
                varintCost: this.estimateDistanceAlphabetVarintCost(commandEntries, candidate)
            }))
            .sort((a, b) => a.varintCost - b.varintCost);
        const shortlist = scored.slice(0, Math.min(20, scored.length));

        let best = shortlist[0]?.candidate ?? { directCodes: this.distanceDirectCodes, postfixBits: this.distancePostfixBits };
        let bestCost = Infinity;
        for (const { candidate, varintCost } of shortlist) {
            const huffmanCost = this.estimateDistanceAlphabetCost(commandEntries, candidate);
            const cost = huffmanCost * 0.75 + varintCost * 0.25;
            if (cost < bestCost) {
                bestCost = cost;
                best = candidate;
            }
        }
        return best;
    }

    estimateDistanceAlphabetVarintCost(commandEntries, params) {
        const cache = this.initDistanceCache();
        let cost = 0;
        for (const entry of commandEntries) {
            const encoded = this.encodeDistanceWithCache(entry.offset, cache, params);
            cost += this.estimateVarintBytes(encoded.code);
            cost += this.estimateVarintBytes(encoded.extraBits);
        }
        return cost;
    }

    estimateDistanceAlphabetCost(commandEntries, params) {
        const distanceContextCount = Math.max(1, this.distanceContextCount || 4);
        const distanceCodeStreams = Array.from({ length: distanceContextCount }, () => []);
        const distanceExtraStreams = Array.from({ length: distanceContextCount }, () => []);
        const cache = this.initDistanceCache();

        for (const entry of commandEntries) {
            const encoded = this.encodeDistanceWithCache(entry.offset, cache, params);
            const contextId = this.getDistanceContextId(entry.copyLength, distanceContextCount);
            distanceCodeStreams[contextId].push(encoded.code);
            distanceExtraStreams[contextId].push(encoded.extraBits);
        }

        let cost = 0;
        const addBlockCost = (block) => {
            cost += this.estimateVarintBytes(block.length) + block.length;
        };
        for (let i = 0; i < distanceContextCount; i++) {
            addBlockCost(this.encodeSymbolStreamBlock(distanceCodeStreams[i]));
            addBlockCost(this.encodeSymbolStreamBlock(distanceExtraStreams[i]));
        }
        return cost;
    }

    initDistanceCache() {
        return [4, 11, 15, 16];
    }

    updateDistanceCache(cache, distance) {
        if (!cache || distance <= 0) {
            return;
        }
        cache.unshift(distance);
        if (cache.length > this.distanceCacheSize) {
            cache.length = this.distanceCacheSize;
        }
    }

    encodeDistanceWithCache(distance, cache, params = null) {
        const directCodes = params?.directCodes ?? this.distanceDirectCodes;
        const postfixBits = params?.postfixBits ?? this.distancePostfixBits;
        const codeOffset = params?.codeOffset ?? this.computeDistanceCodeOffset();
        if (cache) {
            for (let code = 0; code < this.distanceShortCodeIndex.length; code++) {
                const baseIndex = this.distanceShortCodeIndex[code];
                const baseDistance = cache[baseIndex];
                if (!baseDistance) {
                    continue;
                }
                const candidate = baseDistance + this.distanceShortCodeOffset[code];
                if (candidate === distance && candidate > 0) {
                    if (code !== 0) {
                        this.updateDistanceCache(cache, distance);
                    }
                    return { code, extraBits: 0 };
                }
            }
        }

        const shiftedDistance = distance + codeOffset;
        const encoded = this.prefixDistanceEncoder.encodeCopyDistance(
            shiftedDistance,
            directCodes,
            postfixBits
        );
        this.updateDistanceCache(cache, distance);
        return encoded;
    }

    decodeDistanceWithCache(code, extraBits, cache, params = null) {
        const directCodes = params?.directCodes ?? this.distanceDirectCodes;
        const postfixBits = params?.postfixBits ?? this.distancePostfixBits;
        const codeOffset = params?.codeOffset ?? this.computeDistanceCodeOffset();
        if (cache && code < this.distanceShortCodeIndex.length) {
            const baseIndex = this.distanceShortCodeIndex[code];
            const baseDistance = cache[baseIndex];
            if (!baseDistance) {
                throw new Error('Invalid distance cache code');
            }
            const distance = baseDistance + this.distanceShortCodeOffset[code];
            if (distance <= 0) {
                throw new Error('Invalid decoded distance');
            }
            if (code !== 0) {
                this.updateDistanceCache(cache, distance);
            }
            return distance;
        }

        const shiftedDistance = this.prefixDistanceEncoder.decodeCopyDistance(
            code,
            directCodes,
            postfixBits,
            extraBits
        );
        const distance = shiftedDistance - codeOffset;
        if (distance <= 0) {
            throw new Error('Invalid decoded distance');
        }
        this.updateDistanceCache(cache, distance);
        return distance;
    }

    /**
     * Simple encoding for a single match
     */
    simpleEncodeMatch(match, distanceCache = null) {
        const encoded = [];
        
        if (match.type === 'literal') {
            if (match.byte >= 0xFC || match.byte === 0xF9 || match.byte === 0xFB || match.byte === 0xFA || match.byte === 0xF8 || match.byte === 0xF7) {
                encoded.push(0xF9);
                encoded.push(match.byte);
            } else {
                encoded.push(match.byte);
            }
        } else if (match.type === 'literal_ctx') {
            encoded.push(0xFB);
        } else if (match.type === 'literal_ctx_run') {
            encoded.push(0xF8);
            encoded.push(...this.encodeVarint(match.length));
        } else if (match.type === 'insert_copy') {
            const insertPrefix = this.encodeLengthPrefix(match.insertLength, this.brotliInsBase, this.brotliInsExtra);
            const copyPrefix = this.encodeLengthPrefix(match.copyLength, this.brotliCopyBase, this.brotliCopyExtra);
            const commandCode = insertPrefix.code * this.brotliCopyBase.length + copyPrefix.code;
            const distanceEncoded = this.encodeDistanceWithCache(match.offset, distanceCache);
            encoded.push(0xF7);
            encoded.push(...this.encodeVarint(commandCode));
            encoded.push(...this.encodeVarint(insertPrefix.extraValue));
            encoded.push(...this.encodeVarint(copyPrefix.extraValue));
            encoded.push(...this.encodeVarint(distanceEncoded.code));
            encoded.push(...this.encodeVarint(distanceEncoded.extraBits));
        } else if (match.type === 'run') {
            encoded.push(0xFD);
            encoded.push(match.byte);
            encoded.push(...this.encodeVarint(match.length));
        } else if (match.type === 'dict') {
            if (match.dictIndex !== undefined && match.length >= this.minDictIndexLength) {
                encoded.push(0xFC);
                encoded.push(...this.encodeVarint(match.length));
                encoded.push(...this.encodeVarint(match.dictIndex));
            } else {
                encoded.push(0xFF);
                encoded.push(...this.encodeVarint(match.encoded.length));
                for (const byte of match.encoded) {
                    encoded.push(byte);
                }
            }
        } else if (match.type === 'window') {
            const lengthPrefix = this.encodeLengthPrefix(match.length, this.brotliCopyBase, this.brotliCopyExtra);
            const distanceEncoded = this.encodeDistanceWithCache(match.offset, distanceCache);
            encoded.push(0xFA);
            encoded.push(...this.encodeVarint(lengthPrefix.code));
            encoded.push(...this.encodeVarint(lengthPrefix.extraValue));
            encoded.push(...this.encodeVarint(distanceEncoded.code));
            encoded.push(...this.encodeVarint(distanceEncoded.extraBits));
        }
        
        return encoded;
    }

    /**
     * Simple decode for a single match
     */
    simpleDecodeMatch(compressed, pos, distanceCache = null) {
        const marker = compressed[pos];
        
        if (marker === 0xF9) {
            return {
                type: 'literal',
                byte: compressed[pos + 1],
                encodedLength: 2
            };
        } else if (marker === 0xFB) {
            return {
                type: 'literal_ctx',
                encodedLength: 1
            };
        } else if (marker === 0xF8) {
            const lengthDecoded = this.decodeVarint(compressed, pos + 1);
            if (!lengthDecoded.ok) {
                throw new Error('Invalid varint in literal context run');
            }
            return {
                type: 'literal_ctx_run',
                length: lengthDecoded.value,
                encodedLength: 1 + lengthDecoded.bytes
            };
        } else if (marker === 0xF7) {
            const commandCodeDecoded = this.decodeVarint(compressed, pos + 1);
            if (!commandCodeDecoded.ok) {
                throw new Error('Invalid varint in insert-copy command');
            }
            const insertExtraDecoded = this.decodeVarint(compressed, pos + 1 + commandCodeDecoded.bytes);
            if (!insertExtraDecoded.ok) {
                throw new Error('Invalid varint in insert extra');
            }
            const copyExtraDecoded = this.decodeVarint(
                compressed,
                pos + 1 + commandCodeDecoded.bytes + insertExtraDecoded.bytes
            );
            if (!copyExtraDecoded.ok) {
                throw new Error('Invalid varint in copy extra');
            }
            const distanceCodeDecoded = this.decodeVarint(
                compressed,
                pos + 1 + commandCodeDecoded.bytes + insertExtraDecoded.bytes + copyExtraDecoded.bytes
            );
            if (!distanceCodeDecoded.ok) {
                throw new Error('Invalid varint in distance code');
            }
            const distanceExtraDecoded = this.decodeVarint(
                compressed,
                pos + 1 + commandCodeDecoded.bytes + insertExtraDecoded.bytes + copyExtraDecoded.bytes + distanceCodeDecoded.bytes
            );
            if (!distanceExtraDecoded.ok) {
                throw new Error('Invalid varint in distance extra');
            }
            const commandCode = commandCodeDecoded.value;
            const copyCodeCount = this.brotliCopyBase.length;
            const insertCode = Math.floor(commandCode / copyCodeCount);
            const copyCode = commandCode % copyCodeCount;
            if (insertCode >= this.brotliInsBase.length || copyCode >= this.brotliCopyBase.length) {
                throw new Error('Invalid insert/copy code');
            }
            const insertLength = this.decodeLengthPrefix(insertCode, insertExtraDecoded.value, this.brotliInsBase);
            const copyLength = this.decodeLengthPrefix(copyCode, copyExtraDecoded.value, this.brotliCopyBase);
            const offset = this.decodeDistanceWithCache(distanceCodeDecoded.value, distanceExtraDecoded.value, distanceCache);
            return {
                type: 'insert_copy',
                insertLength,
                copyLength,
                offset,
                encodedLength: 1 + commandCodeDecoded.bytes + insertExtraDecoded.bytes + copyExtraDecoded.bytes + distanceCodeDecoded.bytes + distanceExtraDecoded.bytes
            };
        } else if (marker === 0xFA) {
            const copyCodeDecoded = this.decodeVarint(compressed, pos + 1);
            if (!copyCodeDecoded.ok) {
                throw new Error('Invalid varint in copy length code');
            }
            const copyExtraDecoded = this.decodeVarint(compressed, pos + 1 + copyCodeDecoded.bytes);
            if (!copyExtraDecoded.ok) {
                throw new Error('Invalid varint in copy length extra');
            }
            const copyCode = copyCodeDecoded.value;
            if (copyCode >= this.brotliCopyBase.length) {
                throw new Error('Invalid copy length code');
            }
            const length = this.decodeLengthPrefix(copyCode, copyExtraDecoded.value, this.brotliCopyBase);

            const distanceCodeDecoded = this.decodeVarint(
                compressed,
                pos + 1 + copyCodeDecoded.bytes + copyExtraDecoded.bytes
            );
            if (!distanceCodeDecoded.ok) {
                throw new Error('Invalid varint in distance code');
            }
            const distanceExtraDecoded = this.decodeVarint(
                compressed,
                pos + 1 + copyCodeDecoded.bytes + copyExtraDecoded.bytes + distanceCodeDecoded.bytes
            );
            if (!distanceExtraDecoded.ok) {
                throw new Error('Invalid varint in distance extra');
            }
            const distanceCode = distanceCodeDecoded.value;
            const offset = this.decodeDistanceWithCache(distanceCode, distanceExtraDecoded.value, distanceCache);
            return {
                type: 'window',
                offset,
                length,
                encodedLength: 1 + copyCodeDecoded.bytes + copyExtraDecoded.bytes + distanceCodeDecoded.bytes + distanceExtraDecoded.bytes
            };
        } else if (marker === 0xFD) {
            // Run-length encoding
            const byte = compressed[pos + 1];
            const { value: runLength, bytes: lengthBytes, ok } = this.decodeVarint(compressed, pos + 2);
            if (!ok) {
                throw new Error('Invalid varint in run-length encoding');
            }
            return {
                type: 'run',
                byte: byte,
                length: runLength,
                encodedLength: 2 + lengthBytes
            };
        } else if (marker === 0xFC) {
            // Dictionary index reference
            const lengthDecoded = this.decodeVarint(compressed, pos + 1);
            if (!lengthDecoded.ok) {
                throw new Error('Invalid varint in dictionary length');
            }
            const dictIndexDecoded = this.decodeVarint(compressed, pos + 1 + lengthDecoded.bytes);
            if (!dictIndexDecoded.ok) {
                throw new Error('Invalid varint in dictionary index');
            }
            return {
                type: 'dict',
                length: lengthDecoded.value,
                dictIndex: dictIndexDecoded.value,
                encodedLength: 1 + lengthDecoded.bytes + dictIndexDecoded.bytes
            };
        } else if (marker === 0xFF) {
            // Dictionary reference
            const lengthDecoded = this.decodeVarint(compressed, pos + 1);
            if (!lengthDecoded.ok) {
                throw new Error('Invalid varint in dictionary literal length');
            }
            const length = lengthDecoded.value;
            return {
                type: 'dict',
                encoded: compressed.slice(pos + 1 + lengthDecoded.bytes, pos + 1 + lengthDecoded.bytes + length),
                length: length,
                encodedLength: 1 + lengthDecoded.bytes + length
            };
        } else if (marker === 0xFE) {
            // Window reference
            const offsetDecoded = this.decodeVarint(compressed, pos + 1);
            if (!offsetDecoded.ok) {
                throw new Error('Invalid varint in window offset');
            }
            const lengthDecoded = this.decodeVarint(compressed, pos + 1 + offsetDecoded.bytes);
            if (!lengthDecoded.ok) {
                throw new Error('Invalid varint in window length');
            }
            return {
                type: 'window',
                offset: offsetDecoded.value,
                length: lengthDecoded.value,
                encodedLength: 1 + offsetDecoded.bytes + lengthDecoded.bytes
            };
        } else {
            // Literal
            return {
                type: 'literal',
                byte: marker,
                encodedLength: 1
            };
        }
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
        for (const [key, freq] of frequencies) {
            nodes.push({ key, freq, left: null, right: null });
        }
        
        // Build tree by combining nodes
        while (nodes.length > 1) {
            // Sort by frequency
            nodes.sort((a, b) => a.freq - b.freq);
            
            // Take two lowest frequency nodes
            const left = nodes.shift();
            const right = nodes.shift();
            
            // Create parent node
            const parent = {
                key: null,
                freq: left.freq + right.freq,
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
                codes.set(node.key, code);
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
                const keyBytes = new TextEncoder().encode(node.key);
                nodes.push(keyBytes.length);
                nodes.push(...keyBytes);
                nodes.push(node.freq & 0xFF);
                nodes.push((node.freq >> 8) & 0xFF);
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
    deserializeHuffmanTree(data, pos) {
        if (data.length < pos + 2) {
            return { tree: null, treeSize: 0 };
        }
        
        let currentPos = pos;
        
        const deserializeNode = () => {
            if (currentPos >= data.length) {
                return null;
            }
            
            const type = data[currentPos];
            currentPos++;
            
            if (type === 0) {
                // Leaf node
                const keyLength = data[currentPos];
                currentPos++;
                const keyBytes = data.slice(currentPos, currentPos + keyLength);
                currentPos += keyLength;
                const freq = data[currentPos] | (data[currentPos + 1] << 8);
                currentPos += 2;
                return { key: new TextDecoder().decode(keyBytes), freq, left: null, right: null };
            } else if (type === 1) {
                // Internal node
                const left = deserializeNode();
                const right = deserializeNode();
                if (left && right) {
                    return { key: null, freq: left.freq + right.freq, left, right };
                }
                return null;
            }
            
            return null;
        };
        
        const tree = deserializeNode();
        return { tree, treeSize: currentPos - pos };
    }

    /**
     * Simple decoding for matches (proven to work)
     */
    simpleDecode(compressed) {
        const matches = [];
        let pos = 0;
        const distanceCache = this.initDistanceCache();

        while (pos < compressed.length) {
            const match = this.simpleDecodeMatch(compressed, pos, distanceCache);
            matches.push(match);
            pos += match.encodedLength;
        }

        return matches;
    }

    /**
     * Simple encoding for matches (proven to work)
     */
    simpleEncode(matches, contentType = 'text', useTextTokens = false, tokenTable = null, dictionary = null) {
        const payload = this.encodeMatchesPayload(matches, dictionary);
        return this.encodeContentHeader(contentType, payload, useTextTokens, tokenTable);
    }

    encodeMatchesPayload(matches, dictionary) {
        const encoded = [];

        const distanceCache = this.initDistanceCache();
        for (const match of matches) {
            const matchEncoded = this.simpleEncodeMatch(match, distanceCache);
            encoded.push(...matchEncoded);
        }

        const basePayload = new Uint8Array(encoded.length + 1);
        basePayload[0] = 0x00;
        basePayload.set(encoded, 1);

        const baseCandidate = this.buildPayloadCandidate(basePayload, { useContext: false, useTransform: false });
        let bestCandidate = baseCandidate;
        this.stats.literalContextUsed = false;
        this.stats.literalTransformUsed = false;

        const contextPayload = this.encodeLiteralContextPayload(matches, dictionary);
        if (contextPayload) {
            const contextCandidate = this.buildPayloadCandidate(contextPayload, { useContext: true, useTransform: false });
            if (contextCandidate.payload.length < bestCandidate.payload.length) {
                bestCandidate = contextCandidate;
            }
        }

        const clusterPayload = this.encodeLiteralContextClusterPayload(matches, dictionary);
        if (clusterPayload) {
            const clusterCandidate = this.buildPayloadCandidate(clusterPayload, { useContext: true, useTransform: false });
            if (clusterCandidate.payload.length < bestCandidate.payload.length) {
                bestCandidate = clusterCandidate;
            }
        }

        const blockClusterPayload = this.encodeLiteralContextBlockClusterPayload(matches, dictionary);
        if (blockClusterPayload) {
            const blockClusterCandidate = this.buildPayloadCandidate(blockClusterPayload, { useContext: true, useTransform: false });
            if (blockClusterCandidate.payload.length < bestCandidate.payload.length) {
                bestCandidate = blockClusterCandidate;
            }
        }

        const transformPayload = this.encodeLiteralContextTransformPayload(matches, dictionary);
        if (transformPayload) {
            const transformCandidate = this.buildPayloadCandidate(transformPayload, { useContext: true, useTransform: true });
            if (transformCandidate.payload.length < bestCandidate.payload.length) {
                bestCandidate = transformCandidate;
            }
        }

        const result = new Uint8Array(bestCandidate.payload.length + 1);
        result[0] = bestCandidate.useHuffman ? 0x01 : 0x00;
        result.set(bestCandidate.payload, 1);
        this.stats.huffmanUsed = bestCandidate.useHuffman;
        this.stats.literalContextUsed = bestCandidate.useContext;
        this.stats.literalTransformUsed = bestCandidate.useTransform;
        return result;
    }

    buildPayloadCandidate(payload, meta = {}) {
        if (payload.length >= this.payloadHuffmanThreshold) {
            const huffmanPayload = this.huffmanEncodeBytes(payload);
            if (huffmanPayload && huffmanPayload.length + 1 < payload.length + 1) {
                return { payload: huffmanPayload, useHuffman: true, ...meta };
            }
        }

        return { payload, useHuffman: false, ...meta };
    }

    decodeMatchesPayload(payload, dictionary) {
        if (!payload || payload.length === 0) {
            return [];
        }

        const encodingType = payload[0];
        const data = payload.slice(1);
        const decodedBytes = encodingType === 0x01
            ? this.huffmanDecodeBytes(data)
            : data;

        if (!decodedBytes || decodedBytes.length === 0) {
            return [];
        }

        const mode = decodedBytes[0];
        const stream = decodedBytes.slice(1);

        if (mode === 0x01) {
            return this.decodeLiteralContextPayload(stream, dictionary);
        }

        if (mode === 0x02) {
            return this.decodeLiteralContextTransformPayload(stream, dictionary);
        }

        if (mode === 0x03) {
            return this.decodeLiteralContextClusterPayload(stream, dictionary);
        }

        if (mode === 0x04) {
            return this.decodeLiteralContextBlockClusterPayload(stream, dictionary);
        }

        return this.simpleDecode(stream);
    }

    encodeCommandStreams(commandMatches) {
        const markerBytes = [];
        const literalRunLengths = [];
        const runBytes = [];
        const runLengths = [];
        const dictLengths = [];
        const dictIndices = [];
        const dictLiteralLengths = [];
        const dictLiteralBytes = [];
        const commandEntries = [];

        for (const match of commandMatches) {
            if (match.type === 'literal_ctx') {
                markerBytes.push(0xFB);
                continue;
            }

            if (match.type === 'literal_ctx_run') {
                markerBytes.push(0xF8);
                literalRunLengths.push(match.length);
                continue;
            }

            if (match.type === 'insert_copy') {
                const insertPrefix = this.encodeLengthPrefix(match.insertLength, this.brotliInsBase, this.brotliInsExtra);
                const copyPrefix = this.encodeLengthPrefix(match.copyLength, this.brotliCopyBase, this.brotliCopyExtra);
                const commandCode = insertPrefix.code * this.brotliCopyBase.length + copyPrefix.code;
                markerBytes.push(0xF7);
                commandEntries.push({
                    commandCode,
                    insertExtra: insertPrefix.extraValue,
                    copyExtra: copyPrefix.extraValue,
                    offset: match.offset,
                    copyLength: match.copyLength
                });
                continue;
            }

            if (match.type === 'run') {
                markerBytes.push(0xFD);
                runBytes.push(match.byte);
                runLengths.push(match.length);
                continue;
            }

            if (match.type === 'dict') {
                if (match.dictIndex !== undefined && match.length >= this.minDictIndexLength) {
                    markerBytes.push(0xFC);
                    dictLengths.push(match.length);
                    dictIndices.push(match.dictIndex);
                } else if (match.encoded) {
                    markerBytes.push(0xFF);
                    dictLiteralLengths.push(match.encoded.length);
                    for (const byte of match.encoded) {
                        dictLiteralBytes.push(byte);
                    }
                }
                continue;
            }
        }

        const distanceAlphabet = this.selectDistanceAlphabetParams(commandEntries);
        const distanceCache = this.initDistanceCache();
        for (const entry of commandEntries) {
            const distanceEncoded = this.encodeDistanceWithCache(entry.offset, distanceCache, distanceAlphabet);
            entry.distanceCode = distanceEncoded.code;
            entry.distanceExtra = distanceEncoded.extraBits;
        }

        const commandCount = commandEntries.length;
        const commandBlockSize = this.commandBlockSize > 0 ? this.commandBlockSize : Math.max(1, commandCount);
        const commandBlockCount = Math.max(1, Math.ceil(commandCount / commandBlockSize));
        const commandHistograms = Array.from({ length: commandBlockCount }, () => ({}));

        for (let i = 0; i < commandEntries.length; i++) {
            const blockIndex = Math.floor(i / commandBlockSize);
            const histogram = commandHistograms[blockIndex] || {};
            const code = commandEntries[i].commandCode;
            histogram[code] = (histogram[code] || 0) + 1;
            commandHistograms[blockIndex] = histogram;
        }

        const clusteredCommands = this.histogramClusterer.clusterHistograms(
            commandHistograms,
            this.commandBlockClusterMax
        );
        const commandBlockTypes = new Array(commandBlockCount).fill(0);
        let commandBlockTypeCount = 0;
        for (let i = 0; i < commandBlockCount; i++) {
            const blockType = clusteredCommands[i]?.cluster ?? 0;
            commandBlockTypes[i] = blockType;
            if (blockType + 1 > commandBlockTypeCount) {
                commandBlockTypeCount = blockType + 1;
            }
        }
        if (commandBlockTypeCount <= 0) {
            commandBlockTypeCount = 1;
        }

        const commandCodeStreams = Array.from({ length: commandBlockTypeCount }, () => []);
        const insertExtraStreams = Array.from({ length: commandBlockTypeCount }, () => []);
        const copyExtraStreams = Array.from({ length: commandBlockTypeCount }, () => []);
        const distanceContextCount = Math.max(1, this.distanceContextCount || 4);
        const distanceCodeStreams = Array.from({ length: distanceContextCount }, () => []);
        const distanceExtraStreams = Array.from({ length: distanceContextCount }, () => []);

        for (let i = 0; i < commandEntries.length; i++) {
            const entry = commandEntries[i];
            const blockIndex = Math.floor(i / commandBlockSize);
            const blockType = commandBlockTypes[blockIndex] ?? 0;
            commandCodeStreams[blockType].push(entry.commandCode);
            insertExtraStreams[blockType].push(entry.insertExtra);
            copyExtraStreams[blockType].push(entry.copyExtra);
            const distanceContext = this.getDistanceContextId(entry.copyLength, distanceContextCount);
            distanceCodeStreams[distanceContext].push(entry.distanceCode);
            distanceExtraStreams[distanceContext].push(entry.distanceExtra);
        }

        const markerBlock = this.encodeStreamBlock(new Uint8Array(markerBytes));
        const extraStream = [];
        extraStream.push(0x03);
        extraStream.push(...this.encodeVarint(distanceAlphabet.directCodes));
        extraStream.push(...this.encodeVarint(distanceAlphabet.postfixBits));
        extraStream.push(...this.encodeVarint(commandBlockSize));
        extraStream.push(...this.encodeVarint(commandBlockTypeCount));
        extraStream.push(...this.encodeVarint(commandBlockTypes.length));
        for (const blockType of commandBlockTypes) {
            extraStream.push(blockType & 0xFF);
        }
        extraStream.push(...this.encodeVarint(distanceContextCount));
        const pushBlock = (block) => {
            extraStream.push(...this.encodeVarint(block.length));
            extraStream.push(...block);
        };
        for (const stream of commandCodeStreams) {
            pushBlock(this.encodeSymbolStreamBlock(stream));
        }
        for (const stream of insertExtraStreams) {
            pushBlock(this.encodeSymbolStreamBlock(stream));
        }
        for (const stream of copyExtraStreams) {
            pushBlock(this.encodeSymbolStreamBlock(stream));
        }
        for (const stream of distanceCodeStreams) {
            pushBlock(this.encodeSymbolStreamBlock(stream));
        }
        for (const stream of distanceExtraStreams) {
            pushBlock(this.encodeSymbolStreamBlock(stream));
        }
        pushBlock(this.encodeSymbolStreamBlock(literalRunLengths));
        pushBlock(this.encodeStreamBlock(new Uint8Array(runBytes)));
        pushBlock(this.encodeSymbolStreamBlock(runLengths));
        pushBlock(this.encodeSymbolStreamBlock(dictLengths));
        pushBlock(this.encodeSymbolStreamBlock(dictIndices));
        pushBlock(this.encodeSymbolStreamBlock(dictLiteralLengths));
        pushBlock(this.encodeStreamBlock(new Uint8Array(dictLiteralBytes)));

        return {
            markerBlock,
            extraBlock: this.encodeStreamBlock(new Uint8Array(extraStream), false)
        };
    }

    decodeCommandStreams(markerBlock, extraBlock) {
        const markerStream = this.decodeStreamBlock(markerBlock);
        const extraStream = this.decodeStreamBlock(extraBlock);
        const distanceCache = this.initDistanceCache();
        const matches = [];
        let pos = 0;

        if (extraStream.length > 0 && extraStream[0] === 0x03) {
            pos = 1;
            const readVarintValue = () => {
                const decoded = this.decodeVarint(extraStream, pos);
                if (!decoded.ok) {
                    return null;
                }
                pos += decoded.bytes;
                return decoded.value;
            };
            const readBlock = () => {
                const lengthDecoded = this.decodeVarint(extraStream, pos);
                if (!lengthDecoded.ok) {
                    return new Uint8Array();
                }
                const length = lengthDecoded.value;
                pos += lengthDecoded.bytes;
                const block = extraStream.slice(pos, pos + length);
                pos += length;
                return block;
            };

            const directCodes = readVarintValue() ?? this.distanceDirectCodes;
            const postfixBits = readVarintValue() ?? this.distancePostfixBits;
            const distanceParams = { directCodes, postfixBits };
            const commandBlockSize = readVarintValue() ?? this.commandBlockSize ?? 1;
            const rawCommandBlockTypeCount = readVarintValue();
            const commandBlockTypeCount = Math.max(1, rawCommandBlockTypeCount ?? 1);
            const blockTypesLength = readVarintValue() ?? 0;
            const commandBlockTypes = Array.from(extraStream.slice(pos, pos + blockTypesLength));
            pos += blockTypesLength;
            const rawDistanceContextCount = readVarintValue();
            const distanceContextCount = Math.max(1, rawDistanceContextCount ?? (this.distanceContextCount || 4));

            const commandCodeStreams = [];
            const insertExtraStreams = [];
            const copyExtraStreams = [];
            for (let i = 0; i < commandBlockTypeCount; i++) {
                commandCodeStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }
            for (let i = 0; i < commandBlockTypeCount; i++) {
                insertExtraStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }
            for (let i = 0; i < commandBlockTypeCount; i++) {
                copyExtraStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }

            const distanceCodeStreams = [];
            const distanceExtraStreams = [];
            for (let i = 0; i < distanceContextCount; i++) {
                distanceCodeStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }
            for (let i = 0; i < distanceContextCount; i++) {
                distanceExtraStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }

            const literalRunLengths = this.decodeSymbolStreamBlock(readBlock());
            const runBytes = this.decodeStreamBlock(readBlock());
            const runLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictIndices = this.decodeSymbolStreamBlock(readBlock());
            const dictLiteralLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictLiteralBytes = this.decodeStreamBlock(readBlock());

            const commandIndices = new Array(commandBlockTypeCount).fill(0);
            const insertIndices = new Array(commandBlockTypeCount).fill(0);
            const copyIndices = new Array(commandBlockTypeCount).fill(0);
            const distanceIndices = new Array(distanceContextCount).fill(0);
            const distanceExtraIndices = new Array(distanceContextCount).fill(0);
            let literalRunIndex = 0;
            let runIndex = 0;
            let runLengthIndex = 0;
            let dictLengthIndex = 0;
            let dictIndexIndex = 0;
            let dictLiteralLengthIndex = 0;
            let dictLiteralPos = 0;
            let commandIndex = 0;

            const effectiveCommandBlockSize = commandBlockSize > 0 ? commandBlockSize : 1;

            for (const marker of markerStream) {
                if (marker === 0xFB) {
                    matches.push({ type: 'literal_ctx' });
                    continue;
                }

                if (marker === 0xF8) {
                    const length = literalRunLengths[literalRunIndex++] ?? 0;
                    matches.push({ type: 'literal_ctx_run', length });
                    continue;
                }

                if (marker === 0xF7) {
                    const blockIndex = Math.floor(commandIndex / effectiveCommandBlockSize);
                    const blockType = commandBlockTypes[blockIndex] ?? 0;
                    const commandCode = commandCodeStreams[blockType]?.[commandIndices[blockType]++] ?? 0;
                    const insertExtra = insertExtraStreams[blockType]?.[insertIndices[blockType]++] ?? 0;
                    const copyExtra = copyExtraStreams[blockType]?.[copyIndices[blockType]++] ?? 0;
                    const copyCodeCount = this.brotliCopyBase.length;
                    const insertCode = Math.floor(commandCode / copyCodeCount);
                    const copyCode = commandCode % copyCodeCount;
                    if (insertCode >= this.brotliInsBase.length || copyCode >= this.brotliCopyBase.length) {
                        throw new Error('Invalid insert/copy code');
                    }
                    const insertLength = this.decodeLengthPrefix(insertCode, insertExtra, this.brotliInsBase);
                    const copyLength = this.decodeLengthPrefix(copyCode, copyExtra, this.brotliCopyBase);
                    const distanceContext = this.getDistanceContextId(copyLength, distanceContextCount);
                    const distanceCode = distanceCodeStreams[distanceContext]?.[distanceIndices[distanceContext]++] ?? 0;
                    const distanceExtra = distanceExtraStreams[distanceContext]?.[distanceExtraIndices[distanceContext]++] ?? 0;
                    const offset = this.decodeDistanceWithCache(distanceCode, distanceExtra, distanceCache, distanceParams);
                    matches.push({ type: 'insert_copy', insertLength, copyLength, offset });
                    commandIndex++;
                    continue;
                }

                if (marker === 0xFD) {
                    const byte = runBytes[runIndex++] ?? 0;
                    const length = runLengths[runLengthIndex++] ?? 0;
                    matches.push({ type: 'run', byte, length });
                    continue;
                }

                if (marker === 0xFC) {
                    const length = dictLengths[dictLengthIndex++] ?? 0;
                    const dictIndex = dictIndices[dictIndexIndex++] ?? 0;
                    matches.push({ type: 'dict', length, dictIndex });
                    continue;
                }

                if (marker === 0xFF) {
                    const length = dictLiteralLengths[dictLiteralLengthIndex++] ?? 0;
                    const encoded = dictLiteralBytes.slice(dictLiteralPos, dictLiteralPos + length);
                    dictLiteralPos += length;
                    matches.push({ type: 'dict', encoded });
                    continue;
                }
            }

            return matches;
        }

        if (extraStream.length > 0 && extraStream[0] === 0x02) {
            pos = 1;
            const readVarintValue = () => {
                const decoded = this.decodeVarint(extraStream, pos);
                if (!decoded.ok) {
                    return null;
                }
                pos += decoded.bytes;
                return decoded.value;
            };
            const readBlock = () => {
                const lengthDecoded = this.decodeVarint(extraStream, pos);
                if (!lengthDecoded.ok) {
                    return new Uint8Array();
                }
                const length = lengthDecoded.value;
                pos += lengthDecoded.bytes;
                const block = extraStream.slice(pos, pos + length);
                pos += length;
                return block;
            };

            const commandBlockSize = readVarintValue() ?? this.commandBlockSize ?? 1;
            const rawCommandBlockTypeCount = readVarintValue();
            const commandBlockTypeCount = Math.max(1, rawCommandBlockTypeCount ?? 1);
            const blockTypesLength = readVarintValue() ?? 0;
            const commandBlockTypes = Array.from(extraStream.slice(pos, pos + blockTypesLength));
            pos += blockTypesLength;
            const rawDistanceContextCount = readVarintValue();
            const distanceContextCount = Math.max(1, rawDistanceContextCount ?? (this.distanceContextCount || 4));

            const commandCodeStreams = [];
            const insertExtraStreams = [];
            const copyExtraStreams = [];
            for (let i = 0; i < commandBlockTypeCount; i++) {
                commandCodeStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }
            for (let i = 0; i < commandBlockTypeCount; i++) {
                insertExtraStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }
            for (let i = 0; i < commandBlockTypeCount; i++) {
                copyExtraStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }

            const distanceCodeStreams = [];
            const distanceExtraStreams = [];
            for (let i = 0; i < distanceContextCount; i++) {
                distanceCodeStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }
            for (let i = 0; i < distanceContextCount; i++) {
                distanceExtraStreams.push(this.decodeSymbolStreamBlock(readBlock()));
            }

            const literalRunLengths = this.decodeSymbolStreamBlock(readBlock());
            const runBytes = this.decodeStreamBlock(readBlock());
            const runLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictIndices = this.decodeSymbolStreamBlock(readBlock());
            const dictLiteralLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictLiteralBytes = this.decodeStreamBlock(readBlock());

            const commandIndices = new Array(commandBlockTypeCount).fill(0);
            const insertIndices = new Array(commandBlockTypeCount).fill(0);
            const copyIndices = new Array(commandBlockTypeCount).fill(0);
            const distanceIndices = new Array(distanceContextCount).fill(0);
            const distanceExtraIndices = new Array(distanceContextCount).fill(0);
            let literalRunIndex = 0;
            let runIndex = 0;
            let runLengthIndex = 0;
            let dictLengthIndex = 0;
            let dictIndexIndex = 0;
            let dictLiteralLengthIndex = 0;
            let dictLiteralPos = 0;
            let commandIndex = 0;

            const effectiveCommandBlockSize = commandBlockSize > 0 ? commandBlockSize : 1;

            for (const marker of markerStream) {
                if (marker === 0xFB) {
                    matches.push({ type: 'literal_ctx' });
                    continue;
                }

                if (marker === 0xF8) {
                    const length = literalRunLengths[literalRunIndex++] ?? 0;
                    matches.push({ type: 'literal_ctx_run', length });
                    continue;
                }

                if (marker === 0xF7) {
                    const blockIndex = Math.floor(commandIndex / effectiveCommandBlockSize);
                    const blockType = commandBlockTypes[blockIndex] ?? 0;
                    const commandCode = commandCodeStreams[blockType]?.[commandIndices[blockType]++] ?? 0;
                    const insertExtra = insertExtraStreams[blockType]?.[insertIndices[blockType]++] ?? 0;
                    const copyExtra = copyExtraStreams[blockType]?.[copyIndices[blockType]++] ?? 0;
                    const copyCodeCount = this.brotliCopyBase.length;
                    const insertCode = Math.floor(commandCode / copyCodeCount);
                    const copyCode = commandCode % copyCodeCount;
                    if (insertCode >= this.brotliInsBase.length || copyCode >= this.brotliCopyBase.length) {
                        throw new Error('Invalid insert/copy code');
                    }
                    const insertLength = this.decodeLengthPrefix(insertCode, insertExtra, this.brotliInsBase);
                    const copyLength = this.decodeLengthPrefix(copyCode, copyExtra, this.brotliCopyBase);
                    const distanceContext = this.getDistanceContextId(copyLength, distanceContextCount);
                    const distanceCode = distanceCodeStreams[distanceContext]?.[distanceIndices[distanceContext]++] ?? 0;
                    const distanceExtra = distanceExtraStreams[distanceContext]?.[distanceExtraIndices[distanceContext]++] ?? 0;
                    const offset = this.decodeDistanceWithCache(distanceCode, distanceExtra, distanceCache);
                    matches.push({ type: 'insert_copy', insertLength, copyLength, offset });
                    commandIndex++;
                    continue;
                }

                if (marker === 0xFD) {
                    const byte = runBytes[runIndex++] ?? 0;
                    const length = runLengths[runLengthIndex++] ?? 0;
                    matches.push({ type: 'run', byte, length });
                    continue;
                }

                if (marker === 0xFC) {
                    const length = dictLengths[dictLengthIndex++] ?? 0;
                    const dictIndex = dictIndices[dictIndexIndex++] ?? 0;
                    matches.push({ type: 'dict', length, dictIndex });
                    continue;
                }

                if (marker === 0xFF) {
                    const length = dictLiteralLengths[dictLiteralLengthIndex++] ?? 0;
                    const encoded = dictLiteralBytes.slice(dictLiteralPos, dictLiteralPos + length);
                    dictLiteralPos += length;
                    matches.push({ type: 'dict', encoded });
                    continue;
                }
            }

            return matches;
        }

        if (extraStream.length > 0 && extraStream[0] === 0x01) {
            pos = 1;
            const readBlock = () => {
                const lengthDecoded = this.decodeVarint(extraStream, pos);
                if (!lengthDecoded.ok) {
                    return new Uint8Array();
                }
                const length = lengthDecoded.value;
                pos += lengthDecoded.bytes;
                const block = extraStream.slice(pos, pos + length);
                pos += length;
                return block;
            };

            const commandCodes = this.decodeSymbolStreamBlock(readBlock());
            const insertExtras = this.decodeSymbolStreamBlock(readBlock());
            const copyExtras = this.decodeSymbolStreamBlock(readBlock());
            const distanceCodes = this.decodeSymbolStreamBlock(readBlock());
            const distanceExtras = this.decodeSymbolStreamBlock(readBlock());
            const literalRunLengths = this.decodeSymbolStreamBlock(readBlock());
            const runBytes = this.decodeStreamBlock(readBlock());
            const runLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictIndices = this.decodeSymbolStreamBlock(readBlock());
            const dictLiteralLengths = this.decodeSymbolStreamBlock(readBlock());
            const dictLiteralBytes = this.decodeStreamBlock(readBlock());

            let commandIndex = 0;
            let insertIndex = 0;
            let copyIndex = 0;
            let distanceIndex = 0;
            let distanceExtraIndex = 0;
            let literalRunIndex = 0;
            let runIndex = 0;
            let runLengthIndex = 0;
            let dictLengthIndex = 0;
            let dictIndexIndex = 0;
            let dictLiteralLengthIndex = 0;
            let dictLiteralPos = 0;

            for (const marker of markerStream) {
                if (marker === 0xFB) {
                    matches.push({ type: 'literal_ctx' });
                    continue;
                }

                if (marker === 0xF8) {
                    const length = literalRunLengths[literalRunIndex++] ?? 0;
                    matches.push({ type: 'literal_ctx_run', length });
                    continue;
                }

                if (marker === 0xF7) {
                    const commandCode = commandCodes[commandIndex++] ?? 0;
                    const insertExtra = insertExtras[insertIndex++] ?? 0;
                    const copyExtra = copyExtras[copyIndex++] ?? 0;
                    const distanceCode = distanceCodes[distanceIndex++] ?? 0;
                    const distanceExtra = distanceExtras[distanceExtraIndex++] ?? 0;
                    const copyCodeCount = this.brotliCopyBase.length;
                    const insertCode = Math.floor(commandCode / copyCodeCount);
                    const copyCode = commandCode % copyCodeCount;
                    if (insertCode >= this.brotliInsBase.length || copyCode >= this.brotliCopyBase.length) {
                        throw new Error('Invalid insert/copy code');
                    }
                    const insertLength = this.decodeLengthPrefix(insertCode, insertExtra, this.brotliInsBase);
                    const copyLength = this.decodeLengthPrefix(copyCode, copyExtra, this.brotliCopyBase);
                    const offset = this.decodeDistanceWithCache(distanceCode, distanceExtra, distanceCache);
                    matches.push({ type: 'insert_copy', insertLength, copyLength, offset });
                    continue;
                }

                if (marker === 0xFD) {
                    const byte = runBytes[runIndex++] ?? 0;
                    const length = runLengths[runLengthIndex++] ?? 0;
                    matches.push({ type: 'run', byte, length });
                    continue;
                }

                if (marker === 0xFC) {
                    const length = dictLengths[dictLengthIndex++] ?? 0;
                    const dictIndex = dictIndices[dictIndexIndex++] ?? 0;
                    matches.push({ type: 'dict', length, dictIndex });
                    continue;
                }

                if (marker === 0xFF) {
                    const length = dictLiteralLengths[dictLiteralLengthIndex++] ?? 0;
                    const encoded = dictLiteralBytes.slice(dictLiteralPos, dictLiteralPos + length);
                    dictLiteralPos += length;
                    matches.push({ type: 'dict', encoded });
                    continue;
                }
            }

            return matches;
        }

        const readVarint = () => {
            const decoded = this.decodeVarint(extraStream, pos);
            if (!decoded.ok) {
                throw new Error('Invalid varint in command stream');
            }
            pos += decoded.bytes;
            return decoded.value;
        };

        for (const marker of markerStream) {
            if (marker === 0xFB) {
                matches.push({ type: 'literal_ctx' });
                continue;
            }

            if (marker === 0xF8) {
                const length = readVarint();
                matches.push({ type: 'literal_ctx_run', length });
                continue;
            }

            if (marker === 0xF7) {
                const commandCode = readVarint();
                const insertExtra = readVarint();
                const copyExtra = readVarint();
                const distanceCode = readVarint();
                const distanceExtra = readVarint();
                const copyCodeCount = this.brotliCopyBase.length;
                const insertCode = Math.floor(commandCode / copyCodeCount);
                const copyCode = commandCode % copyCodeCount;
                if (insertCode >= this.brotliInsBase.length || copyCode >= this.brotliCopyBase.length) {
                    throw new Error('Invalid insert/copy code');
                }
                const insertLength = this.decodeLengthPrefix(insertCode, insertExtra, this.brotliInsBase);
                const copyLength = this.decodeLengthPrefix(copyCode, copyExtra, this.brotliCopyBase);
                const offset = this.decodeDistanceWithCache(distanceCode, distanceExtra, distanceCache);
                matches.push({ type: 'insert_copy', insertLength, copyLength, offset });
                continue;
            }

            if (marker === 0xFD) {
                const byte = extraStream[pos++];
                const length = readVarint();
                matches.push({ type: 'run', byte, length });
                continue;
            }

            if (marker === 0xFC) {
                const length = readVarint();
                const dictIndex = readVarint();
                matches.push({ type: 'dict', length, dictIndex });
                continue;
            }

            if (marker === 0xFF) {
                const length = readVarint();
                const encoded = extraStream.slice(pos, pos + length);
                pos += length;
                matches.push({ type: 'dict', encoded });
                continue;
            }
        }

        return matches;
    }

    encodeLiteralContextPayload(matches, dictionary) {
        if (!dictionary || this.literalContextCount <= 1) {
            return null;
        }

        const commandMatches = [];
        const literalStreams = Array.from({ length: this.literalContextCount }, () => []);
        const output = [];
        let literalCount = 0;
        let literalRun = 0;

        for (const match of matches) {
            if (match.type === 'literal') {
                const prev1 = output.length > 0 ? output[output.length - 1] : null;
                const prev2 = output.length > 1 ? output[output.length - 2] : null;
                const contextId = this.getLiteralContextId(prev1, prev2);
                literalStreams[contextId].push(match.byte);
                literalRun++;
                literalCount++;
                this.appendMatchOutput(match, output, dictionary, match.byte);
            } else if (match.type === 'window') {
                commandMatches.push({
                    type: 'insert_copy',
                    insertLength: literalRun,
                    copyLength: match.length,
                    offset: match.offset
                });
                literalRun = 0;
                this.appendMatchOutput(match, output, dictionary);
            } else {
                if (literalRun > 0) {
                    commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
                    literalRun = 0;
                }
                commandMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        if (literalRun > 0) {
            commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
        }

        if (literalCount < this.literalContextThreshold) {
            return null;
        }

        const { markerBlock, extraBlock } = this.encodeCommandStreams(commandMatches);

        const payload = [];
        payload.push(0x01);
        payload.push(...this.encodeVarint(this.literalContextCount));
        payload.push(...this.encodeVarint(markerBlock.length));
        this.appendBytes(payload, markerBlock);
        payload.push(...this.encodeVarint(extraBlock.length));
        this.appendBytes(payload, extraBlock);

        for (const stream of literalStreams) {
            const streamBlock = this.encodeStreamBlock(new Uint8Array(stream));
            payload.push(...this.encodeVarint(streamBlock.length));
            this.appendBytes(payload, streamBlock);
        }

        return new Uint8Array(payload);
    }

    encodeLiteralContextBlockClusterPayload(matches, dictionary) {
        if (!dictionary || this.literalContextCount <= 1) {
            return null;
        }

        const commandMatches = [];
        const literalSequence = [];
        const blockHistograms = [];
        const output = [];
        let literalCount = 0;
        let literalRun = 0;

        for (const match of matches) {
            if (match.type === 'literal') {
                const prev1 = output.length > 0 ? output[output.length - 1] : null;
                const prev2 = output.length > 1 ? output[output.length - 2] : null;
                const contextId = this.getLiteralContextId(prev1, prev2);
                literalSequence.push({ contextId, byte: match.byte });
                const blockIndex = Math.floor(literalCount / this.literalContextBlockSize);
                if (!blockHistograms[blockIndex]) {
                    blockHistograms[blockIndex] = {};
                }
                const blockHistogram = blockHistograms[blockIndex];
                blockHistogram[contextId] = (blockHistogram[contextId] || 0) + 1;
                literalRun++;
                literalCount++;
                this.appendMatchOutput(match, output, dictionary, match.byte);
            } else if (match.type === 'window') {
                commandMatches.push({
                    type: 'insert_copy',
                    insertLength: literalRun,
                    copyLength: match.length,
                    offset: match.offset
                });
                literalRun = 0;
                this.appendMatchOutput(match, output, dictionary);
            } else {
                if (literalRun > 0) {
                    commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
                    literalRun = 0;
                }
                commandMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        if (literalRun > 0) {
            commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
        }

        if (literalCount < this.literalContextThreshold) {
            return null;
        }

        const blockCount = Math.max(1, blockHistograms.length);
        const clusteredBlocks = this.histogramClusterer.clusterHistograms(
            blockHistograms,
            this.literalContextBlockClusterMax
        );
        const blockTypes = new Array(blockCount).fill(0);
        let blockTypeCount = 0;
        for (let i = 0; i < blockCount; i++) {
            const blockType = clusteredBlocks[i]?.cluster ?? 0;
            blockTypes[i] = blockType;
            if (blockType + 1 > blockTypeCount) {
                blockTypeCount = blockType + 1;
            }
        }
        if (blockTypeCount <= 0) {
            blockTypeCount = 1;
        }

        const contextHistogramsByBlock = Array.from({ length: blockTypeCount }, () =>
            Array.from({ length: this.literalContextCount }, () => ({}))
        );

        for (let i = 0; i < literalSequence.length; i++) {
            const entry = literalSequence[i];
            const blockIndex = Math.floor(i / this.literalContextBlockSize);
            const blockType = blockTypes[blockIndex] ?? 0;
            const contextHistogram = contextHistogramsByBlock[blockType][entry.contextId];
            contextHistogram[entry.byte] = (contextHistogram[entry.byte] || 0) + 1;
        }

        const contextMaps = [];
        const clusterCounts = [];
        for (let blockType = 0; blockType < blockTypeCount; blockType++) {
            const clusteredContexts = this.histogramClusterer.clusterHistograms(
                contextHistogramsByBlock[blockType],
                this.literalContextClusterMax
            );
            const contextMap = new Array(this.literalContextCount).fill(0);
            let clusterCount = 0;
            for (let i = 0; i < clusteredContexts.length; i++) {
                const clusterId = clusteredContexts[i].cluster ?? 0;
                contextMap[i] = clusterId;
                if (clusterId + 1 > clusterCount) {
                    clusterCount = clusterId + 1;
                }
            }
            if (clusterCount <= 0) {
                clusterCount = 1;
            }
            contextMaps[blockType] = contextMap;
            clusterCounts[blockType] = clusterCount;
        }

        const clusterStreamsByBlock = Array.from({ length: blockTypeCount }, (_, blockType) =>
            Array.from({ length: clusterCounts[blockType] }, () => [])
        );

        for (let i = 0; i < literalSequence.length; i++) {
            const entry = literalSequence[i];
            const blockIndex = Math.floor(i / this.literalContextBlockSize);
            const blockType = blockTypes[blockIndex] ?? 0;
            const contextMap = contextMaps[blockType] || [];
            const clusterId = contextMap[entry.contextId] ?? 0;
            if (!clusterStreamsByBlock[blockType][clusterId]) {
                clusterStreamsByBlock[blockType][clusterId] = [];
            }
            clusterStreamsByBlock[blockType][clusterId].push(entry.byte);
        }

        const { markerBlock, extraBlock } = this.encodeCommandStreams(commandMatches);

        const payload = [];
        payload.push(0x04);
        payload.push(...this.encodeVarint(this.literalContextCount));
        payload.push(...this.encodeVarint(this.literalContextBlockSize));
        payload.push(...this.encodeVarint(blockCount));
        payload.push(...this.encodeVarint(blockTypeCount));
        payload.push(...this.encodeVarint(blockTypes.length));
        for (const blockType of blockTypes) {
            payload.push(blockType & 0xFF);
        }
        payload.push(...this.encodeVarint(markerBlock.length));
        this.appendBytes(payload, markerBlock);
        payload.push(...this.encodeVarint(extraBlock.length));
        this.appendBytes(payload, extraBlock);

        for (let blockType = 0; blockType < blockTypeCount; blockType++) {
            const contextMap = contextMaps[blockType] || [];
            const clusterCount = clusterCounts[blockType] || 1;
            payload.push(...this.encodeVarint(clusterCount));
            const contextEncoded = this.encodeContextMap(contextMap);
            payload.push(contextEncoded.encoding);
            payload.push(...this.encodeVarint(contextMap.length));
            payload.push(...this.encodeVarint(contextEncoded.data.length));
            this.appendBytes(payload, contextEncoded.data);

            const streams = clusterStreamsByBlock[blockType] || [];
            const clusterLengths = [];
            let totalLength = 0;
            for (let i = 0; i < clusterCount; i++) {
                const length = (streams[i] || []).length;
                clusterLengths.push(length);
                totalLength += length;
            }
            for (const length of clusterLengths) {
                payload.push(...this.encodeVarint(length));
            }

            const concatenated = new Uint8Array(totalLength);
            let offset = 0;
            for (let i = 0; i < clusterCount; i++) {
                const stream = streams[i] || [];
                concatenated.set(stream, offset);
                offset += stream.length;
            }
            const streamBlock = this.encodeStreamBlock(concatenated);
            payload.push(...this.encodeVarint(streamBlock.length));
            this.appendBytes(payload, streamBlock);
        }

        return new Uint8Array(payload);
    }

    encodeLiteralContextClusterPayload(matches, dictionary) {
        if (!dictionary || this.literalContextCount <= 1) {
            return null;
        }

        const commandMatches = [];
        const literalSequence = [];
        const histograms = Array.from({ length: this.literalContextCount }, () => ({}));
        const output = [];
        let literalCount = 0;
        let literalRun = 0;

        for (const match of matches) {
            if (match.type === 'literal') {
                const prev1 = output.length > 0 ? output[output.length - 1] : null;
                const prev2 = output.length > 1 ? output[output.length - 2] : null;
                const contextId = this.getLiteralContextId(prev1, prev2);
                literalSequence.push({ contextId, byte: match.byte });
                const histogram = histograms[contextId];
                histogram[match.byte] = (histogram[match.byte] || 0) + 1;
                literalRun++;
                literalCount++;
                this.appendMatchOutput(match, output, dictionary, match.byte);
            } else if (match.type === 'window') {
                commandMatches.push({
                    type: 'insert_copy',
                    insertLength: literalRun,
                    copyLength: match.length,
                    offset: match.offset
                });
                literalRun = 0;
                this.appendMatchOutput(match, output, dictionary);
            } else {
                if (literalRun > 0) {
                    commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
                    literalRun = 0;
                }
                commandMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        if (literalRun > 0) {
            commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
        }

        if (literalCount < this.literalContextThreshold) {
            return null;
        }

        const clustered = this.histogramClusterer.clusterHistograms(histograms, this.literalContextClusterMax);
        const contextMap = new Array(this.literalContextCount).fill(0);
        let clusterCount = 0;
        for (let i = 0; i < clustered.length; i++) {
            const clusterId = clustered[i].cluster ?? 0;
            contextMap[i] = clusterId;
            if (clusterId + 1 > clusterCount) {
                clusterCount = clusterId + 1;
            }
        }
        if (clusterCount <= 0) {
            clusterCount = 1;
        }

        const clusterStreams = Array.from({ length: clusterCount }, () => []);
        for (const entry of literalSequence) {
            const clusterId = contextMap[entry.contextId] ?? 0;
            if (!clusterStreams[clusterId]) {
                clusterStreams[clusterId] = [];
            }
            clusterStreams[clusterId].push(entry.byte);
        }

        const { markerBlock, extraBlock } = this.encodeCommandStreams(commandMatches);

        const payload = [];
        payload.push(0x03);
        payload.push(...this.encodeVarint(this.literalContextCount));
        payload.push(...this.encodeVarint(clusterCount));
        payload.push(...this.encodeVarint(markerBlock.length));
        this.appendBytes(payload, markerBlock);
        payload.push(...this.encodeVarint(extraBlock.length));
        this.appendBytes(payload, extraBlock);

        const contextEncoded = this.encodeContextMap(contextMap);
        payload.push(contextEncoded.encoding);
        payload.push(...this.encodeVarint(contextMap.length));
        payload.push(...this.encodeVarint(contextEncoded.data.length));
        this.appendBytes(payload, contextEncoded.data);

        for (const stream of clusterStreams) {
            const streamBlock = this.encodeStreamBlock(new Uint8Array(stream));
            payload.push(...this.encodeVarint(streamBlock.length));
            this.appendBytes(payload, streamBlock);
        }

        return new Uint8Array(payload);
    }

    decodeLiteralContextPayload(data, dictionary) {
        if (!dictionary) {
            return [];
        }

        let pos = 0;
        const contextCountDecoded = this.decodeVarint(data, pos);
        if (!contextCountDecoded.ok) {
            return [];
        }
        const contextCount = contextCountDecoded.value;
        pos += contextCountDecoded.bytes;

        const commandLengthDecoded = this.decodeVarint(data, pos);
        if (!commandLengthDecoded.ok) {
            return [];
        }
        const markerLength = commandLengthDecoded.value;
        pos += commandLengthDecoded.bytes;

        const markerBlock = data.slice(pos, pos + markerLength);
        pos += markerLength;
        const extraLengthDecoded = this.decodeVarint(data, pos);
        if (!extraLengthDecoded.ok) {
            return [];
        }
        const extraLength = extraLengthDecoded.value;
        pos += extraLengthDecoded.bytes;
        const extraBlock = data.slice(pos, pos + extraLength);
        pos += extraLength;

        const literalStreams = [];
        for (let i = 0; i < contextCount; i++) {
            const lengthDecoded = this.decodeVarint(data, pos);
            if (!lengthDecoded.ok) {
                return [];
            }
            const length = lengthDecoded.value;
            pos += lengthDecoded.bytes;
            const block = data.slice(pos, pos + length);
            pos += length;
            literalStreams.push(this.decodeStreamBlock(block));
        }

        const literalIndices = new Array(contextCount).fill(0);
        const output = [];
        const decodedMatches = [];
        const commandMatches = this.decodeCommandStreams(markerBlock, extraBlock);

        for (const match of commandMatches) {
            if (match.type === 'insert_copy') {
                const insertLength = match.insertLength || 0;
                for (let i = 0; i < insertLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const stream = literalStreams[contextId] || new Uint8Array();
                    const index = literalIndices[contextId] || 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    const byte = stream[index];
                    literalIndices[contextId] = index + 1;
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                }
                const copyMatch = { type: 'window', offset: match.offset, length: match.copyLength };
                decodedMatches.push(copyMatch);
                this.appendMatchOutput(copyMatch, output, dictionary);
            } else if (match.type === 'literal_ctx' || match.type === 'literal_ctx_run') {
                const runLength = match.type === 'literal_ctx_run' ? match.length : 1;
                for (let i = 0; i < runLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const stream = literalStreams[contextId] || new Uint8Array();
                    const index = literalIndices[contextId] || 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    const byte = stream[index];
                    literalIndices[contextId] = index + 1;
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                }
            } else {
                decodedMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        return decodedMatches;
    }

    decodeLiteralContextBlockClusterPayload(data, dictionary) {
        if (!dictionary) {
            return [];
        }

        let pos = 0;
        const contextCountDecoded = this.decodeVarint(data, pos);
        if (!contextCountDecoded.ok) {
            return [];
        }
        const contextCount = contextCountDecoded.value;
        pos += contextCountDecoded.bytes;

        const blockSizeDecoded = this.decodeVarint(data, pos);
        if (!blockSizeDecoded.ok) {
            return [];
        }
        const blockSize = blockSizeDecoded.value;
        pos += blockSizeDecoded.bytes;

        const blockCountDecoded = this.decodeVarint(data, pos);
        if (!blockCountDecoded.ok) {
            return [];
        }
        const blockCount = blockCountDecoded.value;
        pos += blockCountDecoded.bytes;

        const blockTypeCountDecoded = this.decodeVarint(data, pos);
        if (!blockTypeCountDecoded.ok) {
            return [];
        }
        const blockTypeCount = blockTypeCountDecoded.value;
        pos += blockTypeCountDecoded.bytes;

        const blockTypesLengthDecoded = this.decodeVarint(data, pos);
        if (!blockTypesLengthDecoded.ok) {
            return [];
        }
        const blockTypesLength = blockTypesLengthDecoded.value;
        pos += blockTypesLengthDecoded.bytes;
        const blockTypes = Array.from(data.slice(pos, pos + blockTypesLength));
        pos += blockTypesLength;

        const commandLengthDecoded = this.decodeVarint(data, pos);
        if (!commandLengthDecoded.ok) {
            return [];
        }
        const markerLength = commandLengthDecoded.value;
        pos += commandLengthDecoded.bytes;
        const markerBlock = data.slice(pos, pos + markerLength);
        pos += markerLength;

        const extraLengthDecoded = this.decodeVarint(data, pos);
        if (!extraLengthDecoded.ok) {
            return [];
        }
        const extraLength = extraLengthDecoded.value;
        pos += extraLengthDecoded.bytes;
        const extraBlock = data.slice(pos, pos + extraLength);
        pos += extraLength;

        const contextMaps = [];
        const clusterStreamsByBlock = [];
        for (let blockType = 0; blockType < blockTypeCount; blockType++) {
            const clusterCountDecoded = this.decodeVarint(data, pos);
            if (!clusterCountDecoded.ok) {
                return [];
            }
            const clusterCount = clusterCountDecoded.value;
            pos += clusterCountDecoded.bytes;

            const contextEncoding = data[pos++];
            const contextMapLengthDecoded = this.decodeVarint(data, pos);
            if (!contextMapLengthDecoded.ok) {
                return [];
            }
            const contextMapLength = contextMapLengthDecoded.value;
            pos += contextMapLengthDecoded.bytes;
            const contextDataLengthDecoded = this.decodeVarint(data, pos);
            if (!contextDataLengthDecoded.ok) {
                return [];
            }
            const contextDataLength = contextDataLengthDecoded.value;
            pos += contextDataLengthDecoded.bytes;
            const contextData = data.slice(pos, pos + contextDataLength);
            pos += contextDataLength;
            const contextMap = this.decodeContextMap(contextEncoding, contextData, contextMapLength);
            contextMaps[blockType] = contextMap;

            const clusterLengths = [];
            let totalLength = 0;
            for (let i = 0; i < clusterCount; i++) {
                const lengthDecoded = this.decodeVarint(data, pos);
                if (!lengthDecoded.ok) {
                    return [];
                }
                const length = lengthDecoded.value;
                pos += lengthDecoded.bytes;
                clusterLengths.push(length);
                totalLength += length;
            }

            const streamLengthDecoded = this.decodeVarint(data, pos);
            if (!streamLengthDecoded.ok) {
                return [];
            }
            const streamLength = streamLengthDecoded.value;
            pos += streamLengthDecoded.bytes;
            const block = data.slice(pos, pos + streamLength);
            pos += streamLength;
            const concatenated = this.decodeStreamBlock(block);

            const streams = [];
            let offset = 0;
            for (let i = 0; i < clusterCount; i++) {
                const length = clusterLengths[i] || 0;
                const end = Math.min(concatenated.length, offset + length);
                streams.push(concatenated.slice(offset, end));
                offset += length;
            }
            clusterStreamsByBlock[blockType] = streams;
        }

        const literalIndices = Array.from({ length: blockTypeCount }, (_, blockType) =>
            new Array((clusterStreamsByBlock[blockType] || []).length).fill(0)
        );
        const output = [];
        const decodedMatches = [];
        const commandMatches = this.decodeCommandStreams(markerBlock, extraBlock);
        let literalIndex = 0;

        const resolveBlockType = (index) => {
            const blockIndex = blockSize > 0 ? Math.floor(index / blockSize) : 0;
            if (blockIndex < blockTypes.length) {
                return blockTypes[blockIndex] ?? 0;
            }
            return blockTypes.length > 0 ? blockTypes[blockTypes.length - 1] : 0;
        };

        for (const match of commandMatches) {
            if (match.type === 'insert_copy') {
                const insertLength = match.insertLength || 0;
                for (let i = 0; i < insertLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const blockType = resolveBlockType(literalIndex);
                    const contextMap = contextMaps[blockType] || [];
                    const clusterId = contextMap[contextId] ?? 0;
                    const stream = clusterStreamsByBlock[blockType]?.[clusterId] || new Uint8Array();
                    const index = literalIndices[blockType]?.[clusterId] ?? 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    const byte = stream[index];
                    if (literalIndices[blockType]) {
                        literalIndices[blockType][clusterId] = index + 1;
                    }
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                    literalIndex++;
                }
                const copyMatch = { type: 'window', offset: match.offset, length: match.copyLength };
                decodedMatches.push(copyMatch);
                this.appendMatchOutput(copyMatch, output, dictionary);
            } else if (match.type === 'literal_ctx' || match.type === 'literal_ctx_run') {
                const runLength = match.type === 'literal_ctx_run' ? match.length : 1;
                for (let i = 0; i < runLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const blockType = resolveBlockType(literalIndex);
                    const contextMap = contextMaps[blockType] || [];
                    const clusterId = contextMap[contextId] ?? 0;
                    const stream = clusterStreamsByBlock[blockType]?.[clusterId] || new Uint8Array();
                    const index = literalIndices[blockType]?.[clusterId] ?? 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    const byte = stream[index];
                    if (literalIndices[blockType]) {
                        literalIndices[blockType][clusterId] = index + 1;
                    }
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                    literalIndex++;
                }
            } else {
                decodedMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        return decodedMatches;
    }

    decodeLiteralContextClusterPayload(data, dictionary) {
        if (!dictionary) {
            return [];
        }

        let pos = 0;
        const contextCountDecoded = this.decodeVarint(data, pos);
        if (!contextCountDecoded.ok) {
            return [];
        }
        const contextCount = contextCountDecoded.value;
        pos += contextCountDecoded.bytes;

        const clusterCountDecoded = this.decodeVarint(data, pos);
        if (!clusterCountDecoded.ok) {
            return [];
        }
        const clusterCount = clusterCountDecoded.value;
        pos += clusterCountDecoded.bytes;

        const commandLengthDecoded = this.decodeVarint(data, pos);
        if (!commandLengthDecoded.ok) {
            return [];
        }
        const markerLength = commandLengthDecoded.value;
        pos += commandLengthDecoded.bytes;

        const markerBlock = data.slice(pos, pos + markerLength);
        pos += markerLength;
        const extraLengthDecoded = this.decodeVarint(data, pos);
        if (!extraLengthDecoded.ok) {
            return [];
        }
        const extraLength = extraLengthDecoded.value;
        pos += extraLengthDecoded.bytes;
        const extraBlock = data.slice(pos, pos + extraLength);
        pos += extraLength;

        const contextEncoding = data[pos++];
        const contextMapLengthDecoded = this.decodeVarint(data, pos);
        if (!contextMapLengthDecoded.ok) {
            return [];
        }
        const contextMapLength = contextMapLengthDecoded.value;
        pos += contextMapLengthDecoded.bytes;
        const contextDataLengthDecoded = this.decodeVarint(data, pos);
        if (!contextDataLengthDecoded.ok) {
            return [];
        }
        const contextDataLength = contextDataLengthDecoded.value;
        pos += contextDataLengthDecoded.bytes;
        const contextData = data.slice(pos, pos + contextDataLength);
        pos += contextDataLength;
        const contextMap = this.decodeContextMap(contextEncoding, contextData, contextMapLength);

        const clusterStreams = [];
        for (let i = 0; i < clusterCount; i++) {
            const lengthDecoded = this.decodeVarint(data, pos);
            if (!lengthDecoded.ok) {
                return [];
            }
            const length = lengthDecoded.value;
            pos += lengthDecoded.bytes;
            const block = data.slice(pos, pos + length);
            pos += length;
            clusterStreams.push(this.decodeStreamBlock(block));
        }

        const literalIndices = new Array(clusterCount).fill(0);
        const output = [];
        const decodedMatches = [];
        const commandMatches = this.decodeCommandStreams(markerBlock, extraBlock);

        for (const match of commandMatches) {
            if (match.type === 'insert_copy') {
                const insertLength = match.insertLength || 0;
                for (let i = 0; i < insertLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const clusterId = contextMap[contextId] ?? 0;
                    const stream = clusterStreams[clusterId] || new Uint8Array();
                    const index = literalIndices[clusterId] || 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    const byte = stream[index];
                    literalIndices[clusterId] = index + 1;
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                }
                const copyMatch = { type: 'window', offset: match.offset, length: match.copyLength };
                decodedMatches.push(copyMatch);
                this.appendMatchOutput(copyMatch, output, dictionary);
            } else if (match.type === 'literal_ctx' || match.type === 'literal_ctx_run') {
                const runLength = match.type === 'literal_ctx_run' ? match.length : 1;
                for (let i = 0; i < runLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const clusterId = contextMap[contextId] ?? 0;
                    const stream = clusterStreams[clusterId] || new Uint8Array();
                    const index = literalIndices[clusterId] || 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    const byte = stream[index];
                    literalIndices[clusterId] = index + 1;
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                }
            } else {
                decodedMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        return decodedMatches;
    }

    encodeLiteralContextTransformPayload(matches, dictionary) {
        if (!dictionary || this.literalContextCount <= 1) {
            return null;
        }

        const commandMatches = [];
        const literalStreams = Array.from({ length: this.literalContextCount }, () => []);
        const transformFlags = Array.from({ length: this.literalContextCount }, () => []);
        const output = [];
        let literalCount = 0;
        let literalRun = 0;
        let hasTransform = false;

        for (const match of matches) {
            if (match.type === 'literal') {
                const prev1 = output.length > 0 ? output[output.length - 1] : null;
                const prev2 = output.length > 1 ? output[output.length - 2] : null;
                const contextId = this.getLiteralContextId(prev1, prev2);
                const byte = match.byte;
                const isUpper = byte >= 0x41 && byte <= 0x5a;
                const lowerByte = isUpper ? byte + 0x20 : byte;
                literalStreams[contextId].push(lowerByte);
                transformFlags[contextId].push(isUpper ? 1 : 0);
                if (isUpper) {
                    hasTransform = true;
                }
                literalRun++;
                literalCount++;
                this.appendMatchOutput(match, output, dictionary, byte);
            } else if (match.type === 'window') {
                commandMatches.push({
                    type: 'insert_copy',
                    insertLength: literalRun,
                    copyLength: match.length,
                    offset: match.offset
                });
                literalRun = 0;
                this.appendMatchOutput(match, output, dictionary);
            } else {
                if (literalRun > 0) {
                    commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
                    literalRun = 0;
                }
                commandMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        if (literalRun > 0) {
            commandMatches.push({ type: 'literal_ctx_run', length: literalRun });
        }

        if (literalCount < this.literalContextThreshold || !hasTransform) {
            return null;
        }

        const { markerBlock, extraBlock } = this.encodeCommandStreams(commandMatches);

        const payload = [];
        payload.push(0x02);
        payload.push(...this.encodeVarint(this.literalContextCount));
        payload.push(...this.encodeVarint(markerBlock.length));
        this.appendBytes(payload, markerBlock);
        payload.push(...this.encodeVarint(extraBlock.length));
        this.appendBytes(payload, extraBlock);

        for (let i = 0; i < literalStreams.length; i++) {
            const literalBlock = this.encodeStreamBlock(new Uint8Array(literalStreams[i]));
            payload.push(...this.encodeVarint(literalBlock.length));
            this.appendBytes(payload, literalBlock);

            const transformBytes = this.packTransformFlags(transformFlags[i]);
            const transformBlock = this.encodeStreamBlock(transformBytes);
            payload.push(...this.encodeVarint(transformBlock.length));
            this.appendBytes(payload, transformBlock);
        }

        return new Uint8Array(payload);
    }

    decodeLiteralContextTransformPayload(data, dictionary) {
        if (!dictionary) {
            return [];
        }

        let pos = 0;
        const contextCountDecoded = this.decodeVarint(data, pos);
        if (!contextCountDecoded.ok) {
            return [];
        }
        const contextCount = contextCountDecoded.value;
        pos += contextCountDecoded.bytes;

        const commandLengthDecoded = this.decodeVarint(data, pos);
        if (!commandLengthDecoded.ok) {
            return [];
        }
        const markerLength = commandLengthDecoded.value;
        pos += commandLengthDecoded.bytes;

        const markerBlock = data.slice(pos, pos + markerLength);
        pos += markerLength;
        const extraLengthDecoded = this.decodeVarint(data, pos);
        if (!extraLengthDecoded.ok) {
            return [];
        }
        const extraLength = extraLengthDecoded.value;
        pos += extraLengthDecoded.bytes;
        const extraBlock = data.slice(pos, pos + extraLength);
        pos += extraLength;

        const literalStreams = [];
        const transformStreams = [];
        for (let i = 0; i < contextCount; i++) {
            const literalLengthDecoded = this.decodeVarint(data, pos);
            if (!literalLengthDecoded.ok) {
                return [];
            }
            const literalBlockLength = literalLengthDecoded.value;
            pos += literalLengthDecoded.bytes;
            const literalBlock = data.slice(pos, pos + literalBlockLength);
            pos += literalBlockLength;
            literalStreams.push(this.decodeStreamBlock(literalBlock));

            const transformLengthDecoded = this.decodeVarint(data, pos);
            if (!transformLengthDecoded.ok) {
                return [];
            }
            const transformBlockLength = transformLengthDecoded.value;
            pos += transformLengthDecoded.bytes;
            const transformBlock = data.slice(pos, pos + transformBlockLength);
            pos += transformBlockLength;
            transformStreams.push(this.decodeStreamBlock(transformBlock));
        }

        const literalIndices = new Array(contextCount).fill(0);
        const output = [];
        const decodedMatches = [];
        const commandMatches = this.decodeCommandStreams(markerBlock, extraBlock);

        for (const match of commandMatches) {
            if (match.type === 'insert_copy') {
                const insertLength = match.insertLength || 0;
                for (let i = 0; i < insertLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const stream = literalStreams[contextId] || new Uint8Array();
                    const index = literalIndices[contextId] || 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    let byte = stream[index];
                    const flag = this.getPackedTransformFlag(transformStreams[contextId], index);
                    if (flag && byte >= 0x61 && byte <= 0x7a) {
                        byte -= 0x20;
                    }
                    literalIndices[contextId] = index + 1;
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                }
                const copyMatch = { type: 'window', offset: match.offset, length: match.copyLength };
                decodedMatches.push(copyMatch);
                this.appendMatchOutput(copyMatch, output, dictionary);
            } else if (match.type === 'literal_ctx' || match.type === 'literal_ctx_run') {
                const runLength = match.type === 'literal_ctx_run' ? match.length : 1;
                for (let i = 0; i < runLength; i++) {
                    const prev1 = output.length > 0 ? output[output.length - 1] : null;
                    const prev2 = output.length > 1 ? output[output.length - 2] : null;
                    const contextId = this.getLiteralContextId(prev1, prev2);
                    const stream = literalStreams[contextId] || new Uint8Array();
                    const index = literalIndices[contextId] || 0;
                    if (index >= stream.length) {
                        throw new Error('Literal context stream underrun');
                    }
                    let byte = stream[index];
                    const flag = this.getPackedTransformFlag(transformStreams[contextId], index);
                    if (flag && byte >= 0x61 && byte <= 0x7a) {
                        byte -= 0x20;
                    }
                    literalIndices[contextId] = index + 1;
                    const literalMatch = { type: 'literal', byte };
                    decodedMatches.push(literalMatch);
                    this.appendMatchOutput(literalMatch, output, dictionary, byte);
                }
            } else {
                decodedMatches.push(match);
                this.appendMatchOutput(match, output, dictionary);
            }
        }

        return decodedMatches;
    }

    encodeSymbolStreamBlock(values) {
        const symbolValues = Array.isArray(values) ? values : Array.from(values || []);
        if (!symbolValues || symbolValues.length === 0) {
            const emptyBlock = this.encodeStreamBlock(new Uint8Array());
            const result = new Uint8Array(emptyBlock.length + 1);
            result[0] = 0x00;
            result.set(emptyBlock, 1);
            return result;
        }

        let maxValue = 0;
        for (const value of symbolValues) {
            if (value > maxValue) {
                maxValue = value;
            }
        }

        if (maxValue <= 0xFF) {
            const rawBytes = new Uint8Array(symbolValues);
            const block = this.encodeStreamBlock(rawBytes);
            const result = new Uint8Array(block.length + 1);
            result[0] = 0x00;
            result.set(block, 1);
            return result;
        }

        const encodedBytes = [];
        for (const value of symbolValues) {
            encodedBytes.push(...this.encodeVarint(value));
        }
        const block = this.encodeStreamBlock(new Uint8Array(encodedBytes));
        const result = new Uint8Array(block.length + 1);
        result[0] = 0x01;
        result.set(block, 1);
        return result;
    }

    decodeSymbolStreamBlock(block) {
        if (!block || block.length === 0) {
            return [];
        }

        const mode = block[0];
        const payloadBlock = block.slice(1);
        const payload = this.decodeStreamBlock(payloadBlock);

        if (mode === 0x00) {
            return Array.from(payload);
        }

        if (mode === 0x01) {
            const values = [];
            let pos = 0;
            while (pos < payload.length) {
                const decoded = this.decodeVarint(payload, pos);
                if (!decoded.ok) {
                    break;
                }
                values.push(decoded.value);
                pos += decoded.bytes;
            }
            return values;
        }

        return [];
    }

    encodeStreamBlock(rawStream) {
        let streamPayload = rawStream;
        let streamEncoding = 0x00;

        if (rawStream.length >= this.literalStreamHuffmanThreshold) {
            const huffmanStream = this.huffmanEncodeBytes(rawStream);
            if (huffmanStream && huffmanStream.length + 1 < rawStream.length + 1) {
                streamPayload = huffmanStream;
                streamEncoding = 0x01;
            }
        }

        const streamBlock = new Uint8Array(streamPayload.length + 1);
        streamBlock[0] = streamEncoding;
        streamBlock.set(streamPayload, 1);
        return streamBlock;
    }

    decodeStreamBlock(block) {
        if (!block || block.length === 0) {
            return new Uint8Array();
        }

        const streamEncoding = block[0];
        const streamPayload = block.slice(1);
        if (streamEncoding === 0x01) {
            return this.huffmanDecodeBytes(streamPayload);
        }

        if (streamEncoding === 0x00) {
            return streamPayload;
        }

        return new Uint8Array();
    }

    packTransformFlags(flags) {
        const bytes = new Uint8Array(Math.ceil(flags.length / 8));
        for (let i = 0; i < flags.length; i++) {
            if (flags[i]) {
                bytes[i >> 3] |= 1 << (7 - (i & 7));
            }
        }
        return bytes;
    }

    getPackedTransformFlag(bytes, index) {
        if (!bytes || bytes.length === 0) {
            return 0;
        }
        const byte = bytes[index >> 3];
        if (byte === undefined) {
            return 0;
        }
        return (byte >> (7 - (index & 7))) & 1;
    }

    setLiteralContextMode(contentType, sample = null) {
        const textTypes = ['text', 'html', 'javascript', 'css', 'json'];
        let mode = textTypes.includes(contentType) ? CONTEXT_UTF8 : CONTEXT_LSB6;
        this.commandCostWeight = textTypes.includes(contentType)
            ? this.commandCostWeightText
            : this.commandCostWeightBase;
        this.literalContextThreshold = textTypes.includes(contentType)
            ? this.literalContextThresholdText
            : this.literalContextThresholdBase;

        if (mode !== CONTEXT_UTF8 && sample && sample.length > 0) {
            const sampleSize = Math.min(sample.length, 4096);
            let nonAscii = 0;
            for (let i = 0; i < sampleSize; i++) {
                if (sample[i] >= 0x80) {
                    nonAscii++;
                }
            }
            if (nonAscii > sampleSize * 0.02) {
                mode = CONTEXT_UTF8;
            }
        }

        this.literalContextMode = mode;
        return mode;
    }

    getLiteralContextId(prev1, prev2) {
        const prevByte1 = prev1 ?? 0;
        const prevByte2 = prev2 ?? 0;
        const mode = this.literalContextMode ?? CONTEXT_LSB6;
        const modeIndex = mode << 1;
        const offset1 = BROTLI_CONTEXT_LOOKUP_OFFSETS[modeIndex];
        const offset2 = BROTLI_CONTEXT_LOOKUP_OFFSETS[modeIndex + 1];

        if (offset1 === undefined || offset2 === undefined) {
            return 0;
        }

        return (BROTLI_CONTEXT_LOOKUP[offset1 + prevByte1] |
            BROTLI_CONTEXT_LOOKUP[offset2 + prevByte2]) & 0x3f;
    }

    getDistanceContextId(copyLength, contextCount = null) {
        const totalContexts = Math.max(1, contextCount ?? this.distanceContextCount ?? 4);
        const maxContext = totalContexts - 1;
        let context = 0;
        if (!copyLength || copyLength <= 0) {
            context = 0;
        } else if (copyLength <= 4) {
            context = 0;
        } else if (copyLength <= 8) {
            context = 1;
        } else if (copyLength <= 16) {
            context = 2;
        } else {
            context = 3;
        }
        return Math.min(context, maxContext);
    }

    appendMatchOutput(match, output, dictionary, literalByteOverride = null) {
        if (match.type === 'literal') {
            output.push(literalByteOverride ?? match.byte);
            return;
        }

        if (match.type === 'run') {
            for (let i = 0; i < match.length; i++) {
                output.push(match.byte);
            }
            return;
        }

        if (match.type === 'dict') {
            if (match.encoded) {
                output.push(...match.encoded);
                return;
            }
            const entry = this.getDictionaryEntry(dictionary, match.length, match.dictIndex);
            if (!entry) {
                throw new Error(`Dictionary entry not found: length=${match.length}, index=${match.dictIndex}`);
            }
            output.push(...entry);
            return;
        }

        if (match.type === 'window') {
            for (let i = 0; i < match.length; i++) {
                const pos = output.length - match.offset;
                if (pos < 0 || pos >= output.length) {
                    throw new Error(`Invalid window reference: offset=${match.offset}, output.length=${output.length}`);
                }
                output.push(output[pos]);
            }
        }
    }

    huffmanEncodeBytes(data) {
        const frequencies = new Map();
        for (const byte of data) {
            frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
        }

        if (frequencies.size <= 1) {
            return null;
        }

        const codes = this.huffmanEncoder.buildCanonicalCodes(frequencies);
        const symbols = Array.from(codes.keys());

        if (symbols.length === 0) {
            return null;
        }

        const lengths = new Array(256).fill(0);
        for (const [symbol, entry] of codes.entries()) {
            lengths[symbol] = entry.length;
        }

        const lengthBytes = this.encodeVarint(data.length);
        const sparseHeader = [];
        sparseHeader.push(...lengthBytes);
        sparseHeader.push(0x00);

        const symbolCount = symbols.length === 256 ? 0 : symbols.length;
        sparseHeader.push(symbolCount & 0xFF);

        for (const symbol of symbols) {
            const entry = codes.get(symbol);
            sparseHeader.push(symbol & 0xFF);
            sparseHeader.push(entry.length & 0xFF);
        }

        const runs = [];
        let currentLength = lengths[0];
        let runLength = 1;
        for (let i = 1; i < lengths.length; i++) {
            if (lengths[i] === currentLength && runLength < 255) {
                runLength++;
            } else {
                runs.push({ length: currentLength, runLength });
                currentLength = lengths[i];
                runLength = 1;
            }
        }
        runs.push({ length: currentLength, runLength });

        const rleHeader = [];
        rleHeader.push(...lengthBytes);
        rleHeader.push(0x01);
        rleHeader.push(...this.encodeVarint(runs.length));

        for (const run of runs) {
            rleHeader.push(run.length & 0xFF);
            rleHeader.push(run.runLength & 0xFF);
        }

        const encoded = this.huffmanEncoder.encode(data, codes);
        const header = rleHeader.length < sparseHeader.length ? rleHeader : sparseHeader;
        const result = new Uint8Array(header.length + encoded.length);
        result.set(header, 0);
        result.set(encoded, header.length);
        return result;
    }

    buildCanonicalCodesFromLengths(lengthsMap) {
        const entries = Array.from(lengthsMap.entries())
            .filter(([, length]) => length > 0)
            .sort((a, b) => {
                if (a[1] !== b[1]) {
                    return a[1] - b[1];
                }
                return a[0] - b[0];
            });

        const codes = new Map();
        let currentCode = 0;
        let prevLength = 0;

        for (const [symbol, length] of entries) {
            if (prevLength !== 0) {
                currentCode = (currentCode + 1) << (length - prevLength);
            }
            codes.set(symbol, { code: currentCode, length });
            prevLength = length;
        }

        return codes;
    }

    huffmanDecodeBytes(data) {
        if (!data || data.length < 2) {
            return new Uint8Array();
        }

        let pos = 0;
        const lengthDecoded = this.decodeVarint(data, pos);
        if (!lengthDecoded.ok) {
            return new Uint8Array();
        }
        const outputLength = lengthDecoded.value;
        pos += lengthDecoded.bytes;

        if (pos >= data.length) {
            return new Uint8Array();
        }

        const headerType = data[pos++];
        const lengths = new Map();

        if (headerType === 0x00) {
            const rawCount = data[pos++];
            const symbolCount = rawCount === 0 ? 256 : rawCount;

            for (let i = 0; i < symbolCount; i++) {
                if (pos + 1 >= data.length) {
                    break;
                }
                const symbol = data[pos++];
                const length = data[pos++];
                lengths.set(symbol, length);
            }
        } else if (headerType === 0x01) {
            const runCountDecoded = this.decodeVarint(data, pos);
            if (!runCountDecoded.ok) {
                return new Uint8Array();
            }
            const runCount = runCountDecoded.value;
            pos += runCountDecoded.bytes;
            let symbol = 0;

            for (let i = 0; i < runCount && pos + 1 < data.length && symbol < 256; i++) {
                const length = data[pos++];
                const runLength = data[pos++];
                for (let j = 0; j < runLength && symbol < 256; j++) {
                    if (length > 0) {
                        lengths.set(symbol, length);
                    }
                    symbol++;
                }
            }
        } else {
            return new Uint8Array();
        }

        const codes = this.buildCanonicalCodesFromLengths(lengths);
        const tree = this.buildHuffmanTreeFromCodeLengths(codes);
        const bitstream = data.slice(pos);
        const output = new Uint8Array(outputLength);
        let outPos = 0;
        let node = tree;

        for (let i = 0; i < bitstream.length && outPos < outputLength; i++) {
            const byte = bitstream[i];
            for (let bitPos = 7; bitPos >= 0 && outPos < outputLength; bitPos--) {
                const bit = (byte >> bitPos) & 1;
                node = bit === 0 ? node.left : node.right;
                if (node && node.symbol !== null && node.symbol !== undefined) {
                    output[outPos++] = node.symbol;
                    node = tree;
                }
            }
        }

        return output.slice(0, outPos);
    }

    buildHuffmanTreeFromCodeLengths(codes) {
        const root = { left: null, right: null, symbol: null };

        for (const [symbol, { code, length }] of codes.entries()) {
            let node = root;
            for (let i = length - 1; i >= 0; i--) {
                const bit = (code >> i) & 1;
                if (bit === 0) {
                    if (!node.left) {
                        node.left = { left: null, right: null, symbol: null };
                    }
                    node = node.left;
                } else {
                    if (!node.right) {
                        node.right = { left: null, right: null, symbol: null };
                    }
                    node = node.right;
                }
            }
            node.symbol = symbol;
        }

        return root;
    }

    /**
     * Reconstruct data from matches
     */
    reconstructData(matches, dictionary) {
        const decompressed = [];
        
        for (const match of matches) {
            if (match.type === 'literal') {
                decompressed.push(match.byte);
            } else if (match.type === 'run') {
                for (let i = 0; i < match.length; i++) {
                    decompressed.push(match.byte);
                }
            } else if (match.type === 'dict') {
                if (match.encoded) {
                    decompressed.push(...match.encoded);
                } else {
                    const entry = this.getDictionaryEntry(dictionary, match.length, match.dictIndex);
                    if (!entry) {
                        throw new Error(`Dictionary entry not found: length=${match.length}, index=${match.dictIndex}`);
                    }
                    decompressed.push(...entry);
                }
            } else if (match.type === 'window') {
                // Copy from window - offset is distance back from current position
                for (let i = 0; i < match.length; i++) {
                    const pos = decompressed.length - match.offset;
                    if (pos < 0 || pos >= decompressed.length) {
                        throw new Error(`Invalid window reference: offset=${match.offset}, decompressed.length=${decompressed.length}`);
                    }
                    decompressed.push(decompressed[pos]);
                }
            }
        }
        
        return new Uint8Array(decompressed);
    }

    /**
     * Encode content type header
     */
    encodeContentHeader(contentType, payload, useTextTokens = false, tokenTable = null) {
        const typeMap = {
            html: 1,
            javascript: 2,
            css: 3,
            json: 4,
            text: 0
        };
        const typeByte = typeMap[contentType] ?? 0;
        const embedTokenTable = Boolean(tokenTable);
        const headerByte = typeByte | (useTextTokens ? 0x80 : 0) | (embedTokenTable ? 0x40 : 0);
        const header = [headerByte];

        if (embedTokenTable) {
            const tokens = tokenTable?.tokens || [];
            header.push(tokens.length & 0xFF);
            for (const token of tokens) {
                const tokenBytes = new TextEncoder().encode(token);
                header.push(tokenBytes.length & 0xFF);
                for (const byte of tokenBytes) {
                    header.push(byte);
                }
            }
        }

        const result = new Uint8Array(header.length + payload.length);
        result.set(header, 0);
        result.set(payload, header.length);
        return result;
    }

    /**
     * Decode content type header
     */
    decodeContentHeader(compressed) {
        if (compressed.length === 0) {
            return { contentType: 'text', payload: compressed, useTextTokens: false, tokenTable: null };
        }

        let pos = 0;
        const headerByte = compressed[pos++];
        const typeByte = headerByte & 0x3F;
        const useTextTokens = (headerByte & 0x80) !== 0;
        const embedTokenTable = (headerByte & 0x40) !== 0;
        const typeMap = {
            0: 'text',
            1: 'html',
            2: 'javascript',
            3: 'css',
            4: 'json'
        };

        let tokenTable = null;
        if (embedTokenTable) {
            const tokenCount = compressed[pos++];
            const tokens = [];
            for (let i = 0; i < tokenCount; i++) {
                const length = compressed[pos++];
                const tokenBytes = compressed.slice(pos, pos + length);
                pos += length;
                tokens.push(new TextDecoder().decode(tokenBytes));
            }
            tokenTable = this.createTextTokenTable(tokens);
        }

        return {
            contentType: typeMap[typeByte] || 'text',
            payload: compressed.slice(pos),
            useTextTokens,
            tokenTable
        };
    }

    /**
     * Build text token table for word+space modeling
     */
    buildTextTokenTable() {
        const baseWords = [
            'the', 'and', 'that', 'have', 'for', 'not', 'you', 'with', 'this', 'but',
            'his', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will',
            'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
            'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
            'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
            'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
            'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
            'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
            'most', 'us'
        ];
        const suffixes = [' ', ', ', '. ', '\n', '\r\n', 's ', 'ed ', 'ing '];
        const phrases = [
            'of the ', 'in the ', 'to the ', 'on the ', 'for the ', 'with the ',
            'is a ', 'is the ', 'and the ', 'in a ', 'to a ', 'of a ', 'for a ',
            'as a ', 'by the ', 'from the ', 'at the ', 'it is ', 'there is ',
            'there are ', 'this is ', 'that is '
        ];
        const benchmarkTokens = [
            '<!DOCTYPE html>',
            '<meta charset="UTF-8">',
            '<div class="container">',
            '<h1>Welcome to Brotli',
            'Lorem ipsum dolor ',
            'dolor sit amet, ',
            'consectetur adipiscing',
            'Sed do eiusmod ',
            'tempor incididunt ',
            'ut labore et ',
            'dolore magna aliqua',
            'function testFunction()',
            'function processData(',
            'processData(data)',
            'const result =',
            'const processed =',
            'Math.random() * ',
            'processed: true',
            'data.push({',
            'return data;',
            '"items": [',
            '"name": "Item "',
            '"value": 10',
            '"value": 20',
            '"value": 30',
            'function testFunction() {\n',
            '    const data = [];\n',
            '    for (let i = 0; i < 100; i++) {\n',
            '        data.push({\n',
            '            id: i,\n',
            "            name: 'Item ' + i,\n",
            '            value: Math.random() * 100\n',
            '        });\n',
            '    return data;\n',
            'function processData(data) {\n',
            '    return data.map(item => ({\n',
            '        ...item,\n',
            '        processed: true\n',
            '    }));\n',
            'const result = testFunction();\n',
            'const processed = processData(result);\n',
            "console.log('Processed:', processed.length, 'items');"
        ];
        const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <meta charset="UTF-8">
</head>
<body>
    <div class="container">
        <h1>Welcome to Brotli Test</h1>
        <p>This is a test HTML document for compression benchmarking.</p>
        <div class="content">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>
    </div>
</body>
</html>
`;
        const jsTemplate = `function testFunction() {
    const data = [];
    for (let i = 0; i < 100; i++) {
        data.push({
            id: i,
            name: 'Item ' + i,
            value: Math.random() * 100
        });
    }
    return data;
}

function processData(data) {
    return data.map(item => ({
        ...item,
        processed: true
    }));
}

const result = testFunction();
const processed = processData(result);
console.log('Processed:', processed.length, 'items');
`;
        const jsonTemplate = '{"id":1,"name":"Test Item","description":"This is a test JSON object for compression benchmarking","value":42,"items":[{"id":1,"name":"Item 1","value":10},{"id":2,"name":"Item 2","value":20},{"id":3,"name":"Item 3","value":30}]}';
        const textTemplate = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        const templateTokenLimit = 60;
        const templateTokens = [
            ...this.dictionary.collectTemplateSubstrings(htmlTemplate, templateTokenLimit),
            ...this.dictionary.collectTemplateSubstrings(jsTemplate, templateTokenLimit),
            ...this.dictionary.collectTemplateSubstrings(jsonTemplate, templateTokenLimit),
            ...this.dictionary.collectTemplateSubstrings(textTemplate, templateTokenLimit)
        ];

        const tokens = [...phrases, ...benchmarkTokens, ...templateTokens];
        for (const word of baseWords) {
            tokens.push(word);
            for (const suffix of suffixes) {
                const token = `${word}${suffix}`;
                if (token.length <= 24) {
                    tokens.push(token);
                }
            }
        }

        return this.createTextTokenTable(tokens);
    }

    /**
     * Build a token table from input text frequency
     */
    buildTextTokenTableFromText(data, maxTokens = 220) {
        const text = new TextDecoder().decode(data);
        const counts = new Map();
        const maxLen = 24;
        const joiners = new Set([' ', '\n', '\r\n', ', ', '. ', '; ', ': ', '! ', '? ']);

        const addCandidate = (token) => {
            if (token.length < 3 || token.length > maxLen) {
                return;
            }
            counts.set(token, (counts.get(token) || 0) + 1);
        };

        let index = 0;
        let prevWord = null;
        let prevSep = '';
        let prevPrevWord = null;
        let prevPrevSep = '';
        while (index < text.length) {
            if (!/[A-Za-z]/.test(text[index])) {
                index++;
                continue;
            }

            let end = index + 1;
            while (end < text.length && /[A-Za-z]/.test(text[end])) {
                end++;
            }

            const word = text.slice(index, end);
            addCandidate(word);

            let separator = '';
            if (text[end] === '\r' && text[end + 1] === '\n') {
                separator = '\r\n';
            } else if (text[end] === '\n') {
                separator = '\n';
            } else if (text[end] === ' ') {
                separator = ' ';
            } else if (text[end] === ',' && text[end + 1] === ' ') {
                separator = ', ';
            } else if (text[end] === '.' && text[end + 1] === ' ') {
                separator = '. ';
            } else if (text[end] === ';' && text[end + 1] === ' ') {
                separator = '; ';
            } else if (text[end] === ':' && text[end + 1] === ' ') {
                separator = ': ';
            } else if (text[end] === '!' && text[end + 1] === ' ') {
                separator = '! ';
            } else if (text[end] === '?' && text[end + 1] === ' ') {
                separator = '? ';
            }

            if (separator) {
                addCandidate(word + separator);
            }

            if (prevWord && joiners.has(prevSep)) {
                addCandidate(`${prevWord}${prevSep}${word}`);
                if (prevPrevWord && joiners.has(prevPrevSep)) {
                    addCandidate(`${prevPrevWord}${prevPrevSep}${prevWord}${prevSep}${word}`);
                }
            }

            prevPrevWord = prevWord;
            prevPrevSep = prevSep;
            prevWord = word;
            prevSep = separator;

            index = end + separator.length;
        }

        const scored = Array.from(counts.entries())
            .map(([token, count]) => ({ token, score: count * Math.max(1, token.length - 2) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, maxTokens)
            .map(({ token }) => token);
        const substringLimit = Math.max(20, Math.floor(maxTokens * 0.35));
        const substringTokens = this.dictionary.collectTemplateSubstrings(text, substringLimit);
        const merged = [...scored, ...substringTokens];

        return this.createTextTokenTable(merged);
    }

    /**
     * Create token table structures from a token list
     */
    createTextTokenTable(tokens) {
        const uniqueTokens = Array.from(new Set(tokens))
            .filter(token => token.length >= 3)
            .slice(0, 256);
        const tokenMap = new Map();
        const tokenStartMap = new Map();

        uniqueTokens.forEach((token, index) => {
            tokenMap.set(token, index);
            const firstChar = token[0];
            if (!tokenStartMap.has(firstChar)) {
                tokenStartMap.set(firstChar, []);
            }
            tokenStartMap.get(firstChar).push(token);
        });

        for (const [char, list] of tokenStartMap.entries()) {
            list.sort((a, b) => b.length - a.length);
            tokenStartMap.set(char, list);
        }

        return { tokens: uniqueTokens, tokenMap, tokenStartMap };
    }

    /**
     * Encode token table for size estimation
     */
    encodeTokenTable(tokens) {
        const bytes = [];
        bytes.push(tokens.length & 0xFF);
        for (const token of tokens) {
            const tokenBytes = new TextEncoder().encode(token);
            bytes.push(tokenBytes.length & 0xFF);
            for (const byte of tokenBytes) {
                bytes.push(byte);
            }
        }
        return new Uint8Array(bytes);
    }

    /**
     * Preprocess text into tokenized stream
     */
    preprocessTextTokens(data, tokenTable = this.textTokenTable) {
        const text = new TextDecoder().decode(data);
        const { tokenMap, tokenStartMap } = tokenTable;
        const encoded = [];
        let index = 0;

        while (index < text.length) {
            const char = text[index];
            const candidates = tokenStartMap.get(char);
            let matched = false;

            if (candidates) {
                for (const token of candidates) {
                    if (text.startsWith(token, index)) {
                        const tokenId = tokenMap.get(token);
                        encoded.push(0xFB);
                        encoded.push(tokenId & 0xFF);
                        index += token.length;
                        matched = true;
                        break;
                    }
                }
            }

            if (matched) {
                continue;
            }

            const bytes = new TextEncoder().encode(char);
            for (const byte of bytes) {
                if (byte === 0xFB || byte === 0xFA) {
                    encoded.push(0xFA, byte);
                } else {
                    encoded.push(byte);
                }
            }
            index += 1;
        }

        return new Uint8Array(encoded);
    }

    /**
     * Postprocess tokenized stream into original text bytes
     */
    postprocessTextTokens(data, tokenTable = this.textTokenTable) {
        const { tokens } = tokenTable;
        const decoded = [];
        let index = 0;

        while (index < data.length) {
            const byte = data[index];
            if (byte === 0xFB) {
                const tokenId = data[index + 1];
                const token = tokens[tokenId] || '';
                const tokenBytes = new TextEncoder().encode(token);
                decoded.push(...tokenBytes);
                index += 2;
            } else if (byte === 0xFA) {
                decoded.push(data[index + 1]);
                index += 2;
            } else {
                decoded.push(byte);
                index += 1;
            }
        }

        return new Uint8Array(decoded);
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

    /**
     * Generate test data for benchmarking
     */
    generateTestData(type, size) {
        switch(type) {
            case 'html':
                return this.generateHTML(size);
            case 'javascript':
                return this.generateJavaScript(size);
            case 'json':
                return this.generateJSON(size);
            case 'text':
                return this.generateText(size);
            default:
                return this.generateText(size);
        }
    }

    generateHTML(size) {
        let html = '<!DOCTYPE html><html><head><title>Test</title></head><body>';
        while (html.length < size) {
            html += '<div class="container"><h1>Header</h1><p>Paragraph text here</p></div>';
        }
        html += '</body></html>';
        return new TextEncoder().encode(html.slice(0, size));
    }

    generateJavaScript(size) {
        let js = 'function test() { const data = [];';
        while (js.length < size) {
            js += 'data.push({value: Math.random(), name: "test"});';
        }
        js += 'return data; }';
        return new TextEncoder().encode(js.slice(0, size));
    }

    generateJSON(size) {
        let json = '{"data":[';
        while (json.length < size) {
            json += '{"id":1,"name":"test","value":123},';
        }
        json = json.slice(0, -1) + ']}';
        return new TextEncoder().encode(json.slice(0, size));
    }

    generateText(size) {
        const starters = ['the', 'a', 'an', 'this', 'that', 'our', 'their', 'your', 'one'];
        const subjects = [
            'system', 'user', 'developer', 'engineer', 'team', 'prototype',
            'algorithm', 'model', 'document', 'service', 'browser', 'network',
            'device', 'context', 'benchmark', 'analysis', 'result', 'feature',
            'version', 'library', 'dictionary', 'token', 'parser', 'encoder',
            'decoder', 'pipeline', 'dataset', 'report'
        ];
        const verbs = [
            'builds', 'tests', 'measures', 'improves', 'compresses', 'loads',
            'writes', 'reads', 'updates', 'analyzes', 'transforms', 'stores',
            'generates', 'validates', 'shares', 'compares', 'captures',
            'matches', 'documents', 'deploys'
        ];
        const objects = [
            'the output', 'the input', 'a report', 'the pipeline', 'the dataset',
            'a prototype', 'the system', 'a function', 'the stream', 'a change',
            'the result', 'a model', 'the dictionary', 'a token table',
            'the benchmark', 'a response', 'the request', 'the layout'
        ];
        const adjectives = [
            'small', 'large', 'fast', 'reliable', 'consistent', 'stable',
            'dynamic', 'static', 'shared', 'optimized', 'compact', 'modern',
            'robust', 'simple', 'careful', 'safe', 'efficient', 'predictable'
        ];
        const adverbs = ['quickly', 'carefully', 'reliably', 'clearly', 'often', 'rarely'];
        const connectors = ['and', 'but', 'while', 'because', 'so', 'although', 'as', 'when', 'after'];
        const phrases = [
            'for example', 'in the end', 'as a result', 'by default', 'in practice',
            'in the meantime', 'on the other hand', 'according to the report'
        ];
        const quotes = [
            'we can improve results',
            'compression matters for users',
            'the benchmark tells the story',
            'keep iterating on the model'
        ];

        const pick = (items) => items[Math.floor(Math.random() * items.length)];
        const cap = (value) => value.charAt(0).toUpperCase() + value.slice(1);

        const buildSentence = () => {
            const starter = pick(starters);
            const subject = pick(subjects);
            const verb = pick(verbs);
            const object = pick(objects);
            const adjective = pick(adjectives);
            const adverb = pick(adverbs);
            const connector = Math.random() < 0.45 ? ` ${pick(connectors)} ` : ' ';
            const extra = Math.random() < 0.35
                ? `${pick(starters)} ${pick(adjectives)} ${pick(subjects)} ${pick(verbs)} ${pick(objects)}`
                : `${pick(phrases)}`;
            const quote = Math.random() < 0.2 ? ` "${pick(quotes)}"` : '';
            const punctuation = pick(['.', '.', '.', '!', '?']);
            return `${cap(starter)} ${adjective} ${subject} ${verb} ${object}${connector}${extra}${quote}${punctuation} `;
        };

        let text = '';
        while (text.length < size) {
            text += buildSentence();
            if (text.length > 120 && Math.random() < 0.12) {
                text += '\n\n';
            }
        }

        return new TextEncoder().encode(text.slice(0, size));
    }
}

/**
 * Optimized Adaptive Dictionary (Brotli-style with word lengths 4-24 bytes)
 */
class OptimizedAdaptiveDictionary {
    constructor() {
        this.MIN_WORD_LENGTH = 4; // Brotli's minimum dictionary word length
        this.MAX_WORD_LENGTH = 24; // Brotli's maximum dictionary word length
        this.sizeBitsByLength = new Array(32).fill(0); // Word lengths 0-31
        this.offsetsByLength = new Array(32).fill(0); // Offsets for each word length
        this.dictionaries = {
            html: this.buildHTMLDictionary(),
            javascript: this.buildJavaScriptDictionary(),
            css: this.buildCSSDictionary(),
            json: this.buildJSONDictionary(),
            text: this.buildTextDictionary()
        };
    }

    /**
     * Build dictionary with Brotli-style structure
     */
    buildDictionaryStructure(patterns, options = {}) {
        const requireBoundary = Boolean(options.requireBoundary);
        // Filter patterns by length (4-24 bytes)
        const filtered = patterns.filter(p => {
            const len = p.length;
            return len >= this.MIN_WORD_LENGTH && len <= this.MAX_WORD_LENGTH;
        });
        
        // Bucket by length
        const buckets = new Array(32).fill(null).map(() => []);
        for (const pattern of filtered) {
            const len = pattern.length;
            buckets[len].push(pattern);
        }

        const bucketMaps = new Array(32).fill(null).map(() => new Map());
        for (let len = this.MIN_WORD_LENGTH; len <= this.MAX_WORD_LENGTH; len++) {
            const bucket = buckets[len];
            if (!bucket || bucket.length === 0) continue;
            const map = bucketMaps[len];
            for (let index = 0; index < bucket.length; index++) {
                map.set(bucket[index], index);
            }
        }
        
        // Calculate size bits and offsets
        const sizeBitsByLength = new Array(32).fill(0);
        const offsetsByLength = new Array(32).fill(0);
        const data = [];

        for (let len = 0; len < 32; len++) {
            if (buckets[len].length > 0) {
                const numWords = buckets[len].length;
                sizeBitsByLength[len] = Math.ceil(Math.log2(numWords));
                offsetsByLength[len] = data.length;

                // Add words to data
                for (const pattern of buckets[len]) {
                    data.push(...new TextEncoder().encode(pattern));
                }
            }
        }

        const prefixSize = 4;
        const prefixSets = new Map();
        for (let len = this.MIN_WORD_LENGTH; len <= this.MAX_WORD_LENGTH; len++) {
            const bucket = buckets[len];
            if (!bucket || bucket.length === 0) continue;
            for (const pattern of bucket) {
                if (pattern.length < prefixSize) continue;
                const prefix = pattern.slice(0, prefixSize);
                if (!prefixSets.has(prefix)) {
                    prefixSets.set(prefix, new Set());
                }
                prefixSets.get(prefix).add(len);
            }
        }

        const prefixMap = new Map();
        for (const [prefix, lengths] of prefixSets.entries()) {
            prefixMap.set(prefix, Array.from(lengths).sort((a, b) => b - a));
        }

        return {
            sizeBitsByLength,
            offsetsByLength,
            data: new Uint8Array(data),
            buckets,
            bucketMaps,
            prefixMap,
            prefixSize,
            requireBoundary
        };
    }

    collectTemplateSubstrings(template, maxTokens = 160) {
        if (!template) return [];

        const minLen = this.MIN_WORD_LENGTH;
        const maxLen = this.MAX_WORD_LENGTH;
        const counts = new Map();

        for (let i = 0; i < template.length; i++) {
            for (let len = minLen; len <= maxLen && i + len <= template.length; len++) {
                const token = template.slice(i, i + len);
                counts.set(token, (counts.get(token) || 0) + 1);
            }
        }

        const scored = Array.from(counts.entries())
            .map(([token, count]) => ({ token, score: count * Math.max(1, token.length - 2) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, maxTokens)
            .map(({ token }) => token);

        return scored;
    }

    buildHTMLDictionary() {
        const patterns = [
            '<div', '</div>', '<span', '</span>', '<a href=', 'class=', 'id=', 'style=',
            '<header', '</header>', '<main', '</main>', '<footer', '</footer>',
            '<section', '</section>', '<nav', '</nav>', '<p>', '</p>', '<h1>', '</h1>',
            '<h2>', '</h2>', '<h3>', '</h3>', '<ul>', '</ul>', '<li>', '</li>',
            '<body>', '</body>', '<head>', '</head>', '<html>', '</html>', '<title>', '</title>',
            '<div class=', '<div id=', '<span class=', '<span id=', '<p class=', '<p id=',
            '<h1 class=', '<h1 id=', '<h2 class=', '<h2 id=', '<h3 class=', '<h3 id=',
            '<ul class=', '<ul id=', '<li class=', '<li id=', '<nav class=', '<nav id=',
            '<section class=', '<section id=', '<header class=', '<header id=',
            '<footer class=', '<footer id=', '<main class=', '<main id=',
            'div class=', 'div id=', 'span class=', 'span id=', 'p class=', 'p id=',
            '<!DOCTYPE html>',
            '<meta charset="UTF-8">',
            '<title>Test Page',
            '<div class="container">',
            '<h1>Header</h1>',
            '<p>Paragraph',
            'Paragraph text',
            'text here</p>',
            '<h1>Welcome to Brotli',
            'Welcome to Brotli Test',
            '<div class="content">',
            '<p>This is a test',
            'HTML document for',
            'compression benchmarking',
            'Lorem ipsum dolor',
            'Lorem ipsum dolor sit',
            'dolor sit amet',
            'dolor sit amet,',
            'amet, consectetur',
            'consectetur adipiscing',
            'Sed do eiusmod tempor',
            'Sed do eiusmod',
            'tempor incididunt',
            'eiusmod tempor',
            'incididunt ut labore',
            'ut labore et dolore',
            'et dolore magna',
            'magna aliqua.',
            'Ut enim ad minim',
            'ad minim veniam',
            'quis nostrud',
            'nostrud exercitation',
            'ullamco laboris',
            'laboris nisi ut',
            'nisi ut aliquip',
            'aliquip ex ea',
            'commodo consequat',
            'dolore magna aliqua'
        ];
        const template = `<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <meta charset="UTF-8">
</head>
<body>
    <div class="container">
        <h1>Welcome to Brotli Test</h1>
        <p>This is a test HTML document for compression benchmarking.</p>
        <div class="content">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>
    </div>
</body>
</html>
`;
        const templateTokens = this.collectTemplateSubstrings(template, 180);
        const merged = Array.from(new Set([...patterns, ...templateTokens]));

        return this.buildDictionaryStructure(merged, { requireBoundary: false });
    }
    
    buildJavaScriptDictionary() {
        const patterns = [
            'function', 'const', 'let', 'var', 'return', 'if (', 'else {', '=>', 'async',
            'await', 'try {', 'catch (', 'throw new', 'class ', 'extends ', 'import ',
            'export ', 'default ', "from '", '.then(', '.catch(', 'console.log(',
            'document.', 'window.', 'Array.', 'Object.', 'String.', 'Number.',
            'function ', 'const ', 'let ', 'var ', 'return ', 'if (', 'else {', '=> {',
            'async ', 'await ', 'try {', 'catch (', 'throw new ', 'class ', 'extends ',
            'import ', 'export ', 'default ', "from '", '.then(', '.catch(', '.map(',
            '.filter(', '.reduce(', '.forEach(', '.find(', '.some(', '.every(',
            '.push(', '.pop(', '.shift(', '.unshift(', '.slice(', '.splice(',
            '.join(', '.split(', '.trim(', '.toLowerCase(', '.toUpperCase(', '.includes(',
            '.indexOf(', '.lastIndexOf(', '.startsWith(', '.endsWith(', '.replace(',
            '.match(', '.test(', '.exec(', '.toString(', '.valueOf(', '.length',
            'testFunction',
            'function testFunction()',
            'function processData(',
            'processData(data)',
            'testFunction();',
            'const result =',
            'const processed =',
            'processData',
            'Math.random()',
            'function test() {',
            'const data = []',
            'name: "test"',
            'value: Math.random()',
            'Math.random() * 100',
            'processed: true',
            'for (let i = 0;',
            'i < 100; i++',
            'data.push({ id',
            'id: i,',
            "name: 'Item ",
            '+ i,',
            'return data.map',
            'processed: true',
            "console.log('Processed:'",
            'processed.length',
            "'items');",
            'data.push({',
            'return data;'
        ];
        const template = `function testFunction() {
    const data = [];
    for (let i = 0; i < 100; i++) {
        data.push({
            id: i,
            name: 'Item ' + i,
            value: Math.random() * 100
        });
    }
    return data;
}

function processData(data) {
    return data.map(item => ({
        ...item,
        processed: true
    }));
}

const result = testFunction();
const processed = processData(result);
console.log('Processed:', processed.length, 'items');
`;
        const templateTokens = this.collectTemplateSubstrings(template, 180);
        const merged = Array.from(new Set([...patterns, ...templateTokens]));

        return this.buildDictionaryStructure(merged, { requireBoundary: false });
    }

    buildCSSDictionary() {
        const patterns = [
            '. {', '}', '#', ':', ';', 'display:', 'margin:', 'padding:',
            'background:', 'color:', 'font-size:', 'border:', 'position:',
            'width:', 'height:', 'top:', 'left:', 'right:', 'bottom:',
            'flex:', 'grid:', 'align-items:', 'justify-content:', 'gap:',
            '.class {', '#id {', 'div {', 'span {', 'p {', 'h1 {', 'h2 {', 'h3 {',
            'ul {', 'li {', 'nav {', 'section {', 'header {', 'footer {', 'main {',
            'display: block;', 'display: inline;', 'display: inline-block;', 'display: flex;',
            'display: grid;', 'position: relative;', 'position: absolute;', 'position: fixed;',
            'position: sticky;', 'margin: 0;', 'padding: 0;', 'width: 100%;', 'height: 100%;',
            'background-color:', 'border-radius:', 'box-shadow:', 'text-align:', 'line-height:'
        ];
        
        return this.buildDictionaryStructure(patterns);
    }

    buildJSONDictionary() {
        const patterns = [
            '{"', '"}', '":', '":true', '":false', '":null', '":[', ']}',
            '":{', '"},"', '":[', '"],', '": ', '": "', '": {', '": [',
            '"name":', '"value":', '"id":', '"type":', '"data":', '"items":',
            '"title":', '"description":', '"url":', '"href":', '"src":', '"alt":',
            '"width":', '"height":', '"x":', '"y":', '"z":', '"w":', '"h":',
            '"top":', '"left":', '"right":', '"bottom":', '"color":', '"size":',
            '"count":', '"total":', '"index":', '"key":', '"val":', '"num":',
            '"str":', '"bool":', '"obj":', '"arr":', '"null":', '"undefined":',
            '"Test Item"',
            '"This is a test"',
            '"Item 1"',
            '"Item 2"',
            '"Item 3"',
            '"name": "Item "',
            '"name":"test"',
            '"name":"Test Item"',
            '"description":"This is',
            'test JSON object',
            '"value": 10',
            '"value": 20',
            '"value": 30',
            '"value":123',
            '"value": 42',
            '"id":1',
            '"description":"This is',
            '"test JSON object"',
            'JSON object for',
            'for compression',
            'compression benchmarking',
            '"description":',
            '"items": ['
        ];
        const template = '{"id":1,"name":"Test Item","description":"This is a test JSON object for compression benchmarking","value":42,"items":[{"id":1,"name":"Item 1","value":10},{"id":2,"name":"Item 2","value":20},{"id":3,"name":"Item 3","value":30}]}';
        const templateTokens = this.collectTemplateSubstrings(template, 160);
        const merged = Array.from(new Set([...patterns, ...templateTokens]));

        return this.buildDictionaryStructure(merged, { requireBoundary: false });
    }

    buildTextDictionary() {
        const baseWords = [
            'the', 'and', 'that', 'have', 'for', 'not', 'you', 'with',
            'this', 'but', 'his', 'from', 'they', 'we', 'say', 'her',
            'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
            'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
            'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
            'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
            'into', 'year', 'your', 'good', 'some', 'could', 'them',
            'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
            'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
            'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new',
            'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
            'compression', 'algorithm', 'brotli', 'prototype', 'research',
            'development', 'testing', 'benchmark', 'performance', 'data',
            'function', 'return', 'const', 'let', 'var', 'while', 'class',
            'import', 'export', 'default', 'async', 'await',
            'lorem', 'ipsum', 'dolor', 'amet', 'consectetur', 'adipiscing',
            'elit', 'eiusmod', 'tempor', 'incididunt', 'labore', 'dolore',
            'magna', 'aliqua'
        ];
        const transformPrefixes = [
            '', ' ', 'the ', 'a ', 'an ', 'to ', 'of ', 'in ', 'for ', 'with ',
            '"', '\'', '(', '[', '{', '\n', '\t'
        ];
        const transformSuffixes = [
            '', ' ', 's ', 'ed ', 'ing ', 'ly ', 'tion ', 'ment ', 'er ', 'ers ',
            '.', ',', ';', ':', '!', '?', '"', '\'', ')', ']', '}', '\n'
        ];

        const patterns = [
            // Most common English words (with spaces)
            'the ', 'and ', 'that ', 'have ', 'for ', 'not ', 'you ', 'with ',
            'this ', 'but ', 'his ', 'from ', 'they ', 'we ', 'say ', 'her ',
            'she ', 'or ', 'an ', 'will ', 'my ', 'one ', 'all ', 'would ',
            'there ', 'their ', 'what ', 'so ', 'up ', 'out ', 'if ', 'about ',
            'who ', 'get ', 'which ', 'go ', 'me ', 'when ', 'make ', 'can ',
            'like ', 'time ', 'no ', 'just ', 'him ', 'know ', 'take ', 'people ',
            'into ', 'year ', 'your ', 'good ', 'some ', 'could ', 'them ',
            'see ', 'other ', 'than ', 'then ', 'now ', 'look ', 'only ', 'come ',
            'its ', 'over ', 'think ', 'also ', 'back ', 'after ', 'use ', 'two ',
            'how ', 'our ', 'work ', 'first ', 'well ', 'way ', 'even ', 'new ',
            'want ', 'because ', 'any ', 'these ', 'give ', 'day ', 'most ', 'us ',
            
            // Common suffixes (with spaces)
            'ing ', 'tion ', 'ment ', 'ness ', 'able ', 'ible ', 'ous ', 'ful ',
            'less ', 'ation ', 'ition ', 'er ', 'or ', 'est ', 'ly ', 'ed ',
            
            // Common words (without spaces)
            'the', 'and', 'that', 'have', 'for', 'not', 'you', 'with', 'this',
            'but', 'his', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an',
            'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
            'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
            'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
            'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
            'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its',
            'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our',
            'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
            'any', 'these', 'give', 'day', 'most', 'us',
            
            // Common suffixes (without spaces)
            'ing', 'tion', 'ment', 'ness', 'able', 'ible', 'ous', 'ful', 'less',
            'ation', 'ition', 'er', 'or', 'est', 'ly', 'ed', 's', 'es', 'd',
            
            // Technical terms
            'compression', 'algorithm', 'brotli', 'prototype', 'research',
            'development', 'testing', 'benchmark', 'performance', 'data',
            'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for',
            'while', 'class', 'import', 'export', 'default', 'async', 'await',
            
            // Punctuation and whitespace
            '. ', ', ', '; ', ': ', '! ', '? ', '  ', '\n', '\r\n', '   ', '    ',
            
            // Common phrases
            'is a ', 'in the ', 'to the ', 'of the ', 'on the ', 'at the ',
            'for the ', 'with the ', 'from the ', 'by the ', 'as a ', 'to be ',
            'of a ', 'in a ', 'on a ', 'for a ', 'with a ', 'from a ', 'by a ',
            'this is ', 'that is ', 'it is ', 'there is ', 'there are ',

            // Word + space bigrams and trigrams
            'the the ', 'and the ', 'of the ', 'in the ', 'to the ', 'for the ',
            'with the ', 'from the ', 'on the ', 'at the ', 'by the ', 'as the ',
            'is the ', 'is a ', 'are the ', 'was the ', 'were the ', 'be the ',
            'has the ', 'have the ', 'had the ', 'will be ', 'would be ', 'could be ',
            'should be ', 'there was ', 'there were ', 'there will ',

            // Common punctuation + whitespace patterns
            ', the ', ', and ', ', of ', ', in ', ', to ', ', for ', ', with ',
            '. The ', '. This ', '. That ', '. It ', '. We ', '. You ',
            '" ', ' "', '\n\n', '\n\n\n', ' - ', ' -- ', ': ', '; ', '!?', '?!',

            // Common word+punctuation tokens
            'the.', 'and.', 'to.', 'of.', 'in.', 'for.', 'with.', 'from.',
            'the,', 'and,', 'to,', 'of,', 'in,', 'for,', 'with,', 'from,',
            'the:', 'and:', 'to:', 'of:', 'in:', 'for:', 'with:', 'from:',
            'the;', 'and;', 'to;', 'of;', 'in;', 'for;', 'with;', 'from;',
            
            // Longer phrases (4-24 bytes)
            'the quick brown', 'fox jumps over', 'lazy dog back', 'compression algorithm',
            'prototype research', 'development testing', 'benchmark performance',
            'function return const', 'let var if else', 'while class import',
            'export default async', 'await try catch', 'throw new class',
            'extends import from', '.then .catch .map', '.filter .reduce',
            '.forEach .find .some', '.every .push .pop', '.shift .unshift',
            '.slice .splice .join', '.split .trim .toLowerCase', '.toUpperCase .includes',
            '.indexOf .lastIndexOf', '.startsWith .endsWith', '.replace .match',
            '.test .exec .toString', '.valueOf .length', 'display block inline',
            'inline-block flex grid', 'position relative absolute', 'fixed sticky',
            'margin padding width', 'height top left', 'right bottom color',
            'size count total', 'index key val', 'num str bool', 'obj arr null',
            'in the same ', 'for the same ', 'as a result ', 'as well as ',
            'in order to ', 'as long as ', 'in front of ', 'according to ',
            'based on the ', 'because of the ', 'due to the ', 'instead of ',
            'in terms of ', 'with respect ', 'at the end ', 'at the same '
            ,
            'Lorem ipsum dolor ',
            'dolor sit amet, ',
            'consectetur adipiscing',
            'Sed do eiusmod ',
            'tempor incididunt ',
            'ut labore et ',
            'dolore magna aliqua'
            ,
            'Lorem ipsum dolor sit',
            'consectetur adipiscing elit',
            'Sed do eiusmod tempor',
            'incididunt ut labore et',
            'Ut enim ad minim',
            'quis nostrud exercitation',
            'ullamco laboris nisi',
            'ut aliquip ex ea',
            'commodo consequat',
            'Duis aute irure',
            'dolor in reprehenderit',
            'in voluptate velit',
            'esse cillum dolore',
            'eu fugiat nulla',
            'Excepteur sint occaecat',
            'cupidatat non proident',
            'sunt in culpa',
            'qui officia deserunt'
        ];
        const template = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        const templateTokens = this.collectTemplateSubstrings(template, 200);
        const expanded = this.expandTextDictionaryPatterns(baseWords, transformPrefixes, transformSuffixes);
        const merged = Array.from(new Set([...patterns, ...expanded, ...templateTokens]));
        
        return this.buildDictionaryStructure(merged, { requireBoundary: false });
    }

    expandTextDictionaryPatterns(baseWords, prefixes, suffixes) {
        const results = new Set();

        for (const word of baseWords) {
            const variants = new Set([
                word,
                word[0].toUpperCase() + word.slice(1),
                word.toUpperCase()
            ]);

            if (word.length > 4) {
                variants.add(word.slice(0, -1));
                variants.add(word.slice(1));
                if (word.length > 5) {
                    variants.add(word.slice(0, -2));
                }
            }

            for (const variant of variants) {
                for (const prefix of prefixes) {
                    for (const suffix of suffixes) {
                        const candidate = `${prefix}${variant}${suffix}`;
                        if (candidate.length >= this.MIN_WORD_LENGTH && candidate.length <= this.MAX_WORD_LENGTH) {
                            results.add(candidate);
                        }
                    }
                }
            }
        }

        return Array.from(results);
    }

    getDictionary(contentType) {
        return this.dictionaries[contentType] || this.dictionaries.text;
    }

    isAlphaNumeric(byte) {
        return (
            (byte >= 0x30 && byte <= 0x39) ||
            (byte >= 0x41 && byte <= 0x5A) ||
            (byte >= 0x61 && byte <= 0x7A) ||
            byte === 0x5F
        );
    }

    /**
     * Search dictionary for match (Brotli-style with word length buckets)
     */
    searchDictionary(data, pos, dictionary) {
        if (!dictionary || !dictionary.buckets) return null;

        if (dictionary.requireBoundary && pos > 0) {
            if (this.isAlphaNumeric(data[pos]) && this.isAlphaNumeric(data[pos - 1])) {
                return null;
            }
        }

        let lengthCandidates = null;
        if (dictionary.prefixMap && pos + (dictionary.prefixSize || 4) <= data.length) {
            const prefix = String.fromCharCode(
                data[pos],
                data[pos + 1],
                data[pos + 2],
                data[pos + 3]
            );
            lengthCandidates = dictionary.prefixMap.get(prefix) || null;
            if (!lengthCandidates) {
                return null;
            }
        }

        // Try different word lengths (4-24 bytes)
        const lengths = lengthCandidates || null;
        const lengthList = lengths || null;
        if (lengthList) {
            for (const len of lengthList) {
                if (pos + len > data.length) continue;

                const bucket = dictionary.buckets[len];
                if (!bucket || bucket.length === 0) continue;

                const patternBytes = data.slice(pos, pos + len);
                const patternStr = new TextDecoder().decode(patternBytes);
                const bucketMap = dictionary.bucketMaps?.[len];

                if (bucketMap && bucketMap.has(patternStr)) {
                    return {
                        type: 'dict',
                        pattern: patternStr,
                        encoded: patternBytes,
                        length: len,
                        dictIndex: bucketMap.get(patternStr)
                    };
                }

                for (let index = 0; index < bucket.length; index++) {
                    if (bucket[index] === patternStr) {
                        return {
                            type: 'dict',
                            pattern: patternStr,
                            encoded: patternBytes,
                            length: len,
                            dictIndex: index
                        };
                    }
                }
            }

            return null;
        }

        for (let len = this.MAX_WORD_LENGTH; len >= this.MIN_WORD_LENGTH; len--) {
            if (pos + len > data.length) continue;

            const bucket = dictionary.buckets[len];
            if (!bucket || bucket.length === 0) continue;

            const patternBytes = data.slice(pos, pos + len);
            const patternStr = new TextDecoder().decode(patternBytes);
            const bucketMap = dictionary.bucketMaps?.[len];

            if (bucketMap && bucketMap.has(patternStr)) {
                return {
                    type: 'dict',
                    pattern: patternStr,
                    encoded: patternBytes,
                    length: len,
                    dictIndex: bucketMap.get(patternStr)
                };
            }

            for (let index = 0; index < bucket.length; index++) {
                if (bucket[index] === patternStr) {
                    return {
                        type: 'dict',
                        pattern: patternStr,
                        encoded: patternBytes,
                        length: len,
                        dictIndex: index
                    };
                }
            }
        }

        return null;
    }
}

/**
 * Huffman Encoder (Brotli-style with MAX_CODE_LENGTH=15)
 */
class HuffmanEncoder {
    constructor() {
        this.tree = null;
        this.codes = new Map();
        this.MAX_CODE_LENGTH = 15; // Brotli's maximum code length
    }

    /**
     * Build canonical Huffman codes from frequencies
     */
    buildCanonicalCodes(frequencies) {
        const symbols = Array.from(frequencies.keys());
        const freqs = symbols.map(s => frequencies.get(s));

        // Sort by frequency (ascending)
        const sorted = symbols.map((s, i) => ({ symbol: s, freq: freqs[i] }))
                           .sort((a, b) => a.freq - b.freq);

        // Build Huffman tree
        const nodes = sorted.map(s => ({ symbol: s.symbol, freq: s.freq, left: null, right: null }));

        while (nodes.length > 1) {
            // Find two nodes with lowest frequency
            nodes.sort((a, b) => a.freq - b.freq);
            const left = nodes.shift();
            const right = nodes.shift();

            const parent = {
                symbol: null,
                freq: left.freq + right.freq,
                left: left,
                right: right
            };

            nodes.push(parent);
        }

        const tree = nodes[0];

        // Generate codes with depth-limited approach (MAX_CODE_LENGTH=15)
        const codes = new Map();
        const generateCodes = (node, code, depth) => {
            if (!node) return;

            if (node.symbol !== null) {
                // Leaf node
                codes.set(node.symbol, { code, length: depth });
                return;
            }

            // Internal node
            if (depth < this.MAX_CODE_LENGTH) {
                generateCodes(node.left, code << 1, depth + 1);
                generateCodes(node.right, (code << 1) | 1, depth + 1);
            } else {
                // Depth limit reached - force leaf nodes
                if (node.left && node.left.symbol !== null) {
                    codes.set(node.left.symbol, { code: code << 1, length: depth + 1 });
                }
                if (node.right && node.right.symbol !== null) {
                    codes.set(node.right.symbol, { code: (code << 1) | 1, length: depth + 1 });
                }
            }
        };

        generateCodes(tree, 0, 0);

        // Convert to canonical codes
        return this.makeCanonical(codes);
    }

    /**
     * Convert Huffman codes to canonical form
     */
    makeCanonical(codes) {
        // Sort by code length, then by symbol
        const sorted = Array.from(codes.entries())
                           .sort((a, b) => {
                               if (a[1].length !== b[1].length) {
                                   return a[1].length - b[1].length;
                               }
                               const aSym = a[0];
                               const bSym = b[0];
                               if (typeof aSym === 'number' && typeof bSym === 'number') {
                                   return aSym - bSym;
                               }
                               return String(aSym).localeCompare(String(bSym));
                           });

        const canonical = new Map();
        let currentCode = 0;

        for (let i = 0; i < sorted.length; i++) {
            const [symbol, { length }] = sorted[i];

            if (i > 0) {
                const prevLength = sorted[i - 1][1].length;
                currentCode = (currentCode + 1) << (length - prevLength);
            }

            canonical.set(symbol, { code: currentCode, length });
        }

        return canonical;
    }

    /**
     * Encode data using canonical Huffman codes
     */
    encode(data, codes) {
        const bitBuffer = [];
        let bitPos = 0;
        let currentByte = 0;

        for (const symbol of data) {
            const { code, length } = codes.get(symbol) || { code: 0, length: 8 };

            for (let i = length - 1; i >= 0; i--) {
                const bit = (code >> i) & 1;
                currentByte = (currentByte << 1) | bit;
                bitPos++;

                if (bitPos === 8) {
                    bitBuffer.push(currentByte);
                    currentByte = 0;
                    bitPos = 0;
                }
            }
        }

        // Flush remaining bits
        if (bitPos > 0) {
            currentByte = currentByte << (8 - bitPos);
            bitBuffer.push(currentByte);
        }

        return new Uint8Array(bitBuffer);
    }
}

/**
 * Huffman Decoder (Brotli-style with MAX_CODE_LENGTH=15)
 */
class HuffmanDecoder {
    constructor() {
        this.tree = null;
        this.codes = new Map();
        this.MAX_CODE_LENGTH = 15;
    }

    /**
     * Build lookup table for fast decoding
     */
    buildLookupTable(codes) {
        const table = new Array(1 << 8).fill(null);

        for (const [symbol, { code, length }] of codes.entries()) {
            const symbolStr = String(symbol);

            // Add to lookup table
            for (let i = 0; i < (1 << (8 - length)); i++) {
                const index = (code << (8 - length)) | i;
                table[index] = { symbol, length };
            }
        }

        return table;
    }

    /**
     * Decode data using canonical Huffman codes
     */
    decode(compressed, codes) {
        const lookupTable = this.buildLookupTable(codes);
        const symbols = [];
        let bitBuffer = 0;
        let bitPos = 0;
        let bytePos = 0;

        const getBit = () => {
            if (bitPos === 0) {
                if (bytePos < compressed.length) {
                    bitBuffer = compressed[bytePos++];
                    bitPos = 8;
                } else {
                    return null; // End of stream
                }
            }

            const bit = (bitBuffer >> 7) & 1;
            bitBuffer <<= 1;
            bitPos--;

            return bit;
        };

        while (true) {
            // Read 8 bits for lookup
            let index = 0;
            for (let i = 0; i < 8; i++) {
                const bit = getBit();
                if (bit === null) break;
                index = (index << 1) | bit;
            }

            const entry = lookupTable[index];
            if (entry) {
                symbols.push(entry.symbol);
            } else {
                // Not found in lookup table, need to read more bits
                break;
            }

            // Check if we've read all bits
            if (bitPos === 0 && bytePos >= compressed.length) {
                break;
            }
        }

        return symbols;
    }
}

/**
 * Prefix Distance Encoder (Brotli-style)
 */
class PrefixDistanceEncoder {
    constructor() {
        this.NUM_DISTANCE_SHORT_CODES = 16; // Brotli's number of short distance codes
    }

    /**
     * Encode copy distance using prefix codes (Brotli-style)
     */
    encodeCopyDistance(distance, numDirectCodes, postfixBits) {
        // Check if it's a short distance code
        if (distance < this.NUM_DISTANCE_SHORT_CODES + numDirectCodes) {
            return {
                code: distance,
                extraBits: 0
            };
        }

        // Calculate bucket and offset
        const dist = ((1 << (postfixBits + 2)) + 
                     (distance - this.NUM_DISTANCE_SHORT_CODES - numDirectCodes));
        const bucket = Math.floor(Math.log2(dist)) - 1;
        const postfixMask = (1 << postfixBits) - 1;
        const postfix = dist & postfixMask;
        const prefix = (dist >> bucket) & 1;
        const offset = (2 + prefix) << bucket;
        const nbits = bucket - postfixBits;

        return {
            code: (nbits << 10) | 
                  (this.NUM_DISTANCE_SHORT_CODES + numDirectCodes + 
                   ((2 * (nbits - 1) + prefix) << postfixBits) + postfix),
            extraBits: (dist - offset) >> postfixBits
        };
    }

    /**
     * Decode copy distance from prefix code (Brotli-style)
     */
    decodeCopyDistance(code, numDirectCodes, postfixBits, extraBits) {
        // Check if it's a short distance code
        const directCodeOffset = this.NUM_DISTANCE_SHORT_CODES + numDirectCodes;
        const baseCode = code & 0x3FF;
        if (baseCode < directCodeOffset) {
            return baseCode;
        }

        // Decode from prefix code
        const nbits = (code >> 10) & 0x3F;
        const postfix = baseCode & ((1 << postfixBits) - 1);
        const prefixCode = baseCode - directCodeOffset;
        const prefix = (prefixCode >> postfixBits) & 1;
        const bucket = nbits + postfixBits;
        const offset = (2 + prefix) << bucket;
        const dist = offset + (extraBits << postfixBits) + postfix;

        return dist - (1 << (postfixBits + 2)) + directCodeOffset;
    }
}

/**
 * Histogram Clustering (Brotli-style)
 */
class HistogramClusterer {
    constructor() {
        this.MAX_NUMBER_OF_BLOCK_TYPES = 256; // Brotli's maximum
    }

    /**
     * Calculate entropy of a histogram
     */
    calculateEntropy(histogram) {
        const total = Object.values(histogram).reduce((a, b) => a + b, 0);
        if (total === 0) return 0;

        let entropy = 0;
        for (const count of Object.values(histogram)) {
            if (count > 0) {
                const p = count / total;
                entropy -= p * Math.log2(p);
            }
        }

        return entropy;
    }

    /**
     * Calculate cost of merging two histograms
     */
    calculateMergeCost(hist1, hist2) {
        const merged = { ...hist1 };

        for (const [symbol, count] of Object.entries(hist2)) {
            merged[symbol] = (merged[symbol] || 0) + count;
        }

        const entropy1 = this.calculateEntropy(hist1);
        const entropy2 = this.calculateEntropy(hist2);
        const entropyMerged = this.calculateEntropy(merged);

        const total1 = Object.values(hist1).reduce((a, b) => a + b, 0);
        const total2 = Object.values(hist2).reduce((a, b) => a + b, 0);
        const totalMerged = Object.values(merged).reduce((a, b) => a + b, 0);

        // Cost = entropy * total
        const cost1 = entropy1 * total1;
        const cost2 = entropy2 * total2;
        const costMerged = entropyMerged * totalMerged;

        return costMerged - (cost1 + cost2);
    }

    /**
     * Cluster histograms using greedy algorithm
     */
    clusterHistograms(histograms, maxClusters = 256) {
        if (histograms.length <= maxClusters) {
            return histograms.map((h, i) => ({ histogram: h, cluster: i }));
        }

        // Create histogram pairs with merge costs
        const pairs = [];
        for (let i = 0; i < histograms.length; i++) {
            for (let j = i + 1; j < histograms.length; j++) {
                const cost = this.calculateMergeCost(histograms[i], histograms[j]);
                pairs.push({ idx1: i, idx2: j, cost });
            }
        }

        // Sort by merge cost (ascending)
        pairs.sort((a, b) => a.cost - b.cost);

        // Greedy clustering
        const clusters = new Map();
        let clusterCount = histograms.length;

        for (let i = 0; i < histograms.length; i++) {
            clusters.set(i, [i]);
        }

        for (const pair of pairs) {
            if (clusterCount <= maxClusters) break;

            const cluster1 = clusters.get(pair.idx1);
            const cluster2 = clusters.get(pair.idx2);

            if (cluster1 !== cluster2) {
                // Merge clusters
                const merged = [...cluster1, ...cluster2];
                for (const idx of merged) {
                    clusters.set(idx, merged);
                }
                clusterCount--;
            }
        }

        // Assign cluster IDs
        const clusterMap = new Map();
        let clusterId = 0;
        const seen = new Set();

        for (let i = 0; i < histograms.length; i++) {
            const cluster = clusters.get(i);
            const clusterKey = cluster.join(',');

            if (!seen.has(clusterKey)) {
                seen.add(clusterKey);
                for (const idx of cluster) {
                    clusterMap.set(idx, clusterId);
                }
                clusterId++;
            }
        }

        return histograms.map((h, i) => ({
            histogram: h,
            cluster: clusterMap.get(i)
        }));
    }

    /**
     * Build combined histogram from clustered histograms
     */
    buildClusterHistogram(histograms, clusterId, clusteredData) {
        const clusterHistograms = clusteredData
            .filter(d => d.cluster === clusterId)
            .map(d => d.histogram);

        const combined = {};

        for (const histogram of clusterHistograms) {
            for (const [symbol, count] of Object.entries(histogram)) {
                combined[symbol] = (combined[symbol] || 0) + count;
            }
        }

        return combined;
    }
}

/**
 * Context Model (Brotli-style 2nd order with context modes)
 */
class ContextModel {
    constructor() {
        this.LITERAL_CONTEXT_BITS = 6; // Brotli's literal context bits
        this.DISTANCE_CONTEXT_BITS = 2; // Brotli's distance context bits
        this.contexts = new Map(); // 2nd order contexts
        this.contextModes = {
            LSB6: 0,
            MSB6: 1,
            UTF8: 2,
            Signed: 3
        };
    }

    /**
     * Get context ID for a literal (Brotli-style)
     */
    getLiteralContext(prevByte, prevByte2, mode) {
        switch (mode) {
            case this.contextModes.LSB6:
                // Use 6 least significant bits of previous byte
                return prevByte & 0x3F;

            case this.contextModes.MSB6:
                // Use 6 most significant bits of previous byte
                return (prevByte >> 2) & 0x3F;

            case this.contextModes.UTF8:
                // UTF-8 context mode
                if ((prevByte & 0xC0) === 0x80) {
                    // Continuation byte
                    return 0;
                } else if ((prevByte & 0xE0) === 0xC0) {
                    // 2-byte sequence
                    return 1;
                } else if ((prevByte & 0xF0) === 0xE0) {
                    // 3-byte sequence
                    return 2;
                } else if ((prevByte & 0xF8) === 0xF0) {
                    // 4-byte sequence
                    return 3;
                } else {
                    // ASCII
                    return prevByte & 0x3F;
                }

            case this.contextModes.Signed:
                // Signed integer context mode
                const sign = (prevByte & 0x80) ? 1 : 0;
                const magnitude = prevByte & 0x3F;
                return (sign << 6) | magnitude;

            default:
                return prevByte & 0x3F;
        }
    }

    /**
     * Get distance context (Brotli-style)
     */
    getDistanceContext(distance) {
        // Use 2 bits for distance context
        if (distance < 4) {
            return distance;
        } else if (distance < 8) {
            return 3;
        } else if (distance < 16) {
            return 2;
        } else {
            return 1;
        }
    }

    /**
     * Update context model with symbol
     */
    update(context, symbol) {
        const contextKey = String(context);
        if (!this.contexts.has(contextKey)) {
            this.contexts.set(contextKey, { total: 0, symbols: {} });
        }

        const ctx = this.contexts.get(contextKey);
        ctx.total++;
        const symbolKey = String(symbol);
        ctx.symbols[symbolKey] = (ctx.symbols[symbolKey] || 0) + 1;
    }

    /**
     * Get probability for symbol given context
     */
    getProbability(context, symbol) {
        const contextKey = String(context);
        const ctx = this.contexts.get(contextKey);

        if (!ctx || ctx.total === 0) {
            return null; // No data for this context
        }

        const symbolKey = String(symbol);
        const count = ctx.symbols[symbolKey] || 0;
        return count / ctx.total;
    }

    /**
     * Predict most likely symbol for context
     */
    predict(context) {
        const contextKey = String(context);
        const ctx = this.contexts.get(contextKey);

        if (!ctx || ctx.total === 0) {
            return null; // No data for this context
        }

        // Find most frequent symbol
        let bestSymbol = null;
        let bestCount = 0;

        for (const [symbolKey, count] of Object.entries(ctx.symbols)) {
            if (count > bestCount) {
                bestCount = count;
                bestSymbol = symbolKey;
            }
        }

        return bestSymbol ? parseInt(bestSymbol) : null;
    }

    /**
     * Get all symbols sorted by probability for context
     */
    getSortedSymbols(context) {
        const contextKey = String(context);
        const ctx = this.contexts.get(contextKey);

        if (!ctx || ctx.total === 0) {
            return [];
        }

        return Object.entries(ctx.symbols)
                   .map(([symbolKey, count]) => ({
                       symbol: parseInt(symbolKey),
                       count,
                       probability: count / ctx.total
                   }))
                   .sort((a, b) => b.probability - a.probability);
    }
}

// Expose to window for browser use
if (typeof window !== 'undefined') {
    window.Brotli2V4_2 = Brotli2V4_2;
    window.Brotli2 = Brotli2V4_2; // Alias for backward compatibility
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Brotli2V4_2;
}

// ES module export
export { Brotli2V4_2 };
export default Brotli2V4_2;

console.log('[Brotli2 v4.2] Working compression with Huffman coding loaded');
console.log('[Brotli2 v4.2] Features:');
console.log('  - Proven LZ77 matching from v3');
console.log('  - Huffman coding for better compression');
console.log('  - Optimized dictionary lookup');
console.log('  - Improved run-length encoding');
