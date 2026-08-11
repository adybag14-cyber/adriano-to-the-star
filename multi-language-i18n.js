/**
 * Multi-language Support with i18n Framework
 * Internationalization support
 */
(function() {
    'use strict';

    class MultiLanguageI18n {
        constructor() {
            this.currentLanguage = 'en';
            this.translations = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.loadLanguage(this.currentLanguage);
            this.detectLanguage();
        }

        setupUI() {
            if (!document.getElementById('i18n-system')) {
                const i18n = document.createElement('div');
                i18n.id = 'i18n-system';
                i18n.className = 'i18n-system';
                i18n.innerHTML = `
                    <select id="language-selector">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                    </select>
                `;
                document.body.appendChild(i18n);
            }

            document.getElementById('language-selector')?.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }

        detectLanguage() {
            const browserLang = navigator.language.split('-')[0];
            const savedLang = localStorage.getItem('preferredLanguage');
            const lang = savedLang || browserLang || 'en';
            this.setLanguage(lang);
        }

        async loadLanguage(lang) {
            try {
                const response = await fetch(`/locales/${lang}.json`);
                const translations = await response.json();
                this.translations.set(lang, translations);
            } catch (error) {
                console.error(`Failed to load language ${lang}:`, error);
                // Fallback to default translations
                this.translations.set(lang, this.getDefaultTranslations());
            }
        }

        getDefaultTranslations() {
            return {
                'welcome': 'Welcome',
                'save': 'Save',
                'cancel': 'Cancel',
                'delete': 'Delete',
                'edit': 'Edit'
            };
        }

        setLanguage(lang) {
            this.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            this.updateUI();
        }

        t(key, params = {}) {
            const translations = this.translations.get(this.currentLanguage) || {};
            let text = translations[key] || key;
            
            // Replace parameters
            Object.keys(params).forEach(param => {
                text = text.replace(`{{${param}}}`, params[param]);
            });
            
            return text;
        }

        updateUI() {
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.dataset.i18n;
                element.textContent = this.t(key);
            });

            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.dataset.i18nPlaceholder;
                element.placeholder = this.t(key);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.i18n = new MultiLanguageI18n();
        });
    } else {
        window.i18n = new MultiLanguageI18n();
    }
})();

