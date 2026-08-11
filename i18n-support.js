/**
 * Multi-language Support (i18n)
 * Internationalization framework for multiple languages
 * 
 * Features:
 * - Language detection
 * - Translation management
 * - Dynamic language switching
 * - RTL support
 */

class I18nSupport {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'];
        this.rtlLanguages = ['ar', 'he', 'fa'];
        this.init();
    }
    
    init() {
        // Detect browser language
        this.detectLanguage();
        
        // Load translations
        this.loadTranslations();
        
        // Apply language
        this.applyLanguage(this.currentLanguage);
        
        // Create language selector
        this.createLanguageSelector();
        
        console.log('🌍 i18n Support initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i18n_su_pp_or_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    detectLanguage() {
        // Try to load saved preference
        const saved = localStorage.getItem('preferred-language');
        if (saved && this.supportedLanguages.includes(saved)) {
            this.currentLanguage = saved;
            return;
        }
        
        // Detect from browser
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        if (this.supportedLanguages.includes(langCode)) {
            this.currentLanguage = langCode;
        }
    }
    
    loadTranslations() {
        // Basic translations (can be extended with external files)
        this.translations = {
            en: {
                'welcome': 'Welcome',
                'chat': 'Chat',
                'send': 'Send',
                'new_chat': 'New Chat',
                'clear': 'Clear',
                'login': 'Login',
                'logout': 'Logout',
                'settings': 'Settings',
                'theme': 'Theme',
                'language': 'Language',
                'loading': 'Loading...',
                'error': 'Error',
                'success': 'Success'
            },
            es: {
                'welcome': 'Bienvenido',
                'chat': 'Chat',
                'send': 'Enviar',
                'new_chat': 'Nuevo Chat',
                'clear': 'Limpiar',
                'login': 'Iniciar sesión',
                'logout': 'Cerrar sesión',
                'settings': 'Configuración',
                'theme': 'Tema',
                'language': 'Idioma',
                'loading': 'Cargando...',
                'error': 'Error',
                'success': 'Éxito'
            },
            fr: {
                'welcome': 'Bienvenue',
                'chat': 'Chat',
                'send': 'Envoyer',
                'new_chat': 'Nouveau Chat',
                'clear': 'Effacer',
                'login': 'Connexion',
                'logout': 'Déconnexion',
                'settings': 'Paramètres',
                'theme': 'Thème',
                'language': 'Langue',
                'loading': 'Chargement...',
                'error': 'Erreur',
                'success': 'Succès'
            },
            de: {
                'welcome': 'Willkommen',
                'chat': 'Chat',
                'send': 'Senden',
                'new_chat': 'Neuer Chat',
                'clear': 'Löschen',
                'login': 'Anmelden',
                'logout': 'Abmelden',
                'settings': 'Einstellungen',
                'theme': 'Thema',
                'language': 'Sprache',
                'loading': 'Lädt...',
                'error': 'Fehler',
                'success': 'Erfolg'
            }
        };
        
        // Try to load from external file
        this.loadExternalTranslations();
    }
    
    async loadExternalTranslations() {
        // Try to load translations from external JSON files
        for (const lang of this.supportedLanguages) {
            try {
                const response = await fetch(`/translations/${lang}.json`);
                if (response.ok) {
                    const translations = await response.json();
                    this.translations[lang] = { ...(this.translations[lang] || {}), ...translations };
                    if (lang === this.currentLanguage) {
                        this.translateElements();
                    }
                }
            } catch (e) {
                // External file not found, use built-in translations
            }
        }
    }
    
    applyLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('preferred-language', lang);
        
        // Update document language
        document.documentElement.lang = lang;
        
        // Apply RTL if needed
        if (this.rtlLanguages.includes(lang)) {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
        
        // Translate all elements with data-i18n attribute
        this.translateElements();
        
        // Dispatch language change event
        window.dispatchEvent(new CustomEvent('language-changed', {
            detail: { language: lang }
        }));
    }
    
    translateElements() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation && translation !== key) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    }
    
    t(key, params = {}) {
        const getValue = (obj, k) => {
            if (!obj || typeof obj !== 'object' || !k) return null;
            if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
            const parts = String(k).split('.');
            let value = obj;
            for (const part of parts) {
                if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, part)) {
                    value = value[part];
                } else {
                    return null;
                }
            }
            return value;
        };

        const translation =
            getValue(this.translations[this.currentLanguage], key) ??
            getValue(this.translations['en'], key);

        if (typeof translation !== 'string' || translation.length === 0) {
            return key;
        }
        
        // Replace parameters
        let result = translation;
        Object.entries(params).forEach(([param, value]) => {
            result = result.replace(new RegExp(`{{${param}}}`, 'g'), value);
        });
        
        return result;
    }
    
    createLanguageSelector() {
        // Check if selector already exists
        if (document.getElementById('language-selector')) {
            return;
        }
        
        const selector = document.createElement('div');
        selector.id = 'language-selector';
        selector.className = 'language-selector';
        selector.style.cssText = `
            position: fixed;
            bottom: 320px;
            right: 20px;
            z-index: 9998;
        `;
        
        const button = document.createElement('button');
        button.innerHTML = '🌍';
        button.setAttribute('aria-label', 'Select language');
        button.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'language-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            bottom: 60px;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 0.5rem;
            display: none;
            min-width: 150px;
        `;
        
        this.supportedLanguages.forEach(lang => {
            const option = document.createElement('button');
            option.textContent = this.getLanguageName(lang);
            option.style.cssText = `
                width: 100%;
                padding: 0.5rem;
                background: ${lang === this.currentLanguage ? 'rgba(186, 148, 79, 0.3)' : 'transparent'};
                border: none;
                color: white;
                text-align: left;
                cursor: pointer;
                border-radius: 5px;
                margin-bottom: 0.25rem;
            `;
            option.addEventListener('click', () => {
                this.applyLanguage(lang);
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(option);
        });
        
        button.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        selector.appendChild(button);
        selector.appendChild(dropdown);
        document.body.appendChild(selector);
    }
    
    getLanguageName(code) {
        const names = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'it': 'Italiano',
            'pt': 'Português',
            'ru': 'Русский',
            'zh': '中文',
            'ja': '日本語',
            'ar': 'العربية'
        };
        return names[code] || code;
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    addTranslations(lang, translations) {
        if (!this.translations[lang]) {
            this.translations[lang] = {};
        }
        this.translations[lang] = { ...this.translations[lang], ...translations };
        this.translateElements();
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.i18n = new I18nSupport();
    });
} else {
    window.i18n = new I18nSupport();
}

