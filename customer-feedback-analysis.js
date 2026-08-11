/**
 * Customer Feedback Analysis
 * Advanced analysis of customer feedback and sentiment
 */

class CustomerFeedbackAnalysis {
    constructor() {
        this.feedback = new Map();
        this.analyses = new Map();
        this.sentimentScores = new Map();
        this.init();
    }

    init() {
        this.trackEvent('c_us_to_me_rf_ee_db_ac_ka_na_ly_si_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_us_to_me_rf_ee_db_ac_ka_na_ly_si_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addFeedback(feedbackId, userId, content, rating, category) {
        this.feedback.set(feedbackId, {
            id: feedbackId,
            userId,
            content,
            rating,
            category,
            sentiment: null,
            createdAt: new Date()
        });
        console.log(`Feedback added: ${feedbackId}`);
    }

    analyzeSentiment(feedbackId) {
        const feedback = this.feedback.get(feedbackId);
        if (!feedback) {
            throw new Error('Feedback does not exist');
        }
        
        // Analyze sentiment (placeholder for actual sentiment analysis)
        const sentiment = this.performSentimentAnalysis(feedback.content);
        feedback.sentiment = sentiment;
        this.sentimentScores.set(feedbackId, sentiment.score);
        
        return sentiment;
    }

    performSentimentAnalysis(content) {
        // Placeholder for sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'worst'];
        
        const lowerContent = content.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        
        positiveWords.forEach(word => {
            if (lowerContent.includes(word)) positiveCount++;
        });
        
        negativeWords.forEach(word => {
            if (lowerContent.includes(word)) negativeCount++;
        });
        
        let score = 0;
        if (positiveCount > negativeCount) {
            score = 0.5 + (positiveCount / 10);
        } else if (negativeCount > positiveCount) {
            score = 0.5 - (negativeCount / 10);
        } else {
            score = 0.5;
        }
        
        score = Math.max(0, Math.min(1, score));
        
        return {
            score,
            label: score > 0.6 ? 'positive' : score < 0.4 ? 'negative' : 'neutral',
            confidence: Math.abs(score - 0.5) * 2
        };
    }

    getFeedbackSummary(category = null) {
        const feedbacks = Array.from(this.feedback.values());
        const filtered = category ? feedbacks.filter(f => f.category === category) : feedbacks;
        
        const total = filtered.length;
        const avgRating = total > 0 
            ? filtered.reduce((sum, f) => sum + (f.rating || 0), 0) / total 
            : 0;
        
        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
        filtered.forEach(f => {
            if (f.sentiment) {
                sentimentCounts[f.sentiment.label]++;
            }
        });
        
        return {
            total,
            averageRating: avgRating,
            sentimentDistribution: sentimentCounts
        };
    }

    getTrendingTopics(limit = 10) {
        // Extract trending topics from feedback
        const topics = new Map();
        for (const feedback of this.feedback.values()) {
            const words = feedback.content.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 4) {
                    topics.set(word, (topics.get(word) || 0) + 1);
                }
            });
        }
        
        return Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([topic, count]) => ({ topic, count }));
    }

    getFeedback(feedbackId) {
        return this.feedback.get(feedbackId);
    }

    getAllFeedback() {
        return Array.from(this.feedback.values());
    }
}

if (typeof window !== 'undefined') {
    window.customerFeedbackAnalysis = new CustomerFeedbackAnalysis();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerFeedbackAnalysis;
}

