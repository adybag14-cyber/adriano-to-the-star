/**
 * Keyboard Shortcuts System with Customizable Bindings
 * Provides keyboard shortcuts with user customization support
 */
(function() {
    'use strict';

    class KeyboardShortcutsSystem {
        constructor() {
            this.shortcuts = new Map();
            this.customBindings = this.loadCustomBindings();
            this.activeContext = 'global';
            this.contexts = new Map();
            this.init();
        }

        init() {
            this.registerDefaultShortcuts();
            this.setupEventListeners();
            this.setupUI();
        }

        setupEventListeners() {
            document.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });

            // Track context changes
            document.addEventListener('focusin', (e) => {
                const context = this.getContextForElement(e.target);
                if (context) {
                    this.setActiveContext(context);
                }
            });
        }

        setupUI() {
            // Create shortcuts help modal
            if (!document.getElementById('shortcuts-help-modal')) {
                const modal = document.createElement('div');
                modal.id = 'shortcuts-help-modal';
                modal.className = 'shortcuts-help-modal';
                modal.style.display = 'none';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Keyboard Shortcuts</h2>
                            <button class="close-btn" id="shortcuts-close">×</button>
                        </div>
                        <div class="shortcuts-list" id="shortcuts-list"></div>
                        <div class="modal-footer">
                            <button id="customize-shortcuts">Customize Shortcuts</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                // Show modal on ? key
                document.addEventListener('keydown', (e) => {
                    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        const activeElement = document.activeElement;
                        if (activeElement.tagName !== 'INPUT' && 
                            activeElement.tagName !== 'TEXTAREA' &&
                            !activeElement.isContentEditable) {
                            e.preventDefault();
                            this.showHelpModal();
                        }
                    }
                });

                document.getElementById('shortcuts-close')?.addEventListener('click', () => {
                    this.hideHelpModal();
                });

                document.getElementById('customize-shortcuts')?.addEventListener('click', () => {
                    this.showCustomizeModal();
                });
            }
        }

        registerDefaultShortcuts() {
            // Navigation
            this.register('navigate.home', {
                keys: ['g', 'h'],
                description: 'Go to Home',
                action: () => window.location.href = '/',
                context: 'global'
            });

            this.register('navigate.search', {
                keys: ['/'],
                description: 'Focus Search',
                action: () => {
                    const searchInput = document.querySelector('input[type="search"], #search-input');
                    searchInput?.focus();
                },
                context: 'global'
            });

            // Actions
            this.register('action.new', {
                keys: ['n'],
                description: 'Create New Item',
                action: () => {
                    const newBtn = document.querySelector('[data-action="new"], .new-item-btn');
                    newBtn?.click();
                },
                context: 'global'
            });

            this.register('action.save', {
                keys: ['s'],
                ctrl: true,
                description: 'Save',
                action: () => {
                    const saveBtn = document.querySelector('[data-action="save"], .save-btn');
                    saveBtn?.click();
                },
                context: 'editing'
            });

            this.register('action.delete', {
                keys: ['Delete', 'Backspace'],
                description: 'Delete Selected',
                action: () => {
                    const deleteBtn = document.querySelector('[data-action="delete"], .delete-btn');
                    deleteBtn?.click();
                },
                context: 'global'
            });

            // UI
            this.register('ui.toggleSidebar', {
                keys: ['b'],
                description: 'Toggle Sidebar',
                action: () => {
                    const sidebar = document.querySelector('.sidebar');
                    sidebar?.classList.toggle('hidden');
                },
                context: 'global'
            });

            this.register('ui.toggleDarkMode', {
                keys: ['d'],
                description: 'Toggle Dark Mode',
                action: () => {
                    if (window.themeToggle) {
                        window.themeToggle.toggle();
                    }
                },
                context: 'global'
            });

            // Editing
            this.register('edit.undo', {
                keys: ['z'],
                ctrl: true,
                description: 'Undo',
                action: () => document.execCommand('undo'),
                context: 'editing'
            });

            this.register('edit.redo', {
                keys: ['z'],
                ctrl: true,
                shift: true,
                description: 'Redo',
                action: () => document.execCommand('redo'),
                context: 'editing'
            });

            // Help
            this.register('help.show', {
                keys: ['?'],
                description: 'Show Keyboard Shortcuts',
                action: () => this.showHelpModal(),
                context: 'global'
            });
        }

        register(id, config) {
            const shortcut = {
                id,
                keys: config.keys,
                ctrl: config.ctrl || false,
                shift: config.shift || false,
                alt: config.alt || false,
                meta: config.meta || false,
                action: config.action,
                description: config.description,
                context: config.context || 'global'
            };

            // Apply custom binding if exists
            if (this.customBindings[id]) {
                Object.assign(shortcut, this.customBindings[id]);
            }

            this.shortcuts.set(id, shortcut);

            // Add to context
            if (!this.contexts.has(shortcut.context)) {
                this.contexts.set(shortcut.context, []);
            }
            this.contexts.get(shortcut.context).push(id);
        }

        handleKeyDown(e) {
            // Ignore if typing in input/textarea
            const activeElement = document.activeElement;
            if (activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable) {
                // Allow some shortcuts even in inputs
                if (!this.isInputShortcut(e)) {
                    return;
                }
            }

            // Check all shortcuts
            for (const [id, shortcut] of this.shortcuts) {
                if (this.matchesShortcut(e, shortcut)) {
                    e.preventDefault();
                    e.stopPropagation();
                    shortcut.action();
                    return;
                }
            }
        }

        matchesShortcut(e, shortcut) {
            // Check context
            if (shortcut.context !== 'global' && shortcut.context !== this.activeContext) {
                return false;
            }

            // Check modifiers
            if (shortcut.ctrl && !(e.ctrlKey || e.metaKey)) return false;
            if (shortcut.shift && !e.shiftKey) return false;
            if (shortcut.alt && !e.altKey) return false;
            if (shortcut.meta && !e.metaKey) return false;

            // Check if modifiers are required but not present
            if (shortcut.ctrl && !(e.ctrlKey || e.metaKey)) return false;
            if (shortcut.shift && !e.shiftKey) return false;
            if (shortcut.alt && !e.altKey) return false;

            // Check key
            const key = e.key;
            return shortcut.keys.some(k => k.toLowerCase() === key.toLowerCase());
        }

        isInputShortcut(e) {
            // Allow Ctrl+S, Ctrl+Z, etc. in inputs
            return (e.ctrlKey || e.metaKey) && ['s', 'z', 'y', 'a', 'c', 'v', 'x'].includes(e.key.toLowerCase());
        }

        getContextForElement(element) {
            // Determine context based on element
            if (element.closest('.editor, [contenteditable="true"]')) {
                return 'editing';
            }
            if (element.closest('.modal, .dialog')) {
                return 'modal';
            }
            return 'global';
        }

        setActiveContext(context) {
            this.activeContext = context;
        }

        showHelpModal() {
            const modal = document.getElementById('shortcuts-help-modal');
            const list = document.getElementById('shortcuts-list');
            if (!modal || !list) return;

            // Group by context
            const grouped = {};
            for (const [id, shortcut] of this.shortcuts) {
                if (!grouped[shortcut.context]) {
                    grouped[shortcut.context] = [];
                }
                grouped[shortcut.context].push(shortcut);
            }

            list.innerHTML = Object.entries(grouped).map(([context, shortcuts]) => `
                <div class="shortcuts-group">
                    <h3>${this.formatContext(context)}</h3>
                    ${shortcuts.map(s => `
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                ${this.formatKeys(s)}
                            </div>
                            <div class="shortcut-description">${s.description}</div>
                        </div>
                    `).join('')}
                </div>
            `).join('');

            modal.style.display = 'flex';
        }

        hideHelpModal() {
            const modal = document.getElementById('shortcuts-help-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        formatKeys(shortcut) {
            const parts = [];
            if (shortcut.ctrl || shortcut.meta) parts.push('Ctrl');
            if (shortcut.shift) parts.push('Shift');
            if (shortcut.alt) parts.push('Alt');
            parts.push(...shortcut.keys.map(k => k.charAt(0).toUpperCase() + k.slice(1)));
            return parts.join(' + ');
        }

        formatContext(context) {
            return context.charAt(0).toUpperCase() + context.slice(1);
        }

        showCustomizeModal() {
            const modal = document.createElement('div');
            modal.className = 'customize-shortcuts-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Customize Keyboard Shortcuts</h2>
                        <button class="close-btn">×</button>
                    </div>
                    <div class="customize-list" id="customize-list"></div>
                    <div class="modal-footer">
                        <button id="save-custom-shortcuts">Save</button>
                        <button id="reset-shortcuts">Reset to Default</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const list = document.getElementById('customize-list');
            list.innerHTML = Array.from(this.shortcuts.values()).map(shortcut => `
                <div class="customize-item">
                    <div class="customize-info">
                        <div class="customize-description">${shortcut.description}</div>
                        <div class="customize-id">${shortcut.id}</div>
                    </div>
                    <div class="customize-keys">
                        <input type="text" class="key-input" data-id="${shortcut.id}" 
                               value="${this.formatKeys(shortcut)}" readonly />
                        <button class="record-keys" data-id="${shortcut.id}">Record</button>
                    </div>
                </div>
            `).join('');

            // Record keys
            modal.querySelectorAll('.record-keys').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.startRecording(btn.dataset.id, btn);
                });
            });

            // Save
            document.getElementById('save-custom-shortcuts')?.addEventListener('click', () => {
                this.saveCustomBindings();
                modal.remove();
            });

            // Reset
            document.getElementById('reset-shortcuts')?.addEventListener('click', () => {
                if (confirm('Reset all shortcuts to default?')) {
                    this.resetCustomBindings();
                    modal.remove();
                }
            });

            // Close
            modal.querySelector('.close-btn')?.addEventListener('click', () => {
                modal.remove();
            });
        }

        startRecording(shortcutId, button) {
            button.textContent = 'Recording...';
            button.disabled = true;

            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const keys = {
                    key: e.key,
                    ctrl: e.ctrlKey || e.metaKey,
                    shift: e.shiftKey,
                    alt: e.altKey
                };

                const input = document.querySelector(`.key-input[data-id="${shortcutId}"]`);
                if (input) {
                    const parts = [];
                    if (keys.ctrl) parts.push('Ctrl');
                    if (keys.shift) parts.push('Shift');
                    if (keys.alt) parts.push('Alt');
                    parts.push(keys.key);
                    input.value = parts.join(' + ');
                }

                document.removeEventListener('keydown', handler);
                button.textContent = 'Record';
                button.disabled = false;

                // Save to custom bindings
                if (!this.customBindings[shortcutId]) {
                    this.customBindings[shortcutId] = {};
                }
                this.customBindings[shortcutId] = keys;
            };

            document.addEventListener('keydown', handler, { once: true });
        }

        saveCustomBindings() {
            localStorage.setItem('keyboardShortcuts', JSON.stringify(this.customBindings));
            // Reload shortcuts with new bindings
            location.reload();
        }

        loadCustomBindings() {
            const stored = localStorage.getItem('keyboardShortcuts');
            return stored ? JSON.parse(stored) : {};
        }

        resetCustomBindings() {
            localStorage.removeItem('keyboardShortcuts');
            this.customBindings = {};
            location.reload();
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.keyboardShortcuts = new KeyboardShortcutsSystem();
        });
    } else {
        window.keyboardShortcuts = new KeyboardShortcutsSystem();
    }
})();


