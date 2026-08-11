/**
 * Natural Language Generation System
 * Generate natural language text
 */
(function() {
    'use strict';

    class NaturalLanguageGeneration {
        constructor() {
            this.templates = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.loadTemplates();
        }

        setupUI() {
            if (!document.getElementById('nlg-system')) {
                const nlg = document.createElement('div');
                nlg.id = 'nlg-system';
                nlg.className = 'nlg-system';
                nlg.innerHTML = `
                    <div class="nlg-header">
                        <h2>Natural Language Generation</h2>
                        <button id="generate-text">Generate Text</button>
                    </div>
                    <div class="generated-text" id="generated-text"></div>
                `;
                document.body.appendChild(nlg);
            }

            document.getElementById('generate-text')?.addEventListener('click', () => {
                this.generate();
            });
        }

        loadTemplates() {
            this.templates = [
                'The {{metric}} has {{change}} by {{value}} compared to {{period}}.',
                'Based on the data, {{insight}}.',
                'Analysis shows that {{finding}} with a confidence of {{confidence}}%.'
            ];
        }

        generate(data) {
            const template = this.templates[Math.floor(Math.random() * this.templates.length)];
            const text = this.fillTemplate(template, data);
            
            const container = document.getElementById('generated-text');
            if (container) {
                container.textContent = text;
            }
            return text;
        }

        fillTemplate(template, data) {
            let text = template;
            Object.keys(data).forEach(key => {
                text = text.replace(`{{${key}}}`, data[key] || 'N/A');
            });
            return text;
        }

        generateReport(data) {
            const report = [];
            report.push(this.generate({ metric: 'sales', change: 'increased', value: '15%', period: 'last month' }));
            report.push(this.generate({ insight: 'customer satisfaction is improving', finding: 'positive trend', confidence: '85' }));
            return report.join(' ');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.nlg = new NaturalLanguageGeneration();
        });
    } else {
        window.nlg = new NaturalLanguageGeneration();
    }
})();

