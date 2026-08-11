/**
 * Keyboard Shortcuts Panel
 * 
 * Displays all available keyboard shortcuts in a searchable, organized panel.
 * Supports filtering, categories, and keyboard shortcut detection.
 * 
 * @class KeyboardShortcutsPanel
 * @example
 * // Auto-initializes on page load
 * // Access via: window.keyboardShortcutsPanel()
 * 
 * // Show shortcuts panel
 * const panel = window.keyboardShortcutsPanel();
 * panel.show();
 * 
 * // Add custom shortcut
 * panel.addShortcut({
 *   key: 'Ctrl+K',
 *   description: 'Open command palette',
 *   category: 'Navigation',
 *   action: () => console.log('Command palette!')
 * });
 */
class KeyboardShortcutsPanel {
    constructor() {
        this.shortcuts = [];
        this.panel = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        // Load default shortcuts
        this.loadDefaultShortcuts();
        
        // Setup keyboard shortcut to show panel (Ctrl+?)
        this.setupToggleShortcut();
        
        console.log('✅ Keyboard Shortcuts Panel initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("k_ey_bo_ar_ds_ho_rt_cu_ts_pa_ne_l_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Load default keyboard shortcuts
     * 
     * @method loadDefaultShortcuts
     * @returns {void}
     */
    loadDefaultShortcuts() {
        this.shortcuts = [
            {
                key: 'Ctrl+Shift+A',
                description: 'Toggle Quick Actions Toolbar',
                category: 'Navigation',
                action: () => {
                    if (window.quickActionsToolbar) {
                        window.quickActionsToolbar().toggle();
                    }
                }
            },
            {
                key: 'H',
                description: 'Go to Home',
                category: 'Navigation',
                action: () => window.location.href = '/index.html'
            },
            {
                key: 'D',
                description: 'Go to Database',
                category: 'Navigation',
                action: () => window.location.href = '/database.html'
            },
            {
                key: 'S',
                description: 'Focus Search',
                category: 'Navigation',
                action: () => {
                    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
                    if (searchInput) searchInput.focus();
                }
            },
            {
                key: 'T',
                description: 'Toggle Theme',
                category: 'Settings',
                action: () => {
                    if (window.themeToggle) {
                        window.themeToggle().toggle();
                    }
                }
            },
            {
                key: 'M',
                description: 'Open Music Player',
                category: 'Media',
                action: () => {
                    if (window.cosmicMusicPlayer) {
                        const player = window.cosmicMusicPlayer();
                        if (player) {
                            const playerEl = document.getElementById('cosmic-music-player');
                            if (playerEl) {
                                playerEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            }
                        }
                    }
                }
            },
            {
                key: 'E',
                description: 'Export User Data',
                category: 'Data',
                action: () => {
                    if (window.userDataExportImport) {
                        window.userDataExportImport().exportUserData();
                    }
                }
            },
            {
                key: 'Shift+S',
                description: 'Share Page',
                category: 'Social',
                action: () => {
                    if (window.socialSharing) {
                        window.socialSharing().showShareWidget({
                            title: document.title,
                            text: 'Check out this amazing space exploration site!',
                            url: window.location.href
                        });
                    }
                }
            },
            {
                key: 'Ctrl+Shift+N',
                description: 'Clear All Notifications',
                category: 'Notifications',
                action: () => {
                    if (window.enhancedNotifications) {
                        window.enhancedNotifications().removeAll();
                    }
                }
            },
            {
                key: 'Ctrl+?',
                description: 'Show Keyboard Shortcuts',
                category: 'Help',
                action: () => this.show()
            },
            {
                key: 'Esc',
                description: 'Close Modals/Panels',
                category: 'Navigation',
                action: () => {
                    // Close any open modals
                    const modals = document.querySelectorAll('.modal, .share-widget, .settings-modal');
                    modals.forEach(modal => {
                        if (modal.style.display !== 'none') {
                            modal.remove();
                        }
                    });
                }
            }
        ];
    }

    /**
     * Setup keyboard shortcut to toggle panel
     * 
     * @method setupToggleShortcut
     * @returns {void}
     * @private
     */
    setupToggleShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+? or Ctrl+Shift+/
            if ((e.ctrlKey || e.metaKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Show shortcuts panel
     * 
     * @method show
     * @returns {void}
     */
    show() {
        if (this.isVisible) return;

        this.createPanel();
        document.body.appendChild(this.panel);
        this.isVisible = true;
        this.injectStyles();

        // Animate in
        requestAnimationFrame(() => {
            this.panel.style.opacity = '1';
            this.panel.style.transform = 'scale(1)';
        });

        // Focus search input
        const searchInput = this.panel.querySelector('.shortcuts-search');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }

    /**
     * Hide shortcuts panel
     * 
     * @method hide
     * @returns {void}
     */
    hide() {
        if (!this.isVisible || !this.panel) return;

        this.panel.style.opacity = '0';
        this.panel.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (this.panel && this.panel.parentNode) {
                this.panel.remove();
            }
            this.isVisible = false;
        }, 300);
    }

    /**
     * Toggle panel visibility
     * 
     * @method toggle
     * @returns {void}
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Create shortcuts panel
     * 
     * @method createPanel
     * @returns {void}
     * @private
     */
    createPanel() {
        // Group shortcuts by category
        const categories = {};
        this.shortcuts.forEach(shortcut => {
            if (!categories[shortcut.category]) {
                categories[shortcut.category] = [];
            }
            categories[shortcut.category].push(shortcut);
        });

        // Build HTML
        let categoriesHtml = '';
        Object.keys(categories).sort().forEach(category => {
            categoriesHtml += `
                <div class="shortcuts-category">
                    <h3 class="category-title">${this.escapeHtml(category)}</h3>
                    <div class="shortcuts-list">
                        ${categories[category].map(shortcut => `
                            <div class="shortcut-item" data-key="${this.escapeHtml(shortcut.key)}">
                                <div class="shortcut-key">
                                    ${this.formatKeyDisplay(shortcut.key)}
                                </div>
                                <div class="shortcut-description">
                                    ${this.escapeHtml(shortcut.description)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        this.panel = document.createElement('div');
        this.panel.className = 'keyboard-shortcuts-panel';
        this.panel.innerHTML = `
            <div class="shortcuts-panel-content">
                <div class="shortcuts-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button class="shortcuts-close" onclick="window.keyboardShortcutsPanel().hide()">×</button>
                </div>
                <div class="shortcuts-search-container">
                    <input type="text" class="shortcuts-search" placeholder="Search shortcuts..." />
                </div>
                <div class="shortcuts-categories">
                    ${categoriesHtml}
                </div>
                <div class="shortcuts-footer">
                    <p>Press <kbd>Ctrl+?</kbd> to toggle this panel</p>
                </div>
            </div>
        `;

        // Setup search
        const searchInput = this.panel.querySelector('.shortcuts-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterShortcuts(e.target.value);
            });
        }

        // Setup click handlers for shortcuts
        this.panel.querySelectorAll('.shortcut-item').forEach(item => {
            item.addEventListener('click', () => {
                const key = item.dataset.key;
                const shortcut = this.shortcuts.find(s => s.key === key);
                if (shortcut && shortcut.action) {
                    shortcut.action();
                    this.hide();
                }
            });
        });
    }

    /**
     * Filter shortcuts by search query
     * 
     * @method filterShortcuts
     * @param {string} query - Search query
     * @returns {void}
     * @private
     */
    filterShortcuts(query) {
        const lowerQuery = query.toLowerCase();
        const items = this.panel.querySelectorAll('.shortcut-item');
        
        items.forEach(item => {
            const key = item.dataset.key.toLowerCase();
            const description = item.querySelector('.shortcut-description').textContent.toLowerCase();
            const matches = key.includes(lowerQuery) || description.includes(lowerQuery);
            
            item.style.display = matches ? 'flex' : 'none';
        });

        // Hide empty categories
        const categories = this.panel.querySelectorAll('.shortcuts-category');
        categories.forEach(category => {
            const visibleItems = category.querySelectorAll('.shortcut-item[style*="flex"], .shortcut-item:not([style*="none"])');
            category.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
    }

    /**
     * Format key display with proper styling
     * 
     * @method formatKeyDisplay
     * @param {string} key - Keyboard shortcut string
     * @returns {string} Formatted HTML
     * @private
     */
    formatKeyDisplay(key) {
        const parts = key.split('+').map(part => part.trim());
        return parts.map(part => `<kbd>${this.escapeHtml(part)}</kbd>`).join(' + ');
    }

    /**
     * Add custom keyboard shortcut
     * 
     * @method addShortcut
     * @param {Object} shortcut - Shortcut configuration
     * @param {string} shortcut.key - Keyboard combination (e.g., 'Ctrl+S')
     * @param {string} shortcut.description - Description of what the shortcut does
     * @param {string} shortcut.category - Category name
     * @param {Function} shortcut.action - Function to execute
     * @returns {void}
     */
    addShortcut(shortcut) {
        this.shortcuts.push(shortcut);
        
        // Recreate panel if visible
        if (this.isVisible) {
            this.hide();
            this.show();
        }
    }

    /**
     * Remove keyboard shortcut
     * 
     * @method removeShortcut
     * @param {string} key - Keyboard combination to remove
     * @returns {void}
     */
    removeShortcut(key) {
        this.shortcuts = this.shortcuts.filter(s => s.key !== key);
        
        // Recreate panel if visible
        if (this.isVisible) {
            this.hide();
            this.show();
        }
    }

    /**
     * Escape HTML
     * 
     * @method escapeHtml
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     * 
     * @method injectStyles
     * @returns {void}
     * @private
     */
    injectStyles() {
        if (document.getElementById('keyboard-shortcuts-panel-styles')) return;

        const style = document.createElement('style');
        style.id = 'keyboard-shortcuts-panel-styles';
        style.textContent = `
            .keyboard-shortcuts-panel {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10006;
                opacity: 0;
                transform: scale(0.9);
                transition: all 0.3s ease;
            }

            .shortcuts-panel-content {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 16px;
                padding: 2rem;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                font-family: 'Raleway', sans-serif;
                color: white;
            }

            .shortcuts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(186, 148, 79, 0.3);
            }

            .shortcuts-header h2 {
                color: #ba944f;
                margin: 0;
                font-size: 1.5rem;
            }

            .shortcuts-close {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s;
            }

            .shortcuts-close:hover {
                color: #ba944f;
            }

            .shortcuts-search-container {
                margin-bottom: 1.5rem;
            }

            .shortcuts-search {
                width: 100%;
                padding: 0.75rem 1rem;
                background: rgba(186, 148, 79, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 8px;
                color: white;
                font-family: 'Raleway', sans-serif;
                font-size: 1rem;
            }

            .shortcuts-search:focus {
                outline: none;
                border-color: rgba(186, 148, 79, 0.6);
                background: rgba(186, 148, 79, 0.15);
            }

            .shortcuts-categories {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .shortcuts-category {
                background: rgba(186, 148, 79, 0.05);
                border-radius: 8px;
                padding: 1rem;
            }

            .category-title {
                color: #ba944f;
                font-size: 1.1rem;
                margin: 0 0 0.75rem 0;
            }

            .shortcuts-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                background: rgba(186, 148, 79, 0.1);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .shortcut-item:hover {
                background: rgba(186, 148, 79, 0.2);
                transform: translateX(5px);
            }

            .shortcut-key {
                display: flex;
                gap: 0.25rem;
                align-items: center;
            }

            .shortcut-key kbd {
                background: rgba(186, 148, 79, 0.3);
                border: 1px solid rgba(186, 148, 79, 0.5);
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-family: 'Courier New', monospace;
                font-size: 0.85rem;
                color: #ba944f;
                font-weight: 600;
            }

            .shortcut-description {
                color: rgba(255, 255, 255, 0.8);
            }

            .shortcuts-footer {
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(186, 148, 79, 0.3);
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.9rem;
            }

            .shortcuts-footer kbd {
                background: rgba(186, 148, 79, 0.2);
                border: 1px solid rgba(186, 148, 79, 0.4);
                border-radius: 4px;
                padding: 0.2rem 0.4rem;
                font-family: 'Courier New', monospace;
                font-size: 0.85rem;
            }

            @media (max-width: 768px) {
                .shortcuts-panel-content {
                    width: 95%;
                    padding: 1.5rem;
                }

                .shortcut-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let keyboardShortcutsPanelInstance = null;

function initKeyboardShortcutsPanel() {
    if (!keyboardShortcutsPanelInstance) {
        keyboardShortcutsPanelInstance = new KeyboardShortcutsPanel();
    }
    return keyboardShortcutsPanelInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeyboardShortcutsPanel);
} else {
    initKeyboardShortcutsPanel();
}

// Export globally
window.KeyboardShortcutsPanel = KeyboardShortcutsPanel;
window.keyboardShortcutsPanel = () => keyboardShortcutsPanelInstance;


