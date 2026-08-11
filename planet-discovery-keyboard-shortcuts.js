/**
 * Planet Discovery Keyboard Shortcuts
 * Keyboard navigation and shortcuts for power users
 */

class PlanetDiscoveryKeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.init();
    }

    init() {
        this.registerDefaultShortcuts();
        this.setupListeners();
        this.loadUserShortcuts();
        console.log('⌨️ Keyboard shortcuts initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ke_yb_oa_rd_sh_or_tc_ut_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerDefaultShortcuts() {
        // Navigation shortcuts
        this.register('g h', () => this.navigateTo('/index.html'), 'Go to Home');
        this.register('g d', () => this.navigateTo('/database.html'), 'Go to Database');
        this.register('g g', () => this.navigateTo('/games.html'), 'Go to Games');
        this.register('g s', () => this.navigateTo('/shop.html'), 'Go to Shop');

        // Search shortcuts
        this.register('/', () => this.focusSearch(), 'Focus Search');
        this.register('esc', () => this.closeModals(), 'Close Modal/Dialog');

        // Theme shortcuts
        this.register('t', () => this.toggleTheme(), 'Toggle Theme');

        // Language shortcuts
        this.register('l e', () => this.setLanguage('en'), 'Switch to English');
        this.register('l p', () => this.setLanguage('pt'), 'Switch to Portuguese');

        // Music player shortcuts
        this.register('space', (e) => {
            e.preventDefault();
            this.toggleMusic();
        }, 'Play/Pause Music');

        // Help shortcut
        this.register('?', () => this.showHelp(), 'Show Help');
    }

    register(keys, handler, description) {
        const keySequence = keys.toLowerCase().split(' ').join('+');
        this.shortcuts.set(keySequence, { handler, description, keys });
    }

    setupListeners() {
        let keySequence = [];
        let sequenceTimeout = null;

        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;

            // Ignore if typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape' || e.key === '/') {
                    // Allow these keys even in inputs
                } else {
                    return;
                }
            }

            const key = e.key.toLowerCase();
            keySequence.push(key);

            // Clear sequence after 1 second of inactivity
            if (sequenceTimeout) {
                clearTimeout(sequenceTimeout);
            }
            sequenceTimeout = setTimeout(() => {
                keySequence = [];
            }, 1000);

            // Check for single key shortcuts
            if (keySequence.length === 1) {
                const singleKey = keySequence[0];
                const shortcut = this.shortcuts.get(singleKey);
                if (shortcut) {
                    e.preventDefault();
                    shortcut.handler(e);
                    keySequence = [];
                    return;
                }
            }

            // Check for multi-key sequences (like 'g' then 'h')
            if (keySequence.length >= 2) {
                const sequence = keySequence.join('+');
                const shortcut = this.shortcuts.get(sequence);
                if (shortcut) {
                    e.preventDefault();
                    shortcut.handler(e);
                    keySequence = [];
                    return;
                }
            }
        });
    }

    navigateTo(path) {
        window.location.href = path;
    }

    focusSearch() {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], #search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal, .dialog, [role="dialog"]');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        });
    }

    toggleTheme() {
        if (window.themeToggle && typeof window.themeToggle.toggle === 'function') {
            window.themeToggle.toggle();
        } else if (window.planetDiscoveryDarkModeEnhancements) {
            window.planetDiscoveryDarkModeEnhancements.toggleDarkMode();
        }
    }

    setLanguage(lang) {
        if (window.i18n && typeof window.i18n.setLanguage === 'function') {
            window.i18n.setLanguage(lang);
        }
    }

    toggleMusic() {
        const musicPlayer = document.getElementById('cosmic-music-player');
        if (musicPlayer) {
            const playButton = musicPlayer.querySelector('.play-btn, [data-action="play"]');
            if (playButton) {
                playButton.click();
            }
        }
    }

    showHelp() {
        this.renderHelpModal();
    }

    renderHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'keyboard-shortcuts-help';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const shortcutsList = Array.from(this.shortcuts.entries())
            .map(([keys, { description }]) => `
                <div style="display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                    <kbd style="background: rgba(186, 148, 79, 0.2); padding: 0.25rem 0.5rem; border-radius: 4px; color: #ba944f;">${keys}</kbd>
                    <span style="color: rgba(255, 255, 255, 0.9);">${description}</span>
                </div>
            `).join('');

        modal.innerHTML = `
            <div style="background: rgba(26, 26, 46, 0.95); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="color: #ba944f; margin: 0;">⌨️ Keyboard Shortcuts</h2>
                    <button id="close-help" style="background: transparent; border: none; color: #ba944f; font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                <div style="max-height: 60vh; overflow-y: auto;">
                    ${shortcutsList}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-help')?.addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    loadUserShortcuts() {
        try {
            const saved = localStorage.getItem('keyboard-shortcuts');
            if (saved) {
                const userShortcuts = JSON.parse(saved);
                userShortcuts.forEach(({ keys, handler }) => {
                    // Note: handler functions can't be serialized, so this is a placeholder
                    // In a real implementation, you'd need to map handler names to functions
                });
            }
        } catch (error) {
            console.error('Error loading user shortcuts:', error);
        }
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryKeyboardShortcuts = new PlanetDiscoveryKeyboardShortcuts();
}

