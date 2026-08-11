/**
 * Data Conflict Resolution UI
 * Resolve data conflicts
 */
(function() {
    'use strict';

    class DataConflictResolutionUI {
        constructor() {
            this.conflicts = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_conflict_resolution_initialized');
        }

        setupUI() {
            if (!document.getElementById('conflict-resolver')) {
                const resolver = document.createElement('div');
                resolver.id = 'conflict-resolver';
                resolver.className = 'conflict-resolver';
                resolver.innerHTML = `
                    <div class="resolver-header">
                        <h2>Conflict Resolution</h2>
                    </div>
                    <div class="conflicts-list" id="conflicts-list"></div>
                `;
                document.body.appendChild(resolver);
            }
        }

        addConflict(conflict) {
            this.conflicts.push({
                id: this.generateId(),
                ...conflict,
                status: 'pending'
            });
            this.renderConflicts();
        }

        resolveConflict(conflictId, resolution) {
            const conflict = this.conflicts.find(c => c.id === conflictId);
            if (conflict) {
                conflict.status = 'resolved';
                conflict.resolution = resolution;
                this.renderConflicts();
            }
        }

        renderConflicts() {
            const list = document.getElementById('conflicts-list');
            if (!list) return;
            list.innerHTML = this.conflicts.filter(c => c.status === 'pending').map(conflict => `
                <div class="conflict-item" data-conflict-id="${conflict.id}">
                    <div class="conflict-field">${conflict.field}</div>
                    <div class="conflict-values">
                        <div class="value-local">Local: ${conflict.localValue}</div>
                        <div class="value-remote">Remote: ${conflict.remoteValue}</div>
                    </div>
                    <div class="conflict-actions">
                        <button class="use-local" data-conflict-id="${conflict.id}">Use Local</button>
                        <button class="use-remote" data-conflict-id="${conflict.id}">Use Remote</button>
                        <button class="merge" data-conflict-id="${conflict.id}">Merge</button>
                    </div>
                </div>
            `).join('');
        }

        generateId() {
            return 'conflict_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_conflict_resolution_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.conflictResolver = new DataConflictResolutionUI();
        });
    } else {
        window.conflictResolver = new DataConflictResolutionUI();
    }
})();

