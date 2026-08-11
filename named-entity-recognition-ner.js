/**
 * Named Entity Recognition (NER)
 * Recognize named entities
 */
(function() {
    'use strict';

    class NamedEntityRecognitionNER {
        constructor() {
            this.entities = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('ner-system')) {
                const ner = document.createElement('div');
                ner.id = 'ner-system';
                ner.className = 'ner-system';
                ner.innerHTML = `<h2>Named Entity Recognition</h2>`;
                document.body.appendChild(ner);
            }
        }

        recognize(text) {
            if (window.entityExtraction) {
                return window.entityExtraction.extractEntities(text);
            }

            // Fallback NER
            const entities = [];
            
            // Person names
            const personPattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
            let match;
            while ((match = personPattern.exec(text)) !== null) {
                entities.push({
                    type: 'PERSON',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[1].length,
                    confidence: 0.85
                });
            }

            // Organizations
            const orgPattern = /\b([A-Z][a-z]+ (?:Inc|LLC|Corp|Ltd|Company))\b/g;
            while ((match = orgPattern.exec(text)) !== null) {
                entities.push({
                    type: 'ORG',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[1].length,
                    confidence: 0.80
                });
            }

            // Locations
            const locationPattern = /\b([A-Z][a-z]+(?:, [A-Z]{2})?)\b/g;
            while ((match = locationPattern.exec(text)) !== null) {
                entities.push({
                    type: 'LOCATION',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[1].length,
                    confidence: 0.75
                });
            }

            // Dates
            const datePattern = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g;
            while ((match = datePattern.exec(text)) !== null) {
                entities.push({
                    type: 'DATE',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[1].length,
                    confidence: 0.90
                });
            }

            return entities;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ner = new NamedEntityRecognitionNER();
        });
    } else {
        window.ner = new NamedEntityRecognitionNER();
    }
})();

