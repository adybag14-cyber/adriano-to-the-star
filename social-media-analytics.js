/**
 * Social Media Analytics
 * Analytics for social media data and engagement metrics
 */

class SocialMediaAnalytics {
    constructor() {
        this.posts = new Map();
        this.analytics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_oc_ia_lm_ed_ia_an_al_yt_ic_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_oc_ia_lm_ed_ia_an_al_yt_ic_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addPost(postId, postData) {
        const post = {
            id: postId,
            ...postData,
            createdAt: new Date(postData.timestamp || Date.now())
        };
        
        this.posts.set(postId, post);
        console.log(`Post added: ${postId}`);
        return post;
    }

    calculateEngagement(postId) {
        const post = this.posts.get(postId);
        if (!post) {
            throw new Error('Post not found');
        }
        
        const likes = post.likes || 0;
        const comments = post.comments || 0;
        const shares = post.shares || 0;
        const views = post.views || 0;
        
        const engagementRate = views > 0 
            ? ((likes + comments + shares) / views) * 100 
            : 0;
        
        const engagementScore = likes * 1 + comments * 2 + shares * 3;
        
        const analytics = {
            postId,
            likes,
            comments,
            shares,
            views,
            engagementRate,
            engagementScore,
            timestamp: new Date()
        };
        
        const analyticsId = `analytics_${Date.now()}`;
        this.analytics.set(analyticsId, analytics);
        
        return analytics;
    }

    analyzeTrendingTopics(timeframe = '24h') {
        const now = Date.now();
        const timeframeMs = this.getTimeframeMs(timeframe);
        const cutoff = now - timeframeMs;
        
        const topicCounts = new Map();
        
        this.posts.forEach(post => {
            if (post.createdAt.getTime() >= cutoff) {
                const topics = post.topics || post.hashtags || [];
                topics.forEach(topic => {
                    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
                });
            }
        });
        
        return Array.from(topicCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));
    }

    getTimeframeMs(timeframe) {
        const units = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        return units[timeframe] || units['24h'];
    }

    calculateReach(posts) {
        const uniqueUsers = new Set();
        let totalViews = 0;
        let totalEngagements = 0;
        
        posts.forEach(postId => {
            const post = this.posts.get(postId);
            if (post) {
                if (post.userId) {
                    uniqueUsers.add(post.userId);
                }
                totalViews += post.views || 0;
                totalEngagements += (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
            }
        });
        
        return {
            reach: uniqueUsers.size,
            totalViews,
            totalEngagements,
            avgEngagementRate: totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0
        };
    }

    analyzeSentiment(posts) {
        const sentiments = [];
        
        posts.forEach(postId => {
            const post = this.posts.get(postId);
            if (post && post.content) {
                const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing'];
                const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst'];
                
                const lowerContent = post.content.toLowerCase();
                let positiveCount = 0;
                let negativeCount = 0;
                
                positiveWords.forEach(word => {
                    if (lowerContent.includes(word)) positiveCount++;
                });
                
                negativeWords.forEach(word => {
                    if (lowerContent.includes(word)) negativeCount++;
                });
                
                let sentiment = 'neutral';
                if (positiveCount > negativeCount) {
                    sentiment = 'positive';
                } else if (negativeCount > positiveCount) {
                    sentiment = 'negative';
                }
                
                sentiments.push({
                    postId,
                    sentiment,
                    positiveCount,
                    negativeCount
                });
            }
        });
        
        const positive = sentiments.filter(s => s.sentiment === 'positive').length;
        const negative = sentiments.filter(s => s.sentiment === 'negative').length;
        const neutral = sentiments.filter(s => s.sentiment === 'neutral').length;
        
        return {
            total: sentiments.length,
            positive,
            negative,
            neutral,
            sentiments
        };
    }

    calculateOptimalPostingTime() {
        const hourEngagements = Array(24).fill(0);
        const hourCounts = Array(24).fill(0);
        
        this.posts.forEach(post => {
            const hour = post.createdAt.getHours();
            const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
            hourEngagements[hour] += engagement;
            hourCounts[hour]++;
        });
        
        const avgEngagements = hourEngagements.map((eng, hour) => ({
            hour,
            avgEngagement: hourCounts[hour] > 0 ? eng / hourCounts[hour] : 0
        }));
        
        return avgEngagements.reduce((max, item) => 
            item.avgEngagement > max.avgEngagement ? item : max
        , avgEngagements[0]);
    }

    getPost(postId) {
        return this.posts.get(postId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.socialMediaAnalytics = new SocialMediaAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialMediaAnalytics;
}

