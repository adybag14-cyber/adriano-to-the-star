/**
 * Funnel Analysis and Conversion Tracking
 * Track conversion funnels
 */
(function() {
    'use strict';

    class FunnelAnalysisConversion {
        constructor() {
            this.funnels = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('funnel-analysis')) {
                const analysis = document.createElement('div');
                analysis.id = 'funnel-analysis';
                analysis.className = 'funnel-analysis';
                analysis.innerHTML = `<h2>Funnel Analysis</h2>`;
                document.body.appendChild(analysis);
            }
        }

        createFunnel(steps) {
            const funnel = {
                id: this.generateId(),
                steps: steps,
                events: []
            };
            this.funnels.push(funnel);
            return funnel;
        }

        trackEvent(funnelId, step, userId) {
            const funnel = this.funnels.find(f => f.id === funnelId);
            if (funnel) {
                funnel.events.push({
                    step: step,
                    userId: userId,
                    timestamp: new Date().toISOString()
                });
            }
        }

        analyzeFunnel(funnelId) {
            const funnel = this.funnels.find(f => f.id === funnelId);
            if (!funnel) return null;
            
            const analysis = {};
            funnel.steps.forEach((step, index) => {
                const stepEvents = funnel.events.filter(e => e.step === step);
                const prevStepEvents = index > 0 ? 
                    funnel.events.filter(e => e.step === funnel.steps[index - 1]) : 
                    stepEvents;
                
                analysis[step] = {
                    count: stepEvents.length,
                    conversionRate: prevStepEvents.length > 0 ? 
                        (stepEvents.length / prevStepEvents.length) * 100 : 100
                };
            });
            return analysis;
        }

        generateId() {
            return 'funnel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.funnelAnalysis = new FunnelAnalysisConversion();
        });
    } else {
        window.funnelAnalysis = new FunnelAnalysisConversion();
    }
})();

