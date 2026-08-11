/**
 * Biometric Authentication (WebAuthn)
 * WebAuthn/FIDO2 authentication
 */

class BiometricAuthenticationWebAuthn {
    constructor() {
        this.isSupported = window.PublicKeyCredential !== undefined;
        this.init();
    }
    
    init() {
        if (this.isSupported) {
            this.createAuthButton();
        }
        this.trackEvent('webauthn_initialized');
    }
    
    createAuthButton() {
        const btn = document.createElement('button');
        btn.id = 'webauthn-register';
        btn.textContent = '🔐 Register Biometric';
        btn.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            z-index: 9999;
        `;
        
        btn.addEventListener('click', () => this.register());
        document.body.appendChild(btn);
    }
    
    async register() {
        if (!this.isSupported) {
            alert('WebAuthn not supported in this browser');
            return;
        }
        
        try {
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: { name: 'Adriano To The Star' },
                    user: {
                        id: new Uint8Array(16),
                        name: window.supabase?.auth?.user?.email || 'user',
                        displayName: 'User'
                    },
                    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'required'
                    }
                }
            });
            
            console.log('WebAuthn credential created:', credential);
            alert('Biometric authentication registered!');
        } catch (e) {
            console.error('WebAuthn registration failed:', e);
            alert('Registration failed. Please try again.');
        }
    }
    
    async authenticate() {
        try {
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    allowCredentials: []
                }
            });
            
            console.log('WebAuthn authentication:', assertion);
            return true;
        } catch (e) {
            console.error('WebAuthn authentication failed:', e);
            return false;
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`webauthn_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.biometricAuthenticationWebAuthn = new BiometricAuthenticationWebAuthn(); });
} else {
    window.biometricAuthenticationWebAuthn = new BiometricAuthenticationWebAuthn();
}


