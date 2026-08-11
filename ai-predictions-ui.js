/**
 * AI Planet Discovery Predictions UI
 * User interface for AI prediction features
 */

class AIPredictionsUI {
    constructor() {
        this.predictionsSystem = null;
        this.container = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        // Wait for predictions system
        if (window.aiPlanetDiscoveryPredictions) {
            this.predictionsSystem = window.aiPlanetDiscoveryPredictions;
        }

        this.isInitialized = true;
        this.trackEvent('predictions_ui_initialized');
    }

    /**
     * Render predictions UI
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.container = container;

        container.innerHTML = `
            <div class="ai-predictions-panel">
                <h3>AI Planet Discovery Predictions</h3>
                <div class="prediction-form">
                    <input type="text" id="star-name-input" placeholder="Enter star name or KEPID" class="input-field">
                    <button id="predict-btn" class="btn-predict">Get Prediction</button>
                </div>
                <div id="prediction-results" class="prediction-results"></div>
            </div>
        `;

        // Setup event listeners
        const predictBtn = document.getElementById('predict-btn');
        if (predictBtn) {
            predictBtn.addEventListener('click', () => this.runPrediction());
        }
    }

    async runPrediction() {
        const input = document.getElementById('star-name-input');
        const resultsDiv = document.getElementById('prediction-results');
        
        if (!input || !resultsDiv || !this.predictionsSystem) return;

        const starName = input.value.trim();
        if (!starName) {
            alert('Please enter a star name or KEPID');
            return;
        }

        resultsDiv.innerHTML = '<div class="loading">Analyzing star system...</div>';

        try {
            // Get star data (would need to fetch from database)
            const starData = {
                name: starName,
                type: 'G-type',
                mass: 1.0,
                temperature: 5778,
                age: 4.6,
                distance: 100
            };

            const prediction = await this.predictionsSystem.predictDiscoveries(starData);
            this.displayPrediction(prediction);
            this.trackEvent('prediction_displayed', { starName });
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`predictions_ui_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_predictions_ui', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }

    displayPrediction(prediction) {
        const resultsDiv = document.getElementById('prediction-results');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <div class="prediction-card">
                <h4>Prediction Results</h4>
                <div class="prediction-metric">
                    <span class="metric-label">Probability:</span>
                    <span class="metric-value">${prediction.probability}%</span>
                </div>
                <div class="prediction-metric">
                    <span class="metric-label">Likely Planet Types:</span>
                    <span class="metric-value">${prediction.likelyTypes?.join(', ') || 'Unknown'}</span>
                </div>
                <div class="prediction-metric">
                    <span class="metric-label">Estimated Planets:</span>
                    <span class="metric-value">${prediction.estimatedPlanets || 'Unknown'}</span>
                </div>
                <div class="prediction-metric">
                    <span class="metric-label">Habitability Zone:</span>
                    <span class="metric-value">${prediction.habitableZoneProbability || 0}%</span>
                </div>
                <div class="prediction-details">
                    <p>${prediction.reasoning || 'No additional details available'}</p>
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.aiPredictionsUI) {
            window.aiPredictionsUI = new AIPredictionsUI();
        }
    });
}


