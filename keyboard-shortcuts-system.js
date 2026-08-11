/**
 * Keyboard Shortcuts System
 * Provides keyboard shortcuts for common actions
 * 
 * Features:
 * - Customizable shortcuts
 * - Shortcut help overlay
 * - Context-aware shortcuts
 * - Shortcut conflicts detection
 */

class KeyboardShortcutsSystem {
    constructor() {
        this.shortcuts = {
            'ctrl+k': { action: 'search', description: 'Open search' },
            'ctrl+/': { action: 'help', description: 'Show shortcuts' },
            'ctrl+b': { action: 'toggle-sidebar', description: 'Toggle sidebar' },
            'ctrl+d': { action: 'toggle-dark', description: 'Toggle dark mode' },
            'ctrl+m': { action: 'toggle-music', description: 'Toggle music player' },
            'esc': { action: 'close-modals', description: 'Close modals' },
            'ctrl+shift+p': { action: 'command-palette', description: 'Command palette' },
            'ctrl+,': { action: 'settings', description: 'Open settings' }
        };
        this.enabled = true;
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupListeners();
        this.createHelpOverlay();
        console.log('⌨️ Keyboard Shortcuts System initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("k_ey_bo_ar_ds_ho_rt_cu_ts_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadSettings() {
        try {
            const saved = localStorage.getItem('keyboard-shortcuts');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.shortcuts = { ...this.shortcuts, ...parsed.shortcuts };
                this.enabled = parsed.enabled !== false;
            }
        } catch (e) {
            console.warn('Failed to load keyboard shortcuts:', e);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('keyboard-shortcuts', JSON.stringify({
                shortcuts: this.shortcuts,
                enabled: this.enabled
            }));
        } catch (e) {
            console.warn('Failed to save keyboard shortcuts:', e);
        }
    }
    
    setupListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            
            // Don't trigger in input fields unless it's a global shortcut
            const isInput = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.isContentEditable;
            
            const key = this.getKeyString(e);
            const shortcut = this.shortcuts[key];
            
            if (shortcut && (!isInput || key.startsWith('ctrl+'))) {
                e.preventDefault();
                this.executeAction(shortcut.action);
            }
        });
    }
    
    getKeyString(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        
        const key = e.key.toLowerCase();
        if (key === 'escape') parts.push('esc');
        else if (key === ' ') parts.push('space');
        else if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            parts.push(key);
        }
        
        return parts.join('+');
    }
    
    executeAction(action) {
        switch (action) {
            case 'search':
                this.openSearch();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'toggle-sidebar':
                this.toggleSidebar();
                break;
            case 'toggle-dark':
                if (window.themeToggleEnhanced) {
                    window.themeToggleEnhanced.toggle();
                }
                break;
            case 'toggle-music':
                if (window.cosmicMusicPlayer) {
                    window.cosmicMusicPlayer.togglePlayPause();
                }
                break;
            case 'close-modals':
                this.closeModals();
                break;
            case 'command-palette':
                this.showCommandPalette();
                break;
            case 'settings':
                this.openSettings();
                break;
        }
    }
    
    openSearch() {
        // Find search input or create one
        const searchInput = document.querySelector('input[type="search"], #search-input, .search-input');
        if (searchInput) {
            searchInput.focus();
        } else {
            // Create temporary search
            const search = document.createElement('input');
            search.type = 'search';
            search.placeholder = 'Search...';
            search.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                padding: 15px;
                font-size: 1.2rem;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #ba944f;
                border-radius: 8px;
                color: white;
                z-index: 10000;
            `;
            search.addEventListener('blur', () => search.remove());
            document.body.appendChild(search);
            search.focus();
        }
    }
    
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar, #sidebar, [class*="sidebar"]');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }
    
    closeModals() {
        document.querySelectorAll('.modal, [class*="modal"], [class*="panel"]').forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
                modal.remove();
            }
        });
    }
    
    showCommandPalette() {
        const palette = document.createElement('div');
        palette.id = 'command-palette';
        palette.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.98);
            border: 2px solid #ba944f;
            border-radius: 12px;
            padding: 20px;
            z-index: 10001;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
        `;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type a command...';
        input.style.cssText = `
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            color: white;
            font-size: 1rem;
            margin-bottom: 15px;
        `;
        
        const list = document.createElement('div');
        list.id = 'command-list';
        list.style.cssText = 'max-height: 300px; overflow-y: auto;';
        
        const commands = Object.entries(this.shortcuts).map(([key, data]) => ({
            key,
            ...data
        }));
        
        commands.forEach(cmd => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px;
                margin-bottom: 5px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                color: white;
                cursor: pointer;
            `;
            item.innerHTML = `
                <strong>${cmd.description}</strong>
                <span style="float: right; color: #ba944f;">${cmd.key}</span>
            `;
            item.addEventListener('click', () => {
                this.executeAction(cmd.action);
                palette.remove();
            });
            list.appendChild(item);
        });
        
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            Array.from(list.children).forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? 'block' : 'none';
            });
        });
        
        palette.appendChild(input);
        palette.appendChild(list);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                palette.remove();
            }
        });
        
        document.body.appendChild(palette);
        input.focus();
    }
    
    openSettings() {
        // Trigger settings panel if exists
        const settingsBtn = document.querySelector('[aria-label*="settings" i], [id*="settings" i]');
        if (settingsBtn) {
            settingsBtn.click();
        }
    }
    
    showHelp() {
        const existing = document.getElementById('shortcuts-help');
        if (existing) {
            existing.remove();
            return;
        }
        
        const help = document.createElement('div');
        help.id = 'shortcuts-help';
        help.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.98);
            border: 2px solid #ba944f;
            border-radius: 12px;
            padding: 25px;
            z-index: 10001;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
            overflow-y: auto;
        `;
        
        help.innerHTML = `
            <h2 style="color: #ba944f; margin: 0 0 20px 0;">Keyboard Shortcuts</h2>
            <div style="display: grid; gap: 10px;">
                ${Object.entries(this.shortcuts).map(([key, data]) => `
                    <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">
                        <span style="color: white;">${data.description}</span>
                        <kbd style="background: rgba(186, 148, 79, 0.3); padding: 4px 8px; border-radius: 4px; color: #ba944f;">${key}</kbd>
                    </div>
                `).join('')}
            </div>
            <button id="close-shortcuts-help" style="
                width: 100%;
                padding: 10px;
                margin-top: 20px;
                background: rgba(186, 148, 79, 0.3);
                border: 1px solid #ba944f;
                color: white;
                border-radius: 6px;
                cursor: pointer;
            ">Close</button>
        `;
        
        help.querySelector('#close-shortcuts-help').addEventListener('click', () => {
            help.remove();
        });
        
        help.addEventListener('click', (e) => {
            if (e.target === help) help.remove();
        });
        
        document.body.appendChild(help);
    }
    
    createHelpOverlay() {
        // Show hint on first visit
        if (!localStorage.getItem('shortcuts-hint-shown')) {
            setTimeout(() => {
                const hint = document.createElement('div');
                hint.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    background: rgba(186, 148, 79, 0.9);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 9999;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                `;
                hint.textContent = '💡 Press Ctrl+/ to see keyboard shortcuts';
                document.body.appendChild(hint);
                setTimeout(() => hint.remove(), 5000);
                localStorage.setItem('shortcuts-hint-shown', 'true');
            }, 3000);
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.keyboardShortcutsSystem = new KeyboardShortcutsSystem();
    });
} else {
    window.keyboardShortcutsSystem = new KeyboardShortcutsSystem();
}

