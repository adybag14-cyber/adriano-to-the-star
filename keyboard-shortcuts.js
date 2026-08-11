/**
 * Keyboard Shortcuts System
 * Comprehensive keyboard navigation and shortcuts for improved accessibility and UX
 * 
 * Features:
 * - Global keyboard shortcuts
 * - Context-aware shortcuts
 * - Shortcut help dialog
 * - Customizable shortcuts
 * - ARIA labels and announcements
 */

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.helpVisible = false;
        this.modifierKeys = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false
        };
        
        this.init();
    }
    
    init() {
        // Load saved shortcuts
        this.loadShortcuts();
        
        // Register default shortcuts
        this.registerDefaultShortcuts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Create help dialog
        this.createHelpDialog();
        
        console.log('⌨️ Keyboard Shortcuts initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("k_ey_bo_ar_ds_ho_rt_cu_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadShortcuts() {
        try {
            const saved = localStorage.getItem('keyboardShortcuts');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge saved shortcuts with defaults
                Object.entries(parsed).forEach(([key, value]) => {
                    this.shortcuts.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load keyboard shortcuts:', e);
        }
    }
    
    saveShortcuts() {
        try {
            const shortcutsObj = {};
            this.shortcuts.forEach((value, key) => {
                shortcutsObj[key] = value;
            });
            localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcutsObj));
        } catch (e) {
            console.warn('Failed to save keyboard shortcuts:', e);
        }
    }
    
    registerDefaultShortcuts() {
        // Navigation shortcuts
        this.register('g h', () => this.navigateTo('/'), {
            description: 'Go to Home',
            category: 'Navigation'
        });
        
        this.register('g d', () => this.navigateTo('/database.html'), {
            description: 'Go to Database',
            category: 'Navigation'
        });
        
        this.register('g a', () => this.navigateTo('/stellar-ai.html'), {
            description: 'Go to Stellar AI',
            category: 'Navigation'
        });
        
        // Search shortcuts
        this.register('/', (e) => {
            e.preventDefault();
            this.focusSearch();
        }, {
            description: 'Focus search',
            category: 'Search'
        });
        
        this.register('ctrl+k', (e) => {
            e.preventDefault();
            this.focusSearch();
        }, {
            description: 'Open search (Ctrl+K)',
            category: 'Search'
        });
        
        // Chat shortcuts
        this.register('ctrl+enter', (e) => {
            e.preventDefault();
            this.submitChat();
        }, {
            description: 'Send message (Ctrl+Enter)',
            category: 'Chat'
        });
        
        this.register('escape', () => {
            this.closeModals();
        }, {
            description: 'Close modals/dialogs',
            category: 'General'
        });
        
        // Help shortcut
        this.register('?', (e) => {
            e.preventDefault();
            this.toggleHelp();
        }, {
            description: 'Show keyboard shortcuts',
            category: 'General'
        });
        
        // Theme toggle
        this.register('t', () => {
            this.toggleTheme();
        }, {
            description: 'Toggle theme',
            category: 'UI'
        });
        
        // Animation controls
        this.register('a', () => {
            if (window.animationControls) {
                window.animationControls.setEnabled(!window.animationControls.settings.enabled);
            }
        }, {
            description: 'Toggle animations',
            category: 'UI'
        });
        
        // Scroll shortcuts
        this.register('j', () => {
            window.scrollBy({ top: 100, behavior: 'smooth' });
        }, {
            description: 'Scroll down',
            category: 'Navigation'
        });
        
        this.register('k', () => {
            window.scrollBy({ top: -100, behavior: 'smooth' });
        }, {
            description: 'Scroll up',
            category: 'Navigation'
        });
        
        this.register('g g', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, {
            description: 'Scroll to top',
            category: 'Navigation'
        });
        
        this.register('G', () => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, {
            description: 'Scroll to bottom',
            category: 'Navigation'
        });
    }
    
    register(key, handler, options = {}) {
        const shortcut = {
            key: this.normalizeKey(key),
            handler,
            description: options.description || '',
            category: options.category || 'General',
            preventDefault: options.preventDefault !== false
        };
        
        this.shortcuts.set(key, shortcut);
    }
    
    normalizeKey(key) {
        // Normalize key combinations
        return key.toLowerCase()
            .replace(/\s+/g, '')
            .replace('ctrl', 'control')
            .replace('cmd', 'meta')
            .replace('command', 'meta');
    }
    
    setupEventListeners() {
        // Track modifier keys
        document.addEventListener('keydown', (e) => {
            this.modifierKeys.ctrl = e.ctrlKey;
            this.modifierKeys.alt = e.altKey;
            this.modifierKeys.shift = e.shiftKey;
            this.modifierKeys.meta = e.metaKey;
        });
        
        document.addEventListener('keyup', (e) => {
            this.modifierKeys.ctrl = e.ctrlKey;
            this.modifierKeys.alt = e.altKey;
            this.modifierKeys.shift = e.shiftKey;
            this.modifierKeys.meta = e.metaKey;
        });
        
        // Handle key presses
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            
            // Don't trigger shortcuts when typing in inputs
            if (this.isTyping(e.target)) {
                // Allow some shortcuts even when typing
                const allowedInInput = ['escape', 'ctrl+enter'];
                const key = this.getKeyString(e);
                if (!allowedInInput.includes(key)) {
                    return;
                }
            }
            
            const key = this.getKeyString(e);
            const shortcut = this.findShortcut(key);
            
            if (shortcut) {
                if (shortcut.preventDefault) {
                    e.preventDefault();
                }
                shortcut.handler(e);
                this.announceShortcut(shortcut);
            }
        });
    }
    
    getKeyString(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        
        // Get the actual key
        let key = e.key.toLowerCase();
        
        // Handle special keys
        if (key === ' ') key = 'space';
        if (key === 'arrowdown') key = 'down';
        if (key === 'arrowup') key = 'up';
        if (key === 'arrowleft') key = 'left';
        if (key === 'arrowright') key = 'right';
        
        parts.push(key);
        
        return parts.join('+');
    }
    
    findShortcut(keyString) {
        // Try exact match first
        if (this.shortcuts.has(keyString)) {
            return this.shortcuts.get(keyString);
        }
        
        // Try normalized match
        const normalized = this.normalizeKey(keyString);
        if (this.shortcuts.has(normalized)) {
            return this.shortcuts.get(normalized);
        }
        
        return null;
    }
    
    isTyping(element) {
        if (!element || !element.tagName) return false;
        const tagName = element.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea';
        const isContentEditable = element.contentEditable === 'true';
        return isInput || isContentEditable;
    }
    
    navigateTo(url) {
        if (url.startsWith('/')) {
            window.location.href = url;
        } else {
            window.location.href = url;
        }
    }
    
    focusSearch() {
        // Try to find search input
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], #search-input, .search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        } else {
            this.announce('Search input not found');
        }
    }
    
    submitChat() {
        const chatInput = document.querySelector('#chat-input, .chat-input, textarea[placeholder*="message" i]');
        const sendButton = document.querySelector('#send-btn, .send-btn, button[aria-label*="send" i]');
        
        if (chatInput && chatInput.value.trim()) {
            if (sendButton) {
                sendButton.click();
            } else {
                // Trigger Enter key event
                const event = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                chatInput.dispatchEvent(event);
            }
        }
    }
    
    closeModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal, .dialog, [role="dialog"]');
        modals.forEach(modal => {
            if (modal.style.display !== 'none' && !modal.classList.contains('hidden')) {
                const closeBtn = modal.querySelector('.close, [aria-label*="close" i], button[aria-label*="close" i]');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    modal.style.display = 'none';
                    modal.classList.add('hidden');
                }
            }
        });
        
        // Close help dialog if open
        if (this.helpVisible) {
            this.toggleHelp();
        }
    }
    
    toggleTheme() {
        // Try to find theme toggle
        const themeToggle = document.querySelector('#theme-toggle, .theme-toggle, [aria-label*="theme" i]');
        if (themeToggle) {
            themeToggle.click();
        } else {
            // Fallback: toggle body class
            document.body.classList.toggle('light-theme');
            document.body.classList.toggle('dark-theme');
        }
    }
    
    toggleHelp() {
        this.helpVisible = !this.helpVisible;
        const dialog = document.getElementById('keyboard-shortcuts-help');
        if (dialog) {
            dialog.style.display = this.helpVisible ? 'block' : 'none';
            dialog.setAttribute('aria-hidden', !this.helpVisible);
            
            if (this.helpVisible) {
                dialog.focus();
            }
        }
    }
    
    createHelpDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'keyboard-shortcuts-help';
        dialog.className = 'keyboard-shortcuts-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'shortcuts-title');
        dialog.setAttribute('aria-hidden', 'true');
        dialog.style.display = 'none';
        
        // Group shortcuts by category
        const categories = new Map();
        this.shortcuts.forEach((shortcut, key) => {
            const category = shortcut.category || 'General';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push({ key, ...shortcut });
        });
        
        let html = `
            <div class="shortcuts-dialog-content">
                <div class="shortcuts-dialog-header">
                    <h2 id="shortcuts-title">⌨️ Keyboard Shortcuts</h2>
                    <button class="shortcuts-close" aria-label="Close shortcuts help" onclick="window.keyboardShortcuts.toggleHelp()">×</button>
                </div>
                <div class="shortcuts-dialog-body">
        `;
        
        categories.forEach((shortcuts, category) => {
            html += `<div class="shortcuts-category">
                <h3>${category}</h3>
                <ul>`;
            shortcuts.forEach(shortcut => {
                const keyDisplay = shortcut.key.replace(/\+/g, ' + ').replace(/control/g, 'Ctrl').replace(/meta/g, 'Cmd');
                html += `<li>
                    <kbd>${keyDisplay}</kbd>
                    <span>${shortcut.description || shortcut.key}</span>
                </li>`;
            });
            html += `</ul></div>`;
        });
        
        html += `
                </div>
            </div>
        `;
        
        dialog.innerHTML = html;
        document.body.appendChild(dialog);
        
        // Add CSS
        this.injectHelpDialogCSS();
    }
    
    injectHelpDialogCSS() {
        if (document.getElementById('keyboard-shortcuts-css')) return;
        
        const style = document.createElement('style');
        style.id = 'keyboard-shortcuts-css';
        style.textContent = `
            .keyboard-shortcuts-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 10px;
                padding: 0;
                z-index: 10000;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
            }
            
            .shortcuts-dialog-content {
                padding: 1.5rem;
            }
            
            .shortcuts-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(186, 148, 79, 0.3);
            }
            
            .shortcuts-dialog-header h2 {
                color: #ba944f;
                margin: 0;
                font-size: 1.5rem;
            }
            
            .shortcuts-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.8);
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                line-height: 1;
            }
            
            .shortcuts-close:hover {
                color: #ba944f;
            }
            
            .shortcuts-dialog-body {
                color: rgba(255, 255, 255, 0.9);
            }
            
            .shortcuts-category {
                margin-bottom: 2rem;
            }
            
            .shortcuts-category h3 {
                color: #ba944f;
                margin: 0 0 1rem 0;
                font-size: 1.1rem;
            }
            
            .shortcuts-category ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .shortcuts-category li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                margin-bottom: 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
            }
            
            .shortcuts-category kbd {
                background: rgba(186, 148, 79, 0.2);
                border: 1px solid rgba(186, 148, 79, 0.4);
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-family: 'Courier New', monospace;
                font-size: 0.85rem;
                color: #ba944f;
                min-width: 120px;
                text-align: center;
            }
            
            .shortcuts-category span {
                flex: 1;
                margin-left: 1rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    announceShortcut(shortcut) {
        // Announce shortcut activation for screen readers
        this.announce(`Shortcut activated: ${shortcut.description || shortcut.key}`);
    }
    
    announce(message) {
        // Create aria-live region for announcements
        let liveRegion = document.getElementById('aria-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
    
    // Public API
    enable() {
        this.enabled = true;
    }
    
    disable() {
        this.enabled = false;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.keyboardShortcuts = new KeyboardShortcuts();
    });
} else {
    window.keyboardShortcuts = new KeyboardShortcuts();
}
