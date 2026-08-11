/**
 * Sentiment Analysis for User Feedback
 * Analyzes sentiment of user feedback and reviews
 */

class SentimentAnalysisFeedback {
    constructor() {
        this.sentimentModel = null;
        this.init();
    }
    
    init() {
        this.loadSentimentModel();
    }
    
    loadSentimentModel() {
        // Simplified sentiment analysis using keyword matching
        // In production, would use ML model
        this.sentimentModel = {
            positive: ['great', 'excellent', 'amazing', 'love', 'fantastic', 'wonderful', 'perfect', 'good', 'nice', 'awesome'],
            negative: ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'poor', 'disappointing', 'frustrating', 'annoying'],
            neutral: ['okay', 'fine', 'average', 'decent', 'acceptable']
        };
    }
    
    analyzeSentiment(text) {
        if (!text || text.length === 0) {
            return { sentiment: 'neutral', score: 0, confidence: 0 };
        }
        
        const lowerText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;
        
        // Count positive words
        this.sentimentModel.positive.forEach(word => {
            const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
            positiveScore += matches;
        });
        
        // Count negative words
        this.sentimentModel.negative.forEach(word => {
            const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
            negativeScore += matches;
        });
        
        // Calculate sentiment
        const totalWords = text.split(/\s+/).length;
        const positiveRatio = positiveScore / totalWords;
        const negativeRatio = negativeScore / totalWords;
        
        let sentiment = 'neutral';
        let score = 0;
        
        if (positiveRatio > negativeRatio && positiveRatio > 0.1) {
            sentiment = 'positive';
            score = positiveRatio;
        } else if (negativeRatio > positiveRatio && negativeRatio > 0.1) {
            sentiment = 'negative';
            score = -negativeRatio;
        }
        
        const confidence = Math.abs(positiveRatio - negativeRatio);
        
        return {
            sentiment,
            score: Math.max(-1, Math.min(1, score)),
            confidence: Math.min(1, confidence),
            positiveScore,
            negativeScore
        };
    }
    
    async analyzeFeedback(feedbackId) {
        // Analyze feedback from database
        if (window.supabase) {
            const { data } = await window.supabase
                .from('feedback')
                .select('*')
                .eq('id', feedbackId)
                .single();
            
            if (data && data.comment) {
                const analysis = this.analyzeSentiment(data.comment);
                
                // Update feedback with sentiment
                await window.supabase
                    .from('feedback')
                    .update({
                        sentiment: analysis.sentiment,
                        sentiment_score: analysis.score,
                        sentiment_confidence: analysis.confidence
                    })
                    .eq('id', feedbackId);
                
                return analysis;
            }
        }
        
        return null;
    }
    
    async analyzeBatch(feedbackIds) {
        // Analyze multiple feedback items
        const results = await Promise.all(
            feedbackIds.map(id => this.analyzeFeedback(id))
        );
        
        return results.filter(r => r !== null);
    }
    
    getSentimentSummary(feedbackList) {
        // Get overall sentiment summary
        const sentiments = feedbackList.map(f => f.sentiment || 'neutral');
        const positive = sentiments.filter(s => s === 'positive').length;
        const negative = sentiments.filter(s => s === 'negative').length;
        const neutral = sentiments.filter(s => s === 'neutral').length;
        const total = sentiments.length;
        
        return {
            positive: (positive / total) * 100,
            negative: (negative / total) * 100,
            neutral: (neutral / total) * 100,
            overall: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
            total
        };
    }
    
    detectEmotions(text) {
        // Detect specific emotions
        const emotions = {
            happy: ['happy', 'joy', 'excited', 'delighted', 'pleased'],
            sad: ['sad', 'disappointed', 'unhappy', 'depressed'],
            angry: ['angry', 'furious', 'mad', 'annoyed', 'frustrated'],
            surprised: ['surprised', 'shocked', 'amazed', 'astonished']
        };
        
        const detected = [];
        const lowerText = text.toLowerCase();
        
        Object.keys(emotions).forEach(emotion => {
            if (emotions[emotion].some(word => lowerText.includes(word))) {
                detected.push(emotion);
            }
        });
        
        return detected;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.sentimentAnalysisFeedback = new SentimentAnalysisFeedback(); });
} else {
    window.sentimentAnalysisFeedback = new SentimentAnalysisFeedback();
}

