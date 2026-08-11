/**
 * Query Performance Analysis
 * Analyzes query performance and provides insights
 */

class QueryPerformanceAnalysis {
    constructor() {
        this.queryStats = new Map();
        this.init();
    }
    
    init() {
        this.startAnalysis();
    }
    
    startAnalysis() {
        // Analyze query performance
        setInterval(() => {
            this.analyzeQueries();
        }, 300000); // Every 5 minutes
    }
    
    analyzeQueries() {
        // Analyze query statistics
        const analysis = {
            totalQueries: 0,
            avgDuration: 0,
            slowQueries: [],
            recommendations: []
        };
        
        this.queryStats.forEach((stats, query) => {
            analysis.totalQueries += stats.count;
            analysis.avgDuration += stats.totalDuration;
            
            if (stats.avgDuration > 500) {
                analysis.slowQueries.push({
                    query,
                    avgDuration: stats.avgDuration,
                    count: stats.count
                });
            }
        });
        
        if (analysis.totalQueries > 0) {
            analysis.avgDuration = analysis.avgDuration / analysis.totalQueries;
        }
        
        // Generate recommendations
        if (analysis.slowQueries.length > 0) {
            analysis.recommendations.push('Consider adding indexes for slow queries');
            analysis.recommendations.push('Review query patterns for optimization opportunities');
        }
        
        return analysis;
    }
    
    recordQuery(query, duration) {
        if (!this.queryStats.has(query)) {
            this.queryStats.set(query, {
                count: 0,
                totalDuration: 0,
                avgDuration: 0
            });
        }
        
        const stats = this.queryStats.get(query);
        stats.count++;
        stats.totalDuration += duration;
        stats.avgDuration = stats.totalDuration / stats.count;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.queryPerformanceAnalysis = new QueryPerformanceAnalysis(); });
} else {
    window.queryPerformanceAnalysis = new QueryPerformanceAnalysis();
}

