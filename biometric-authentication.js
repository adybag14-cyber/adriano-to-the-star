/**
 * Biometric Authentication Support
 * Support biometric authentication
 */
(function() {
    'use strict';

    class BiometricAuthentication {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.checkBiometricSupport();
            this.trackEvent('biometric_auth_initialized');
        }

        setupUI() {
            if (!document.getElementById('biometric-auth')) {
                const auth = document.createElement('div');
                auth.id = 'biometric-auth';
                auth.className = 'biometric-auth';
                auth.innerHTML = `
                    <button id="biometric-login-btn" style="display: none;">Login with Biometrics</button>
                `;
                document.body.appendChild(auth);
            }

            document.getElementById('biometric-login-btn')?.addEventListener('click', () => {
                this.authenticate();
            });
        }

        checkBiometricSupport() {
            if (window.PublicKeyCredential) {
                document.getElementById('biometric-login-btn').style.display = 'block';
            }
        }

        async authenticate() {
            if (navigator.credentials && navigator.credentials.get) {
                try {
                    return await navigator.credentials.get({
                        publicKey: {
                            challenge: new Uint8Array(32),
                            allowCredentials: []
                        }
                    });
                } catch (error) {
                    console.error('Biometric authentication failed:', error);
                }
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`biometric_auth_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.biometricAuth = new BiometricAuthentication();
        });
    } else {
        window.biometricAuth = new BiometricAuthentication();
    }
})();

