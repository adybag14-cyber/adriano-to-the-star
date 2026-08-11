/**
 * Language Translation Service
 * Translate text between languages
 */
(function() {
    'use strict';

    class LanguageTranslationService {
        constructor() {
            this.translations = [];
            this.supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja'];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('translation-service')) {
                const service = document.createElement('div');
                service.id = 'translation-service';
                service.className = 'translation-service';
                service.innerHTML = `
                    <div class="service-header">
                        <h2>Translation Service</h2>
                        <textarea id="text-to-translate" placeholder="Enter text to translate..."></textarea>
                        <select id="target-language">
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="zh">Chinese</option>
                            <option value="ja">Japanese</option>
                        </select>
                        <button id="translate-btn">Translate</button>
                    </div>
                    <div class="translations-list" id="translations-list"></div>
                `;
                document.body.appendChild(service);
            }

            document.getElementById('translate-btn')?.addEventListener('click', () => {
                this.translate();
            });
        }

        async translate() {
            const text = document.getElementById('text-to-translate').value;
            const targetLang = document.getElementById('target-language').value;
            
            if (!text.trim()) return;

            const translation = await this.translateText(text, 'en', targetLang);
            const result = {
                id: this.generateId(),
                original: text,
                translated: translation,
                sourceLang: 'en',
                targetLang: targetLang,
                createdAt: new Date().toISOString()
            };
            this.translations.push(result);
            this.renderTranslations();
            this.trackEvent('translation_completed', { source: 'en', target: targetLang, length: text.length });
        }

        async translateText(text, sourceLang, targetLang) {
            // Translation (would use translation API in production)
            // Simplified mock translation
            if (window.i18n && window.i18n.t) {
                // Use i18n if available
                return text; // Would translate here
            }
            
            // Mock translation
            return `[${targetLang.toUpperCase()}] ${text}`;
        }

        trackEvent(eventName, data = {}) {
            if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
                try {
                    window.performanceMonitoring.recordMetric(`translation:${eventName}`, 1, {
                        source: 'language-translation-service',
                        ...data
                    });
                } catch (e) {
                    console.warn('Failed to record translation event:', e);
                }
            }
            if (window.analytics && window.analytics.track) {
                window.analytics.track('Translation Event', { event: eventName, ...data });
            }
        }

        renderTranslations() {
            const list = document.getElementById('translations-list');
            if (!list) return;

            list.innerHTML = this.translations.slice(-5).map(trans => `
                <div class="translation-item">
                    <div class="trans-original">${trans.original}</div>
                    <div class="trans-arrow">→</div>
                    <div class="trans-translated">${trans.translated}</div>
                    <div class="trans-langs">${trans.sourceLang} → ${trans.targetLang}</div>
                </div>
            `).join('');
        }

        generateId() {
            return 'trans_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.translationService = new LanguageTranslationService();
        });
    } else {
        window.translationService = new LanguageTranslationService();
    }
})();

