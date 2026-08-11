/**
 * Conflict Resolution for Concurrent Edits
 * 
 * Implements comprehensive conflict resolution for concurrent edits.
 * 
 * @module ConflictResolutionSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ConflictResolutionSystem {
    constructor() {
        this.conflicts = new Map();
        this.resolutionStrategies = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize conflict resolution system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('ConflictResolutionSystem already initialized');
            return;
        }

        this.setupDefaultStrategies();
        
        this.isInitialized = true;
        this.trackEvent('conflict_resolution_initialized');
    }

    /**
     * Set up default resolution strategies
     * @private
     */
    setupDefaultStrategies() {
        // Last write wins
        this.registerStrategy('last-write-wins', (conflict) => {
            const sorted = conflict.edits.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            return sorted[0];
        });

        // First write wins
        this.registerStrategy('first-write-wins', (conflict) => {
            const sorted = conflict.edits.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            return sorted[0];
        });

        // Merge
        this.registerStrategy('merge', (conflict) => {
            const merged = { ...conflict.base };
            conflict.edits.forEach(edit => {
                Object.assign(merged, edit.data);
            });
            return { data: merged, timestamp: new Date().toISOString() };
        });

        // User choice
        this.registerStrategy('user-choice', async (conflict) => {
            return this.promptUserChoice(conflict);
        });
    }

    /**
     * Register resolution strategy
     * @public
     * @param {string} name - Strategy name
     * @param {Function} strategy - Strategy function
     */
    registerStrategy(name, strategy) {
        this.resolutionStrategies.set(name, strategy);
    }

    /**
     * Detect conflict
     * @public
     * @param {string} entityId - Entity ID
     * @param {Object} newEdit - New edit
     * @param {Object} existingEdits - Existing edits
     * @returns {Object|null} Conflict object or null
     */
    detectConflict(entityId, newEdit, existingEdits) {
        const conflictingEdits = existingEdits.filter(edit => {
            // Check if edits overlap (same fields modified)
            return this.editsOverlap(newEdit, edit);
        });

        if (conflictingEdits.length === 0) {
            return null;
        }

        return {
            entityId,
            base: this.getBaseVersion(entityId),
            edits: [newEdit, ...conflictingEdits],
            detectedAt: new Date().toISOString()
        };
    }

    /**
     * Check if edits overlap
     * @private
     * @param {Object} edit1 - First edit
     * @param {Object} edit2 - Second edit
     * @returns {boolean} True if overlapping
     */
    editsOverlap(edit1, edit2) {
        const fields1 = Object.keys(edit1.data || {});
        const fields2 = Object.keys(edit2.data || {});
        return fields1.some(field => fields2.includes(field));
    }

    /**
     * Resolve conflict
     * @public
     * @param {Object} conflict - Conflict object
     * @param {string} strategy - Resolution strategy
     * @returns {Promise<Object>} Resolved edit
     */
    async resolveConflict(conflict, strategy = 'last-write-wins') {
        const strategyFn = this.resolutionStrategies.get(strategy);
        if (!strategyFn) {
            throw new Error(`Unknown strategy: ${strategy}`);
        }

        const resolved = await strategyFn(conflict);
        
        // Store conflict resolution
        this.conflicts.set(conflict.entityId, {
            conflict,
            resolution: resolved,
            strategy,
            resolvedAt: new Date().toISOString()
        });

        return resolved;
    }

    /**
     * Prompt user choice
     * @private
     * @param {Object} conflict - Conflict object
     * @returns {Promise<Object>} User-selected edit
     */
    async promptUserChoice(conflict) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'conflict-resolution-modal';
            modal.innerHTML = `
                <div class="conflict-modal-content">
                    <h3>Conflict Detected</h3>
                    <p>Multiple edits were made to the same content. Please choose which version to keep:</p>
                    <div class="conflict-options">
                        ${conflict.edits.map((edit, index) => `
                            <div class="conflict-option">
                                <h4>Version ${index + 1}</h4>
                                <pre>${JSON.stringify(edit.data, null, 2)}</pre>
                                <button class="choose-version" data-index="${index}">Choose This</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="merge-option">Merge All</button>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelectorAll('.choose-version').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    resolve(conflict.edits[index]);
                    modal.remove();
                });
            });

            modal.querySelector('.merge-option').addEventListener('click', () => {
                const merged = this.resolutionStrategies.get('merge')(conflict);
                resolve(merged);
                modal.remove();
            });
        });
    }

    /**
     * Get base version
     * @private
     * @param {string} entityId - Entity ID
     * @returns {Object} Base version
     */
    getBaseVersion(entityId) {
        // This would typically fetch from server
        try {
            return JSON.parse(localStorage.getItem(`entity-${entityId}`) || '{}');
        } catch {
            return {};
        }
    }

    /**
     * Get conflict history
     * @public
     * @param {string} entityId - Entity ID
     * @returns {Array} Conflict history
     */
    getConflictHistory(entityId) {
        const conflict = this.conflicts.get(entityId);
        return conflict ? [conflict] : [];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`conflict_resolution_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.ConflictResolutionSystem = ConflictResolutionSystem;
window.conflictResolution = new ConflictResolutionSystem();
window.conflictResolution.init();

