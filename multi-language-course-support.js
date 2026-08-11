/**
 * Multi-Language Course Support
 * @class MultiLanguageCourseSupport
 * @description Provides multi-language support for courses.
 */
class MultiLanguageCourseSupport {
    constructor() {
        this.translations = new Map();
        this.supportedLanguages = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja'];
        this.init();
    }

    init() {
        this.trackEvent('m_ul_ti_la_ng_ua_ge_co_ur_se_su_pp_or_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_ul_ti_la_ng_ua_ge_co_ur_se_su_pp_or_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add translation.
     * @param {string} courseId - Course identifier.
     * @param {string} language - Language code.
     * @param {object} translationData - Translation data.
     */
    addTranslation(courseId, language, translationData) {
        const translationKey = `${courseId}_${language}`;
        this.translations.set(translationKey, {
            courseId,
            language,
            ...translationData,
            title: translationData.title,
            description: translationData.description,
            content: translationData.content || {},
            createdAt: new Date()
        });
        console.log(`Translation added: ${courseId} in ${language}`);
    }

    /**
     * Get course in language.
     * @param {string} courseId - Course identifier.
     * @param {string} language - Language code.
     * @returns {object} Translated course data.
     */
    getCourseInLanguage(courseId, language) {
        const translationKey = `${courseId}_${language}`;
        return this.translations.get(translationKey);
    }

    /**
     * Get available languages.
     * @param {string} courseId - Course identifier.
     * @returns {Array<string>} Available language codes.
     */
    getAvailableLanguages(courseId) {
        return Array.from(this.translations.keys())
            .filter(key => key.startsWith(`${courseId}_`))
            .map(key => key.split('_')[1]);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.multiLanguageCourseSupport = new MultiLanguageCourseSupport();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiLanguageCourseSupport;
}

