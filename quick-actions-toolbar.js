/**
 * Quick Actions Toolbar
 * 
 * A floating toolbar that provides quick access to common actions and keyboard shortcuts.
 * The toolbar can be minimized, hidden, and customized with user-defined actions.
 * 
 * @class QuickActionsToolbar
 * @example
 * // The toolbar auto-initializes on page load
 * // Access via: window.quickActionsToolbar()
 * 
 * // Add custom action
 * const toolbar = window.quickActionsToolbar();
 * toolbar.addAction({
 *   id: 'custom',
 *   icon: '⭐',
 *   label: 'Custom Action',
 *   action: () => console.log('Custom action!'),
 *   shortcut: 'C'
 * });
 */
class QuickActionsToolbar {
    constructor() {
        this.isVisible = true;
        this.isMinimized = false;
        this.actions = [];
        this.toolbar = null;
        this.init();
    }

    init() {
        // Load saved state
        this.loadState();
        
        // Setup default actions
        this.setupDefaultActions();
        
        // Create toolbar
        this.createToolbar();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('✅ Quick Actions Toolbar initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("q_ui_ck_ac_ti_on_st_oo_lb_ar_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Load saved toolbar state from localStorage
     * 
     * Restores visibility and minimized state from previous session.
     * 
     * @method loadState
     * @returns {void}
     */
    loadState() {
        try {
            const saved = localStorage.getItem('quick-actions-state');
            if (saved) {
                const state = JSON.parse(saved);
                this.isVisible = state.isVisible !== false;
                this.isMinimized = state.isMinimized || false;
            }
        } catch (error) {
            console.warn('Failed to load toolbar state:', error);
        }
    }

    /**
     * Save current toolbar state to localStorage
     * 
     * Persists visibility and minimized state for next session.
     * 
     * @method saveState
     * @returns {void}
     */
    saveState() {
        try {
            localStorage.setItem('quick-actions-state', JSON.stringify({
                isVisible: this.isVisible,
                isMinimized: this.isMinimized
            }));
        } catch (error) {
            console.warn('Failed to save toolbar state:', error);
        }
    }

    /**
     * Setup default toolbar actions
     * 
     * Creates default action buttons for: Home, Database, Search, Share,
     * Export, Theme Toggle, Music Player, and Settings.
     * 
     * @method setupDefaultActions
     * @returns {void}
     */
    setupDefaultActions() {
        this.actions = [
            {
                id: 'home',
                icon: '🏠',
                label: 'Home',
                action: () => window.location.href = '/index.html',
                shortcut: 'H'
            },
            {
                id: 'database',
                icon: '🌌',
                label: 'Database',
                action: () => window.location.href = '/database.html',
                shortcut: 'D'
            },
            {
                id: 'search',
                icon: '🔍',
                label: 'Search',
                action: () => {
                    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
                    if (searchInput) {
                        searchInput.focus();
                    }
                },
                shortcut: 'S'
            },
            {
                id: 'share',
                icon: '🔗',
                label: 'Share',
                action: () => {
                    if (window.socialSharing && typeof window.socialSharing === 'function') {
                        window.socialSharing().showShareWidget({
                            title: document.title,
                            text: 'Check out this amazing space exploration site!',
                            url: window.location.href
                        });
                    }
                },
                shortcut: 'Shift+S'
            },
            {
                id: 'export',
                icon: '📥',
                label: 'Export Data',
                action: () => {
                    if (window.userDataExportImport && typeof window.userDataExportImport === 'function') {
                        window.userDataExportImport().exportUserData();
                    }
                },
                shortcut: 'E'
            },
            {
                id: 'theme',
                icon: '🌓',
                label: 'Toggle Theme',
                action: () => {
                    if (window.themeToggle && typeof window.themeToggle === 'function') {
                        const theme = window.themeToggle();
                        if (theme && theme.toggle) {
                            theme.toggle();
                        }
                    }
                },
                shortcut: 'T'
            },
            {
                id: 'music',
                icon: '🎵',
                label: 'Music Player',
                action: () => {
                    if (window.cosmicMusicPlayer && typeof window.cosmicMusicPlayer === 'function') {
                        const player = window.cosmicMusicPlayer();
                        if (player) {
                            const playerEl = document.getElementById('cosmic-music-player');
                            if (playerEl) {
                                playerEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            }
                        }
                    }
                },
                shortcut: 'M'
            },
            {
                id: 'settings',
                icon: '⚙️',
                label: 'Settings',
                action: () => {
                    this.showSettings();
                },
                shortcut: 'Ctrl+,'
            }
        ];
    }

    /**
     * Create and append toolbar DOM element
     * 
     * Builds the toolbar HTML structure and appends it to the document body.
     * 
     * @method createToolbar
     * @returns {void}
     */
    createToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'quick-actions-toolbar';
        this.toolbar.id = 'quick-actions-toolbar';
        
        if (this.isMinimized) {
            this.toolbar.classList.add('minimized');
        }

        this.updateToolbar();
        document.body.appendChild(this.toolbar);
        this.injectStyles();
    }

    /**
     * Update toolbar HTML and event listeners
     * 
     * Rebuilds the toolbar content based on current actions and state.
     * 
     * @method updateToolbar
     * @returns {void}
     */
    updateToolbar() {
        if (!this.toolbar) return;

        const actionsHtml = this.actions.map(action => `
            <button 
                class="quick-action-btn" 
                data-action-id="${action.id}"
                title="${action.label} (${action.shortcut})"
            >
                <span class="action-icon">${action.icon}</span>
                ${!this.isMinimized ? `<span class="action-label">${action.label}</span>` : ''}
            </button>
        `).join('');

        this.toolbar.innerHTML = `
            <div class="toolbar-header">
                <span class="toolbar-title">${!this.isMinimized ? 'Quick Actions' : ''}</span>
                <button class="toolbar-minimize" title="${this.isMinimized ? 'Expand' : 'Minimize'}">
                    ${this.isMinimized ? '⬆️' : '⬇️'}
                </button>
                <button class="toolbar-close" title="Hide Toolbar">×</button>
            </div>
            <div class="toolbar-actions">
                ${actionsHtml}
            </div>
        `;

        // Add event listeners
        this.toolbar.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const actionId = btn.dataset.actionId;
                const action = this.actions.find(a => a.id === actionId);
                if (action && action.action) {
                    action.action();
                }
            });
        });

        const minimizeBtn = this.toolbar.querySelector('.toolbar-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.toggleMinimize();
            });
        }

        const closeBtn = this.toolbar.querySelector('.toolbar-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }

    /**
     * Toggle minimize
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.toolbar.classList.toggle('minimized', this.isMinimized);
        this.updateToolbar();
        this.saveState();
    }

    /**
     * Show toolbar
     */
    show() {
        this.isVisible = true;
        if (this.toolbar) {
            this.toolbar.style.display = 'flex';
        }
        this.saveState();
    }

    /**
     * Hide toolbar
     */
    hide() {
        this.isVisible = false;
        if (this.toolbar) {
            this.toolbar.style.display = 'none';
        }
        this.saveState();
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Add a custom action to the toolbar
     * 
     * @method addAction
     * @param {Object} action - Action configuration object
     * @param {string} action.id - Unique action identifier
     * @param {string} action.icon - Emoji or icon for the action
     * @param {string} action.label - Display label for the action
     * @param {Function} action.action - Function to execute when action is clicked
     * @param {string} [action.shortcut] - Keyboard shortcut (e.g., 'H', 'Ctrl+S')
     * @returns {void}
     * @example
     * toolbar.addAction({
     *   id: 'custom',
     *   icon: '⭐',
     *   label: 'Custom',
     *   action: () => alert('Custom action!'),
     *   shortcut: 'C'
     * });
     */
    addAction(action) {
        this.actions.push(action);
        this.updateToolbar();
    }

    /**
     * Remove an action from the toolbar
     * 
     * @method removeAction
     * @param {string} actionId - ID of the action to remove
     * @returns {void}
     */
    removeAction(actionId) {
        this.actions = this.actions.filter(a => a.id !== actionId);
        this.updateToolbar();
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Toggle toolbar with Ctrl+Shift+A
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggle();
                return;
            }

            // Action shortcuts
            this.actions.forEach(action => {
                if (action.shortcut) {
                    const parts = action.shortcut.split('+').map(s => s.trim());
                    const key = parts[parts.length - 1].toLowerCase();
                    const needsCtrl = parts.includes('Ctrl') || parts.includes('Cmd');
                    const needsShift = parts.includes('Shift');
                    const needsAlt = parts.includes('Alt');

                    if (e.key.toLowerCase() === key &&
                        (needsCtrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)) &&
                        (needsShift ? e.shiftKey : !e.shiftKey) &&
                        (needsAlt ? e.altKey : !e.altKey)) {
                        e.preventDefault();
                        action.action();
                    }
                }
            });
        });
    }

    /**
     * Show settings
     */
    showSettings() {
        const modal = document.createElement('div');
        modal.className = 'quick-actions-settings-modal';
        modal.innerHTML = `
            <div class="settings-modal-content">
                <h3>Quick Actions Settings</h3>
                <div class="settings-section">
                    <label>
                        <input type="checkbox" ${this.isVisible ? 'checked' : ''} id="toolbar-visible">
                        Show Toolbar
                    </label>
                    <label>
                        <input type="checkbox" ${this.isMinimized ? 'checked' : ''} id="toolbar-minimized">
                        Minimized by Default
                    </label>
                </div>
                <div class="settings-actions">
                    <button class="settings-close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.injectStyles();

        // Event listeners
        modal.querySelector('#toolbar-visible').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.show();
            } else {
                this.hide();
            }
        });

        modal.querySelector('#toolbar-minimized').addEventListener('change', (e) => {
            this.isMinimized = e.target.checked;
            this.toolbar.classList.toggle('minimized', this.isMinimized);
            this.updateToolbar();
            this.saveState();
        });

        modal.querySelector('.settings-close-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('quick-actions-styles')) return;

        const style = document.createElement('style');
        style.id = 'quick-actions-styles';
        style.textContent = `
            .quick-actions-toolbar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 16px;
                padding: 1rem;
                z-index: 10000;
                font-family: 'Raleway', sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                transition: all 0.3s ease;
            }

            .quick-actions-toolbar.minimized {
                padding: 0.5rem;
            }

            .toolbar-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
            }

            .toolbar-title {
                color: #ba944f;
                font-weight: 600;
                font-size: 0.9rem;
            }

            .toolbar-minimize,
            .toolbar-close {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                padding: 0.25rem 0.5rem;
                font-size: 1rem;
                transition: color 0.2s;
            }

            .toolbar-minimize:hover,
            .toolbar-close:hover {
                color: #ba944f;
            }

            .toolbar-actions {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .quick-action-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: rgba(186, 148, 79, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.8);
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Raleway', sans-serif;
                font-size: 0.9rem;
            }

            .quick-action-btn:hover {
                background: rgba(186, 148, 79, 0.2);
                border-color: rgba(186, 148, 79, 0.5);
                color: #ba944f;
                transform: translateY(-2px);
            }

            .action-icon {
                font-size: 1.2rem;
            }

            .action-label {
                white-space: nowrap;
            }

            .quick-actions-toolbar.minimized .action-label {
                display: none;
            }

            .quick-actions-settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10005;
            }

            .settings-modal-content {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 16px;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                font-family: 'Raleway', sans-serif;
                color: white;
            }

            .settings-modal-content h3 {
                color: #ba944f;
                margin-top: 0;
            }

            .settings-section {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin: 1.5rem 0;
            }

            .settings-section label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
            }

            .settings-section input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }

            .settings-actions {
                display: flex;
                justify-content: flex-end;
            }

            .settings-close-btn {
                padding: 0.75rem 1.5rem;
                background: rgba(186, 148, 79, 0.2);
                border: 1px solid rgba(186, 148, 79, 0.5);
                border-radius: 8px;
                color: #ba944f;
                font-family: 'Raleway', sans-serif;
                cursor: pointer;
                transition: all 0.2s;
            }

            .settings-close-btn:hover {
                background: rgba(186, 148, 79, 0.3);
            }

            @media (max-width: 768px) {
                .quick-actions-toolbar {
                    left: 10px;
                    right: 10px;
                    transform: none;
                    width: auto;
                }

                .toolbar-actions {
                    justify-content: center;
                }

                .quick-action-btn {
                    flex: 1;
                    min-width: 60px;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let quickActionsToolbarInstance = null;

function initQuickActionsToolbar() {
    if (!quickActionsToolbarInstance) {
        quickActionsToolbarInstance = new QuickActionsToolbar();
    }
    return quickActionsToolbarInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickActionsToolbar);
} else {
    initQuickActionsToolbar();
}

// Export globally
window.QuickActionsToolbar = QuickActionsToolbar;
window.quickActionsToolbar = () => quickActionsToolbarInstance;

