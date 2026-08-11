/**
 * Clipboard Manager
 * 
 * Enhanced clipboard functionality with history, formatted copying,
 * and quick copy buttons for links and content.
 * 
 * @class ClipboardManager
 * @example
 * // Auto-initializes on page load
 * // Access via: window.clipboardManager()
 * 
 * // Copy text
 * const clipboard = window.clipboardManager();
 * clipboard.copy('Text to copy', { format: 'text/plain' });
 */
class ClipboardManager {
    constructor() {
        this.clipboardHistory = [];
        this.maxHistory = 50;
        this.init();
    }

    init() {
        // Load clipboard history
        this.loadHistory();
        
        // Setup copy buttons
        this.setupCopyButtons();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('✅ Clipboard Manager initialized');
    }

    /**
     * Setup copy buttons on page
     * 
     * @method setupCopyButtons
     * @returns {void}
     */
    setupCopyButtons() {
        // Find all elements with data-copy attribute
        const copyElements = document.querySelectorAll('[data-copy]');
        copyElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const text = element.dataset.copy || element.textContent;
                this.copy(text, { source: element });
            });
        });

        // Add copy buttons to code blocks
        this.addCopyButtonsToCodeBlocks();
    }

    /**
     * Add copy buttons to code blocks
     * 
     * @method addCopyButtonsToCodeBlocks
     * @returns {void}
     */
    addCopyButtonsToCodeBlocks() {
        const codeBlocks = document.querySelectorAll('pre code, .code-block, .highlight');
        codeBlocks.forEach(block => {
            if (block.querySelector('.copy-code-btn')) return; // Already has button

            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.innerHTML = '📋';
            btn.title = 'Copy code';
            btn.setAttribute('aria-label', 'Copy code');
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const code = block.textContent || block.innerText;
                this.copy(code, { format: 'text/plain', source: 'code-block' });
                btn.innerHTML = '✅';
                setTimeout(() => {
                    btn.innerHTML = '📋';
                }, 2000);
            });

            // Position button
            const container = block.closest('pre') || block.parentElement;
            if (container) {
                container.style.position = 'relative';
                container.appendChild(btn);
            }
        });
    }

    /**
     * Copy text to clipboard
     * 
     * @method copy
     * @param {string} text - Text to copy
     * @param {Object} options - Copy options
     * @param {string} [options.format] - Clipboard format
     * @param {HTMLElement} [options.source] - Source element
     * @returns {Promise<boolean>} True if successful
     */
    async copy(text, options = {}) {
        if (!text) return false;

        try {
            // Use modern Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback to execCommand
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            // Add to history
            this.addToHistory(text, options);

            // Show notification
            this.showCopyNotification(text);

            this.trackEvent('text_copied', { length: text.length, source: options.source, format: options.format || 'text/plain' });
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showCopyError();
            this.trackEvent('copy_failed', { error: error.message });
            return false;
        }
    }

    /**
     * Copy as formatted text
     * 
     * @method copyFormatted
     * @param {string} text - Text to copy
     * @param {string} format - Format (markdown, html, etc.)
     * @returns {Promise<boolean>} True if successful
     */
    async copyFormatted(text, format = 'markdown') {
        let formattedText = text;

        if (format === 'markdown') {
            // Convert to markdown if needed
            formattedText = this.toMarkdown(text);
        } else if (format === 'html') {
            formattedText = this.toHTML(text);
        }

        return this.copy(formattedText, { format });
    }

    /**
     * Convert text to markdown
     * 
     * @method toMarkdown
     * @param {string} text - Text to convert
     * @returns {string} Markdown formatted text
     */
    toMarkdown(text) {
        // Basic markdown conversion
        return text;
    }

    /**
     * Convert text to HTML
     * 
     * @method toHTML
     * @param {string} text - Text to convert
     * @returns {string} HTML formatted text
     */
    toHTML(text) {
        // Basic HTML conversion
        return text.replace(/\n/g, '<br>');
    }

    /**
     * Copy current page URL
     * 
     * @method copyURL
     * @param {Object} options - Copy options
     * @returns {Promise<boolean>} True if successful
     */
    async copyURL(options = {}) {
        const url = window.location.href;
        return this.copy(url, { ...options, source: 'url' });
    }

    /**
     * Copy page title and URL
     * 
     * @method copyPageInfo
     * @returns {Promise<boolean>} True if successful
     */
    async copyPageInfo() {
        const title = document.title;
        const url = window.location.href;
        const text = `${title}\n${url}`;
        return this.copy(text, { format: 'text/plain', source: 'page-info' });
    }

    /**
     * Add to clipboard history
     * 
     * @method addToHistory
     * @param {string} text - Copied text
     * @param {Object} options - Copy options
     * @returns {void}
     */
    addToHistory(text, options = {}) {
        // Don't add duplicates
        const existing = this.clipboardHistory.find(item => item.text === text);
        if (existing) {
            // Move to top
            const index = this.clipboardHistory.indexOf(existing);
            this.clipboardHistory.splice(index, 1);
        }

        const item = {
            id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            text: text.substring(0, 500), // Limit length
            fullText: text,
            format: options.format || 'text/plain',
            source: options.source || 'manual',
            timestamp: new Date().toISOString()
        };

        this.clipboardHistory.unshift(item);

        // Limit history size
        if (this.clipboardHistory.length > this.maxHistory) {
            this.clipboardHistory = this.clipboardHistory.slice(0, this.maxHistory);
        }

        this.saveHistory();
    }

    /**
     * Show copy notification
     * 
     * @method showCopyNotification
     * @param {string} text - Copied text
     * @returns {void}
     */
    showCopyNotification(text) {
        // Use notification center if available
        if (window.notificationCenter) {
            const center = window.notificationCenter();
            const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
            center.show(`Copied: ${preview}`, {
                type: 'success',
                duration: 2000
            });
        } else {
            // Fallback to simple alert
            console.log('✅ Copied to clipboard');
        }
    }

    /**
     * Show copy error
     * 
     * @method showCopyError
     * @returns {void}
     */
    showCopyError() {
        if (window.notificationCenter) {
            const center = window.notificationCenter();
            center.show('Failed to copy to clipboard', {
                type: 'error',
                duration: 3000
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     * 
     * @method setupKeyboardShortcuts
     * @returns {void}
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+C to copy current URL
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.copyURL();
            }

            // Ctrl+Shift+I to copy page info
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.copyPageInfo();
            }
        });
    }

    /**
     * Get clipboard history
     * 
     * @method getHistory
     * @returns {Array} Clipboard history
     */
    getHistory() {
        return [...this.clipboardHistory];
    }

    /**
     * Clear history
     * 
     * @method clearHistory
     * @returns {void}
     */
    clearHistory() {
        this.clipboardHistory = [];
        this.saveHistory();
    }

    /**
     * Load history from localStorage
     * 
     * @method loadHistory
     * @returns {void}
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem('clipboard-history');
            if (stored) {
                this.clipboardHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load clipboard history:', error);
        }
    }

    /**
     * Save history to localStorage
     * 
     * @method saveHistory
     * @returns {void}
     */
    saveHistory() {
        try {
            localStorage.setItem('clipboard-history', JSON.stringify(this.clipboardHistory));
        } catch (error) {
            console.warn('Failed to save clipboard history:', error);
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`clipboard:${eventName}`, 1, {
                    source: 'clipboard-manager',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record clipboard event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Clipboard Event', { event: eventName, ...data });
        }
    }
}

// Initialize globally
let clipboardManagerInstance = null;

function initClipboardManager() {
    if (!clipboardManagerInstance) {
        clipboardManagerInstance = new ClipboardManager();
    }
    return clipboardManagerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClipboardManager);
} else {
    initClipboardManager();
}

// Export globally
window.ClipboardManager = ClipboardManager;
window.clipboardManager = () => clipboardManagerInstance;

