/**
 * Consent Management System
 * Manage user consent
 */
(function() {
    'use strict';

    class ConsentManagementSystem {
        constructor() {
            this.consents = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.loadConsents();
            this.trackEvent('consent_sys_initialized');
        }

        setupUI() {
            if (!document.getElementById('consent-management')) {
                const consent = document.createElement('div');
                consent.id = 'consent-management';
                consent.className = 'consent-management';
                consent.innerHTML = `
                    <div class="consent-banner" id="consent-banner" style="display: none;">
                        <div class="consent-content">
                            <p>We use cookies and similar technologies. Please review and accept our privacy policy.</p>
                            <div class="consent-options" id="consent-options"></div>
                            <div class="consent-actions">
                                <button id="accept-all">Accept All</button>
                                <button id="reject-all">Reject All</button>
                                <button id="save-preferences">Save Preferences</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(consent);
            }

            this.setupConsentListeners();
        }

        setupConsentListeners() {
            document.getElementById('accept-all')?.addEventListener('click', () => {
                this.acceptAll();
            });

            document.getElementById('reject-all')?.addEventListener('click', () => {
                this.rejectAll();
            });

            document.getElementById('save-preferences')?.addEventListener('click', () => {
                this.savePreferences();
            });
        }

        showConsentBanner() {
            const banner = document.getElementById('consent-banner');
            if (banner && !this.hasConsent()) {
                banner.style.display = 'block';
            }
        }

        hasConsent() {
            return localStorage.getItem('consent-given') === 'true';
        }

        acceptAll() {
            const consents = {
                necessary: true,
                analytics: true,
                marketing: true,
                timestamp: new Date().toISOString()
            };
            this.saveConsents(consents);
            this.hideBanner();
        }

        rejectAll() {
            const consents = {
                necessary: true,
                analytics: false,
                marketing: false,
                timestamp: new Date().toISOString()
            };
            this.saveConsents(consents);
            this.hideBanner();
        }

        savePreferences() {
            const consents = {
                necessary: true,
                analytics: document.getElementById('consent-analytics')?.checked || false,
                marketing: document.getElementById('consent-marketing')?.checked || false,
                timestamp: new Date().toISOString()
            };
            this.saveConsents(consents);
            this.hideBanner();
        }

        saveConsents(consents) {
            localStorage.setItem('user-consents', JSON.stringify(consents));
            localStorage.setItem('consent-given', 'true');
            this.consents = consents;
        }

        loadConsents() {
            const stored = localStorage.getItem('user-consents');
            if (stored) {
                this.consents = JSON.parse(stored);
            } else {
                this.showConsentBanner();
            }
        }

        hideBanner() {
            const banner = document.getElementById('consent-banner');
            if (banner) {
                banner.style.display = 'none';
            }
        }

        hasConsentFor(category) {
            return this.consents[category] || false;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`consent_sys_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.consentManagement = new ConsentManagementSystem();
        });
    } else {
        window.consentManagement = new ConsentManagementSystem();
    }
})();

