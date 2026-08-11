/**
 * AI Planet Habitability Analysis UI
 * User interface for habitability analysis features
 */

class AIHabitabilityUI {
    constructor() {
        this.habitabilitySystem = null;
        this.container = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (window.aiHabitabilityAnalysis) {
            this.habitabilitySystem = window.aiHabitabilityAnalysis;
        }

        this.isInitialized = true;
        this.trackEvent('habitability_ui_initialized');
    }

    /**
     * Show habitability analysis for a planet
     */
    async showAnalysis(planetData, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.habitabilitySystem) return;

        container.innerHTML = '<div class="loading">Analyzing habitability...</div>';

        try {
            const analysis = await this.habitabilitySystem.analyzeHabitability(planetData);
            this.displayAnalysis(analysis, container);
            this.trackEvent('analysis_displayed', { score: analysis.habitabilityScore });
        } catch (error) {
            container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }

    displayAnalysis(analysis, container) {
        if (!container) return;

        container.innerHTML = `
            <div class="habitability-analysis-card">
                <h4>Habitability Analysis</h4>
                <div class="habitability-score">
                    <span class="score-label">Habitability Score:</span>
                    <span class="score-value">${analysis.habitabilityScore || 0}/100</span>
                </div>
                <div class="habitability-factors">
                    <h5>Key Factors:</h5>
                    <ul>
                        ${analysis.factors?.map(factor => `<li>${this.escapeHtml(factor)}</li>`).join('') || '<li>No factors available</li>'}
                    </ul>
                </div>
                <div class="habitability-summary">
                    <p>${this.escapeHtml(analysis.summary || 'No summary available')}</p>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`habitability_ui_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_habitability_ui', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.aiHabitabilityUI) {
            window.aiHabitabilityUI = new AIHabitabilityUI();
        }
    });
}


