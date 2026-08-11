/**
 * Code Splitting and Dynamic Imports
 * Implement code splitting for better performance
 */
(function() {
    'use strict';

    class CodeSplittingDynamicImports {
        constructor() {
            this.loadedModules = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('code_split_dyn_initialized');
        }

        setupUI() {
            if (!document.getElementById('code-splitting')) {
                const splitting = document.createElement('div');
                splitting.id = 'code-splitting';
                splitting.className = 'code-splitting';
                splitting.innerHTML = `<h2>Code Splitting</h2>`;
                document.body.appendChild(splitting);
            }
        }

        async loadModule(moduleName) {
            if (this.loadedModules.has(moduleName)) {
                return this.loadedModules.get(moduleName);
            }

            try {
                const module = await import(`./modules/${moduleName}.js`);
                this.loadedModules.set(moduleName, module);
                return module;
            } catch (error) {
                console.error(`Failed to load module ${moduleName}:`, error);
                return null;
            }
        }

        async loadRoute(route) {
            return await this.loadModule(`routes/${route}`);
        }

        async loadComponent(componentName) {
            return await this.loadModule(`components/${componentName}`);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`code_split_dyn_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.codeSplitting = new CodeSplittingDynamicImports();
        });
    } else {
        window.codeSplitting = new CodeSplittingDynamicImports();
    }
})();

