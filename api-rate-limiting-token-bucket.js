/**
 * API Rate Limiting - Token Bucket
 * Token bucket algorithm for rate limiting
 */

class APIRateLimitingTokenBucket {
    constructor() {
        this.buckets = new Map();
        this.init();
    }

    init() {
        this.trackEvent('token_bucket_initialized');
    }

    createBucket(bucketId, capacity, refillRate) {
        const bucket = {
            id: bucketId,
            capacity,
            tokens: capacity,
            refillRate, // tokens per second
            lastRefill: Date.now(),
            stats: {
                totalRequests: 0,
                allowed: 0,
                rejected: 0
            },
            createdAt: new Date()
        };
        
        this.buckets.set(bucketId, bucket);
        this.trackEvent('bucket_created', { bucketId });
        return bucket;
    }

    refillTokens(bucket) {
        const now = Date.now();
        const elapsed = (now - bucket.lastRefill) / 1000; // seconds
        const tokensToAdd = elapsed * bucket.refillRate;
        
        bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
    }

    consumeToken(bucketId, tokens = 1) {
        const bucket = this.buckets.get(bucketId);
        if (!bucket) {
            throw new Error('Bucket does not exist');
        }
        
        this.refillTokens(bucket);
        bucket.stats.totalRequests++;
        
        if (bucket.tokens >= tokens) {
            bucket.tokens -= tokens;
            bucket.stats.allowed++;
            console.log(`Token consumed from bucket: ${bucketId}, remaining: ${bucket.tokens}`);
            return { allowed: true, remaining: bucket.tokens };
        } else {
            bucket.stats.rejected++;
            console.log(`Request rejected from bucket: ${bucketId}, insufficient tokens`);
            return { allowed: false, remaining: bucket.tokens };
        }
    }

    getBucketStats(bucketId) {
        const bucket = this.buckets.get(bucketId);
        if (!bucket) {
            throw new Error('Bucket does not exist');
        }
        
        this.refillTokens(bucket);
        
        return {
            id: bucket.id,
            capacity: bucket.capacity,
            tokens: bucket.tokens,
            refillRate: bucket.refillRate,
            stats: bucket.stats
        };
    }

    getBucket(bucketId) {
        return this.buckets.get(bucketId);
    }

    getAllBuckets() {
        return Array.from(this.buckets.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`token_bucket_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRateLimitingTokenBucket = new APIRateLimitingTokenBucket();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRateLimitingTokenBucket;
}

