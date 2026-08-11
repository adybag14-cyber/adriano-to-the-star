class I18nSystem {
    constructor() {
        this.translations = new Map();
        this.defaultLocale = 'en';
    }
    setLocale(locale) {
        this.defaultLocale = locale;
    }
    addTranslations(locale, dict) {
        this.translations.set(locale, { ...(this.translations.get(locale) || {}), ...(dict || {}) });
        return this.translations.get(locale);
    }
    t(key, locale = null) {
        const loc = locale || this.detectLocale();
        const dict = this.translations.get(loc) || {};
        return dict[key] || key;
    }
    detectLocale() {
        if (typeof navigator !== 'undefined' && navigator.language) return navigator.language.split('-')[0];
        return this.defaultLocale;
    }
}
const i18nSystem = new I18nSystem();
if (typeof window !== 'undefined') {
    window.i18nSystem = i18nSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nSystem;
}
