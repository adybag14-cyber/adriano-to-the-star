/**
 * Performance Score Tracking
 * Tracks performance scores over time
 */

class PerformanceScoreTracking {
    constructor() {
        this.scores = [];
        this.init();
    }
    
    init() {
        this.calculateScore();
    }
    
    calculateScore() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const score = this.computePerformanceScore();
                this.scores.push({
                    score,
                    timestamp: Date.now()
                });
                
                this.saveScore(score);
            }, 3000);
        });
    }
    
    computePerformanceScore() {
        // Calculate performance score (0-100)
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return 0;
        
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;
        
        // Score based on load time (simplified)
        let score = 100;
        if (loadTime > 5000) score -= 30;
        else if (loadTime > 3000) score -= 20;
        else if (loadTime > 2000) score -= 10;
        
        return Math.max(0, score);
    }
    
    saveScore(score) {
        try {
            const scores = JSON.parse(localStorage.getItem('perf_scores') || '[]');
            scores.push({ score, timestamp: Date.now() });
            localStorage.setItem('perf_scores', JSON.stringify(scores.slice(-30))); // Keep last 30
        } catch (e) {
            console.warn('Could not save score:', e);
        }
    }
    
    getAverageScore() {
        if (this.scores.length === 0) return 0;
        return this.scores.reduce((sum, s) => sum + s.score, 0) / this.scores.length;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.performanceScoreTracking = new PerformanceScoreTracking(); });
} else {
    window.performanceScoreTracking = new PerformanceScoreTracking();
}

