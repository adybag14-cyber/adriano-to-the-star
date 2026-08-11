/**
 * Feature Store for ML Features
 * Store and manage ML features
 */
(function () {
    'use strict';

    class FeatureStoreML {
        constructor() {
            this.features = new Map();
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('feature-store')) {
                const store = document.createElement('div');
                store.id = 'feature-store';
                store.className = 'feature-store';
                store.innerHTML = `<h2>Feature Store</h2>`;
                document.body.appendChild(store);
            }
        }

        createFeature(name, definition) {
            const feature = {
                id: this.generateId(),
                name: name,
                definition: definition,
                type: definition.type || 'numeric',
                createdAt: new Date().toISOString()
            };
            this.features.set(name, feature);
            return feature;
        }

        getFeature(name) {
            return this.features.get(name);
        }

        computeFeature(name, data) {
            const feature = this.features.get(name);
            if (!feature) return null;

            if (!window.authManager?.isAdmin()) {
                console.warn('Security Block: Non-admin attempted to compute dynamic feature.');
                return null;
            }

            const fn = new Function('data', feature.definition.compute);
            return fn(data);
        }

        getFeatureVector(entityId, featureNames) {
            const vector = {};
            featureNames.forEach(name => {
                const data = this.getEntityData(entityId);
                vector[name] = this.computeFeature(name, data);
            });
            return vector;
        }

        getEntityData(entityId) {
            // Get data for entity
            if (window.database?.get) {
                return window.database.get(entityId);
            }
            return {};
        }

        generateId() {
            return 'feature_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.featureStore = new FeatureStoreML();
        });
    } else {
        window.featureStore = new FeatureStoreML();
    }
})();

