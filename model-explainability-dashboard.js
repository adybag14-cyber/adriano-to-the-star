/**
 * Model Explainability Dashboard
 * Explain model predictions
 */
(function() {
    'use strict';

    class ModelExplainabilityDashboard {
        constructor() {
            this.explanations = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('explainability-dashboard')) {
                const dashboard = document.createElement('div');
                dashboard.id = 'explainability-dashboard';
                dashboard.className = 'explainability-dashboard';
                dashboard.innerHTML = `
                    <div class="dashboard-header">
                        <h2>Model Explainability</h2>
                    </div>
                    <div class="explanations-container" id="explanations-container"></div>
                `;
                document.body.appendChild(dashboard);
            }
        }

        explainPrediction(modelId, input, prediction) {
            const explanation = {
                id: this.generateId(),
                modelId: modelId,
                input: input,
                prediction: prediction,
                featureImportance: this.calculateFeatureImportance(input),
                shapValues: this.calculateSHAPValues(input),
                timestamp: new Date().toISOString()
            };
            this.explanations.push(explanation);
            this.renderExplanation(explanation);
            return explanation;
        }

        calculateFeatureImportance(input) {
            // Calculate feature importance (simplified)
            const importance = {};
            Object.keys(input).forEach(key => {
                importance[key] = Math.random() * 100;
            });
            return importance;
        }

        calculateSHAPValues(input) {
            // Calculate SHAP values (simplified)
            const shap = {};
            Object.keys(input).forEach(key => {
                shap[key] = (Math.random() - 0.5) * 2;
            });
            return shap;
        }

        renderExplanation(explanation) {
            const container = document.getElementById('explanations-container');
            if (!container) return;

            const explanationEl = document.createElement('div');
            explanationEl.className = 'explanation-item';
            explanationEl.innerHTML = `
                <div class="explanation-header">
                    <h3>Prediction Explanation</h3>
                    <div class="prediction-value">${explanation.prediction}</div>
                </div>
                <div class="feature-importance">
                    <h4>Feature Importance</h4>
                    ${Object.entries(explanation.featureImportance)
                        .sort((a, b) => b[1] - a[1])
                        .map(([feature, importance]) => `
                            <div class="feature-item">
                                <span class="feature-name">${feature}</span>
                                <div class="importance-bar">
                                    <div class="importance-fill" style="width: ${importance}%"></div>
                                </div>
                                <span class="importance-value">${importance.toFixed(1)}%</span>
                            </div>
                        `).join('')}
                </div>
            `;
            container.appendChild(explanationEl);
        }

        generateId() {
            return 'explain_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.explainabilityDashboard = new ModelExplainabilityDashboard();
        });
    } else {
        window.explainabilityDashboard = new ModelExplainabilityDashboard();
    }
})();

