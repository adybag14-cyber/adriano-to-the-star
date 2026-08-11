/**
 * Auto-save Functionality with Version History
 * Automatically saves changes and maintains version history
 */
(function() {
    'use strict';

    class AutoSaveSystem {
        constructor() {
            this.saveInterval = 30000; // 30 seconds
            this.maxVersions = 50;
            this.versions = new Map();
            this.saveTimers = new Map();
            this.dirtyFlags = new Map();
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.loadVersions();
            this.trackEvent('autosave_initialized');
        }

        setupEventListeners() {
            // Track changes in editable elements
            document.addEventListener('input', (e) => {
                if (this.isEditableElement(e.target)) {
                    this.markDirty(e.target);
                }
            }, true);

            // Track changes in contenteditable
            document.addEventListener('input', (e) => {
                if (e.target.isContentEditable) {
                    this.markDirty(e.target);
                }
            }, true);

            // Save before unload
            window.addEventListener('beforeunload', () => {
                this.saveAllDirty();
            });

            // Save on visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.saveAllDirty();
                }
            });
        }

        isEditableElement(element) {
            return element.tagName === 'INPUT' ||
                   element.tagName === 'TEXTAREA' ||
                   element.isContentEditable;
        }

        markDirty(element) {
            const id = this.getElementId(element);
            if (!id) return;

            this.dirtyFlags.set(id, true);
            this.scheduleSave(id, element);
        }

        getElementId(element) {
            return element.id || 
                   element.dataset.saveId || 
                   element.closest('[data-save-id]')?.dataset.saveId;
        }

        scheduleSave(id, element) {
            // Clear existing timer
            if (this.saveTimers.has(id)) {
                clearTimeout(this.saveTimers.get(id));
            }

            // Schedule new save
            const timer = setTimeout(() => {
                this.saveElement(id, element);
            }, this.saveInterval);

            this.saveTimers.set(id, timer);
        }

        async saveElement(id, element) {
            if (!this.dirtyFlags.get(id)) return;

            try {
                const data = this.extractElementData(element);
                const version = await this.createVersion(id, data);

                this.dirtyFlags.set(id, false);
                this.saveTimers.delete(id);

                // Dispatch event
                window.dispatchEvent(new CustomEvent('autoSaveComplete', {
                    detail: { id, version }
                }));

                this.showSaveIndicator(element);
            } catch (error) {
                console.error('Auto-save failed:', error);
                this.showSaveError(element);
            }
        }

        extractElementData(element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                return {
                    value: element.value,
                    type: element.type
                };
            } else if (element.isContentEditable) {
                return {
                    html: element.innerHTML,
                    text: element.textContent
                };
            } else {
                // Try to extract from form
                const form = element.closest('form');
                if (form) {
                    const formData = new FormData(form);
                    const data = {};
                    for (const [key, value] of formData.entries()) {
                        data[key] = value;
                    }
                    return data;
                }
            }

            return { content: element.textContent };
        }

        async createVersion(id, data) {
            const version = {
                id: this.generateVersionId(),
                elementId: id,
                data: data,
                timestamp: new Date().toISOString(),
                user: this.getCurrentUser()
            };

            // Get or create version history for this element
            if (!this.versions.has(id)) {
                this.versions.set(id, []);
            }

            const history = this.versions.get(id);
            history.unshift(version);

            // Limit versions
            if (history.length > this.maxVersions) {
                history.splice(this.maxVersions);
            }

            // Save to storage
            await this.saveVersionToStorage(id, version);

            return version;
        }

        generateVersionId() {
            return 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        getCurrentUser() {
            if (window.supabase?.auth?.user) {
                const user = window.supabase.auth.user();
                return user ? user.id : 'anonymous';
            }
            return 'anonymous';
        }

        async saveVersionToStorage(id, version) {
            // Save to localStorage
            const key = `autosave_${id}`;
            const history = this.versions.get(id) || [];
            localStorage.setItem(key, JSON.stringify(history));

            // Also save to server if available
            if (window.database?.saveVersion) {
                try {
                    await window.database.saveVersion(id, version);
                } catch (error) {
                    console.warn('Failed to save version to server:', error);
                }
            }
        }

        getVersionHistory(id) {
            return this.versions.get(id) || [];
        }

        async restoreVersion(id, versionId) {
            const history = this.versions.get(id);
            if (!history) {
                throw new Error('No version history found');
            }

            const version = history.find(v => v.id === versionId);
            if (!version) {
                throw new Error('Version not found');
            }

            const element = document.getElementById(id) || 
                          document.querySelector(`[data-save-id="${id}"]`);
            if (!element) {
                throw new Error('Element not found');
            }

            // Restore data
            this.restoreElementData(element, version.data);

            // Create new version from restored state
            await this.createVersion(id, version.data);

            // Dispatch event
            window.dispatchEvent(new CustomEvent('versionRestored', {
                detail: { id, versionId }
            }));
        }

        restoreElementData(element, data) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = data.value || '';
            } else if (element.isContentEditable) {
                element.innerHTML = data.html || data.text || '';
            } else {
                // Try to restore form data
                const form = element.closest('form');
                if (form && data) {
                    Object.keys(data).forEach(key => {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input) {
                            input.value = data[key];
                        }
                    });
                }
            }
        }

        showVersionHistory(id) {
            const history = this.getVersionHistory(id);
            if (history.length === 0) {
                alert('No version history available');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'version-history-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Version History</h3>
                        <button class="close-btn">×</button>
                    </div>
                    <div class="version-list" id="version-list"></div>
                </div>
            `;
            document.body.appendChild(modal);

            const list = document.getElementById('version-list');
            list.innerHTML = history.map(version => `
                <div class="version-item" data-version-id="${version.id}">
                    <div class="version-info">
                        <div class="version-time">${this.formatTime(version.timestamp)}</div>
                        <div class="version-user">${version.user}</div>
                    </div>
                    <div class="version-actions">
                        <button class="restore-btn" data-version-id="${version.id}">Restore</button>
                        <button class="preview-btn" data-version-id="${version.id}">Preview</button>
                    </div>
                </div>
            `).join('');

            list.querySelectorAll('.restore-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Restore this version? Current changes will be saved first.')) {
                        await this.saveElement(id, document.getElementById(id));
                        await this.restoreVersion(id, btn.dataset.versionId);
                        modal.remove();
                    }
                });
            });

            list.querySelectorAll('.preview-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.previewVersion(id, btn.dataset.versionId);
                });
            });

            modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.remove();
            });
        }

        previewVersion(id, versionId) {
            const history = this.versions.get(id);
            const version = history?.find(v => v.id === versionId);
            if (!version) return;

            const preview = document.createElement('div');
            preview.className = 'version-preview';
            preview.innerHTML = `
                <div class="preview-content">
                    <h4>Preview: ${this.formatTime(version.timestamp)}</h4>
                    <pre>${JSON.stringify(version.data, null, 2)}</pre>
                </div>
            `;
            document.body.appendChild(preview);

            setTimeout(() => preview.remove(), 5000);
        }

        formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString();
        }

        saveAllDirty() {
            this.dirtyFlags.forEach((dirty, id) => {
                if (dirty) {
                    const element = document.getElementById(id) || 
                                  document.querySelector(`[data-save-id="${id}"]`);
                    if (element) {
                        this.saveElement(id, element);
                    }
                }
            });
        }

        showSaveIndicator(element) {
            const indicator = document.createElement('div');
            indicator.className = 'save-indicator';
            indicator.textContent = 'Saved';
            element.parentElement?.appendChild(indicator);

            setTimeout(() => {
                indicator.classList.add('show');
            }, 10);

            setTimeout(() => {
                indicator.classList.remove('show');
                setTimeout(() => indicator.remove(), 300);
            }, 2000);
        }

        showSaveError(element) {
            const indicator = document.createElement('div');
            indicator.className = 'save-indicator error';
            indicator.textContent = 'Save failed';
            element.parentElement?.appendChild(indicator);

            setTimeout(() => {
                indicator.classList.add('show');
            }, 10);

            setTimeout(() => {
                indicator.classList.remove('show');
                setTimeout(() => indicator.remove(), 300);
            }, 3000);
        }

        loadVersions() {
            // Load version histories from localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('autosave_')) {
                    const id = key.replace('autosave_', '');
                    try {
                        const history = JSON.parse(localStorage.getItem(key));
                        this.versions.set(id, history);
                    } catch (error) {
                        console.error('Failed to load versions:', error);
                    }
                }
            });
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`autosave_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.autoSave = new AutoSaveSystem();
        });
    } else {
        window.autoSave = new AutoSaveSystem();
    }
})();


