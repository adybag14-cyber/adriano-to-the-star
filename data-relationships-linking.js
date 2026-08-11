/**
 * Data Relationships and Linking Between Records
 * Link related records together
 */
(function() {
    'use strict';

    class DataRelationshipsLinking {
        constructor() {
            this.relationships = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_relationships_initialized');
        }

        setupUI() {
            if (!document.getElementById('relationships-panel')) {
                const panel = document.createElement('div');
                panel.id = 'relationships-panel';
                panel.className = 'relationships-panel';
                panel.innerHTML = `
                    <div class="panel-header">
                        <h3>Data Relationships</h3>
                        <button class="create-link-btn" id="create-link-btn">Create Link</button>
                    </div>
                    <div class="relationships-list" id="relationships-list"></div>
                `;
                document.body.appendChild(panel);
            }
        }

        createRelationship(sourceId, targetId, type) {
            const relationship = {
                id: this.generateId(),
                sourceId: sourceId,
                targetId: targetId,
                type: type,
                createdAt: new Date().toISOString()
            };
            this.relationships.push(relationship);
            this.saveRelationships();
            return relationship;
        }

        getRelationships(recordId) {
            return this.relationships.filter(r => 
                r.sourceId === recordId || r.targetId === recordId
            );
        }

        generateId() {
            return 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveRelationships() {
            localStorage.setItem('dataRelationships', JSON.stringify(this.relationships));
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_relationships_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataRelationships = new DataRelationshipsLinking();
        });
    } else {
        window.dataRelationships = new DataRelationshipsLinking();
    }
})();


