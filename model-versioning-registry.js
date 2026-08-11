/**
 * Model Versioning and Registry
 * Version and registry ML models
 */
(function() {
    'use strict';

    class ModelVersioningRegistry {
        constructor() {
            this.models = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('model-registry')) {
                const registry = document.createElement('div');
                registry.id = 'model-registry';
                registry.className = 'model-registry';
                registry.innerHTML = `
                    <div class="registry-header">
                        <h2>Model Registry</h2>
                        <button id="register-model">Register Model</button>
                    </div>
                    <div class="models-list" id="models-list"></div>
                `;
                document.body.appendChild(registry);
            }
        }

        registerModel(model) {
            const version = this.getNextVersion(model.name);
            const registered = {
                id: this.generateId(),
                name: model.name,
                version: version,
                model: model,
                metadata: model.metadata || {},
                registeredAt: new Date().toISOString()
            };
            this.models.push(registered);
            this.renderModels();
            return registered;
        }

        getNextVersion(name) {
            const versions = this.models
                .filter(m => m.name === name)
                .map(m => m.version)
                .sort((a, b) => this.compareVersions(b, a));
            if (versions.length === 0) return '1.0.0';
            return this.incrementVersion(versions[0]);
        }

        compareVersions(v1, v2) {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            for (let i = 0; i < 3; i++) {
                if (parts1[i] > parts2[i]) return 1;
                if (parts1[i] < parts2[i]) return -1;
            }
            return 0;
        }

        incrementVersion(version) {
            const parts = version.split('.').map(Number);
            parts[2]++;
            if (parts[2] >= 100) {
                parts[2] = 0;
                parts[1]++;
            }
            if (parts[1] >= 100) {
                parts[1] = 0;
                parts[0]++;
            }
            return parts.join('.');
        }

        getModel(name, version) {
            return this.models.find(m => m.name === name && m.version === version);
        }

        getLatestModel(name) {
            const models = this.models.filter(m => m.name === name);
            if (models.length === 0) return null;
            return models.sort((a, b) => this.compareVersions(b.version, a.version))[0];
        }

        renderModels() {
            const list = document.getElementById('models-list');
            if (!list) return;

            list.innerHTML = this.models.map(model => `
                <div class="model-item">
                    <div class="model-name">${model.name}</div>
                    <div class="model-version">v${model.version}</div>
                    <div class="model-date">${new Date(model.registeredAt).toLocaleDateString()}</div>
                </div>
            `).join('');
        }

        generateId() {
            return 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.modelRegistry = new ModelVersioningRegistry();
        });
    } else {
        window.modelRegistry = new ModelVersioningRegistry();
    }
})();

