/**
 * Planet Discovery Cookie Consent
 * GDPR-compliant cookie consent management
 */

class PlanetDiscoveryCookieConsent {
    constructor() {
        this.consent = {
            necessary: true, // Always required
            analytics: false,
            marketing: false,
            functional: false
        };
        this.init();
    }

    init() {
        this.loadConsent();
        if (!this.hasConsent()) {
            this.showConsentBanner();
        }
        console.log('🍪 Cookie consent initialized');
    }

    loadConsent() {
        try {
            const saved = localStorage.getItem('cookie-consent');
            if (saved) {
                this.consent = { ...this.consent, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading cookie consent:', error);
        }
    }

    saveConsent() {
        try {
            localStorage.setItem('cookie-consent', JSON.stringify(this.consent));
            localStorage.setItem('cookie-consent-date', new Date().toISOString());
        } catch (error) {
            console.error('Error saving cookie consent:', error);
        }
    }

    hasConsent() {
        return localStorage.getItem('cookie-consent') !== null;
    }

    showConsentBanner() {
        // Don't show if already displayed
        if (document.getElementById('cookie-consent-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(26, 26, 46, 0.95);
            border-top: 2px solid rgba(186, 148, 79, 0.5);
            padding: 1.5rem;
            z-index: 10000;
            box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.3);
        `;

        banner.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">🍪 Cookie Consent</h4>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 0.9rem;">
                        We use cookies to enhance your experience, analyze site usage, and assist in marketing efforts. 
                        By clicking "Accept All", you consent to our use of cookies. 
                        <a href="/privacy.html" style="color: #ba944f;">Learn more</a>
                    </p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button id="cookie-settings-btn" style="padding: 0.75rem 1.5rem; background: transparent; border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Settings
                    </button>
                    <button id="cookie-accept-necessary-btn" style="padding: 0.75rem 1.5rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.9); cursor: pointer; font-weight: 600;">
                        Necessary Only
                    </button>
                    <button id="cookie-accept-all-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Accept All
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('cookie-accept-all-btn')?.addEventListener('click', () => {
            this.acceptAll();
            banner.remove();
        });

        document.getElementById('cookie-accept-necessary-btn')?.addEventListener('click', () => {
            this.acceptNecessary();
            banner.remove();
        });

        document.getElementById('cookie-settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
    }

    acceptAll() {
        this.consent = {
            necessary: true,
            analytics: true,
            marketing: true,
            functional: true
        };
        this.saveConsent();
        this.applyConsent();
    }

    acceptNecessary() {
        this.consent = {
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false
        };
        this.saveConsent();
        this.applyConsent();
    }

    applyConsent() {
        // Enable/disable features based on consent
        if (this.consent.analytics) {
            // Enable analytics
            if (window.planetDiscoveryAnalyticsTracking) {
                // Analytics already initialized
            }
        } else {
            // Disable analytics
            console.log('Analytics disabled due to consent');
        }

        // Dispatch event for other scripts to listen
        window.dispatchEvent(new CustomEvent('cookie-consent-updated', {
            detail: this.consent
        }));
    }

    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'cookie-settings-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: rgba(26, 26, 46, 0.95); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">🍪 Cookie Settings</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                        <div>
                            <strong style="color: rgba(255, 255, 255, 0.9);">Necessary Cookies</strong>
                            <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Required for the site to function</p>
                        </div>
                        <input type="checkbox" checked disabled style="width: 20px; height: 20px;">
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                        <div>
                            <strong style="color: rgba(255, 255, 255, 0.9);">Analytics Cookies</strong>
                            <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Help us understand how visitors interact with our site</p>
                        </div>
                        <input type="checkbox" id="consent-analytics" ${this.consent.analytics ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                        <div>
                            <strong style="color: rgba(255, 255, 255, 0.9);">Marketing Cookies</strong>
                            <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Used to deliver personalized ads</p>
                        </div>
                        <input type="checkbox" id="consent-marketing" ${this.consent.marketing ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                        <div>
                            <strong style="color: rgba(255, 255, 255, 0.9);">Functional Cookies</strong>
                            <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Enable enhanced functionality and personalization</p>
                        </div>
                        <input type="checkbox" id="consent-functional" ${this.consent.functional ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button id="cookie-save-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Save Preferences
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('cookie-save-btn')?.addEventListener('click', () => {
            this.consent.analytics = document.getElementById('consent-analytics').checked;
            this.consent.marketing = document.getElementById('consent-marketing').checked;
            this.consent.functional = document.getElementById('consent-functional').checked;
            this.saveConsent();
            this.applyConsent();
            modal.remove();
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) banner.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryCookieConsent = new PlanetDiscoveryCookieConsent();
}

