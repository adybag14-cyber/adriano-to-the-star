/**
 * Entity Extraction and Linking
 * Extract and link entities
 */
(function () {
    'use strict';

    class EntityExtractionLinking {
        constructor() {
            this.entities = new Map();
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('entity-extraction')) {
                const extraction = document.createElement('div');
                extraction.id = 'entity-extraction';
                extraction.className = 'entity-extraction';
                extraction.innerHTML = `<h2>Entity Extraction</h2>`;
                document.body.appendChild(extraction);
            }
        }

        extractEntities(text) {
            const entities = [];

            // Extract person names (simplified)
            const personPattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
            let match;
            while ((match = personPattern.exec(text)) !== null) {
                entities.push({
                    type: 'PERSON',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[1].length
                });
            }

            // Extract organizations
            const orgPattern = /\b([A-Z][a-z]+ (?:Inc|LLC|Corp|Ltd))\b/g;
            while ((match = orgPattern.exec(text)) !== null) {
                entities.push({
                    type: 'ORG',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[1].length
                });
            }

            // Extract locations
            // eslint-disable-next-line security/detect-unsafe-regex
            const locationPattern = /\b([A-Z][a-z]+(?:, [A-Z][a-z]+)?)\b/g;
            while ((match = locationPattern.exec(text)) !== null) {
                entities.push({
                    type: 'LOCATION',
                    text: match[1],
                    start: match.index,
                    end: match.index + match[1].length
                });
            }

            return entities;
        }

        linkEntities(entities) {
            entities.forEach(entity => {
                const existing = this.findExistingEntity(entity);
                if (existing) {
                    entity.linkedId = existing.id;
                } else {
                    const newEntity = {
                        id: this.generateId(),
                        type: entity.type,
                        name: entity.text,
                        mentions: [entity]
                    };
                    this.entities.set(newEntity.id, newEntity);
                    entity.linkedId = newEntity.id;
                }
            });
        }

        findExistingEntity(entity) {
            for (const [id, existing] of this.entities) {
                if (existing.type === entity.type &&
                    this.similarity(existing.name, entity.text) > 0.8) {
                    return existing;
                }
            }
            return null;
        }

        similarity(str1, str2) {
            const longer = str1.length > str2.length ? str1 : str2;
            const shorter = str1.length > str2.length ? str2 : str1;
            if (longer.length === 0) return 1.0;
            return (longer.length - this.editDistance(longer, shorter)) / longer.length;
        }

        editDistance(str1, str2) {
            const matrix = [];
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[str2.length][str1.length];
        }

        generateId() {
            return 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.entityExtraction = new EntityExtractionLinking();
        });
    } else {
        window.entityExtraction = new EntityExtractionLinking();
    }
})();

