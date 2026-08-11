/**
 * SpaceLoader Features Module (Optional)
 * 
 * Adds optional features: themes, i18n, analytics, config UI
 * This module is OPTIONAL and can fail without breaking the page
 */

(function() {
    'use strict';

    // Only load if core loader exists
    if (!window.SpaceLoaderCore) {
        return;
    }

    // Simple theme system (optional)
    const themes = {
        default: {},
        nebula: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        galaxy: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
    };

    // Simple translations (optional)
    const translations = {
        en: { loading: 'LOADING', welcome: 'WELCOME TO THE COSMOS' },
        es: { loading: 'CARGANDO', welcome: 'BIENVENIDO AL COSMOS' },
        fr: { loading: 'CHARGEMENT', welcome: 'BIENVENUE DANS LE COSMOS' }
    };

    /**
     * Applies theme (optional)
     * 
     * Applies a visual theme to the loader. Available themes include
     * 'default', 'nebula', and 'galaxy'. Non-critical - failures are
     * caught and logged without breaking the page.
     * 
     * @public
     * @param {string} themeName - Name of theme to apply ('default', 'nebula', 'galaxy')
     * @returns {void}
     */
    function applyTheme(themeName) {
        try {
            const loader = document.getElementById('space-loader');
            if (!loader) return;

            const theme = themes[themeName] || themes.default;
            if (theme.background) {
                loader.style.background = theme.background;
            }
        } catch (e) {
            console.warn('Error applying theme (non-critical):', e);
        }
    }

    /**
     * Applies translations (optional)
     * 
     * Updates loader text based on user's locale. Supports English (en),
     * Spanish (es), and French (fr). Falls back to English if locale
     * is not supported. Non-critical - failures are caught and logged
     * without breaking the page.
     * 
     * @public
     * @param {string} [locale] - Locale code (e.g., 'en', 'es', 'fr'). If not provided, uses navigator.language
     * @returns {void}
     */
    function applyTranslations(locale) {
        try {
            const lang = (locale || navigator.language || 'en').split('-')[0];
            const t = translations[lang] || translations.en;

            const loadingText = document.querySelector('#space-loader .loader-text');
            if (loadingText) {
                const dots = loadingText.querySelector('.dots')?.textContent || '...';
                loadingText.innerHTML = t.loading + '<span class="dots">' + dots + '</span>';
            }
        } catch (e) {
            console.warn('Error applying translations (non-critical):', e);
        }
    }

    /**
     * Simple analytics (optional)
     * 
     * Tracks loader completion time and stores it in localStorage.
     * Maintains a history of the last 100 load times. Non-critical -
     * failures are caught and logged without breaking the page.
     * 
     * @private
     * @returns {void}
     */
    function trackLoadTime() {
        try {
            const loadTime = Date.now() - (window.loaderStartTime || Date.now());
            console.log('Loader analytics:', { loadTime });
            
            // Store in localStorage if available
            try {
                const analytics = JSON.parse(localStorage.getItem('loaderAnalytics') || '[]');
                analytics.push({ loadTime, timestamp: Date.now() });
                if (analytics.length > 100) analytics.shift();
                localStorage.setItem('loaderAnalytics', JSON.stringify(analytics));
            } catch (e) {
                // localStorage not available, skip
            }
        } catch (e) {
            console.warn('Error tracking analytics (non-critical):', e);
        }
    }

    /**
     * Initialize features
     * 
     * Loads saved theme from localStorage, applies translations based
     * on user's locale, and hooks into loader completion to track
     * analytics. Non-critical - failures are caught and logged without
     * breaking the page.
     * 
     * @private
     * @returns {void}
     */
    function init() {
        try {
            // Apply saved theme
            try {
                const savedTheme = localStorage.getItem('loaderTheme');
                if (savedTheme) applyTheme(savedTheme);
            } catch (e) {
                // Skip if localStorage unavailable
            }

            // Apply translations
            applyTranslations();

            // Track when loader completes
            const originalComplete = window.SpaceLoaderCore.complete;
            if (originalComplete) {
                window.SpaceLoaderCore.complete = function() {
                    trackLoadTime();
                    originalComplete();
                };
            }
        } catch (e) {
            console.warn('Error initializing features (non-critical):', e);
        }
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export API
    if (typeof window !== 'undefined') {
        window.SpaceLoaderFeatures = {
            applyTheme: applyTheme,
            applyTranslations: applyTranslations
        };
    }
})();

