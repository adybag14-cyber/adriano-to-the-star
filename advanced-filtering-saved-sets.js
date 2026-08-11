/**
 * Advanced Filtering with Saved Filter Sets
 * Save and reuse filter configurations
 */
(function() {
    'use strict';

    class AdvancedFilteringSavedSets {
        constructor() {
            this.savedSets = [];
            this.init();
        }

        init() {
            this.loadSavedSets();
            this.setupUI();
            this.trackEvent('saved_sets_initialized');
        }

        setupUI() {
            if (!document.getElementById('filter-sets-panel')) {
                const panel = document.createElement('div');
                panel.id = 'filter-sets-panel';
                panel.className = 'filter-sets-panel';
                panel.innerHTML = `
                    <div class="panel-header">
                        <h3>Saved Filter Sets</h3>
                        <button class="save-set-btn" id="save-filter-set-btn">Save Current</button>
                    </div>
                    <div class="sets-list" id="sets-list"></div>
                `;
                document.body.appendChild(panel);
            }
        }

        saveFilterSet(name, filters) {
            const set = {
                id: this.generateId(),
                name: name,
                filters: filters,
                createdAt: new Date().toISOString()
            };
            this.savedSets.push(set);
            this.saveSets();
            this.trackEvent('filter_set_saved', { setId: set.id, name });
            return set;
        }

        loadFilterSet(id) {
            const set = this.savedSets.find(s => s.id === id);
            this.trackEvent('filter_set_loaded', { id, found: !!set });
            return set ? set.filters : null;
        }

        generateId() {
            return 'set_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveSets() {
            localStorage.setItem('savedFilterSets', JSON.stringify(this.savedSets));
        }

        loadSavedSets() {
            const stored = localStorage.getItem('savedFilterSets');
            if (stored) {
                try {
                    this.savedSets = JSON.parse(stored);
                } catch (error) {
                    console.error('Failed to load sets:', error);
                    this.savedSets = [];
                }
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`saved_sets_${eventName}`, 1, data);
                }
                if (window.analytics) {
                    window.analytics.track(eventName, { module: 'advanced_filtering_saved_sets', ...data });
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.filterSets = new AdvancedFilteringSavedSets();
        });
    } else {
        window.filterSets = new AdvancedFilteringSavedSets();
    }
})();


