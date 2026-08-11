/**
 * Real-time Translation Service
 * Provides real-time translation capabilities using various translation APIs
 */

class RealtimeTranslationService {
    constructor() {
        this.translations = new Map();
        this.languages = new Map();
        this.activeTranslations = new Map();
        this.init();
    }

    init() {
        this.loadLanguages();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeTranslationInterfaces();
        });

        // Auto-translate elements with data attributes
        const observer = new MutationObserver(() => {
            this.processTranslationElements();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Load supported languages
     */
    loadLanguages() {
        this.languages.set('en', 'English');
        this.languages.set('es', 'Spanish');
        this.languages.set('fr', 'French');
        this.languages.set('de', 'German');
        this.languages.set('it', 'Italian');
        this.languages.set('pt', 'Portuguese');
        this.languages.set('ru', 'Russian');
        this.languages.set('zh', 'Chinese');
        this.languages.set('ja', 'Japanese');
        this.languages.set('ko', 'Korean');
        this.languages.set('ar', 'Arabic');
        this.languages.set('hi', 'Hindi');
    }

    /**
     * Initialize translation interfaces
     */
    initializeTranslationInterfaces() {
        const containers = document.querySelectorAll('[data-translate-container]');
        containers.forEach(container => {
            this.setupTranslationInterface(container);
        });

        this.processTranslationElements();
    }

    /**
     * Setup translation interface
     */
    setupTranslationInterface(container) {
        if (container.querySelector('.translation-interface')) {
            return;
        }

        const ui = document.createElement('div');
        ui.className = 'translation-interface';

        ui.innerHTML = `
            <div class="translation-controls">
                <label>
                    From: 
                    <select class="translation-source-lang" data-translation-source aria-label="Source language">
                        ${Array.from(this.languages.entries()).map(([code, name]) => 
                            `<option value="${code}">${name}</option>`
                        ).join('')}
                    </select>
                </label>
                <label>
                    To: 
                    <select class="translation-target-lang" data-translation-target aria-label="Target language">
                        ${Array.from(this.languages.entries()).map(([code, name]) => 
                            `<option value="${code}">${name}</option>`
                        ).join('')}
                </select>
                </label>
                <button class="translation-toggle-btn" data-translation-toggle>Start Translation</button>
            </div>
            <div class="translation-output" role="region" aria-live="polite"></div>
        `;

        container.appendChild(ui);

        const toggleBtn = ui.querySelector('[data-translation-toggle]');
        toggleBtn.addEventListener('click', () => {
            this.toggleTranslation(container);
        });
    }

    /**
     * Process elements that need translation
     */
    processTranslationElements() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            if (!element.hasAttribute('data-translate-processed')) {
                element.setAttribute('data-translate-processed', 'true');
                this.translateElement(element);
            }
        });
    }

    /**
     * Translate element
     */
    async translateElement(element) {
        const sourceLang = element.getAttribute('data-translate-from') || 'auto';
        const targetLang = element.getAttribute('data-translate-to') || 'en';
        const text = element.textContent || element.value;

        if (!text.trim()) {
            return;
        }

        try {
            const translated = await this.translate(text, sourceLang, targetLang);
            this.displayTranslation(element, translated, targetLang);
        } catch (error) {
            console.error('Translation error:', error);
        }
    }

    /**
     * Translate text
     */
    async translate(text, sourceLang = 'auto', targetLang = 'en') {
        const cacheKey = `${sourceLang}-${targetLang}-${text}`;
        if (this.translations.has(cacheKey)) {
            return this.translations.get(cacheKey);
        }

        // In production, this would call a translation API
        // For now, use a simple placeholder
        const translated = await this.callTranslationAPI(text, sourceLang, targetLang);
        
        this.translations.set(cacheKey, translated);
        return translated;
    }

    /**
     * Call translation API (placeholder)
     */
    async callTranslationAPI(text, sourceLang, targetLang) {
        // This would integrate with Google Translate API, DeepL, etc.
        // For demonstration, return a placeholder
        return `[Translated to ${this.languages.get(targetLang) || targetLang}]: ${text}`;
    }

    /**
     * Display translation
     */
    displayTranslation(element, translated, targetLang) {
        const container = element.parentElement;
        if (!container) {
            console.error('Element has no parent container');
            return;
        }
        let translationDiv = container.querySelector('.element-translation');

        if (!translationDiv) {
            translationDiv = document.createElement('div');
            translationDiv.className = 'element-translation';
            translationDiv.setAttribute('data-lang', targetLang);
            container.appendChild(translationDiv);
        }

        translationDiv.textContent = translated;
    }

    /**
     * Toggle real-time translation
     */
    toggleTranslation(container) {
        const ui = container.querySelector('.translation-interface');
        const toggleBtn = ui.querySelector('[data-translation-toggle]');
        const isActive = this.activeTranslations.has(container);

        if (isActive) {
            this.stopTranslation(container);
            toggleBtn.textContent = 'Start Translation';
        } else {
            this.startTranslation(container);
            toggleBtn.textContent = 'Stop Translation';
        }
    }

    /**
     * Start real-time translation
     */
    startTranslation(container) {
        const ui = container.querySelector('.translation-interface');
        const sourceLang = ui.querySelector('[data-translation-source]').value;
        const targetLang = ui.querySelector('[data-translation-target]').value;
        const output = ui.querySelector('.translation-output');

        this.activeTranslations.set(container, {
            sourceLang,
            targetLang,
            interval: setInterval(async () => {
                const text = this.getTextToTranslate(container);
                if (text) {
                    const translated = await this.translate(text, sourceLang, targetLang);
                    output.textContent = translated;
                }
            }, 1000) // Update every second
        });
    }

    /**
     * Stop real-time translation
     */
    stopTranslation(container) {
        const active = this.activeTranslations.get(container);
        if (active && active.interval) {
            clearInterval(active.interval);
        }
        this.activeTranslations.delete(container);
    }

    /**
     * Get text to translate from container
     */
    getTextToTranslate(container) {
        const input = container.querySelector('input, textarea, [contenteditable]');
        if (input) {
            return input.value || input.textContent;
        }
        return container.textContent;
    }

    /**
     * Translate page content
     */
    async translatePage(targetLang = 'en') {
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div[data-translate]');
        const translations = [];

        for (const element of elements) {
            const text = element.textContent.trim();
            if (text && !element.hasAttribute('data-translate-skip')) {
                try {
                    const translated = await this.translate(text, 'auto', targetLang);
                    translations.push({ element, original: text, translated });
                } catch (error) {
                    console.error('Error translating element:', error);
                }
            }
        }

        return translations;
    }

    /**
     * Apply translations to page
     */
    applyTranslations(translations) {
        translations.forEach(({ element, translated }) => {
            element.setAttribute('data-original-text', element.textContent);
            element.textContent = translated;
        });
    }

    /**
     * Restore original text
     */
    restoreOriginalText() {
        const elements = document.querySelectorAll('[data-original-text]');
        elements.forEach(element => {
            const original = element.getAttribute('data-original-text');
            if (original) {
                element.textContent = original;
                element.removeAttribute('data-original-text');
            }
        });
    }

    /**
     * Detect language
     */
    async detectLanguage(text) {
        // In production, use a language detection API
        // Simple heuristic for demonstration
        const patterns = {
            'es': /[áéíóúñ]/i,
            'fr': /[àâäéèêëïîôùûüÿç]/i,
            'de': /[äöüß]/i,
            'zh': /[\u4e00-\u9fff]/,
            'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
            'ko': /[\uac00-\ud7af]/,
            'ar': /[\u0600-\u06ff]/
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                return lang;
            }
        }

        return 'en'; // Default to English
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return Array.from(this.languages.entries()).map(([code, name]) => ({
            code,
            name
        }));
    }
}

// Auto-initialize
const realtimeTranslationService = new RealtimeTranslationService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeTranslationService;
}
