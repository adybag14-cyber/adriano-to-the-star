/**
 * Competitive Analysis Tools
 * Tools for analyzing competitors and market positioning
 */

class CompetitiveAnalysisTools {
    constructor() {
        this.competitors = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('competitive_tools_initialized');
    }

    addCompetitor(competitorId, name, details) {
        this.competitors.set(competitorId, {
            id: competitorId,
            name,
            ...details,
            addedAt: new Date()
        });
        console.log(`Competitor added: ${competitorId}`);
    }

    createAnalysis(analysisId, competitorIds, focusAreas) {
        this.analyses.set(analysisId, {
            id: analysisId,
            competitorIds,
            focusAreas,
            findings: [],
            createdAt: new Date()
        });
        console.log(`Analysis created: ${analysisId}`);
    }

    addFinding(analysisId, finding) {
        const analysis = this.analyses.get(analysisId);
        if (!analysis) {
            throw new Error('Analysis does not exist');
        }
        analysis.findings.push({
            ...finding,
            addedAt: new Date()
        });
        console.log(`Finding added to analysis: ${analysisId}`);
    }

    compareFeatures(competitorIds, features) {
        const comparison = {};
        for (const competitorId of competitorIds) {
            const competitor = this.competitors.get(competitorId);
            if (competitor) {
                comparison[competitorId] = {
                    name: competitor.name,
                    features: features.map(feature => ({
                        feature,
                        supported: competitor.features?.includes(feature) || false
                    }))
                };
            }
        }
        return comparison;
    }

    getCompetitor(competitorId) {
        return this.competitors.get(competitorId);
    }

    getAllCompetitors() {
        return Array.from(this.competitors.values());
    }

    getAnalysis(analysisId) {
        return this.analyses.get(analysisId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`competitive_tools_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.competitiveAnalysisTools = new CompetitiveAnalysisTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompetitiveAnalysisTools;
}

